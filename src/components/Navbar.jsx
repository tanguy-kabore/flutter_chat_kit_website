import { useState } from 'react';
import { MessageCircle, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-violet-light/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold gradient-text tracking-tight">
              ChatKit
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-violet-deep transition-colors">
              Fonctionnalités
            </a>
            <a href="#download" className="text-sm font-medium text-gray-600 hover:text-violet-deep transition-colors">
              Télécharger
            </a>
            <a
              href="#download"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-bg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
            >
              Télécharger l'APK
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-violet-pale transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-5 h-5 text-violet-deep" /> : <Menu className="w-5 h-5 text-violet-deep" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 space-y-2">
            <a
              href="#features"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-violet-pale hover:text-violet-deep transition-colors"
            >
              Fonctionnalités
            </a>
            <a
              href="#download"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-violet-pale hover:text-violet-deep transition-colors"
            >
              Télécharger
            </a>
            <a
              href="#download"
              onClick={() => setOpen(false)}
              className="block mx-4 px-4 py-2.5 rounded-xl text-sm font-semibold text-white text-center gradient-bg shadow-md"
            >
              Télécharger l'APK
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
