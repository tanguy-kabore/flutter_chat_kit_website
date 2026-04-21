import { Smartphone, Globe, Phone, Video, Clock, Sparkles } from 'lucide-react';

const items = [
  {
    icon: Smartphone,
    title: 'iOS',
    desc: 'Application native pour iPhone et iPad disponible sur l\'App Store.',
    delay: 0,
  },
  {
    icon: Globe,
    title: 'Web',
    desc: 'Accédez à ChatKit depuis n\'importe quel navigateur sans installation.',
    delay: 1,
  },
  {
    icon: Phone,
    title: 'Appels audio',
    desc: 'Discutez en temps réel avec vos contacts via des appels vocaux HD.',
    delay: 2,
  },
  {
    icon: Video,
    title: 'Appels vidéo',
    desc: 'Partagez vos moments en visioconférence avec jusqu\'à 8 participants.',
    delay: 3,
  },
];

export default function ComingSoon() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-bg opacity-[0.03] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-pale border border-violet-soft/30 text-violet-deep text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Sur la feuille de route
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Prochainement sur{' '}
            <span className="gradient-text">ChatKit</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Des fonctionnalités et plateformes passionnantes arrivent très bientôt.
            Restez connectés !
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map(({ icon: Icon, title, desc, delay }, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl bg-white border border-gray-100 hover:border-violet-soft/40 hover:shadow-xl hover:shadow-violet-accent/5 transition-all duration-300"
              style={{ animationDelay: `${delay * 100}ms` }}
            >
              {/* Coming soon badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-violet-accent to-violet-mid text-white text-[11px] font-bold shadow-md">
                  <Clock className="w-3 h-3" />
                  Bientôt
                </span>
              </div>

              <div className="mt-4 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-pale flex items-center justify-center mb-4 group-hover:bg-violet-accent group-hover:shadow-lg transition-all duration-300">
                  <Icon className="w-7 h-7 text-violet-accent group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <p className="text-sm text-gray-400 mb-4">
            Téléchargez dès maintenant la version Android et soyez les premiers informés.
          </p>
          <a
            href="#download"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold gradient-bg shadow-lg hover:shadow-xl hover:opacity-95 transition-all text-sm"
          >
            Télécharger l'APK
          </a>
        </div>
      </div>
    </section>
  );
}
