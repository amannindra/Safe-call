import { Link } from 'react-router-dom';
import scenariosData from '../../json/scenarios.json';
import './start.css';

type ScenarioItem = {
  id?: string;
  title?: string;
  description?: string;
  difficulty?: string;
  [key: string]: unknown;
};

const scenarios = scenariosData as ScenarioItem[];

const ArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function StarterPage() {
  return (
    <div className="start-page min-h-screen bg-elevenlabs-dark text-white flex flex-col md:flex-row md:min-h-screen">
      {/* Left half: company name + tagline + divider + Testing / Training */}
      <div className="start-left flex flex-1 flex-col items-center justify-center p-8 md:p-12">
        <div className="flex flex-col items-center space-y-2">
          <img src="/images/logo.png" alt="SafeCall" className="start-logo w-20 h-20 md:w-24 md:h-24 object-contain" />
          <h1 className="start-hero-title text-center">SafeCall</h1>
          <p className="text-elevenlabs-muted text-sm md:text-base text-center">Train. Test. Respond.</p>
        </div>
        <div className="start-left-divider w-full max-w-xs my-8 h-px bg-elevenlabs-green/60" aria-hidden />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
          <Link
            to="/training"
            className="start-btn start-btn-secondary inline-flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-medium no-underline"
          >
            <span>Training</span>
            <span className="start-btn-arrow" aria-hidden><ArrowRight /></span>
          </Link>
          <Link
            to="/testing"
            className="start-btn start-btn-secondary inline-flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-medium no-underline"
          >
            <span>Testing</span>
            <span className="start-btn-arrow" aria-hidden><ArrowRight /></span>
          </Link>
        </div>
      </div>

      {/* Right half: scenarios from JSON (first loaded, rest blank for dynamic allocation later) */}
      <div className="start-right flex flex-1 flex-col items-center justify-center p-8 md:p-12 border-t md:border-t-0 md:border-l border-elevenlabs-border overflow-hidden">
        <div className="start-scenarios-block flex flex-col items-center w-full max-w-md">
          <h2 className="start-scenarios-title text-xl font-semibold text-white mb-1 text-center">Scenarios</h2>
          <p className="text-sm text-elevenlabs-muted mb-5 text-center">Train with realistic call scenarios</p>
          <div className="flex flex-col gap-5 w-full overflow-y-auto scrollbar-thin start-scenarios-list">
          {scenarios.map((scenario, index) => (
            <div
              key={scenario.id ?? index}
              className={`start-scenario-card rounded-xl border p-4 transition-colors ${
                scenario.title
                  ? 'border-elevenlabs-border bg-elevenlabs-card'
                  : 'border-dashed border-elevenlabs-border bg-elevenlabs-card/50'
              }`}
            >
              {scenario.title ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="start-scenario-num flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-elevenlabs-green/20 text-elevenlabs-green">
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
                  <span className="start-scenario-num flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-elevenlabs-border text-elevenlabs-muted">
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
