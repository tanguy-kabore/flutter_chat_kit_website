import { useState } from 'react';
import {
  Building2, Mail, Phone, User, Globe, Users, DollarSign,
  Calendar, MessageSquare, Send, CheckCircle, AlertCircle,
  ChevronDown, Briefcase, Zap, Shield, Settings, Star,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const COMPANY_SIZES = [
  '1 – 10 employés',
  '11 – 50 employés',
  '51 – 200 employés',
  '201 – 500 employés',
  '500+ employés',
];

const SECTORS = [
  'Banque / Finance',
  'Santé',
  'Éducation',
  'Commerce / Retail',
  'Logistique / Transport',
  'Administration publique',
  'ONG / Association',
  'Télécommunications',
  'Technologie / IT',
  'Autre',
];

const BUDGETS = [
  'Moins de 500 000 FCFA',
  '500 000 – 2 000 000 FCFA',
  '2 000 000 – 5 000 000 FCFA',
  '5 000 000 – 10 000 000 FCFA',
  'Plus de 10 000 000 FCFA',
  'À définir ensemble',
];

const TIMELINES = [
  'Dès que possible (< 1 mois)',
  'Court terme (1 – 3 mois)',
  'Moyen terme (3 – 6 mois)',
  'Long terme (6 – 12 mois)',
  'Pas encore défini',
];

const FEATURES = [
  'Messagerie instantanée',
  'Chiffrement de bout en bout',
  'Appels audio / vidéo',
  'Gestion des utilisateurs',
  'Tableau de bord admin',
  'Intégration SSO / LDAP',
  'Branding personnalisé',
  'Hébergement on-premise',
  'API / Webhooks',
  'Support dédié',
];

function SelectField({ label, icon: Icon, value, onChange, options, placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
        <select
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none ${Icon ? 'pl-10' : 'pl-4'} pr-9 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 transition-all bg-white`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function InputField({ label, icon: Icon, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
        <input
          type={type} required={required} value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 transition-all`}
        />
      </div>
    </div>
  );
}

// ── Pitch section (always visible) ────────────────────────────────────────────
function EnterprisePitch() {
  return (
    <div className="bg-gradient-to-br from-violet-deep via-violet-mid to-violet-accent rounded-3xl p-8 sm:p-10 text-white overflow-hidden relative">
      {/* Decorative circles */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-xs font-semibold mb-5">
          <Star className="w-3.5 h-3.5 text-yellow-300" />
          Solution Enterprise
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">
          ChatKit adapté à<br />votre entreprise
        </h3>
        <p className="text-white/75 text-sm leading-relaxed mb-7 max-w-md">
          Déployez une solution de messagerie sécurisée, entièrement personnalisée à
          votre identité visuelle, vos processus internes et vos contraintes techniques.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: Shield,   text: 'Chiffrement militaire & conformité RGPD' },
            { icon: Settings, text: 'Branding complet — logo, couleurs, domaine' },
            { icon: Zap,      text: 'Déploiement cloud ou on-premise' },
            { icon: Users,    text: 'Gestion avancée des équipes & rôles' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-sm text-white/85">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function EnterpriseForm() {
  const [form, setForm] = useState({
    contact_name: '', contact_email: '', contact_phone: '',
    company_name: '', company_size: '', sector: '', website: '',
    budget: '', timeline: '', message: '',
    features: [],
  });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function toggleFeature(f) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter((x) => x !== f)
        : [...prev.features, f],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const { error } = await supabase.from('enterprise_leads').insert({
        contact_name:  form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || null,
        company_name:  form.company_name.trim(),
        company_size:  form.company_size || null,
        sector:        form.sector || null,
        website:       form.website.trim() || null,
        budget:        form.budget || null,
        timeline:      form.timeline || null,
        features:      form.features.length ? form.features : null,
        message:       form.message.trim() || null,
        status:        'new',
      });
      if (error) throw error;
      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <section id="enterprise" className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="inline-flex w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Demande envoyée !</h2>
          <p className="text-gray-500 mb-8">
            Merci pour votre intérêt. Notre équipe commerciale étudiera votre demande
            et vous contactera sous <strong>48h ouvrées</strong>.
          </p>
          <button
            onClick={() => {
              setForm({ contact_name:'',contact_email:'',contact_phone:'',company_name:'',company_size:'',sector:'',website:'',budget:'',timeline:'',message:'',features:[] });
              setStatus('idle');
            }}
            className="px-6 py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-opacity shadow-md"
          >
            Nouvelle demande
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="enterprise" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-pale border border-violet-soft/30 text-violet-deep text-xs font-semibold mb-4">
            <Briefcase className="w-3.5 h-3.5" />
            Pour les entreprises
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Une version <span className="gradient-text">sur mesure</span><br className="hidden sm:block" />
            pour votre organisation
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Vous êtes une entreprise, une institution ou une organisation ? Nous concevons
            une solution ChatKit entièrement personnalisée à vos besoins.
            Remplissez le formulaire ci-dessous et nous vous recontactons rapidement.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left — Pitch */}
          <div className="lg:col-span-2 space-y-6">
            <EnterprisePitch />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '48h', label: 'Délai de réponse' },
                { value: '100%', label: 'Personnalisable' },
                { value: '24/7', label: 'Support dédié' },
              ].map((s) => (
                <div key={s.label} className="bg-violet-pale rounded-2xl p-4 text-center">
                  <p className="text-xl font-extrabold gradient-text">{s.value}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">

            {/* ── Contact ── */}
            <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-violet-mid uppercase tracking-widest mb-5">
                Votre contact
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField label="Nom complet" icon={User} value={form.contact_name} onChange={(v) => set('contact_name', v)} placeholder="Jean Dupont" required />
                <InputField label="Email professionnel" icon={Mail} type="email" value={form.contact_email} onChange={(v) => set('contact_email', v)} placeholder="jean@entreprise.com" required />
                <InputField label="Téléphone" icon={Phone} type="tel" value={form.contact_phone} onChange={(v) => set('contact_phone', v)} placeholder="+226 00 00 00 00" />
              </div>
            </div>

            {/* ── Entreprise ── */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-violet-mid uppercase tracking-widest mb-5">
                Votre organisation
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField label="Nom de l'entreprise" icon={Building2} value={form.company_name} onChange={(v) => set('company_name', v)} placeholder="Acme Corp" required />
                <InputField label="Site web" icon={Globe} value={form.website} onChange={(v) => set('website', v)} placeholder="https://acme.com" />
                <SelectField label="Taille de l'entreprise" icon={Users} value={form.company_size} onChange={(v) => set('company_size', v)} options={COMPANY_SIZES} placeholder="Choisir..." />
                <SelectField label="Secteur d'activité" icon={Briefcase} value={form.sector} onChange={(v) => set('sector', v)} options={SECTORS} placeholder="Choisir..." />
              </div>
            </div>

            {/* ── Besoins ── */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-violet-mid uppercase tracking-widest mb-5">
                Fonctionnalités souhaitées
              </h3>
              <div className="flex flex-wrap gap-2">
                {FEATURES.map((f) => (
                  <button
                    key={f} type="button"
                    onClick={() => toggleFeature(f)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      form.features.includes(f)
                        ? 'gradient-bg text-white border-transparent shadow-sm'
                        : 'border-gray-200 text-gray-500 hover:border-violet-soft hover:text-violet-deep'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Projet ── */}
            <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-violet-mid uppercase tracking-widest mb-5">
                Détails du projet
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <SelectField label="Budget estimé" icon={DollarSign} value={form.budget} onChange={(v) => set('budget', v)} options={BUDGETS} placeholder="Sélectionner..." />
                <SelectField label="Délai souhaité" icon={Calendar} value={form.timeline} onChange={(v) => set('timeline', v)} options={TIMELINES} placeholder="Sélectionner..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <MessageSquare className="inline w-4 h-4 mr-1.5 text-gray-400" />
                  Description de votre besoin
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  placeholder="Décrivez votre projet, vos contraintes techniques, vos besoins spécifiques..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 transition-all resize-none"
                />
              </div>
            </div>

            {/* ── Submit ── */}
            <div className="px-6 sm:px-8 py-6">
              {status === 'error' && (
                <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{errorMsg}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-semibold gradient-bg hover:opacity-95 transition-all shadow-md disabled:opacity-60"
              >
                {status === 'sending' ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Envoi en cours...</>
                ) : (
                  <><Send className="w-4 h-4" /> Envoyer ma demande</>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                Réponse garantie sous 48h ouvrées · Informations confidentielles
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
