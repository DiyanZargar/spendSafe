import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User as UserIcon,
  RotateCcw,
  Zap,
  Layers,
  ArrowUpRight,
  TrendingUp,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { chatService } from '../services/chat';

interface NeuralAICopilotProps {
  initialConversationId?: string;
  onExpenseMutated?: () => void;
  onClose?: () => void;
  isFloating?: boolean;
}

const ACTION_MODES = [
  {
    category: 'Log',
    icon: Zap,
    prompts: [
      'Spent $45 on dinner with friends',
      'Log $18 for Uber ride',
      'Record $120 power utility bill',
    ],
  },
  {
    category: 'Audit',
    icon: Layers,
    prompts: [
      'How much did I spend this month?',
      'What did I spend today?',
      'Breakdown my top spending category',
    ],
  },
  {
    category: 'Forecast',
    icon: TrendingUp,
    prompts: [
      'Is my Netflix subscription active?',
      'Give me a summary report',
      'Compare this month to last month',
    ],
  },
];

export const NeuralAICopilot: React.FC<NeuralAICopilotProps> = ({
  initialConversationId,
  onExpenseMutated,
  onClose,
  isFloating = false,
}) => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      sender: 'assistant',
      text: "⚡ Neural Co-Pilot active. Type natural commands to log expenses or query your ledger.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (messageToSend?: string) => {
    const text = (messageToSend || inputText).trim();
    if (!text || isLoading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, { sender: 'user', text, time: userTime }]);
    if (!messageToSend) setInputText('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(text, conversationId, 'web');
      setConversationId(response.conversation_id);

      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: response.reply, time: botTime },
      ]);

      // Automatically refresh queries
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      if (onExpenseMutated) onExpenseMutated();
    } catch (err: any) {
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ ${err.message || 'Request failed.'}`,
          time: botTime,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        sender: 'assistant',
        text: "Co-Pilot memory reset. Ready for next query.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Minimized pill state
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-2xl transition-all hover:scale-105 font-mono text-xs font-bold animate-fadeIn"
        style={{
          backgroundColor: 'var(--bg-card-elevated)',
          borderColor: 'var(--accent-purple)',
          color: 'var(--accent-purple)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 0 20px rgba(174, 129, 255, 0.3)',
        }}
      >
        <Bot className="w-4 h-4 text-purple-400" />
        <span>Neural Co-Pilot</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      </button>
    );
  }

  return (
    <div
      className="flex flex-col w-full rounded-3xl border transition-all overflow-hidden shadow-2xl font-mono text-xs"
      style={{
        backgroundColor: 'var(--bg-card-elevated)',
        borderColor: 'var(--border-main)',
        maxHeight: '500px',
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.4), 0 0 24px rgba(174, 129, 255, 0.2)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center justify-between border-b shrink-0"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-sidebar)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-purple)',
            }}
          >
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              <span>Co-Pilot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            title="Reset Context"
            className="p-1 rounded-lg border transition-colors hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize"
            className="p-1 rounded-lg border transition-colors hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-hover)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            <Minimize2 className="w-3 h-3" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Close"
              className="p-1 rounded-lg border transition-colors hover:scale-105"
              style={{
                backgroundColor: 'var(--bg-hover)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector Strip */}
      <div
        className="px-2.5 py-1.5 flex items-center gap-1.5 border-b overflow-x-auto scrollbar-none shrink-0"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-base)',
        }}
      >
        {ACTION_MODES.map((mode, idx) => {
          const Icon = mode.icon;
          const active = activeCategoryIdx === idx;
          return (
            <button
              key={mode.category}
              onClick={() => setActiveCategoryIdx(idx)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all shrink-0 border ${
                active ? 'scale-102 shadow-2xs font-bold' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: active ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
                borderColor: active ? 'var(--accent-purple)' : 'var(--border-subtle)',
                color: active ? 'var(--accent-purple)' : 'var(--text-muted)',
              }}
            >
              <Icon className="w-2.5 h-2.5" />
              <span>{mode.category}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Feed (Compact, Scrollable, No Dead Gaps) */}
      <div
        className="overflow-y-auto p-3 space-y-2 h-[250px] shrink-0"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  borderColor: 'var(--border-active)',
                  color: 'var(--accent-cyan)',
                }}
              >
                <Bot className="w-3 h-3" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-2.5 text-[11px] leading-relaxed transition-all ${
                m.sender === 'user'
                  ? 'rounded-tr-none font-medium'
                  : 'rounded-tl-none border whitespace-pre-wrap'
              }`}
              style={
                m.sender === 'user'
                  ? {
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-primary-fg)',
                      boxShadow: '0 2px 8px var(--accent-primary-glow)',
                    }
                  : {
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-main)',
                      color: 'var(--text-primary)',
                    }
              }
            >
              <div>{m.text}</div>
              <div
                className="text-[9px] mt-0.5 text-right opacity-70"
                style={{
                  color: m.sender === 'user' ? '#ffffff' : 'var(--text-muted)',
                }}
              >
                {m.time}
              </div>
            </div>

            {m.sender === 'user' && (
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-main)',
                  color: 'var(--text-muted)',
                }}
              >
                <UserIcon className="w-3 h-3" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div
            className="flex items-center gap-2 p-2 rounded-xl border w-fit"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-active)',
            }}
          >
            <div className="flex items-center gap-0.5 h-3 px-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full waveform-bar"
                  style={{
                    backgroundColor:
                      i % 3 === 0
                        ? 'var(--accent-magenta)'
                        : i % 2 === 0
                        ? 'var(--accent-cyan)'
                        : 'var(--accent-yellow)',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Executing backend tools...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips (Single Slim Row) */}
      <div
        className="px-2.5 py-1.5 border-t flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-card-subtle)',
        }}
      >
        {ACTION_MODES[activeCategoryIdx].prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            disabled={isLoading}
            className="shrink-0 px-2 py-0.5 rounded-lg border text-[10px] transition-all hover:scale-102 flex items-center gap-1"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-main)',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="truncate max-w-[170px]">{p}</span>
            <ArrowUpRight className="w-2.5 h-2.5 opacity-60" style={{ color: 'var(--accent-cyan)' }} />
          </button>
        ))}
      </div>

      {/* Compact Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2 border-t flex items-center gap-1.5 shrink-0"
        style={{
          borderColor: 'var(--border-main)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <input
          type="text"
          placeholder="Instruct Co-Pilot (e.g. 'Spent $20 at Target')..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-3 py-1.5 rounded-xl text-[11px] border focus:outline-none transition-all"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-main)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="p-2 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--accent-primary-fg)',
            boxShadow: '0 2px 8px var(--accent-primary-glow)',
          }}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
