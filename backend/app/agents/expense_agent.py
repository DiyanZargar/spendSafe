import re
from typing import Dict, Any, List, Optional
from app.agents.base_agent import BaseAgent
from app.agents.context import AgentUserContext
from app.agents.tools.expense_tools import ExpenseTools
from app.agents.tools.analytics_tools import AnalyticsTools
from app.agents.tools.recurring_tools import RecurringTools
from app.agents.tools.report_tools import ReportTools
from app.config import settings


class ExpenseAgent(BaseAgent):
    """
    Primary financial AI agent for conversational expense management.
    Built with Agno agent framework and supported by a robust deterministic
    intent engine for zero-dependency local testing and offline execution.
    """

    def __init__(self, user_context: AgentUserContext, services: Dict[str, Any]):
        super().__init__(user_context, services)
        self.expense_tools = ExpenseTools(user_context, services)
        self.analytics_tools = AnalyticsTools(user_context, services)
        self.recurring_tools = RecurringTools(user_context, services)
        self.report_tools = ReportTools(user_context, services)

        self._all_tools = (
            self.expense_tools.get_tool_callables() +
            self.analytics_tools.get_tool_callables() +
            self.recurring_tools.get_tool_callables() +
            self.report_tools.get_tool_callables()
        )
        self.agent_instance = self.build_agent()

    def get_tools(self) -> List[Any]:
        return self._all_tools

    def build_agent(self) -> Any:
        """Construct Agno Agent using user's configured provider or environment settings."""
        # 1. Determine provider, model, api_key, and base_url (user-configured takes precedence)
        provider = (self.context.llm_provider or "").lower().strip()
        model_id = self.context.llm_model or settings.DEFAULT_LLM_MODEL
        api_key = self.context.llm_api_key
        base_url = self.context.llm_base_url

        # Only construct live Agno LLM if user configured an API key (or host for Ollama)
        if not api_key and provider != "ollama":
            return None

        try:
            from agno.agent import Agent

            system_instructions = (
                f"You are a helpful and precise personal finance assistant. "
                f"The user's currency is {self.context.currency} and timezone is {self.context.timezone}. "
                f"Always record, query, edit, and delete expenses through your available tools. "
                f"Never execute arbitrary SQL or assume a user ID."
            )

            # Build model according to provider
            model_instance = None
            if provider == "openai":
                from agno.models.openai import OpenAIChat
                model_instance = OpenAIChat(
                    id=model_id or "gpt-4o",
                    api_key=api_key,
                    base_url=base_url if base_url else None
                )
            elif provider == "anthropic":
                from agno.models.anthropic import Claude
                model_instance = Claude(
                    id=model_id or "claude-3-5-sonnet-20241022",
                    api_key=api_key
                )
            elif provider in ("gemini", "google"):
                from agno.models.google import Gemini
                model_instance = Gemini(
                    id=model_id or "gemini-1.5-flash",
                    api_key=api_key
                )
            elif provider == "groq":
                from agno.models.groq import Groq
                model_instance = Groq(
                    id=model_id or "llama-3.3-70b-versatile",
                    api_key=api_key,
                    base_url=base_url if base_url else None
                )
            elif provider == "ollama":
                from agno.models.ollama import Ollama
                model_instance = Ollama(
                    id=model_id or "llama3.1",
                    host=base_url or "http://localhost:11434"
                )
            else:
                # Custom / OpenAI-compatible endpoint
                from agno.models.openai import OpenAIChat
                model_instance = OpenAIChat(
                    id=model_id or "custom-model",
                    api_key=api_key or "sk-dummy",
                    base_url=base_url or "http://localhost:8000/v1"
                )

            agent = Agent(
                model=model_instance,
                instructions=system_instructions,
                tools=self._all_tools,
                markdown=True,
            )
            return agent
        except Exception:
            return None

    async def run(self, message: str) -> str:
        """Process conversational user message."""
        cleaned_msg = message.strip()

        # If Agno is configured with live LLM, run through Agno
        if self.agent_instance is not None:
            try:
                response = await self.agent_instance.arun(cleaned_msg)
                
                # Check if Agno finished with error status
                is_error = False
                if hasattr(response, "status") and str(response.status).lower().endswith("error"):
                    is_error = True

                content = None
                if response and hasattr(response, "content") and response.content:
                    content = str(response.content)
                elif isinstance(response, str):
                    content = response

                if content and ("provider returned error" in content.lower() or "rate-limited" in content.lower()):
                    is_error = True

                if content and not is_error:
                    return content
                elif is_error:
                    # Execute through local deterministic parser so user requests are never dropped!
                    parsed_reply = await self._parse_and_execute_intent(cleaned_msg)
                    if parsed_reply:
                        if parsed_reply.startswith("👋 Hello") or "Expense recorded" in parsed_reply or "Total" in parsed_reply or "Summary" in parsed_reply:
                            return parsed_reply
                        return f"{parsed_reply}\n\n*(Note: Executed via local offline engine due to cloud LLM rate limit)*"
                    return (
                        "⚠️ Upstream LLM rate limit exceeded (e.g. OpenRouter daily quota limit).\n"
                        "Your transaction was processed where possible. You can change your model or provider anytime in Settings."
                    )
            except Exception:
                # Gracefully fall back to deterministic parser on LLM exception
                pass

        # Built-in deterministic NLU parser for guaranteed testability and offline use
        return await self._parse_and_execute_intent(cleaned_msg)

    async def _parse_and_execute_intent(self, text: str) -> str:
        """Pattern matching engine mapping natural queries to domain tools."""
        lower = text.lower().strip()

        # 0. Greetings, Start, and Help commands
        if lower in ("/start", "start", "hi", "hello", "hey", "help", "/help", "menu"):
            return (
                "👋 Hello! I am your AI Expense Tracker Assistant.\n\n"
                "You can message me naturally anytime to manage your expenses:\n"
                "• *'Spent 450 on dinner'* — Record an expense\n"
                "• *'Spent 120 on Uber'* — Record transportation\n"
                "• *'What did I spend today?'* — Daily summary\n"
                "• *'How much did I spend this month?'* — Monthly total\n"
                "• *'Monthly report'* — Comprehensive category breakdown\n"
                "• *'Delete last expense'* — Remove a mistaken entry\n\n"
                "All expenses are instantly synced with your dashboard!"
            )

        # 1. Report queries ("Give me my September report", "September report", "monthly report")
        report_match = re.search(r'(?:give me\s+(?:my\s+)?)?(\w+)\s+report', lower)
        if "report" in lower:
            month_word = "this_month"
            for m in ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]:
                if m in lower:
                    month_word = m
                    break
            if "yearly" in lower or "annual" in lower:
                return await self.report_tools.generate_yearly_report()
            return await self.report_tools.generate_monthly_report(period=month_word)

        # 2. Today's spending ("What did I spend today?", "today's expenses")
        if "spend today" in lower or "spent today" in lower or "today" in lower and ("what did i" in lower or "how much" in lower):
            return await self.analytics_tools.get_daily_summary()

        # 3. Monthly summary ("How much did I spend this month?", "monthly spending")
        if "this month" in lower and ("how much" in lower or "what did i" in lower):
            if any(c in lower for c in ["food", "dinner", "lunch", "travel", "shopping", "transport"]):
                for cat in ["Food & Dining", "Transportation", "Shopping", "Entertainment", "Groceries"]:
                    if cat.lower() in lower or cat.split()[0].lower() in lower:
                        return await self.analytics_tools.get_category_breakdown(period="this_month")
            return await self.analytics_tools.get_monthly_summary(month="this_month")

        # 4. Compare periods ("Compare with last month", "how does this month compare")
        if "compare" in lower:
            return await self.analytics_tools.compare_periods()

        # 5. Category breakdown ("category breakdown", "breakdown by category")
        if "category" in lower and ("breakdown" in lower or "distribution" in lower or "spend" in lower):
            return await self.analytics_tools.get_category_breakdown()

        # 6. Delete expense ("Delete the 800 shirt expense", "Delete the Uber expense from yesterday")
        if lower.startswith("delete") or "remove the" in lower or "delete the" in lower:
            query_part = re.sub(r'^(?:delete|remove)\s+(?:the\s+)?', '', lower)
            query_part = re.sub(r'\s+expense.*$', '', query_part)
            clean_query = query_part.replace("from yesterday", "").replace("yesterday", "").strip()
            # Extract merchant/keywords
            clean_query = re.sub(r'[₹$€£]', '', clean_query).strip()
            return await self.expense_tools.search_and_delete_expense(clean_query)

        # 7. Update expense ("Change that expense from 500 to 650", "Change yesterday's Uber expense to 650")
        if lower.startswith("change") or lower.startswith("update"):
            to_match = re.search(r'(?:to|become)\s+[₹$€£]?\s*(\d+(?:\.\d{1,2})?)', lower)
            if to_match:
                new_amount = float(to_match.group(1))
                # Find recent matching expense or merchant
                merchant_match = re.search(r'(?:change|update)\s+(?:yesterday\'s\s+)?([a-zA-Z]+)', lower)
                merchant_keyword = merchant_match.group(1) if merchant_match else ""
                repo = self.services["expense_service"].expense_repo
                matches = await repo.search_expenses(self.context.user_id, merchant_keyword, limit=1)
                if matches:
                    target = matches[0]
                    return await self.expense_tools.update_expense(str(target.id), amount=new_amount)
                # Fallback to the latest expense
                recent, _ = await self.services["expense_service"].list_expenses(
                    self.context.user_id,
                    from_app_schemas := type("Obj", (), {"limit": 1, "offset": 0, "start_date": None, "end_date": None, "category": None, "merchant": None})()
                )
                if recent:
                    return await self.expense_tools.update_expense(str(recent[0].id), amount=new_amount)

        # 8. Subscription check ("Is my Netflix subscription still active?", "Netflix subscription")
        if "subscription" in lower or "netflix" in lower or "spotify" in lower:
            merchant_name = "Netflix" if "netflix" in lower else "Spotify" if "spotify" in lower else "Subscription"
            return await self.recurring_tools.check_subscription_status(merchant_name)

        # 9. List recent expenses ("List my expenses", "What did I spend?")
        if "list" in lower and "expense" in lower or lower in ("what did i spend?", "recent expenses", "my expenses"):
            return await self.expense_tools.list_expenses(limit=5)

        # 10. Record Expense ("I spent 450 on dinner", "Spent 120 on Uber", "450 for coffee", "dinner 450", "450 dinner", "spent 450 dinner")
        raw_target = None
        amount_val = None

        spend_match = re.search(r'(?:i\s+spent|spent|paid)\s+[₹$€£]?\s*(\d+(?:\.\d{1,2})?)(?:\s+(?:on|for|at))?\s+([a-zA-Z0-9\s&]+)', lower)
        if spend_match:
            amount_val = float(spend_match.group(1))
            raw_target = spend_match.group(2).strip().title()
        else:
            # "450 on dinner" or "450 for lunch" or "450 dinner"
            num_first = re.search(r'^[₹$€£]?\s*(\d+(?:\.\d{1,2})?)(?:\s+(?:on|for|at))?\s+([a-zA-Z0-9\s&]+)', lower)
            if num_first:
                amount_val = float(num_first.group(1))
                raw_target = num_first.group(2).strip().title()
            else:
                # "dinner 450" or "coffee 120"
                text_first = re.search(r'^([a-zA-Z\s&]+)\s+[₹$€£]?\s*(\d+(?:\.\d{1,2})?)$', lower)
                if text_first:
                    raw_target = text_first.group(1).strip().title()
                    amount_val = float(text_first.group(2))

        if amount_val is not None and raw_target:

            # Categorize
            category = "Other"
            merchant = raw_target
            lower_target = raw_target.lower()

            if any(w in lower_target for w in ["dinner", "lunch", "breakfast", "food", "cafe", "coffee", "restaurant", "starbucks", "mcdonalds", "pizza"]):
                category = "Food & Dining"
            elif any(w in lower_target for w in ["uber", "lyft", "taxi", "bus", "train", "metro", "fuel", "gas", "petrol"]):
                category = "Transportation"
            elif any(w in lower_target for w in ["shirt", "clothes", "shoes", "amazon", "shopping", "store"]):
                category = "Shopping"
            elif any(w in lower_target for w in ["groceries", "supermarket", "grocery", "walmart", "milk", "vegetables"]):
                category = "Groceries"
            elif any(w in lower_target for w in ["netflix", "movie", "cinema", "spotify", "game"]):
                category = "Entertainment"
            elif any(w in lower_target for w in ["electricity", "water", "wifi", "internet", "bill", "rent"]):
                category = "Bills & Utilities"

            return await self.expense_tools.create_expense(
                amount=amount_val,
                category=category,
                merchant=merchant,
                description=f"Recorded via {self.context.channel}"
            )

        # Default help
        return (
            "I can help you manage your expenses! You can ask me:\n"
            "• 'I spent 450 on dinner.'\n"
            "• 'What did I spend today?'\n"
            "• 'How much did I spend this month?'\n"
            "• 'Give me my September report.'\n"
            "• 'Delete the Uber expense.'\n"
            "• 'Is my Netflix subscription still active?'"
        )
