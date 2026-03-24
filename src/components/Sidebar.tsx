/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { auth } from '@/src/services/firebase';
import { Button } from './ui/Button';
import { cn } from '@/src/lib/utils';

export const Sidebar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { label: 'Demanda de Expedição', icon: LayoutDashboard, href: '/' },
    { label: 'Alimentar Dados', icon: Database, href: '/alimentar' },
  ];

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform bg-nazaria-blue text-white transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col p-6">
          <div className="mb-10 flex flex-col items-center gap-2">
            <div className="flex h-16 w-full items-center justify-center rounded-xl bg-white p-2">
              <img 
                src="./logo.png" 
                alt="Nazária Logo" 
                className="h-full w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white/90">Logística</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-nazaria-orange text-white'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-6">
            <div className="mb-4 flex items-center gap-3 px-4">
              <div className="h-8 w-8 rounded-full bg-nazaria-orange flex items-center justify-center text-xs font-bold">
                {auth.currentUser?.displayName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{auth.currentUser?.displayName || 'Usuário'}</p>
                <p className="truncate text-xs text-slate-400">{auth.currentUser?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
};
