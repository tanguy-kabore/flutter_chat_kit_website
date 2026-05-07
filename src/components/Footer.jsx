import { MessageCircle, Heart } from 'lucide-react';
import FlagBF from './FlagBF';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold gradient-text">ChatKit</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-violet-accent transition-colors">Fonctionnalités</a>
            <a href="#download" className="hover:text-violet-accent transition-colors">Télécharger</a>
            <a href="#bug-report" className="hover:text-violet-accent transition-colors">Signaler un bug</a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-gray-400 flex items-center gap-1.5">
            &copy; {year} ChatKit. Fait avec
            <Heart className="w-3.5 h-3.5 text-violet-accent fill-violet-accent" />
            <span className="text-xs">·</span>
            <span className="flex items-center gap-1 text-xs">
              <FlagBF size={14} />
              Burkina Faso
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
