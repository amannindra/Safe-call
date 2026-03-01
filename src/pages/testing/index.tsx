import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { PhoneOffIcon, PhoneIcon, MessageSquare, FileText, Mic } from 'lucide-react';
import { initScene } from '@webspatial/react-sdk';
import { AgentOrb } from '../../components/AgentOrb';
import { TranscriptPanel, type TranscriptMessage } from '../../components/TranscriptPanel';
import { SummaryPanel } from '../../components/SummaryPanel';
import { AudioWavePanel } from '../../components/AudioWavePanel';
import { MapPanel } from '../../components/MapPanel';
import { SCENARIOS } from '../../scenarios';
import { writeTranscript, writeSummary, writeMic, type TranscriptMessageSync } from '../../sync';

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID ?? '';
const XR_BASE = typeof __XR_ENV_BASE__ !== 'undefined' ? __XR_ENV_BASE__ : '';

const WINDOW_CONFIGS = [
  { name: 'Transcript', path: 'transcript', width: 420, height: 480 },
  { name: 'Summary', path: 'summary', width: 420, height: 320 },
  { name: 'Audio', path: 'audio', width: 380, height: 280 },
] as const;

/** visionOS / WebSpatial AVP: use WebSocket to avoid WebRTC/mic issues that can crash the app */
function useConnectionType(): 'webrtc' | 'websocket' {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return 'websocket';
    const ua = navigator.userAgent;
    if (/Vision|Reality|WebSpatial/i.test(ua)) return 'websocket';
    if (typeof (globalThis as { __XR_ENV_BASE__?: string }).__XR_ENV_BASE__ !== 'undefined') return 'websocket';
    return 'webrtc';
  }, []);
}

export default function HomePage() {
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [summary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<keyof typeof SCENARIOS | ''>('fire');
  const connectionType = useConnectionType();

  const conversation = useConversation({
    onConnect: () => {
      setError(null);
    },
    onDisconnect: () => {},
    onMessage: (message: { source?: string; message?: string }) => {
      const text = message.message ?? '';
      if (text) {
        const role = message.source === 'user' ? 'user' : 'assistant';
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${prev.length}`,
            role,
            content: text,
            timestamp: new Date(),
          },
        ]);
      }
    },
    onError: (err: unknown) => {
      console.error('Conversation error:', err);
      const msg = typeof err === 'string' ? err : err instanceof Error ? err.message : 'Connection error';
      setError(msg);
    },
  });

  const handleStart = useCallback(async () => {
    if (!AGENT_ID) {
      setError('Set VITE_ELEVENLABS_AGENT_ID in .env');
      return;
    }
    setError(null);
    setMessages([]);
    if (typeof navigator?.mediaDevices?.getUserMedia === 'function') {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setError('Microphone access is required. Please allow and try again.');
        return;
      }
    }
    try {
      const dynamicVariables = selectedScenario ? SCENARIOS[selectedScenario] : undefined;
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType,
        dynamicVariables,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start session');
    }
  }, [conversation, selectedScenario, connectionType]);

  const handleEnd = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const statusStr = String(conversation.status);
  const isActive = conversation.status === 'connected' || statusStr.startsWith('connecting');

  const getInputVolume = useCallback(() => {
    try {
      const raw = conversation.getInputVolume?.() ?? 0;
      return Math.min(1, Math.pow(raw, 0.5) * 2.5);
    } catch {
      return 0;
    }
  }, [conversation]);

  const getOutputVolume = useCallback(() => {
    try {
      const raw = conversation.getOutputVolume?.() ?? 0;
      return Math.min(1, Math.pow(raw, 0.5) * 2.5);
    } catch {
      return 0;
    }
  }, [conversation]);

  const safeGetInputFreq = useCallback(() => {
    try {
      return conversation.getInputByteFrequencyData?.();
    } catch {
      return undefined;
    }
  }, [conversation]);

  const safeGetOutputFreq = useCallback(() => {
    try {
      return conversation.getOutputByteFrequencyData?.();
    } catch {
      return undefined;
    }
  }, [conversation]);

  const summaryText = useMemo(() => {
    if (summary) return summary;
    const assistant = messages.filter((m) => m.role === 'assistant');
    if (assistant.length === 0) return '';
    return assistant.slice(-3).map((m) => m.content).join(' ');
  }, [summary, messages]);

  const [isSpatial, setIsSpatial] = useState(false);
  useEffect(() => {
    try {
      setIsSpatial(
        (typeof __XR_ENV_BASE__ !== 'undefined' && __XR_ENV_BASE__ !== '') ||
          (typeof document !== 'undefined' && document.documentElement.classList.contains('is-spatial'))
      );
    } catch {
      setIsSpatial(false);
    }
  }, []);

  const toSyncMessage = useCallback((m: TranscriptMessage): TranscriptMessageSync => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp?.toISOString(),
  }), []);

  useEffect(() => {
    if (!isSpatial) return;
    writeTranscript(messages.map(toSyncMessage));
  }, [isSpatial, messages, toSyncMessage]);

  useEffect(() => {
    if (!isSpatial) return;
    writeSummary(summaryText);
  }, [isSpatial, summaryText]);

  const micIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!isSpatial) return;
    micIntervalRef.current = setInterval(() => {
      writeMic({
        isActive,
        inputLevel: getInputVolume(),
        outputLevel: getOutputVolume(),
      });
    }, 200);
    return () => {
      if (micIntervalRef.current) clearInterval(micIntervalRef.current);
    };
  }, [isSpatial, isActive, getInputVolume, getOutputVolume]);

  const openWindow = useCallback((name: string, path: string, width: number, height: number) => {
    initScene(
      name,
      (prev) => ({
        ...prev,
        defaultSize: { width, height, depth: 0 },
        resizability: {
          minWidth: Math.floor(width * 0.6),
          minHeight: Math.floor(height * 0.5),
          maxWidth: 1200,
          maxHeight: 900,
        },
        worldScaling: 'automatic',
        worldAlignment: 'gravityAligned',
        baseplateVisibility: 'automatic',
      }),
      { type: 'window' }
    );
    const features = `width=${width},height=${height},resizable=yes,scrollbars=yes`;
    window.open(`${XR_BASE}${path}`, name, features);
  }, []);

  if (isSpatial) {
    return (
      <div className="min-h-screen bg-elevenlabs-dark text-white p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold">ElevenLabs Agent</h1>
            <p className="text-sm text-elevenlabs-muted">
              Open Transcript, Summary & Audio in separate movable windows
            </p>
          </header>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-elevenlabs-border bg-elevenlabs-card p-8 min-h-[380px] gap-6">
            <AgentOrb
              getInputVolume={getInputVolume}
              getOutputVolume={getOutputVolume}
              isSpeaking={conversation.isSpeaking}
              status={statusStr}
            />
            {error && (
              <p className="text-sm text-red-400 text-center max-w-md">{error}</p>
            )}
            <div className="flex flex-col items-center gap-3">
              <label className="text-sm text-elevenlabs-muted">Scenario</label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value as keyof typeof SCENARIOS | '')}
                disabled={isActive}
                className="rounded-lg border border-elevenlabs-border bg-elevenlabs-card px-3 py-1.5 text-sm text-white focus:border-elevenlabs-accent focus:outline-none focus:ring-1 focus:ring-elevenlabs-accent disabled:opacity-50"
              >
                <option value="">None</option>
                {Object.keys(SCENARIOS).map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>
            <button
              onClick={isActive ? handleEnd : handleStart}
              disabled={statusStr.startsWith('connecting')}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                ${isActive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-elevenlabs-accent text-white hover:bg-indigo-600'}
              `}
            >
              {isActive ? <><PhoneOffIcon className="w-5 h-5" /> End conversation</> : <><PhoneIcon className="w-5 h-5" /> Start conversation</>}
            </button>
          </div>
          <section className="mt-6 rounded-2xl border border-elevenlabs-border bg-elevenlabs-card p-4">
            <p className="text-sm text-elevenlabs-muted mb-3">Open in separate movable windows</p>
            <div className="flex flex-wrap gap-2">
              {WINDOW_CONFIGS.map(({ name, path, width, height }) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => openWindow(name, path, width, height)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-elevenlabs-border hover:bg-elevenlabs-accent/30 text-white text-sm font-medium transition-colors"
                >
                  {path === 'transcript' && <MessageSquare className="w-4 h-4" aria-hidden />}
                  {path === 'summary' && <FileText className="w-4 h-4" aria-hidden />}
                  {path === 'audio' && <Mic className="w-4 h-4" aria-hidden />}
                  {name}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-elevenlabs-dark text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">ElevenLabs Agent</h1>
          <p className="text-sm text-elevenlabs-muted">
            Voice conversation with WebRTC · Transcript, summary & audio levels
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm text-elevenlabs-muted">Scenario:</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as keyof typeof SCENARIOS | '')}
              disabled={isActive}
              className="rounded-lg border border-elevenlabs-border bg-elevenlabs-card px-3 py-1.5 text-sm text-white focus:border-elevenlabs-accent focus:outline-none focus:ring-1 focus:ring-elevenlabs-accent disabled:opacity-50"
            >
              <option value="">None</option>
              {Object.keys(SCENARIOS).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-elevenlabs-border bg-elevenlabs-card p-8 min-h-[420px]">
              <div className="flex flex-col items-center gap-6">
                <AgentOrb
                  getInputVolume={getInputVolume}
                  getOutputVolume={getOutputVolume}
                  isSpeaking={conversation.isSpeaking}
                  status={statusStr}
                />
                {error && (
                  <p className="text-sm text-red-400 text-center max-w-md">{error}</p>
                )}
                <button
                  onClick={isActive ? handleEnd : handleStart}
                  disabled={statusStr.startsWith('connecting')}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
                    ${isActive
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-elevenlabs-accent text-white hover:bg-indigo-600'
                    }
                  `}
                >
                  {isActive ? (
                    <>
                      <PhoneOffIcon className="w-5 h-5" />
                      End conversation
                    </>
                  ) : (
                    <>
                      <PhoneIcon className="w-5 h-5" />
                      Start conversation
                    </>
                  )}
                </button>
              </div>
            </div>

            <MapPanel />
          </div>

          <div className="flex flex-col gap-4">
            <TranscriptPanel messages={messages} />
            <SummaryPanel summary={summaryText} />
            <AudioWavePanel
              getInputByteFrequencyData={safeGetInputFreq}
              getOutputByteFrequencyData={safeGetOutputFreq}
              isActive={isActive}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
