import { useState, useEffect } from 'react';

const statusStyles = { verified: 'border-secondary/30 bg-secondary/10 text-secondary', failed: 'border-error/30 bg-error/10 text-error', pending: 'border-tertiary-container/30 bg-tertiary-container/10 text-tertiary-container' };
const statusIcons = { verified: 'verified', failed: 'gpp_bad', pending: 'pending' };
const statusLabels = { verified: 'Verified', failed: 'Failed', pending: 'Pending' };

export default function History() {
  const [selectedRow, setSelectedRow] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chainStatus, setChainStatus] = useState(null);

  useEffect(() => { loadHistory(); loadChainStatus(); }, []);

  const loadHistory = async () => {
    setLoading(true);
    try { const res = await fetch('/api/history'); if (res.ok) { const data = await res.json(); setHistoryData(data.records || []); } } catch {} finally { setLoading(false); }
  };

  const loadChainStatus = async () => {
    try { const res = await fetch('/api/chain/status'); if (res.ok) { const data = await res.json(); setChainStatus(data); } } catch {}
  };

  const truncateTx = (tx) => { if (!tx) return ''; return tx.length > 16 ? tx.slice(0, 6) + '...' + tx.slice(-4) : tx; };

  return (
    <div className="p-4 md:p-6 pb-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-headline-md text-on-surface mb-2">Verification History</h2>
            <p className="text-body-md text-on-surface-variant">Immutable record of recent facial scan verifications anchored to the blockchain.</p>
          </div>
          <button onClick={loadHistory} className="flex items-center gap-2 border border-outline-variant bg-surface-container-high text-on-surface px-4 py-2 rounded-lg hover:bg-surface-container-highest transition-colors text-[13px] font-medium">
            <span className="material-symbols-outlined text-[16px]">refresh</span>Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-panel rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity"><span className="material-symbols-outlined text-[80px] text-primary">check_circle</span></div>
            <h4 className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Total Verified</h4>
            <div className="text-[32px] font-bold text-on-surface leading-none">{historyData.length}</div>
            <div className="text-secondary text-[12px] flex items-center gap-1 mt-2"><span className="material-symbols-outlined text-[14px]">trending_up</span>Blockchain records</div>
          </div>
          <div className="card-panel rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity"><span className="material-symbols-outlined text-[80px] text-secondary">hub</span></div>
            <h4 className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Chain Status</h4>
            <div className="text-[32px] font-bold text-on-surface font-mono leading-none">{chainStatus?.connected ? `#${chainStatus.chain_id}` : 'Offline'}</div>
            <div className={`text-[12px] flex items-center gap-1 mt-2 ${chainStatus?.connected ? 'text-secondary' : 'text-error'}`}><span className={`w-1.5 h-1.5 rounded-full ${chainStatus?.connected ? 'bg-secondary animate-pulse' : 'bg-error'}`}></span>{chainStatus?.connected ? 'Connected' : 'Disconnected'}</div>
          </div>
          <div className="card-panel rounded-xl p-5 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity"><span className="material-symbols-outlined text-[80px] text-tertiary-container">account_balance</span></div>
            <h4 className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Default Account</h4>
            <div className="text-[13px] text-on-surface truncate font-mono">{chainStatus?.account ? chainStatus.account.slice(0, 10) + '...' : 'N/A'}</div>
            <div className="text-on-surface-variant text-[12px] mt-2">Balance: {chainStatus?.balance_wei ? (Number(chainStatus.balance_wei) / 1e18).toFixed(0) + ' ETH' : 'N/A'}</div>
          </div>
        </div>

        <div className="card-panel rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-[12px] font-semibold text-on-surface uppercase tracking-wider">Verification Ledger</h3>
            <span className="text-[12px] text-on-surface-variant">{historyData.length} record(s)</span>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center"><span className="material-symbols-outlined text-[40px] text-primary-container animate-spin mb-3">progress_activity</span><p className="text-[13px] text-on-surface-variant">Loading history...</p></div>
            ) : historyData.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center"><span className="material-symbols-outlined text-[40px] text-on-surface-variant opacity-20 mb-3">history</span><p className="text-headline-sm text-on-surface">No records yet</p><p className="text-[13px] text-on-surface-variant mt-2">Complete the fingerprint + anchor flow to see records here</p></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-outline-variant">
                  {[['Date & Time (UTC)', 'Date & Time (UTC)'], ['Source', 'Source'], ['Transaction Hash', 'Transaction Hash'], ['Block', 'Block'], ['Status', 'Status']].map(([, label]) => <th key={label} className="p-3.5 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{label}</th>)}
                  <th className="p-3.5"></th>
                </tr></thead>
                <tbody className="text-[13px] text-on-surface">
                  {historyData.map((row, i) => (
                    <tr key={i} className="border-b border-outline-variant/50 table-row-hover transition-colors cursor-pointer group" onClick={() => setSelectedRow(row)}>
                      <td className="p-3.5"><span className="text-[12px] text-on-surface font-mono">{row.date}</span></td>
                      <td className="p-3.5"><div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-on-surface-variant">dns</span><span className="font-mono text-[12px]">{row.source}</span></div></td>
                      <td className="p-3.5"><div className="flex items-center gap-1.5"><span className="text-[12px] text-primary-container font-mono truncate w-28 inline-block">{truncateTx(row.tx)}</span><button className="text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-primary transition-all p-0.5 rounded" title="Copy Hash" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(row.tx); }}><span className="material-symbols-outlined text-[14px]">content_copy</span></button></div></td>
                      <td className="p-3.5 text-[12px] font-mono">{row.block_number || '--'}</td>
                      <td className="p-3.5"><div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[11px] ${statusStyles[row.status] || statusStyles.verified}`}><span className="material-symbols-outlined text-[12px]">{statusIcons[row.status] || 'verified'}</span>{statusLabels[row.status] || 'Verified'}</div></td>
                      <td className="p-3.5 text-right"><span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[18px]">chevron_right</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRow(null)}></div>
          <div className="glass-panel w-full max-w-2xl rounded-xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-5 border-b border-outline-variant flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-headline-sm text-on-surface">Verification Record</h3>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[11px] ${statusStyles[selectedRow.status] || statusStyles.verified}`}><span className="material-symbols-outlined text-[12px]">{statusIcons[selectedRow.status] || 'verified'}</span>{statusLabels[selectedRow.status] || 'Verified'}</div>
                </div>
                <p className="text-[12px] text-on-surface-variant font-mono">ID: VRF-{selectedRow.date?.replace(/[-: ]/g, '').slice(0, 8) || '00000000'}-889A</p>
              </div>
              <button className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high transition-colors" onClick={() => setSelectedRow(null)}><span className="material-symbols-outlined text-[20px]">close</span></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <h4 className="text-[11px] font-semibold text-on-surface-variant mb-2 uppercase tracking-wider">Cryptographic Evidence</h4>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3.5 text-[12px] text-on-surface font-mono break-all relative group leading-relaxed">
                  {selectedRow.tx || 'N/A'}
                  <button className="absolute top-2 right-2 p-1.5 bg-surface-container-high border border-outline-variant rounded-md text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-primary transition-all" onClick={() => navigator.clipboard.writeText(selectedRow.tx || '')}><span className="material-symbols-outlined text-[14px]">content_copy</span></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[['Timestamp (UTC)', selectedRow.date], ['Block Height', selectedRow.block_number || 'Pending'], ['Source', selectedRow.source], ['Fingerprint', selectedRow.fingerprint || 'N/A']].map(([label, value]) => (
                  <div key={label} className="border-l-2 border-outline-variant pl-3">
                    <div className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">{label}</div>
                    <div className={`text-[13px] text-on-surface mt-1 font-mono ${label === 'Fingerprint' ? 'text-[12px] break-all' : ''}`}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 border-t border-outline-variant flex justify-end gap-3">
              <button className="border border-outline-variant bg-surface-container-high text-on-surface px-4 py-2 rounded-lg hover:bg-surface-container-highest transition-colors text-[13px] font-medium" onClick={() => setSelectedRow(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
