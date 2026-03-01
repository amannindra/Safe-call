import { useNavigate } from "react-router-dom";
import { FileText, MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { MapPanel } from "../../components/MapPanel";

export default function TrainingPage() {
  const navigate = useNavigate();

  const dispatcherTranscript = `Dispatcher: 911, what's your emergency?
Caller: My house is on fire! Please send help!
Dispatcher: What's the address?
Caller: 742 Maplewood Drive, Brookside.
Dispatcher: Are you inside?
Caller: No, I'm outside with my daughter.
Dispatcher: Good. Stay outside. Is anyone still inside?
Caller: No, just our dog.
Dispatcher: Do not go back in. Fire crews are on the way. Are either of you injured?
Caller: No.
Dispatcher: Move across the street and stay clear of smoke.
Caller: Okay… I hear sirens.
Dispatcher: That's them. Wave them down. Stay safe.`;

  const feedback = `The dispatcher was calm and collected throughout the interaction, ensuring that the caller would not panic. Asking, "What's the address?" early on ensured help could be sent even if the call disconnected. By asking, "Is anyone still inside?" and "Are either of you injured?", the dispatcher gathered essential information for responding crews and assessed medical risk. Overall, the dispatcher remained concise, safety-focused, and methodical while ensuring emergency services were en route.`;

  return (
    <div className="min-h-screen bg-elevenlabs-dark text-white p-4 md:p-6 flex flex-col">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-elevenlabs-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="h-4 w-px bg-elevenlabs-border" />
        <div>
          <h1 className="text-2xl font-bold">Training</h1>
          <p className="text-sm text-elevenlabs-muted">Review example calls and feedback</p>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="rounded-2xl border border-elevenlabs-border bg-elevenlabs-card p-6 flex flex-col gap-4 min-h-[420px]">
          <div className="flex items-center gap-2 border-b border-elevenlabs-border pb-3">
            <MessageSquare className="w-4 h-4 text-elevenlabs-accent" />
            <h2 className="text-base font-semibold">Call Transcript</h2>
          </div>
          <pre className="flex-1 text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-mono overflow-y-auto scrollbar-thin">
            {dispatcherTranscript}
          </pre>
        </div>

        <div className="rounded-2xl border border-elevenlabs-border bg-elevenlabs-card p-6 flex flex-col gap-4 min-h-[420px]">
          <div className="flex items-center gap-2 border-b border-elevenlabs-border pb-3">
            <FileText className="w-4 h-4 text-elevenlabs-green" />
            <h2 className="text-base font-semibold">Feedback</h2>
          </div>
          <p className="flex-1 text-sm text-white/80 leading-relaxed overflow-y-auto scrollbar-thin">
            {feedback}
          </p>
        </div>
        </div>
        <MapPanel initialAddress="742 Maplewood Drive, Brookside" />
      </div>

      <div className="flex justify-center pt-8 pb-2">
        <button
          onClick={() => navigate("/testing")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-elevenlabs-accent text-white hover:bg-indigo-600 transition-all"
        >
          Start Testing
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
