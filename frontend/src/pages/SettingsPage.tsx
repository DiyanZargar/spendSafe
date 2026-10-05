import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle,
  Send,
  Hash,
  CheckCircle,
  AlertCircle,
  Trash2,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Terminal,
  Cpu,
  ChevronDown,
  Edit2,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import {
  ChannelConnection,
  ChannelVerifyResult,
  User,
  LLMConfigResponse,
  LLMFetchModelsResult,
} from '../types';

interface SettingsPageProps {
  user: User | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'telegram' | 'slack'>('whatsapp');

  // WhatsApp form state
  const [waSid, setWaSid] = useState('');
  const [waToken, setWaToken] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [showWaToken, setShowWaToken] = useState(false);

  // Telegram form state
  const [tgToken, setTgToken] = useState('');
  const [tgId, setTgId] = useState('');
  const [showTgToken, setShowTgToken] = useState(false);

  // Slack form state
  const [slackWebhook, setSlackWebhook] = useState('');
  const [slackBotToken, setSlackBotToken] = useState('');
  const [slackChannelId, setSlackChannelId] = useState('');
  const [slackMode, setSlackMode] = useState<'webhook' | 'bot'>('webhook');
  const [showSlackToken, setShowSlackToken] = useState(false);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ channel: string; valid: boolean; message: string } | null>(null);

  // Copy state
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const webhookBaseUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1/channels/webhook`
    : 'http://localhost:8000/api/v1/channels/webhook';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(key);
    setTimeout(() => setCopiedWebhook(null), 2000);
  };

  // Fetch connections
  const { data: connections = [], isLoading } = useQuery<ChannelConnection[]>({
    queryKey: ['channel_connections'],
    queryFn: () => apiRequest<ChannelConnection[]>('/channels/connections'),
  });

  // Verify credentials mutation
  const handleVerifyCredentials = async (channelType: string, credentials: Record<string, any>) => {
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const result = await apiRequest<ChannelVerifyResult>('/channels/verify', {
        method: 'POST',
        body: JSON.stringify({
          channel_type: channelType,
          credentials,
        }),
      });
      setVerifyResult({ channel: channelType, valid: result.valid, message: result.message });
    } catch (err: any) {
      setVerifyResult({
        channel: channelType,
        valid: false,
        message: err.message || 'Verification failed. Could not reach channel provider.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: (data: { channel_type: string; external_identifier: string; credentials: Record<string, any>; verify?: boolean }) =>
      apiRequest('/channels/connect', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channel_connections'] });
      setStatusMsg({
        type: 'success',
        text: `${variables.channel_type.toUpperCase()} connected successfully! Credentials are encrypted with AES-Fernet at rest.`,
      });
      setVerifyResult(null);
      if (variables.channel_type === 'whatsapp') {
        setWaSid('');
        setWaToken('');
        setWaNumber('');
      } else if (variables.channel_type === 'telegram') {
        setTgToken('');
        setTgId('');
      } else if (variables.channel_type === 'slack') {
        setSlackWebhook('');
        setSlackBotToken('');
        setSlackChannelId('');
      }
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to connect channel.' });
    },
  });

  // Disconnect mutation
  // Editing state for existing channel connection
  const [editingConnection, setEditingConnection] = useState<ChannelConnection | null>(null);

  // Update connection mutation
  const updateConnectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { external_identifier?: string; credentials?: Record<string, any> } }) =>
      apiRequest(`/channels/connections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel_connections'] });
      setStatusMsg({
        type: 'success',
        text: 'Channel updated successfully! Changes saved with AES-Fernet encryption at rest.',
      });
      setVerifyResult(null);
      setEditingConnection(null);
      setWaSid('');
      setWaToken('');
      setWaNumber('');
      setTgToken('');
      setTgId('');
      setSlackWebhook('');
      setSlackBotToken('');
      setSlackChannelId('');
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update channel.' });
    },
  });

  // Disconnect mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/channels/connections/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel_connections'] });
      setStatusMsg({ type: 'success', text: 'Channel disconnected and encrypted credentials deleted.' });
      if (editingConnection) {
        setEditingConnection(null);
      }
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to disconnect channel.' });
    },
  });

  const handleConnectWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingConnection && editingConnection.channel_type === 'whatsapp') {
      if (!waNumber.trim()) {
        setStatusMsg({ type: 'error', text: 'Please enter a WhatsApp number.' });
        return;
      }
      const creds: Record<string, any> = {};
      if (waSid.trim()) creds.account_sid = waSid.trim();
      if (waToken.trim()) creds.auth_token = waToken.trim();
      if (waNumber.trim()) creds.whatsapp_number = waNumber.trim();
      updateConnectionMutation.mutate({
        id: editingConnection.id,
        data: {
          external_identifier: waNumber.trim(),
          credentials: Object.keys(creds).length > 0 ? creds : undefined,
        },
      });
      return;
    }

    if (!waSid.trim() || !waToken.trim() || !waNumber.trim()) {
      setStatusMsg({ type: 'error', text: 'Please fill in all Twilio WhatsApp fields.' });
      return;
    }
    connectMutation.mutate({
      channel_type: 'whatsapp',
      external_identifier: waNumber.trim(),
      credentials: {
        account_sid: waSid.trim(),
        auth_token: waToken.trim(),
        whatsapp_number: waNumber.trim(),
      },
      verify: false,
    });
  };

  const handleConnectTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingConnection && editingConnection.channel_type === 'telegram') {
      if (!tgId.trim()) {
        setStatusMsg({ type: 'error', text: 'Please enter your Telegram Chat ID.' });
        return;
      }
      const creds: Record<string, any> = {};
      if (tgToken.trim()) creds.bot_token = tgToken.trim();
      updateConnectionMutation.mutate({
        id: editingConnection.id,
        data: {
          external_identifier: tgId.trim(),
          credentials: Object.keys(creds).length > 0 ? creds : undefined,
        },
      });
      return;
    }

    if (!tgToken.trim() || !tgId.trim()) {
      setStatusMsg({ type: 'error', text: 'Please fill in both Telegram Bot Token and Chat ID.' });
      return;
    }
    connectMutation.mutate({
      channel_type: 'telegram',
      external_identifier: tgId.trim(),
      credentials: {
        bot_token: tgToken.trim(),
      },
      verify: false,
    });
  };

  const handleConnectSlack = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingConnection && editingConnection.channel_type === 'slack') {
      const creds: Record<string, any> = {};
      if (slackMode === 'webhook') {
        if (slackWebhook.trim()) creds.webhook_url = slackWebhook.trim();
        updateConnectionMutation.mutate({
          id: editingConnection.id,
          data: {
            external_identifier: 'slack-incoming-webhook',
            credentials: Object.keys(creds).length > 0 ? creds : undefined,
          },
        });
      } else {
        if (!slackChannelId.trim()) {
          setStatusMsg({ type: 'error', text: 'Please enter a Slack Channel ID.' });
          return;
        }
        if (slackBotToken.trim()) creds.bot_token = slackBotToken.trim();
        if (slackChannelId.trim()) creds.channel_id = slackChannelId.trim();
        updateConnectionMutation.mutate({
          id: editingConnection.id,
          data: {
            external_identifier: slackChannelId.trim(),
            credentials: Object.keys(creds).length > 0 ? creds : undefined,
          },
        });
      }
      return;
    }

    if (slackMode === 'webhook') {
      if (!slackWebhook.trim()) {
        setStatusMsg({ type: 'error', text: 'Please enter a Slack Webhook URL.' });
        return;
      }
      connectMutation.mutate({
        channel_type: 'slack',
        external_identifier: 'slack-incoming-webhook',
        credentials: {
          webhook_url: slackWebhook.trim(),
        },
        verify: false,
      });
    } else {
      if (!slackBotToken.trim() || !slackChannelId.trim()) {
        setStatusMsg({ type: 'error', text: 'Please enter Slack Bot Token and Channel ID.' });
        return;
      }
      connectMutation.mutate({
        channel_type: 'slack',
        external_identifier: slackChannelId.trim(),
        credentials: {
          bot_token: slackBotToken.trim(),
          channel_id: slackChannelId.trim(),
        },
        verify: false,
      });
    }
  };

  // ---------------- LLM Configuration State ----------------
  const [llmProvider, setLlmProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama' | 'custom'>('openai');
  const [llmModel, setLlmModel] = useState('gpt-4o');
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [showLlmKey, setShowLlmKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [lastCurlCommand, setLastCurlCommand] = useState<string | null>(null);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchModelsMsg, setFetchModelsMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Fetch current LLM config
  const { data: llmConfig, isLoading: isLoadingLlm } = useQuery<LLMConfigResponse>({
    queryKey: ['llm_config'],
    queryFn: () => apiRequest<LLMConfigResponse>('/llm/config'),
  });

  // Sync state once fetched
  React.useEffect(() => {
    if (llmConfig?.configured && llmConfig.provider) {
      setLlmProvider(llmConfig.provider as any);
      if (llmConfig.model) setLlmModel(llmConfig.model);
      if (llmConfig.base_url) setLlmBaseUrl(llmConfig.base_url);
    }
  }, [llmConfig]);

  // Save LLM Config Mutation
  const saveLlmMutation = useMutation({
    mutationFn: (data: { provider: string; model: string; api_key?: string; base_url?: string }) =>
      apiRequest<LLMConfigResponse>('/llm/config', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['llm_config'] });
      setLlmApiKey('');
      setStatusMsg({
        type: 'success',
        text: `LLM Configuration saved! AI provider set to ${data.provider?.toUpperCase()} (${data.model}). Key encrypted with Fernet at rest.`,
      });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save LLM configuration.' });
    },
  });

  // Delete LLM Config Mutation
  const deleteLlmMutation = useMutation({
    mutationFn: () => apiRequest('/llm/config', { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm_config'] });
      setLlmApiKey('');
      setAvailableModels([]);
      setLastCurlCommand(null);
      setStatusMsg({ type: 'success', text: 'Custom LLM removed. Returned to default/offline parsing.' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to remove LLM configuration.' });
    },
  });

  // Fetch available models by running curl command
  const handleFetchModels = async () => {
    setIsFetchingModels(true);
    setFetchModelsMsg(null);
    try {
      const res = await apiRequest<LLMFetchModelsResult>('/llm/fetch-models', {
        method: 'POST',
        body: JSON.stringify({
          provider: llmProvider,
          api_key: llmApiKey.trim() || undefined,
          base_url: llmBaseUrl.trim() || undefined,
        }),
      });
      setLastCurlCommand(res.curl_command);
      if (res.success && res.models && res.models.length > 0) {
        setAvailableModels(res.models);
        // Default to first or current model
        if (!res.models.includes(llmModel)) {
          setLlmModel(res.models[0]);
        }
        setFetchModelsMsg({
          success: true,
          text: res.message || `Retrieved ${res.models.length} available models via curl execution!`,
        });
      } else {
        setFetchModelsMsg({
          success: res.success,
          text: res.message || 'No models returned from endpoint.',
        });
      }
    } catch (err: any) {
      setFetchModelsMsg({
        success: false,
        text: err.message || 'Failed to run curl command against endpoint.',
      });
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSaveLlm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!llmModel.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter or select a model name.' });
      return;
    }
    // If not configured yet and no key entered for cloud providers
    if (!llmConfig?.configured && !llmApiKey.trim() && llmProvider !== 'ollama') {
      setStatusMsg({ type: 'error', text: 'Please enter your API Key to configure this LLM provider.' });
      return;
    }
    saveLlmMutation.mutate({
      provider: llmProvider,
      model: llmModel.trim(),
      api_key: llmApiKey.trim() || undefined,
      base_url: llmBaseUrl.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Channel Connections & Integration Settings</h2>
        <p className="text-xs text-slate-500">
          Configure external communication channels directly in the UI. No backend environment credentials required.
        </p>
      </div>

      {/* Security Architecture Notice */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-xs space-y-1.5">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>UI-Only Configuration & Zero-Knowledge Architecture</span>
        </div>
        <p className="text-[11px] text-slate-700 leading-relaxed">
          Messaging integrations (WhatsApp, Telegram, Slack) are configured <span className="font-bold text-emerald-800">strictly in this user interface</span>.
          No channel tokens exist in backend <code className="text-[10px] bg-white px-1.5 py-0.5 rounded text-slate-800 border border-slate-200">.env</code> files.
          All credentials are encrypted with <span className="font-bold text-emerald-700">AES-Fernet cryptography at rest</span> and are never exposed in API responses.
        </p>
      </div>

      {/* User profile card */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-900">{user?.full_name}</div>
          <div className="text-xs text-slate-500">{user?.email}</div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">Default Currency: {user?.currency} • Timezone: {user?.timezone}</div>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted Session</span>
        </div>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-[11px] opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ---------------- AI & LLM Provider Configuration Card ---------------- */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>AI & LLM Model Configuration</span>
                {llmConfig?.configured ? (
                  <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                    {llmConfig.provider?.toUpperCase()} • {llmConfig.model}
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                    Default / Offline Mode
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Configure your personal AI provider and model directly in the UI. No backend environment credentials required.
              </p>
            </div>
          </div>

          {llmConfig?.configured && (
            <button
              onClick={() => {
                if (confirm('Disconnect custom LLM configuration? The agent will revert to the offline/deterministic parser.')) {
                  deleteLlmMutation.mutate();
                }
              }}
              title="Remove LLM Configuration"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Informative Security Banner */}
        <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-[11px] text-purple-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>
              Your API key is encrypted at rest using <span className="font-semibold">AES-Fernet</span>. It is never exposed in plain text.
            </span>
          </div>
          {llmConfig?.masked_api_key && (
            <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-700">
              Key: {llmConfig.masked_api_key}
            </span>
          )}
        </div>

        {/* Fetch models feedback banner */}
        {fetchModelsMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              fetchModelsMsg.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {fetchModelsMsg.success ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{fetchModelsMsg.text}</span>
          </div>
        )}

        {/* Last Executed curl command display */}
        {lastCurlCommand && (
          <div className="p-3 bg-slate-900 rounded-xl space-y-1.5 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Executed curl command to check available models:</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(lastCurlCommand, 'curl_cmd')}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
              >
                {copiedWebhook === 'curl_cmd' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedWebhook === 'curl_cmd' ? 'Copied' : 'Copy curl'}</span>
              </button>
            </div>
            <div className="font-mono text-[11px] text-emerald-300 break-all select-all">
              {lastCurlCommand}
            </div>
          </div>
        )}

        {/* OpenRouter Rate Limit Advice Notice */}
        <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>OpenRouter Free-Tier Daily Quotas & Alternative Free Providers:</span>
          </div>
          <p className="leading-relaxed text-slate-700">
            OpenRouter limits free accounts with $0 credits to a daily request quota. If you see HTTP 429 (<code className="text-[10px] bg-white px-1 py-0.5 rounded border border-amber-200 font-mono">Rate limit exceeded: free-models-per-day</code>), 
            the Expense Agent continues to process all your Telegram messages and expenses smoothly via its built-in local engine!
            You can also switch provider to <strong>Groq</strong> (which offers 14,400 free requests/day with <code className="text-[10px] bg-white px-1 py-0.5 rounded font-mono">llama-3.3-70b-versatile</code>) or <strong>Google Gemini</strong> in the dropdown.
          </p>
        </div>

        <form onSubmit={handleSaveLlm} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provider Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                LLM Provider
              </label>
              <select
                value={llmProvider}
                onChange={(e) => {
                  const p = e.target.value as any;
                  setLlmProvider(p);
                  setAvailableModels([]);
                  // Default suggested model per provider
                  if (p === 'openai') setLlmModel('gpt-4o');
                  else if (p === 'anthropic') setLlmModel('claude-3-5-sonnet-20241022');
                  else if (p === 'gemini') setLlmModel('gemini-1.5-flash');
                  else if (p === 'groq') setLlmModel('llama-3.3-70b-versatile');
                  else if (p === 'ollama') setLlmModel('llama3.1');
                  else setLlmModel('nvidia/nemotron-3-super-120b-a12b:free');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-semibold"
              >
                <option value="openai">OpenAI (GPT-4o, GPT-4o-mini, o1)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet, Haiku)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Flash, Pro)</option>
                <option value="groq">Groq (Llama 3.3 70B, Mixtral - 14k req/day free)</option>
                <option value="ollama">Ollama (Local / Self-hosted)</option>
                <option value="custom">Custom / OpenAI-Compatible (OpenRouter, Proxies)</option>
              </select>
            </div>

            {/* Model Name / Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1 flex items-center justify-between">
                <span>Model Name / ID</span>
                {availableModels.length > 0 && (
                  <span className="text-emerald-700 font-normal lowercase text-[10px]">
                    {availableModels.length} models fetched via curl
                  </span>
                )}
              </label>
              {availableModels.length > 0 ? (
                <div className="relative">
                  <select
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder={
                    llmProvider === 'openai'
                      ? 'gpt-4o'
                      : llmProvider === 'anthropic'
                      ? 'claude-3-5-sonnet-20241022'
                      : llmProvider === 'gemini'
                      ? 'gemini-1.5-flash'
                      : llmProvider === 'groq'
                      ? 'llama-3.3-70b-versatile'
                      : 'model-identifier'
                  }
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                />
              )}

              {/* Quick Model Selector Pills */}
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Quick Select:</span>
                {llmProvider === 'custom' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setLlmModel('nvidia/nemotron-3-super-120b-a12b:free')}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono border transition-all ${
                        llmModel === 'nvidia/nemotron-3-super-120b-a12b:free'
                          ? 'bg-purple-100 border-purple-300 text-purple-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Nvidia Nemotron 120B (Fast, tested 1.0s)"
                    >
                      nvidia/nemotron-3-super-120b-a12b:free
                    </button>
                    <button
                      type="button"
                      onClick={() => setLlmModel('inclusionai/ling-3.0-flash-sante:free')}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono border transition-all ${
                        llmModel === 'inclusionai/ling-3.0-flash-sante:free'
                          ? 'bg-purple-100 border-purple-300 text-purple-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      inclusionai/ling-3.0-flash-sante:free
                    </button>
                    <button
                      type="button"
                      onClick={() => setLlmModel('dots-studio/dots-3-note-preview:free')}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono border transition-all ${
                        llmModel === 'dots-studio/dots-3-note-preview:free'
                          ? 'bg-purple-100 border-purple-300 text-purple-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      dots-studio/dots-3-note-preview:free
                    </button>
                    <button
                      type="button"
                      onClick={() => setLlmModel('qwen/qwen3.8-27b:free')}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono border transition-all ${
                        llmModel === 'qwen/qwen3.8-27b:free'
                          ? 'bg-purple-100 border-purple-300 text-purple-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      qwen/qwen3.8-27b:free
                    </button>
                  </>
                )}
                {llmProvider === 'groq' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setLlmModel('llama-3.3-70b-versatile')}
                      className="text-[10px] px-2 py-0.5 rounded-md font-mono border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    >
                      llama-3.3-70b-versatile
                    </button>
                    <button
                      type="button"
                      onClick={() => setLlmModel('llama-3.1-8b-instant')}
                      className="text-[10px] px-2 py-0.5 rounded-md font-mono border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    >
                      llama-3.1-8b-instant
                    </button>
                  </>
                )}
                {llmProvider === 'gemini' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setLlmModel('gemini-1.5-flash')}
                      className="text-[10px] px-2 py-0.5 rounded-md font-mono border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    >
                      gemini-1.5-flash
                    </button>
                    <button
                      type="button"
                      onClick={() => setLlmModel('gemini-1.5-pro')}
                      className="text-[10px] px-2 py-0.5 rounded-md font-mono border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    >
                      gemini-1.5-pro
                    </button>
                  </>
                )}
                {llmProvider === 'openai' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setLlmModel('gpt-4o')}
                      className="text-[10px] px-2 py-0.5 rounded-md font-mono border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    >
                      gpt-4o
                    </button>
                    <button
                      type="button"
                      onClick={() => setLlmModel('gpt-4o-mini')}
                      className="text-[10px] px-2 py-0.5 rounded-md font-mono border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                    >
                      gpt-4o-mini
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* API Key */}
          {llmProvider !== 'ollama' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1 flex items-center justify-between">
                <span>Personal API Key</span>
                {llmConfig?.configured && llmConfig.masked_api_key && !llmApiKey && (
                  <span className="text-emerald-700 font-normal lowercase text-[10px]">
                    Using currently stored key ({llmConfig.masked_api_key})
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showLlmKey ? 'text' : 'password'}
                  placeholder={
                    llmConfig?.configured && llmConfig.masked_api_key
                      ? `Leave blank to keep existing key (${llmConfig.masked_api_key})`
                      : 'sk-••••••••••••••••••••••••••••••••'
                  }
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 font-mono pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowLlmKey(!showLlmKey)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                >
                  {showLlmKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Custom Base URL (For Ollama, Custom proxies, or Enterprise endpoints) */}
          {(llmProvider === 'custom' || llmProvider === 'ollama' || llmProvider === 'openai' || llmProvider === 'groq') && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Custom Endpoint / Base URL {llmProvider === 'ollama' ? '(Ollama Host)' : '(Optional)'}
              </label>
              <input
                type="text"
                placeholder={
                  llmProvider === 'ollama'
                    ? 'http://localhost:11434'
                    : llmProvider === 'openai'
                    ? 'https://api.openai.com/v1 (or your proxy)'
                    : 'https://openrouter.ai/api/v1'
                }
                value={llmBaseUrl}
                onChange={(e) => setLlmBaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
              />
            </div>
          )}

          {/* Action buttons: Run curl to fetch models & Save and Encrypt */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isFetchingModels || (!llmApiKey.trim() && !llmConfig?.configured && llmProvider !== 'ollama')}
              onClick={handleFetchModels}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingModels ? 'animate-spin' : ''}`} />
              <span>Run curl to Check Available Models</span>
            </button>

            <button
              type="submit"
              disabled={saveLlmMutation.isPending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{llmConfig?.configured ? 'Update & Save LLM Configuration' : 'Save & Encrypt LLM'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Active connections list */}

      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Your Connected Channels</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              {connections.length} active
            </span>
          </h3>
          <span className="text-[11px] text-slate-500">Credentials encrypted with AES-Fernet</span>
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading channel connections...</span>
          </div>
        ) : connections.length === 0 ? (
          <div className="text-slate-400 text-xs py-6 text-center border border-dashed border-slate-200 rounded-xl">
            No external channels linked yet. Configure WhatsApp, Telegram, or Slack below to chat with your Expense Agent!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {connections.map((c) => (
              <div key={c.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                      c.channel_type === 'whatsapp'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : c.channel_type === 'telegram'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {c.channel_type === 'whatsapp' ? (
                      <MessageCircle className="w-4 h-4" />
                    ) : c.channel_type === 'telegram' ? (
                      <Send className="w-4 h-4" />
                    ) : (
                      <Hash className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 capitalize flex items-center gap-2">
                      <span>{c.channel_type}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Active</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Target: {c.external_identifier}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>Fernet Encrypted</span>
                  </span>
                  <button
                    onClick={() => {
                      setEditingConnection(c);
                      setActiveTab(c.channel_type as any);
                      if (c.channel_type === 'whatsapp') {
                        setWaNumber(c.external_identifier);
                        setWaSid('');
                        setWaToken('');
                      } else if (c.channel_type === 'telegram') {
                        setTgId(c.external_identifier);
                        setTgToken('');
                      } else if (c.channel_type === 'slack') {
                        setSlackChannelId(c.external_identifier);
                        setSlackWebhook('');
                        setSlackBotToken('');
                      }
                      document.getElementById('channel-config-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    title="Edit Channel Configuration"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1 text-xs border border-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] font-medium hidden sm:inline">Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Disconnect and remove ${c.channel_type} connection?`)) {
                        deleteMutation.mutate(c.id);
                      }
                    }}
                    title="Disconnect Channel"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new connection forms */}
      <div id="channel-config-form" className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {editingConnection ? `Edit ${editingConnection.channel_type.toUpperCase()} Channel` : 'Configure or Connect Channel'}
          </h3>
          <p className="text-xs text-slate-500">
            {editingConnection
              ? 'Update the external recipient identifier or enter new credentials. Existing encrypted secrets remain preserved.'
              : 'Select a provider, enter credentials, and test connection live before saving.'}
          </p>
        </div>

        {/* Editing active banner */}
        {editingConnection && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Editing configured <strong>{editingConnection.channel_type.toUpperCase()}</strong> channel (Identifier: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-200">{editingConnection.external_identifier}</code>).
                Leave token/secret fields blank to retain your existing encrypted credentials.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingConnection(null);
                setWaSid('');
                setWaToken('');
                setWaNumber('');
                setTgToken('');
                setTgId('');
                setSlackWebhook('');
                setSlackBotToken('');
                setSlackChannelId('');
              }}
              className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-800 hover:bg-amber-100 text-[11px] font-semibold transition-colors"
            >
              Cancel Edit
            </button>
          </div>
        )}

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => {
              setActiveTab('whatsapp');
              setVerifyResult(null);
            }}
            className={`pb-2.5 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Twilio WhatsApp</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('telegram');
              setVerifyResult(null);
            }}
            className={`pb-2.5 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'telegram'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Telegram Bot</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('slack');
              setVerifyResult(null);
            }}
            className={`pb-2.5 px-4 text-xs font-bold transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'slack'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>Slack</span>
          </button>
        </div>

        {/* Verification feedback box */}
        {verifyResult && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              verifyResult.valid
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {verifyResult.valid ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{verifyResult.message}</span>
          </div>
        )}

        {/* WhatsApp Tab */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4 pt-1">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Webhook URL to configure in Twilio Console:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${webhookBaseUrl}/whatsapp`, 'whatsapp')}
                  className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold"
                >
                  {copiedWebhook === 'whatsapp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook === 'whatsapp' ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-slate-900 select-all break-all font-semibold">
                {webhookBaseUrl}/whatsapp
              </div>
            </div>

            <form onSubmit={handleConnectWhatsApp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Twilio Account SID
                </label>
                <input
                  type="text"
                  placeholder={editingConnection && editingConnection.channel_type === 'whatsapp' ? 'Leave blank to retain existing encrypted SID' : 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'}
                  value={waSid}
                  onChange={(e) => setWaSid(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Twilio Auth Token
                </label>
                <div className="relative">
                  <input
                    type={showWaToken ? 'text' : 'password'}
                    placeholder={editingConnection && editingConnection.channel_type === 'whatsapp' ? 'Leave blank to retain existing encrypted Token' : '••••••••••••••••••••••••••••••••'}
                    value={waToken}
                    onChange={(e) => setWaToken(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 font-mono pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWaToken(!showWaToken)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showWaToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Twilio WhatsApp Sender Number (E.164)
                </label>
                <input
                  type="text"
                  placeholder="+14155238886"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Twilio sandbox number (e.g. +14155238886) or your approved business WhatsApp number.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isVerifying || !waSid.trim() || !waToken.trim()}
                  onClick={() =>
                    handleVerifyCredentials('whatsapp', {
                      account_sid: waSid.trim(),
                      auth_token: waToken.trim(),
                    })
                  }
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>Test Credentials</span>
                </button>

                <button
                  type="submit"
                  disabled={connectMutation.isPending || updateConnectionMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{editingConnection && editingConnection.channel_type === 'whatsapp' ? 'Update & Save WhatsApp Channel' : 'Connect & Encrypt'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Telegram Tab */}
        {activeTab === 'telegram' && (
          <div className="space-y-4 pt-1">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Webhook URL to configure for Telegram Bot:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${webhookBaseUrl}/telegram`, 'telegram')}
                  className="flex items-center gap-1 text-blue-700 hover:text-blue-800 font-bold"
                >
                  {copiedWebhook === 'telegram' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook === 'telegram' ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-slate-900 select-all break-all font-semibold">
                {webhookBaseUrl}/telegram
              </div>
            </div>

            <form onSubmit={handleConnectTelegram} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Telegram Bot Token (from @BotFather)
                </label>
                <div className="relative">
                  <input
                    type={showTgToken ? 'text' : 'password'}
                    placeholder={editingConnection && editingConnection.channel_type === 'telegram' ? 'Leave blank to retain existing encrypted Bot Token' : '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ'}
                    value={tgToken}
                    onChange={(e) => setTgToken(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 font-mono pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTgToken(!showTgToken)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showTgToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Your Telegram User ID or Chat ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 987654321"
                  value={tgId}
                  onChange={(e) => setTgId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Obtain your chat ID by messaging @userinfobot on Telegram or sending /start to your bot.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isVerifying || !tgToken.trim()}
                  onClick={() =>
                    handleVerifyCredentials('telegram', {
                      bot_token: tgToken.trim(),
                    })
                  }
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>Test Bot Token</span>
                </button>

                <button
                  type="submit"
                  disabled={connectMutation.isPending || updateConnectionMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{editingConnection && editingConnection.channel_type === 'telegram' ? 'Update & Save Telegram Bot' : 'Connect & Encrypt'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Slack Tab */}
        {activeTab === 'slack' && (
          <div className="space-y-4 pt-1">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600">
                <span>Slack Events API / Webhook Request URL:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`${webhookBaseUrl}/slack`, 'slack')}
                  className="flex items-center gap-1 text-purple-700 hover:text-purple-800 font-bold"
                >
                  {copiedWebhook === 'slack' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook === 'slack' ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-slate-900 select-all break-all font-semibold">
                {webhookBaseUrl}/slack
              </div>
            </div>

            <div className="flex gap-4 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setSlackMode('webhook')}
                className={`text-xs font-bold pb-1 border-b-2 ${
                  slackMode === 'webhook'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Incoming Webhook URL
              </button>
              <button
                type="button"
                onClick={() => setSlackMode('bot')}
                className={`text-xs font-bold pb-1 border-b-2 ${
                  slackMode === 'bot'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Slack Bot Token (OAuth)
              </button>
            </div>

            <form onSubmit={handleConnectSlack} className="space-y-3">
              {slackMode === 'webhook' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Slack Incoming Webhook URL
                  </label>
                  <input
                    type="text"
                    placeholder={editingConnection && editingConnection.channel_type === 'slack' ? 'Leave blank to retain existing Webhook URL' : 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'}
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Slack Bot User OAuth Token (xoxb-...)
                    </label>
                    <div className="relative">
                      <input
                        type={showSlackToken ? 'text' : 'password'}
                        placeholder={editingConnection && editingConnection.channel_type === 'slack' ? 'Leave blank to retain existing Bot Token' : 'xoxb-your-slack-bot-token'}
                        value={slackBotToken}
                        onChange={(e) => setSlackBotToken(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 font-mono pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSlackToken(!showSlackToken)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                      >
                        {showSlackToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Target Channel ID (e.g. C01234567)
                    </label>
                    <input
                      type="text"
                      placeholder="C01234567"
                      value={slackChannelId}
                      onChange={(e) => setSlackChannelId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-500 font-mono"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isVerifying || (slackMode === 'webhook' ? !slackWebhook.trim() : !slackBotToken.trim())}
                  onClick={() =>
                    handleVerifyCredentials(
                      'slack',
                      slackMode === 'webhook'
                        ? { webhook_url: slackWebhook.trim() }
                        : { bot_token: slackBotToken.trim() }
                    )
                  }
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>Test Slack Connection</span>
                </button>

                <button
                  type="submit"
                  disabled={connectMutation.isPending || updateConnectionMutation.isPending}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{editingConnection && editingConnection.channel_type === 'slack' ? 'Update & Save Slack Channel' : 'Connect & Encrypt'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
