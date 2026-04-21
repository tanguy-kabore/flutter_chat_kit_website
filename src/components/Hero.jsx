import { Download, Shield, Zap, MessageCircle } from 'lucide-react';
import FlagBF from './FlagBF';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-violet-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-violet-soft/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-pale/30 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-pale border border-violet-soft/30 text-violet-deep text-xs font-semibold mb-6">
              <Zap className="w-3.5 h-3.5" />
              Messagerie nouvelle génération
            </div>

            {/* Burkina Faso badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-violet-soft/20 text-gray-500 text-[11px] font-medium mb-6 shadow-sm">
              <FlagBF size={18} />
              Conçu et développé au Burkina Faso
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Communiquez avec{' '}
              <span className="gradient-text">simplicité</span>{' '}
              et{' '}
              <span className="gradient-text">élégance</span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              ChatKit est une application de messagerie rapide, sécurisée et intuitive.
              Envoyez des messages, photos, vidéos, localisations et bien plus encore.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="#download"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold gradient-bg shadow-lg hover:shadow-xl hover:opacity-95 transition-all animate-pulse-glow"
              >
                <Download className="w-5 h-5" />
                Télécharger l'APK
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-violet-deep bg-violet-pale hover:bg-violet-light transition-colors border border-violet-soft/30"
              >
                En savoir plus
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Shield className="w-4 h-4 text-violet-accent" />
                Chiffré de bout en bout
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Zap className="w-4 h-4 text-violet-accent" />
                Ultra rapide
              </div>
            </div>
          </div>

          {/* Right — Phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="animate-float">
              <div className="phone-mockup w-[280px] sm:w-[300px]">
                <div className="phone-screen bg-white">
                  {/* Status bar */}
                  <div className="gradient-bg px-4 py-2 flex items-center justify-between">
                    <span className="text-white/80 text-[10px] font-medium">09:41</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-1.5 rounded-sm bg-white/60" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    </div>
                  </div>

                  {/* App bar */}
                  <div className="gradient-bg px-4 pb-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">ChatKit</p>
                      <p className="text-white/60 text-[10px]">3 conversations</p>
                    </div>
                  </div>

                  {/* Chat messages preview */}
                  <div className="p-3 space-y-2.5 bg-violet-bg min-h-[340px]">
                    {/* Day separator */}
                    <div className="flex justify-center">
                      <span className="px-3 py-0.5 rounded-md bg-violet-pale text-violet-mid text-[10px] font-medium">
                        Aujourd'hui
                      </span>
                    </div>

                    {/* Received message */}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-md px-3 py-2 max-w-[75%] shadow-sm">
                        <p className="text-[11px] text-gray-800">Salut ! Tu as vu la nouvelle version ? 🚀</p>
                        <p className="text-[8px] text-gray-400 text-right mt-0.5">09:30</p>
                      </div>
                    </div>

                    {/* Sent message */}
                    <div className="flex justify-end">
                      <div className="bg-violet-light rounded-2xl rounded-tr-md px-3 py-2 max-w-[75%] shadow-sm">
                        <p className="text-[11px] text-gray-800">Oui, c'est génial ! J'adore le nouveau design 💜</p>
                        <p className="text-[8px] text-violet-mid text-right mt-0.5">09:31 ✓✓</p>
                      </div>
                    </div>

                    {/* Received */}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-md px-3 py-2 max-w-[75%] shadow-sm">
                        <p className="text-[11px] text-gray-800">Les emojis et réactions sont top aussi 😍</p>
                        <p className="text-[8px] text-gray-400 text-right mt-0.5">09:32</p>
                      </div>
                    </div>

                    {/* Sent with image placeholder */}
                    <div className="flex justify-end">
                      <div className="bg-violet-light rounded-2xl rounded-tr-md overflow-hidden max-w-[75%] shadow-sm">
                        <div className="h-20 bg-gradient-to-br from-violet-soft/40 to-violet-accent/20 flex items-center justify-center">
                          <span className="text-2xl">📸</span>
                        </div>
                        <div className="px-3 py-1.5">
                          <p className="text-[11px] text-gray-800">Regarde cette photo !</p>
                          <p className="text-[8px] text-violet-mid text-right mt-0.5">09:33 ✓✓</p>
                        </div>
                      </div>
                    </div>

                    {/* Received */}
                    <div className="flex justify-start">
                      <div className="bg-white rounded-2xl rounded-tl-md px-3 py-2 max-w-[75%] shadow-sm">
                        <p className="text-[11px] text-gray-800">Magnifique ! 🎉</p>
                        <p className="text-[8px] text-gray-400 text-right mt-0.5">09:34</p>
                      </div>
                    </div>
                  </div>

                  {/* Input bar */}
                  <div className="bg-white border-t border-gray-100 px-3 py-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-50 rounded-full px-3 py-1.5">
                      <p className="text-[10px] text-gray-300">Écrire un message...</p>
                    </div>
                    <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
