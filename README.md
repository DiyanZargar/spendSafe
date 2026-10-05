# Agentic Expense Management Platform

A multi-user expense management application built as a **Modular Monolith with MVC architecture**, Service Layer, Repository Pattern, and an embedded conversational **Agno AI Expense Agent**.

Users can record, query, edit, delete, analyze, and receive reminders about expenses through:
- **React Financial Dashboard** (Vite + TypeScript + Tailwind CSS v4 + Recharts with modern **Light Theme**)
- **WhatsApp** (via Twilio WhatsApp integration — configured in UI)
- **Telegram** (via Telegram Bot API — configured in UI)
- **Slack** (via Slack Webhook & Bot adapter — configured in UI)

---

## 1. Architecture

```text
HTTP / Webhooks / Chat
       │
       ▼
Controllers (FastAPI / Thin MVC Routes)
       │
       ├── ConversationService ──► ExpenseAgent (Agno + Tools)
       │                                  │
       ▼                                  ▼
Services (Business Logic, Auth, Orchestration, Validation)
       │
       ▼
Repositories (BaseRepository[T], Data Access Queries)
       │
       ▼
Database (PostgreSQL + pgvector / Async SQLAlchemy 2.x)
```

### Core Architectural Decisions
- **Modular Monolith**: One deployable application with clear internal domain boundaries.
- **Thin Controllers**: Zero business logic or database queries inside route functions.
- **User Isolation**: All financial records and agent tools are strictly scoped to the authenticated user's ID.
- **Decimal Precision**: All currency amounts use `Decimal` / `Numeric(12, 2)` to eliminate floating-point rounding errors.
- **Channel Inversion**: The core application depends only on the `BaseChannel` contract. Provider SDKs are decoupled.
- **Zero Hardcoded Secrets**: All keys, passwords, database URLs, and encryption seeds are loaded from `.env`.

---

## 2. Technology Stack

### Backend
- **Python 3.12+**
- **FastAPI**
- **Pydantic v2**
- **SQLAlchemy 2.x (Async)** & **Alembic**
- **PostgreSQL** with **pgvector**
- **Agno** (formerly Phidata) for autonomous agents
- **Redis** & **ARQ** for background workers and schedulers
- **JWT** (`pyjwt`) authentication & **Bcrypt** password hashing
- **Cryptography (Fernet)** for user channel credential encryption at rest
- **Matplotlib & Pillow** for high-resolution visual PNG financial report generation

### Frontend
- **React 18/19** & **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **TanStack Query** (React Query)
- **Recharts**
- **Lucide React**

---

## 3. Directory Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── controllers/         # Thin MVC Controllers
│   │   │   ├── auth_controller.py
│   │   │   ├── expense_controller.py
│   │   │   ├── analytics_controller.py
│   │   │   ├── conversation_controller.py
│   │   │   ├── channel_controller.py
│   │   │   └── report_controller.py
│   │   ├── models/              # SQLAlchemy 2.x Declarative Models
│   │   │   ├── user.py
│   │   │   ├── expense.py
│   │   │   ├── category.py
│   │   │   ├── recurring_expense.py
│   │   │   ├── conversation.py
│   │   │   ├── message.py
│   │   │   ├── channel_connection.py
│   │   │   ├── notification.py
│   │   │   └── report.py
│   │   ├── schemas/             # Pydantic v2 Contracts
│   │   ├── services/            # Business Logic Layer
│   │   ├── repositories/        # Database Access Layer (BaseRepository[T])
│   │   ├── agents/              # Agno BaseAgent & ExpenseAgent
│   │   │   ├── base_agent.py
│   │   │   ├── expense_agent.py
│   │   │   ├── context.py
│   │   │   └── tools/           # Strongly-typed domain tools
│   │   ├── channels/            # BaseChannel & Channel Adapters
│   │   │   ├── base_channel.py
│   │   │   ├── channel_manager.py
│   │   │   ├── web.py
│   │   │   ├── telegram.py
│   │   │   ├── whatsapp.py
│   │   │   └── slack.py
│   │   ├── reports/             # Monthly/Yearly data + PNG renderer
│   │   ├── workers/             # ARQ background jobs and scheduler
│   │   ├── database/            # Engine, session, migrations
│   │   ├── security/            # JWT, bcrypt, Fernet encryption
│   │   └── utils/               # Datetime, currency, serialization
│   ├── tests/                   # Pytest test suite
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Recharts, Table, Modal, AI Chat Widget
│   │   ├── pages/               # Dashboard, Expenses, Reports, Settings, Auth
│   │   ├── layouts/             # AppLayout
│   │   ├── services/            # Client API Layer
│   │   └── types/               # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
├── Makefile
└── README.md
```

---

## 4. Quick Start with Docker Compose

1. **Clone & Setup Environment:**
   ```bash
   cp .env.example .env
   ```

2. **Launch all services:**
   ```bash
   docker compose up --build
   ```

   Services started:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:8000
   - **Swagger Docs**: http://localhost:8000/docs
   - **PostgreSQL + pgvector**: localhost:5432
   - **Redis**: localhost:6379
   - **ARQ Worker**: Background tasks processor

---

## 5. Local Development Setup (Without Docker)

### Backend
```bash
# 1. Create and activate virtual environment
cd backend
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -e .

# 3. Run FastAPI dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 6. Running Automated Tests

Run the full pytest suite (uses fast in-memory SQLite async testing with full user isolation verification):

```bash
make test
# Or directly:
cd backend && pytest -v tests/
```

**Test Coverage Highlights:**
- **`test_auth.py`**: Registration, duplicate prevention, password validation, JWT tokens, unauthorized route blocking.
- **`test_expenses.py`**: CRUD operations, Decimal precision, strict user data isolation (User B cannot access User A's data).
- **`test_agent.py`**: Conversational natural language expense creation, updates, deletions, and reports.
- **`test_channels.py`**: BaseChannel contract adherence, webhook parsing, and identity resolution.
- **`test_services.py`**: Direct business logic unit tests and visual PNG report generation.

---

## 7. Conversational AI Agent (Agno ExpenseAgent)

The embedded AI Assistant understands natural queries:

| Command | Action Taken |
| :--- | :--- |
| `I spent 450 on dinner` | Records expense of $450 in category **Food & Dining** |
| `What did I spend today?` | Aggregates today's total spending and transactions |
| `How much did I spend this month?` | Compiles monthly financial overview with average per transaction |
| `Delete the Uber expense` | Identifies and removes the matching transaction |
| `Change that expense from 500 to 650` | Modifies the matching transaction amount |
| `Give me my September report` | Aggregates metrics and generates a downloadable visual PNG report |
| `Is my Netflix subscription still active?` | Checks recurring expense status and next renewal date |

---

## 8. Financial Infographic Reports

The platform includes a built-in visual PNG infographic renderer (`renderer.py`). When the user or agent requests a monthly or annual report, it compiles:
- Total spend & daily average
- Category breakdown horizontal bar chart
- Daily spending trajectory area chart
- High-resolution dark aesthetic PNG ready to download or send directly via WhatsApp/Telegram!

---

## 9. Security & Encryption
- **UI-Only Channel Configuration**: All external channels (WhatsApp, Telegram, Slack) are configured strictly through the web UI by the authenticated user. Zero channel credentials or bot tokens exist in `.env` files or backend settings.
- **Credential Encryption at Rest**: Channel tokens, Twilio credentials, and webhooks are encrypted using **Fernet (AES-128-CBC + SHA256 HMAC)** with `CREDENTIALS_ENCRYPTION_KEY` before saving in PostgreSQL. Secrets are never returned in API responses or logged.
- **Password Storage**: Salted **Bcrypt** hashing.
- **Tokens**: Signed **HS256 JWT** tokens with configurable expiration.
- **Minimal Environment Footprint**: `.env` contains strictly required infrastructure variables (PostgreSQL, Redis, JWT secrets, Fernet encryption key, app host/port, CORS, and optional OpenAI key).

---

## 10. UI Channels Configuration & Light Theme

### Light Theme
The platform is styled using a modern **Light Theme** built on Tailwind CSS v4:
- Clean slate-50 canvas with crisp slate-200 bordered cards and soft shadows.
- High-contrast typography with emerald (`#059669`) primary brand accents.
- Light-themed Recharts charts with clean grid lines and styled tooltips.
- Full responsive support for mobile, tablet, and desktop viewports.

### Configuring Channels in the UI
Navigate to **Channels & Settings** in the dashboard:
1. **Twilio WhatsApp**:
   - Provide your **Twilio Account SID**, **Auth Token**, and **WhatsApp Sender Number**.
   - Copy the displayed Webhook URL (`http://<domain>:8000/api/v1/channels/webhook/whatsapp`) into your Twilio Sandbox console.
   - Click **Test Credentials** to verify with Twilio live, then click **Connect & Encrypt**.
2. **Telegram Bot**:
   - Create a bot via `@BotFather` on Telegram to receive your bot token.
   - Enter your **Bot Token** and **Telegram Chat/User ID** (from `@userinfobot`).
   - Copy the Webhook URL (`http://<domain>:8000/api/v1/channels/webhook/telegram`).
   - Click **Test Bot Token**, then click **Connect & Encrypt**.
3. **Slack**:
   - Choose between **Incoming Webhook URL** or **Bot OAuth Token (`xoxb-...`)** with target channel ID.
   - Copy the Webhook URL (`http://<domain>:8000/api/v1/channels/webhook/slack`).
   - Click **Test Slack Connection**, then click **Connect & Encrypt**.

All credentials are encrypted with AES-Fernet before being saved and never leak to browser responses.

---

## 11. UI-Only AI & LLM Provider Configuration

The conversational agent's LLM provider and API keys are **configured exclusively in the UI** (never in backend configuration files or `.env`):

### Supported Providers:
- **OpenAI** (`gpt-4o`, `gpt-4o-mini`, `o1`, etc.)
- **Anthropic** (`claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, etc.)
- **Google Gemini** (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`, etc.)
- **Groq** (`llama-3.3-70b-versatile`, `mixtral-8x7b-32768`, etc.)
- **Ollama** (Local / self-hosted models like `llama3.1`, `mistral`, `deepseek-r1`)
- **Custom / OpenAI-Compatible** endpoints (vLLM, LM Studio, custom gateways)

### How It Works:
1. Navigate to **Channels & Settings** in the web dashboard.
2. Select your provider, enter your personal API key (or local endpoint for Ollama).
3. Click **"Run curl to Check Available Models"**:
   - The platform executes a real `curl` command against the provider endpoint (e.g. `curl -s -X GET "https://api.openai.com/v1/models" -H "Authorization: Bearer <key>"`).
   - The UI displays the exact executed `curl` command in an interactive terminal snippet with copy-to-clipboard functionality.
   - All retrieved models are automatically populated into the Model Name dropdown selector.
4. Click **"Save & Encrypt LLM"**:
   - The API key is encrypted at rest using **AES-Fernet** cryptography.
   - Subsequent API reads return only masked keys (e.g. `sk-••••1234`), preserving zero-knowledge security.
   - When communicating with the agent in Web Chat or messaging channels, `ExpenseAgent` dynamically uses your chosen provider and model.
   - If no LLM is configured, the platform functions offline using its built-in deterministic intent engine.
