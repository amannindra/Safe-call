import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import TestingPage from './pages/testing';
import TranscriptWindow from './pages/TranscriptWindow';
import SummaryWindow from './pages/SummaryWindow';
import AudioWindow from './pages/AudioWindow';
import StarterPage from './pages/start/start';
import TrainingPage from './pages/training/training';
import SummaryPage from './pages/summary/summary';
// const basename = typeof __XR_ENV_BASE__ !== 'undefined' ? __XR_ENV_BASE__ : '';

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<StarterPage />} />
          <Route path="training" element={<TrainingPage />} />
          <Route path="/testing" element={<TestingPage />} />
          <Route path='/summary' element={<SummaryPage />} />
          {/* <Route path="transcript" element={<TranscriptWindow />} />
          <Route path="summary" element={<SummaryWindow />} />
          <Route path="audio" element={<AudioWindow />} /> */}
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
