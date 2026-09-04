import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePipeline } from '../context/PipelineContext';

export default function SearchResults() {
  const { uploadedFile, searchResults, setSearchResults, setSelectedResult } = usePipeline();
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchTime, setSearchTime] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchResults.length === 0 && uploadedFile && !searching) { doSearch(); }
  }, [uploadedFile]);

  const doSearch = useCallback(async () => {
    if (!uploadedFile || searching) return;
    setSearching(true); setSearchError(null); const start = Date.now();
    try {
      const formData = new FormData(); formData.append('file', uploadedFile);
      const response = await fetch('/api/search', { method: 'POST', body: formData });
      if (!response.ok) { const errData = await response.json().catch(() => ({})); throw new Error(errData.detail || `Search failed: ${response.statusText}`); }
      const data = await response.json(); setSearchResults(data.results || []); setSearchTime(((Date.now() - start) / 1000).toFixed(1));
    } catch (err) { setSearchError(err.message); } finally { setSearching(false); }
  }, [uploadedFile, searching, setSearchResults]);

  const handleUseResult = (result) => { setSelectedResult(result); navigate('/fingerprint'); };

  const featured = searchResults[0] || null;
  const secondary = searchResults.slice(1);

  return (
    <div className="p-4 md:p-6 pb-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant pb-4">
          <div>
            <h2 className="text-headline-md text-on-surface font-bold tracking-tight">Matching Online Content</h2>
            <p className="text-[13px] text-on-surface-variant mt-1 flex items-center gap-2">
              {searching ? <><span className="material-symbols-outlined text-[16px] text-primary-container animate-spin">progress_activity</span>Searching...</> : searchResults.length > 0 ? <><span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>Completed in {searchTime}s — {searchResults.length} result(s) found</> : <><span className="material-symbols-outlined text-[16px] text-on-surface-variant">info</span>Upload an image on the Dashboard to start a search</>}
            </p>
          </div>
          <button onClick={doSearch} disabled={searching || !uploadedFile} className="px-4 py-2 bg-surface-container-high border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container-highest transition-colors text-[13px] font-medium flex items-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined text-[16px]">refresh</span>{searching ? 'Searching...' : 'Re-search'}
          </button>
        </div>

        {searchError && <div className="p-4 bg-error/10 border border-error/30 rounded-lg text-error text-[13px]">{searchError}</div>}

        {searching && <div className="card-panel rounded-xl p-12 flex flex-col items-center justify-center"><span className="material-symbols-outlined text-[56px] text-primary-container animate-spin mb-4">progress_activity</span><p className="text-headline-sm text-on-surface">Searching the web...</p><p className="text-body-sm text-on-surface-variant mt-2">Running Google Lens reverse image search via SerpApi</p></div>}

        {!searching && searchResults.length === 0 && !searchError && <div className="card-panel rounded-xl p-12 flex flex-col items-center justify-center"><span className="material-symbols-outlined text-[56px] text-on-surface-variant opacity-20 mb-4">search_off</span><p className="text-headline-sm text-on-surface">No results yet</p><p className="text-body-sm text-on-surface-variant mt-2">Upload an image on the Dashboard to begin</p></div>}

        {featured && (
          <div className="card-panel rounded-xl p-6 relative overflow-hidden group verified-glow">
            <div className="absolute top-0 right-0 p-4 opacity-5"><span className="material-symbols-outlined text-[120px] text-secondary">verified_user</span></div>
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              <div className="w-full md:w-1/3 flex flex-col gap-3">
                <div className="relative rounded-lg overflow-hidden border border-outline-variant aspect-[3/4] bg-surface-container">
                  {featured.thumbnail ? <img src={featured.thumbnail} alt={featured.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant text-[56px] opacity-20">face</span></div>}
                  <div className="absolute inset-0 border-2 border-secondary/40 pointer-events-none rounded-lg z-10 m-3 flex items-center justify-center">
                    <div className="w-14 h-14 border-2 border-secondary/60 rounded-full animate-[spin_4s_linear_infinite] border-t-transparent"></div>
                    <span className="material-symbols-outlined absolute text-secondary text-[24px]">center_focus_strong</span>
                  </div>
                </div>
                <div className="flex justify-between items-center px-1"><span className="text-[11px] text-outline uppercase tracking-wider">Source: {featured.source || 'Unknown'}</span></div>
              </div>
              <div className="w-full md:w-2/3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[12px] rounded-md border border-secondary/20 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">bolt</span>Top Match</span>
                    <span className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[12px] rounded-md border border-outline-variant">{featured.source || 'Web'}</span>
                  </div>
                  <h3 className="text-headline-sm text-on-surface mt-3 mb-2">{featured.title || 'Unknown'}</h3>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/50"><p className="text-[11px] text-outline uppercase tracking-wider mb-1">Profile Link</p><a href={featured.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-primary truncate block hover:underline font-mono">{featured.url ? new URL(featured.url).hostname : 'N/A'}</a></div>
                    <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/50"><p className="text-[11px] text-outline uppercase tracking-wider mb-1">Image</p><p className="text-[12px] text-on-surface truncate font-mono">{featured.image_url ? 'Available' : 'N/A'}</p></div>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => handleUseResult(featured)} className="flex-1 bg-primary text-on-primary py-2.5 px-5 rounded-lg font-semibold hover:bg-primary/90 transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.2)]"><span className="material-symbols-outlined text-[18px]">check_circle</span>Use This Result</button>
                  <a href={featured.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container-highest transition-colors flex justify-center items-center gap-2"><span className="material-symbols-outlined text-[18px]">open_in_new</span>Visit</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {secondary.length > 0 && (
          <div>
            <h3 className="text-headline-sm text-on-surface mb-4 mt-6 font-semibold">Other Potential Matches ({secondary.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {secondary.map((match, i) => (
                <div key={i} className="card-panel rounded-lg p-4 hover:bg-surface-container-high transition-all duration-200 cursor-pointer group">
                  <div className="relative aspect-square rounded-lg bg-surface-container-lowest overflow-hidden border border-outline-variant mb-3 flex items-center justify-center">
                    {match.thumbnail ? <img src={match.thumbnail} alt={match.title} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-on-surface-variant text-[40px] opacity-20">person</span>}
                  </div>
                  <div className="flex justify-between items-start mb-2"><span className="px-2 py-0.5 bg-surface-container-highest text-on-surface text-[10px] rounded border border-outline-variant">{match.source || 'Web'}</span></div>
                  <p className="text-[13px] text-on-surface truncate mb-3">{match.title || 'Untitled'}</p>
                  <button onClick={() => handleUseResult(match)} className="w-full py-1.5 bg-primary/10 text-primary text-[12px] font-medium rounded-md hover:bg-primary hover:text-on-primary transition-all duration-200">Use Result</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
