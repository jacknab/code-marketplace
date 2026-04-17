'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/FirebaseProvider';
import { 
  LayoutDashboard, 
  LogIn, 
  UserPlus, 
  ChevronDown, 
  ShoppingBag, 
  Download, 
  Heart, 
  Settings, 
  PlusCircle, 
  LogOut,
  User as UserIcon,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export function Navbar() {
  const { user, dbUser, loading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <header className="bg-white border-b border-border-main sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-12">
          <Link href="/" className="flex items-center gap-2 font-black text-2xl text-primary tracking-tighter">
            <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
               <span className="text-xs">MK</span>
            </div>
            CORE
          </Link>
          <div className="hidden md:flex space-x-8 text-sm font-bold text-text-muted">
            <Link href="/" className="hover:text-primary transition-colors">Marketplace</Link>
            <Link href="#" className="hover:text-primary transition-colors">Best Sellers</Link>
            <Link href="#" className="hover:text-primary transition-colors">New Assets</Link>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {loading ? (
            <div className="w-10 h-10 bg-slate-100 animate-pulse rounded-full"></div>
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 group p-1 pr-3 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                   {user.photoURL ? (
                     <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black uppercase text-sm">
                       {user.email?.[0] || 'U'}
                     </div>
                   )}
                </div>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${showMenu ? 'rotate-180' : ''}`} />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-border-main py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Account Summary */}
                  <div className="px-6 py-4 border-b border-slate-50 mb-2">
                    <div className="text-sm font-black text-text-main truncate">{dbUser?.name || user.displayName || 'Account'}</div>
                    <div className="text-xs font-bold text-text-muted truncate opacity-60">{user.email}</div>
                  </div>

                  {/* Personal Account Section */}
                  <div className="px-3 py-2">
                    <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">Personal Account</div>
                    <MenuLink href="/downloads" icon={<Download className="w-4 h-4" />} label="My Downloads" />
                    <MenuLink href="/collection" icon={<Heart className="w-4 h-4" />} label="My Collection" />
                    <MenuLink href="/settings" icon={<Settings className="w-4 h-4" />} label="Profile Settings" />
                  </div>

                  {/* Developer Section */}
                  {dbUser?.role === 'DEVELOPER' && (
                    <div className="px-3 py-2 border-t border-slate-50 mt-2">
                      <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Developer Portal</div>
                      <MenuLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Business Console" />
                      <MenuLink href="/dashboard/create-listing" icon={<PlusCircle className="w-4 h-4" />} label="Add New Product" />
                      <MenuLink href="/dashboard/withdrawals" icon={<CreditCard className="w-4 h-4" />} label="Payouts" />
                    </div>
                  )}

                  <div className="px-3 pt-2 border-t border-slate-50 mt-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-error-main hover:bg-error-main/5 rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-6">
              <Link href="/login" className="text-sm font-bold text-text-muted hover:text-primary transition-colors flex items-center gap-2">
                Sign in
              </Link>
              <Link href="/register" className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider hover:bg-primary-dark transition-all transform hover:-translate-y-0.5 shadow-xl shadow-primary/20 flex items-center gap-2">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-2 text-sm font-bold text-text-main hover:bg-slate-50 rounded-xl transition-all">
      <span className="text-text-muted">{icon}</span>
      {label}
    </Link>
  );
}
