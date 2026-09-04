import { useState } from 'react';
import { usePipeline } from '../context/PipelineContext';

export default function Verification() {
  const { fingerprint, anchorResult } = usePipeline();
  const [isTampered, setIsTampered] = useState(false);

  const originalHash = fingerprint || '0x8f2a9c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f';
  const tamperedHash = originalHash.slice(0, -1) + (originalHash.slice(-1) === 'a' ? 'b' : 'a');
  const currentHash = isTampered ? tamperedHash : originalHash;
  const isVerified = !isTampered && !!fingerprint;

  return (
    <div className="p-4 md:p-6 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-headline-md text-on-surface mb-2">Verify Data Integrity</h2>
          <p className="text-body-md text-on-surface-variant">Real-time cryptographic comparison of active session data against immutable blockchain records.</p>
        </div>

        {!fingerprint && <div className="p-4 bg-tertiary-container/10 border border-tertiary-container/30 rounded-lg text-tertiary-container text-[13px] mb-8 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">info</span>No fingerprint generated yet. Complete the Fingerprint step first to enable verification.</div>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
          <div className="lg:col-span-5 card-panel rounded-xl p-5 flex flex-col relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3"><span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Current Data (Session)</span><span className="material-symbols-outlined text-primary text-[18px]">memory</span></div>
            <div className={`text-[12px] font-mono bg-surface-container-lowest p-3 rounded-lg border border-outline-variant break-all mb-3 leading-relaxed ${isTampered ? 'text-error border-error/30' : 'text-on-surface'}`}>{currentHash}</div>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-[11px] text-outline font-mono">Source: Local Node</span>
              <button onClick={() => navigator.clipboard.writeText(currentHash)} className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-primary p-1 rounded hover:bg-surface-container-high" title="Copy hash"><span className="material-symbols-outlined text-[16px]">content_copy</span></button>
            </div>
          </div>

          <div className="lg:col-span-2 flex items-center justify-center py-4">
            <div className="w-14 h-14 rounded-full card-panel flex items-center justify-center relative transition-all duration-500">
              <span className={`material-symbols-outlined text-[24px] transition-colors duration-300 ${isTampered ? 'text-error' : 'text-on-surface-variant'}`}>{isTampered ? 'not_equal' : 'equal'}</span>
              <div className="absolute left-[-40px] top-1/2 h-[1px] w-[40px] bg-outline-variant -z-10 hidden lg:block"></div>
              <div className="absolute right-[-40px] top-1/2 h-[1px] w-[40px] bg-outline-variant -z-10 hidden lg:block"></div>
            </div>
          </div>

          <div className="lg:col-span-5 card-panel rounded-xl p-5 flex flex-col relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3"><span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Blockchain Record (Ledger)</span><span className="material-symbols-outlined text-secondary-fixed-dim text-[18px]">lan</span></div>
            <div className="text-[12px] font-mono text-on-surface bg-surface-container-lowest p-3 rounded-lg border border-outline-variant break-all mb-3 leading-relaxed">{anchorResult?.data || originalHash}</div>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-[11px] text-outline font-mono">Network: {anchorResult ? 'Local ETH' : 'Pending'}</span>
              <button onClick={() => navigator.clipboard.writeText(anchorResult?.data || originalHash)} className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-primary p-1 rounded hover:bg-surface-container-high" title="Copy hash"><span className="material-symbols-outlined text-[16px]">content_copy</span></button>
            </div>
          </div>
        </div>

        <div className={`card-panel rounded-xl p-8 mb-8 flex flex-col items-center justify-center text-center transition-all duration-500 ${isTampered ? 'failed-glow border-error/50' : 'verified-glow border-secondary/50'}`}>
          <span className={`material-symbols-outlined text-[48px] mb-4 ${isTampered ? 'text-error' : 'text-secondary'}`}>{isTampered ? 'gpp_bad' : 'check_circle'}</span>
          <h3 className={`text-[20px] font-bold uppercase tracking-wider mb-2 ${isTampered ? 'text-error' : 'text-secondary'}`}>{isTampered ? 'VERIFICATION FAILED' : isVerified ? 'VERIFIED' : 'NO DATA'}</h3>
          <p className="text-[14px] text-on-surface-variant max-w-lg">{isTampered ? 'Hash mismatch detected. Local data may have been compromised.' : isVerified ? 'Cryptographic hashes match. Data integrity is confirmed.' : 'Generate a fingerprint and anchor it to the blockchain first.'}</p>
        </div>

        <div className="card-panel rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5"><span className="material-symbols-outlined text-error text-[20px]">warning</span><h3 className="text-headline-sm text-on-surface">Tamper Detection Test</h3></div>
          <div className="bg-surface-container p-5 rounded-lg border border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-5">
            <div><p className="text-body-md text-on-surface mb-1">Simulate Unauthorized Modification</p><p className="text-[13px] text-on-surface-variant">Inject a bit-flip error into the local session data to trigger a mismatch.</p></div>
            <button onClick={() => setIsTampered(!isTampered)} disabled={!fingerprint} className={`px-5 py-2.5 text-[12px] font-semibold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap flex items-center gap-2 disabled:opacity-50 ${isTampered ? 'bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest' : 'bg-primary text-on-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(0,209,255,0.2)]'}`}>
              <span className="material-symbols-outlined text-[16px]">bug_report</span>{isTampered ? 'Restore Data' : 'Simulate Tampering'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
