import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import scenariosData from '../../json/scenarios.json';

type ScenarioItem = {
  id?: string;
  title?: string;
  description?: string;
  difficulty?: string;
  [key: string]: unknown;
};

const scenarios = scenariosData as ScenarioItem[];

export default function StarterPage() {
  return (
    <div className="min-h-screen bg-elevenlabs-dark text-white flex flex-col md:flex-row">
      {/* Left half */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 md:p-12">
        <div className="flex flex-col items-center space-y-2">
          <img src="/images/logo.png" alt="SafeCall" className="w-20 h-20 md:w-24 md:h-24 object-contain mb-1" />
          <h1
            className="text-center font-bold leading-tight bg-linear-to-b from-white to-white/25 bg-clip-text text-transparent m-0"
            style={{ fontSize: 'clamp(4rem, 22vw, 10rem)', lineHeight: 1.1 }}
          >
            SafeCall
          </h1>
          <p className="text-elevenlabs-muted text-sm md:text-base text-center">Train. Test. Respond.</p>
        </div>

        <div className="w-full max-w-xs my-8 h-px bg-elevenlabs-border" aria-hidden />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
          <Link
            to="/training"
            className="inline-flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-medium no-underline
              bg-elevenlabs-accent text-white
              transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:bg-indigo-600"
          >
            <span>Training</span>
            <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
          </Link>
          <Link
            to="/testing"
            className="inline-flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-medium no-underline
              bg-elevenlabs-accent text-white
              transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:bg-indigo-600"
          >
            <span>Testing</span>
            <ArrowRight className="w-5 h-5 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Right half */}
      <div className="flex flex-1 flex-col items-center justify-center p-8 md:p-12 border-t md:border-t-0 md:border-l border-elevenlabs-border overflow-hidden">
        <div className="flex flex-col items-center w-full max-w-md">
          <h2 className="text-xl font-semibold text-white mb-1 text-center pb-1 border-b-[3px] border-elevenlabs-accent inline-block">
            Scenarios
          </h2>
          <p className="text-sm text-elevenlabs-muted mb-5 text-center">Train with realistic call scenarios</p>
          <div className="flex flex-col gap-5 w-full overflow-y-auto scrollbar-thin max-h-[50vh] pr-1">
            {scenarios.map((scenario, index) => (
              <div
                key={scenario.id ?? index}
                className={`rounded-xl border p-4 transition-colors hover:border-elevenlabs-accent ${
                  scenario.title
                    ? 'border-elevenlabs-border bg-elevenlabs-card'
                    : 'border-dashed border-elevenlabs-border bg-elevenlabs-card/50'
                }`}
              >
                {scenario.title ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-elevenlabs-accent/20 text-elevenlabs-accent">
                        {index + 1}
                      </span>
                      <h3 className="text-base font-semibold text-white">{scenario.title}</h3>
                      {scenario.difficulty && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-elevenlabs-border text-elevenlabs-muted">
                          {scenario.difficulty}
                        </span>
                      )}
                    </div>
                    {scenario.description && (
                      <p className="text-sm text-elevenlabs-muted mt-3 line-clamp-3">{scenario.description}</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-elevenlabs-border text-elevenlabs-muted">
                      {index + 1}
                    </span>
                    <p className="text-sm text-elevenlabs-muted">Coming soon</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
