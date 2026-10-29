import { useEffect, useState } from 'react';
import { Menu, X, LogIn, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const links = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
];

interface NavbarProps {
  onSignInClick: () => void;
  onAdminClick: () => void;
}

export function Navbar({ onSignInClick, onAdminClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-ink-950/80 backdrop-blur-xl border-b border-white/[0.06] py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-2.5 group">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-ink-950 font-bold text-sm font-[Sora] glow transition-transform group-hover:scale-105">
            MP
          </span>
          <span className="hidden sm:block font-[Sora] font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
            MyPortfolio
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 text-sm text-slate-400 hover:text-emerald-300 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              {l.label}
            </a>
          ))}
          <div className="w-px h-6 bg-white/10 mx-2" />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 bg-white/[0.04] rounded-full border border-white/10">
                <User className="w-3.5 h-3.5" />
                {isAdmin ? 'Owner' : 'Member'}
              </span>
              {isAdmin && (
                <button
                  onClick={onAdminClick}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-emerald-300 hover:text-emerald-200 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </button>
              )}
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm text-slate-400 hover:text-rose-300 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-ink-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg hover:from-emerald-300 hover:to-cyan-300 transition-all glow"
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 text-slate-300 hover:text-white"
          aria-label="Menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mt-3 mx-4 glass rounded-2xl p-4 animate-fade-in">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm text-slate-300 hover:text-emerald-300 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                {l.label}
              </a>
            ))}
            <div className="h-px bg-white/10 my-2" />
            {user ? (
              <>
                {isAdmin && (
                  <button
                    onClick={() => {
                      onAdminClick();
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-300 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <Shield className="w-4 h-4" /> Admin panel
                  </button>
                )}
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-rose-300 rounded-lg hover:bg-white/[0.04]"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onSignInClick();
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg"
              >
                <LogIn className="w-4 h-4" /> Sign in
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
