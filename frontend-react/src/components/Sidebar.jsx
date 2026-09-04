import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/scan', icon: 'face', label: 'New Scan' },
  { to: '/fingerprint', icon: 'fingerprint', label: 'Fingerprint' },
  { to: '/verification', icon: 'analytics', label: 'Status' },
  { to: '/history', icon: 'history', label: 'History' },
];

export default function Sidebar({ open, onClose }) {
  const [chainOnline, setChainOnline] = useState(null);

  useEffect(() => {
    const checkChain = async () => {
      try {
        const res = await fetch('/api/chain/status');
        if (res.ok) {
          const data = await res.json();
          setChainOnline(data.connected);
        } else {
          setChainOnline(false);
        }
      } catch {
        setChainOnline(false);
      }
    };
    checkChain();
    const interval = setInterval(checkChain, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />
      )}
      <aside className={`w-[280px] h-screen fixed left-0 top-0 border-r border-outline-variant bg-surface-container-lowest flex flex-col z-40 transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="px-5 py-5 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-container/15 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary-container text-[22px]">face</span>
            </div>
            <div>
              <h1 className="text-headline-sm font-bold text-primary tracking-tight leading-tight">FaceChain</h1>
              <p className="text-[11px] text-on-surface-variant leading-tight">AI-Blockchain Verification</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          <ul className="space-y-0.5 px-2">
            {navItems.map(({ to, icon, label }) => (
              <li key={to}>
                <NavLink to={to} end={to === '/'} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-all duration-150 ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}>
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="px-5 py-4 border-t border-outline-variant space-y-3">
          <div className={`flex items-center gap-2 ${chainOnline ? 'text-secondary' : chainOnline === false ? 'text-error' : 'text-on-surface-variant'}`}>
            <span className={`w-2 h-2 rounded-full ${chainOnline ? 'bg-secondary animate-pulse' : chainOnline === false ? 'bg-error' : 'bg-on-surface-variant'}`}></span>
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {chainOnline ? 'Blockchain Online' : chainOnline === false ? 'Blockchain Offline' : 'Checking...'}
            </span>
          </div>
          <ul className="space-y-0.5">
            <li>
              <a className="flex items-center gap-2 py-1.5 text-on-surface-variant hover:text-primary transition-colors duration-150 text-[13px]" href="#">
                <span className="material-symbols-outlined text-[18px]">settings</span>
                <span>Settings</span>
              </a>
            </li>
            <li>
              <a className="flex items-center gap-2 py-1.5 text-on-surface-variant hover:text-primary transition-colors duration-150 text-[13px]" href="#">
                <span className="material-symbols-outlined text-[18px]">help</span>
                <span>Support</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
