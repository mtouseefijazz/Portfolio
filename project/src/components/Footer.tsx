import { Heart } from 'lucide-react';

export function Footer({ name }: { name: string }) {
  return (
    <footer className="relative border-t border-white/[0.06] py-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500 flex items-center gap-1.5">
          © {new Date().getFullYear()} {name}. Built with
          <Heart className="w-3.5 h-3.5 text-emerald-400" /> and care.
        </p>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <a href="#home" className="hover:text-emerald-300 transition-colors">Top</a>
          <a href="#projects" className="hover:text-emerald-300 transition-colors">Projects</a>
          <a href="#blog" className="hover:text-emerald-300 transition-colors">Blog</a>
          <a href="#contact" className="hover:text-emerald-300 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
