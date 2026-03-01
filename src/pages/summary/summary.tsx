export default function SummaryPage() {
  return (
    <div className="min-h-screen bg-elevenlabs-dark text-white p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Summary</h1>
          <p className="text-sm text-elevenlabs-muted">Session summary and performance overview</p>
        </header>
        <div className="rounded-2xl border border-elevenlabs-border bg-elevenlabs-card p-8 flex items-center justify-center min-h-[320px]">
          <p className="text-elevenlabs-muted text-sm">No summary available yet.</p>
        </div>
      </div>
    </div>
  );
}