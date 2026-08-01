"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, HandCoins, RefreshCw, TrendingUp, Download } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Investments', href: '/investments', icon: TrendingUp },
    { name: 'Udhari', href: '/udhari', icon: HandCoins },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              ExpenseTracker
            </span>
          </div>
          <div className="flex space-x-1 sm:space-x-4 items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                  title={item.name}
                >
                  <Icon className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="hidden md:inline">{item.name}</span>
                </Link>
              );
            })}
            
            <div className="flex items-center space-x-2 md:space-x-6 ml-2 md:ml-6 pl-2 md:pl-6 border-l border-slate-800">
              <a 
                href="/api/export" 
                className="flex items-center space-x-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium p-2 md:p-0"
                title="Download CSV Report"
              >
                <Download className="w-5 h-5" />
                <span className="hidden md:inline">Export</span>
              </a>
              <button 
                onClick={() => window.location.reload()} 
                className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all"
                title="Refresh Dashboard"
              >
                <RefreshCw className="w-5 h-5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
