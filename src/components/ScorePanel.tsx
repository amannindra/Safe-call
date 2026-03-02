import { useMemo } from 'react';
import { Award, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import type { TranscriptMessage } from './TranscriptPanel';

// ─── Scoring criteria ────────────────────────────────────────────────────────

type Criterion = {
  id: string;
  label: string;
  description: string;
  points: number;
  keywords: string[];
  /** When true, match is against ALL messages (user + assistant), not just dispatcher */
  allMessages?: boolean;
  /** Custom scorer that overrides keyword check */
  score?: (userMsgs: string[], allMsgs: string[]) => { earned: number; evidence?: string };
};

const CRITERIA: Criterion[] = [
  {
    id: 'location',
    label: 'Location Obtained',
    description: 'Dispatcher asked for and confirmed the caller\'s address or location.',
    points: 20,
    keywords: ['address', 'location', 'where are you', 'what street', 'street', 'where do you live', 'what address'],
  },
  {
    id: 'occupancy',
    label: 'Occupancy Check',
    description: 'Dispatcher asked whether anyone else was still inside the building.',
    points: 20,
    keywords: ['anyone inside', 'anyone else', 'anyone still', 'anyone in the', 'others inside', 'still inside', 'trapped inside', 'anyone left'],
  },
  {
    id: 'medical',
    label: 'Medical / Injury Assessment',
    description: 'Dispatcher asked whether the caller or others were injured.',
    points: 20,
    keywords: ['injur', 'hurt', 'medical', 'pain', 'ambulance', 'paramedic', 'wound', 'bleeding', 'breathing', 'need medical'],
  },
  {
    id: 'safety',
    label: 'Safety Instructions Given',
    description: 'Dispatcher gave clear evacuation or safety instructions to the caller.',
    points: 20,
    keywords: ['stay outside', 'get out', 'evacuate', 'leave the building', 'away from', 'don\'t go back', 'do not go back', 'move away', 'stay away', 'step back', 'keep away', 'cross the street', 'stay clear'],
  },
  {
    id: 'communication',
    label: 'Clear Communication',
    description: 'Dispatcher gave substantive responses throughout the call (not just one-word replies).',
    points: 20,
    keywords: [],
    score: (userMsgs) => {
      if (userMsgs.length === 0) return { earned: 0 };
      const avgWords = userMsgs.reduce((sum, m) => sum + m.split(/\s+/).length, 0) / userMsgs.length;
      const turns = userMsgs.length;
      if (turns >= 4 && avgWords >= 6)  return { earned: 20, evidence: `${turns} turns, avg ${avgWords.toFixed(0)} words` };
      if (turns >= 3 && avgWords >= 4)  return { earned: 15, evidence: `${turns} turns, avg ${avgWords.toFixed(0)} words` };
      if (turns >= 2 && avgWords >= 3)  return { earned: 10, evidence: `${turns} turns, avg ${avgWords.toFixed(0)} words` };
      return { earned: 5, evidence: `Only ${turns} turn(s)` };
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ScoredCriterion = Criterion & {
  earned: number;
  evidence?: string;
};

function grade(pct: number): { letter: string; colour: string } {
  if (pct >= 90) return { letter: 'A',  colour: 'text-emerald-400' };
  if (pct >= 80) return { letter: 'B',  colour: 'text-green-400'   };
  if (pct >= 70) return { letter: 'C',  colour: 'text-yellow-400'  };
  if (pct >= 60) return { letter: 'D',  colour: 'text-orange-400'  };
  return          { letter: 'F',  colour: 'text-red-400'    };
}

function scoreAll(messages: TranscriptMessage[]): ScoredCriterion[] {
  const userMsgs  = messages.filter((m) => m.role === 'user').map((m) => m.content.toLowerCase());
  const allMsgs   = messages.map((m) => m.content.toLowerCase());

  return CRITERIA.map((c) => {
    if (c.score) {
      const result = c.score(userMsgs, allMsgs);
      return { ...c, earned: result.earned, evidence: result.evidence };
    }

    const pool = c.allMessages ? allMsgs : userMsgs;
    const combined = pool.join(' ');
    const matchedKeyword = c.keywords.find((kw) => combined.includes(kw));
    return {
      ...c,
      earned: matchedKeyword ? c.points : 0,
      evidence: matchedKeyword ? `"${matchedKeyword}"` : undefined,
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

type ScorePanelProps = {
  messages: TranscriptMessage[];
  /** True once the conversation session has ended with at least one message. */
  sessionEnded: boolean;
  /** True while the conversation is actively running. */
  isActive: boolean;
};

export function ScorePanel({ messages, sessionEnded, isActive }: ScorePanelProps) {
  const scored = useMemo(
    () => (sessionEnded ? scoreAll(messages) : []),
    [sessionEnded, messages],
  );

  const totalEarned = scored.reduce((s, c) => s + c.earned, 0);
  const totalMax    = CRITERIA.reduce((s, c) => s + c.points, 0);
  const pct         = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
  const { letter, colour } = grade(pct);

  // ── While conversation is running ──────────────────────────────────────────
  if (isActive) {
    return (
      <div className="rounded-xl border border-elevenlabs-border bg-elevenlabs-card p-4 flex items-center gap-3">
        <Award className="w-4 h-4 text-elevenlabs-muted shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white/60">Performance Score</p>
          <p className="text-xs text-elevenlabs-muted">Scored after the call ends.</p>
        </div>
      </div>
    );
  }

  // ── Before any session ─────────────────────────────────────────────────────
  if (!sessionEnded) {
    return (
      <div className="rounded-xl border border-elevenlabs-border bg-elevenlabs-card p-4 flex items-center gap-3">
        <Clock className="w-4 h-4 text-elevenlabs-muted shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white/60">Performance Score</p>
          <p className="text-xs text-elevenlabs-muted">Start a conversation to receive a score.</p>
        </div>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-elevenlabs-border bg-elevenlabs-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-elevenlabs-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-elevenlabs-accent" />
          <h3 className="text-sm font-semibold text-white">Performance Score</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${colour}`}>{letter}</span>
          <span className="text-sm text-elevenlabs-muted font-mono">{pct}%</span>
        </div>
      </div>

      {/* Total bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-elevenlabs-muted">Total</span>
          <span className="text-xs font-mono text-white/70">{totalEarned} / {totalMax} pts</span>
        </div>
        <div className="h-2 w-full rounded-full bg-elevenlabs-border overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Criteria list */}
      <div className="divide-y divide-elevenlabs-border">
        {scored.map((c) => {
          const passed = c.earned === c.points;
          const partial = c.earned > 0 && c.earned < c.points;
          return (
            <div key={c.id} className="px-4 py-3 flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {passed  && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {partial && <ChevronRight  className="w-4 h-4 text-yellow-400" />}
                {!passed && !partial && <XCircle className="w-4 h-4 text-red-400/60" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium ${passed || partial ? 'text-white' : 'text-white/50'}`}>
                    {c.label}
                  </p>
                  <span className={`text-xs font-mono shrink-0 ${
                    passed ? 'text-emerald-400' : partial ? 'text-yellow-400' : 'text-red-400/60'
                  }`}>
                    {c.earned}/{c.points}
                  </span>
                </div>
                <p className="text-xs text-elevenlabs-muted mt-0.5">{c.description}</p>
                {c.evidence && (
                  <p className="text-xs text-indigo-400 mt-1">
                    ✓ Detected: {c.evidence}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
