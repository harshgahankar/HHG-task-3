import { Bell, UserCircle, Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function TopBar({ onMenuToggle }) {
  return (
    <header className="bg-surface/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-30">
      <div className="flex justify-between items-center h-14 px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button onClick={onMenuToggle} className="md:hidden text-on-surface-variant hover:text-primary transition-colors p-1">
            <Menu size={22} />
          </button>
          <nav className="hidden md:flex gap-1">
            {[['/', 'Dashboard'], ['/scan', 'Scan'], ['/fingerprint', 'Fingerprint'], ['/verification', 'Verification'], ['/history', 'History']].map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors ${isActive ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-md hover:bg-surface-container-high">
            <Bell size={18} />
          </button>
          <button className="text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-md hover:bg-surface-container-high">
            <UserCircle size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
