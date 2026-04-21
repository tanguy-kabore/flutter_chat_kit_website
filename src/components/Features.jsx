import {
  MessageCircle, Image, Video, MapPin, Shield, Users,
  Reply, Smile, Bell, Search, Forward, Trash2,
} from 'lucide-react';

const features = [
  {
    icon: MessageCircle,
    title: 'Messagerie instantanée',
    desc: 'Envoyez et recevez des messages en temps réel avec une interface fluide et intuitive.',
  },
  {
    icon: Image,
    title: 'Photos & Vidéos',
    desc: 'Partagez vos moments préférés avec un envoi rapide de photos et vidéos.',
  },
  {
    icon: MapPin,
    title: 'Localisation',
    desc: 'Partagez votre position en un tap pour faciliter vos rendez-vous.',
  },
  {
    icon: Users,
    title: 'Groupes',
    desc: 'Créez des groupes pour discuter avec votre famille, amis ou collègues.',
  },
  {
    icon: Reply,
    title: 'Réponses & Transferts',
    desc: 'Répondez à un message précis ou transférez-le vers une autre conversation.',
  },
  {
    icon: Smile,
    title: 'Réactions emoji',
    desc: 'Réagissez aux messages avec des emojis pour exprimer vos émotions rapidement.',
  },
  {
    icon: Shield,
    title: 'Statuts éphémères',
    desc: 'Partagez des photos, vidéos ou textes en statut visibles pendant 24h.',
  },
  {
    icon: Bell,
    title: 'Notifications push',
    desc: 'Ne manquez aucun message grâce aux notifications en temps réel.',
  },
  {
    icon: Search,
    title: 'Recherche avancée',
    desc: 'Retrouvez n\'importe quel message dans vos conversations instantanément.',
  },
  {
    icon: Forward,
    title: 'Transfert multi',
    desc: 'Transférez des messages vers plusieurs conversations en une seule action.',
  },
  {
    icon: Video,
    title: 'Documents & Fichiers',
    desc: 'Envoyez tout type de fichier : PDF, documents, audio et plus encore.',
  },
  {
    icon: Trash2,
    title: 'Suppression flexible',
    desc: 'Supprimez vos messages pour vous ou pour tout le monde.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-violet-accent/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-violet-soft/5 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-pale border border-violet-soft/30 text-violet-deep text-xs font-semibold mb-4">
            Fonctionnalités
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Tout ce dont vous avez{' '}
            <span className="gradient-text">besoin</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Une application complète de messagerie avec toutes les fonctionnalités
            modernes pour une expérience de communication optimale.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-violet-soft/50 hover:shadow-lg hover:shadow-violet-accent/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-pale flex items-center justify-center mb-4 group-hover:bg-violet-accent group-hover:shadow-md transition-all duration-300">
                <Icon className="w-6 h-6 text-violet-accent group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
