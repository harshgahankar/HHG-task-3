import { useState } from 'react';
import { usePipeline } from '../context/PipelineContext';

export default function Fingerprint() {
  const { selectedResult, fingerprint, setFingerprint, anchorResult, setAnchorResult } = usePipeline();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  const generateFingerprint = async () => {
    setIsGenerating(true); setError(null);
    try {
      const record = selectedResult || { source: 'manual', url: '', title: 'Manual Entry', image_url: '' };
      const response = await fetch('/api/fingerprint', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: record.source || '', url: record.url || '', title: record.title || '', image_url: record.image_url || '' }) });
      if (!response.ok) throw new Error(`Fingerprint failed: ${response.statusText}`);
      const data = await response.json(); setFingerprint(data.fingerprint);
    } catch (err) { setError(err.message); } finally { setIsGenerating(false); }
  };

  const recordBlockchain = async () => {
    if (!fingerprint) return;
    setIsRecording(true); setError(null);
    try {
      const response = await fetch('/api/anchor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fingerprint }) });
      if (!response.ok) { const errData = await response.json().catch(() => ({})); throw new Error(errData.detail || `Anchor failed: ${response.statusText}`); }
      const data = await response.json(); setAnchorResult(data);
    } catch (err) { setError(err.message); } finally { setIsRecording(false); }
  };

  const hashReady = fingerprint && !isGenerating;
  const isRecorded = !!anchorResult;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-headline-md text-on-surface mb-2">Scan Pipeline</h2>
        <p className="text-body-md text-on-surface-variant">Step 3 & 4: Digital Fingerprint and Blockchain Registration</p>
      </div>

      <div className="mb-8 relative">
        <div className="absolute top-4 left-0 right-0 h-[2px] bg-outline-variant hidden md:block"></div>
        <div className="flex items-center justify-between relative z-10">
          {[{ label: 'Biometrics', done: true }, { label: 'Verification', done: true }, { label: 'Fingerprint', active: !hashReady }, { label: 'Blockchain', done: isRecorded }].map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-2 bg-background px-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step.done ? 'bg-secondary text-on-secondary shadow-[0_0_12px_rgba(16,185,129,0.3)]' : step.active ? 'border-2 border-primary bg-primary/10 text-primary relative' : 'border border-outline-variant bg-surface-container-high text-on-surface-variant'}`}>
                {step.done ? <span className="material-symbols-outlined text-[18px]">check</span> : step.active ? <><div className="absolute inset-0 rounded-full border border-primary animate-ping opacity-40"></div><span className="text-[13px]">{i + 1}</span></> : <span className="text-[13px]">{i + 1}</span>}
              </div>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${step.active ? 'text-primary' : 'text-on-surface-variant'}`}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-panel rounded-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-[12px] font-semibold text-on-surface uppercase tracking-wider">Create Digital Fingerprint</h3>
            <span className="material-symbols-outlined text-primary text-[20px]">fingerprint</span>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center min-h-[180px] mb-5 relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
                <div className="w-44 h-44 rounded-full border border-primary animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute w-28 h-28 rounded-full border border-secondary animate-[spin_7s_linear_infinite_reverse]"></div>
              </div>
              <div className="text-center z-10 space-y-3">
                <button onClick={generateFingerprint} disabled={isGenerating} className="px-6 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[12px] font-semibold uppercase tracking-wider hover:bg-primary hover:text-on-primary transition-all duration-300 flex items-center gap-2 mx-auto disabled:opacity-50">
                  <span className="material-symbols-outlined text-[16px]">memory</span>{isGenerating ? 'Computing...' : 'Generate Hash'}
                </button>
                <p className="text-[13px] text-on-surface-variant max-w-xs">Computes a unique SHA-256 geometric vector hash based on verified biometric nodal points.</p>
              </div>
            </div>
            <div className="bg-surface-container p-4 rounded-lg border border-outline-variant group relative">
              <h4 className="text-[11px] font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">SHA-256 Output</h4>
              <div className="text-[13px] text-primary break-all font-mono leading-relaxed">{fingerprint || <span className="text-on-surface-variant">Awaiting generation...</span>}</div>
              {fingerprint && <button onClick={() => navigator.clipboard.writeText(fingerprint)} className="absolute top-3 right-3 text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-container-high" title="Copy hash"><span className="material-symbols-outlined text-[16px]">content_copy</span></button>}
            </div>
          </div>
        </div>

        <div className={`rounded-xl overflow-hidden flex flex-col relative transition-all duration-500 ${isRecorded ? 'card-panel verified-glow border-secondary' : 'card-panel'} ${!hashReady ? 'opacity-50 pointer-events-none' : ''}`}>
          {!hashReady && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center flex-col gap-3"><span className="material-symbols-outlined text-[36px] text-on-surface-variant">lock</span><p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Awaiting Fingerprint</p></div>}
          <div className="p-5 border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-[12px] font-semibold text-on-surface uppercase tracking-wider">Blockchain Record</h3>
            <span className="material-symbols-outlined text-secondary text-[20px]">link</span>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container p-3.5 border border-outline-variant rounded-lg"><span className="block text-[11px] font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Network</span><span className="text-[13px] text-on-surface font-mono">Local Ethereum</span></div>
              <div className="bg-surface-container p-3.5 border border-outline-variant rounded-lg"><span className="block text-[11px] font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Block #</span><span className="text-[13px] text-on-surface font-mono">{anchorResult?.block_number || '--'}</span></div>
            </div>
            <div className="bg-surface-container p-3.5 border border-outline-variant rounded-lg group relative">
              <span className="block text-[11px] font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">Transaction ID</span>
              <span className={`text-[12px] break-all font-mono ${isRecorded ? 'text-secondary' : 'text-on-surface'}`}>{anchorResult?.tx_hash || 'Pending injection...'}</span>
              {isRecorded && <button onClick={() => navigator.clipboard.writeText(anchorResult.tx_hash)} className="absolute top-3 right-3 text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-container-high" title="Copy tx hash"><span className="material-symbols-outlined text-[16px]">content_copy</span></button>}
            </div>
            {error && <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-error text-[13px]">{error}</div>}
            <div className="mt-auto pt-2">
              <button onClick={recordBlockchain} disabled={isRecording || isRecorded || !hashReady} className="w-full py-3 rounded-lg bg-primary text-on-primary text-[12px] font-semibold uppercase tracking-wider hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.25)] disabled:opacity-50">
                <span className="material-symbols-outlined text-[18px]">account_tree</span>{isRecording ? 'Broadcasting...' : isRecorded ? 'Recorded on Blockchain' : 'Record on Blockchain'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
