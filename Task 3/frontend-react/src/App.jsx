import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PipelineProvider } from './context/PipelineContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SearchResults from './pages/SearchResults';
import Fingerprint from './pages/Fingerprint';
import Verification from './pages/Verification';
import History from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <PipelineProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<SearchResults />} />
            <Route path="/fingerprint" element={<Fingerprint />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/history" element={<History />} />
          </Route>
        </Routes>
      </PipelineProvider>
    </BrowserRouter>
  );
}
