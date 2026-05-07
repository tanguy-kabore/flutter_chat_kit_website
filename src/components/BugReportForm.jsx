import { useState, useRef, useCallback } from 'react';
import {
  Bug, Upload, X, Send, CheckCircle, AlertCircle,
  User, Mail, Smartphone, ChevronDown, Paperclip, Play,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const SEVERITY = [
  { value: 'low',      label: 'Faible',    color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'medium',   label: 'Moyen',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'high',     label: 'Élevé',     color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'critical', label: 'Critique',  color: 'bg-red-100 text-red-700 border-red-200' },
];

const CATEGORIES = [
  'Interface utilisateur',
  'Messages / Conversations',
  'Notifications',
  'Chiffrement / Sécurité',
  'Connexion / Authentification',
  'Photos / Médias',
  'Performances / Lenteur',
  'Autre',
];

const MAX_FILES = 5;
const MAX_SIZE_MB = 50;
const ACCEPTED = 'image/*,video/*,.mp4,.mov,.webm,.jpg,.jpeg,.png,.gif,.webp';

function FilePreview({ file, onRemove }) {
  const isVideo = file.type.startsWith('video/');
  const url = URL.createObjectURL(file);
  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square">
      {isVideo ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <video src={url} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
          </div>
        </div>
      ) : (
        <img src={url} alt={file.name} className="w-full h-full object-cover" />
      )}
      <button
        type="button"
        onClick={() => onRemove(file)}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
      >
        <X className="w-3.5 h-3.5 text-white" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/40 backdrop-blur-sm">
        <p className="text-white text-[10px] truncate">{file.name}</p>
      </div>
    </div>
  );
}

export default function BugReportForm() {
  const [form, setForm] = useState({
    name: '', email: '', device: '', app_version: '',
    category: '', severity: 'medium',
    title: '', description: '', steps: '',
  });
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef();

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addFiles = useCallback((incoming) => {
    const valid = [];
    for (const f of incoming) {
      if (files.length + valid.length >= MAX_FILES) break;
      if (f.size > MAX_SIZE_MB * 1024 * 1024) continue;
      if (!files.find((x) => x.name === f.name && x.size === f.size)) valid.push(f);
    }
    setFiles((prev) => [...prev, ...valid]);
  }, [files]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (f) => setFiles((prev) => prev.filter((x) => x !== f));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setStatus('sending');
    setErrorMsg('');

    try {
      // 1. Insert bug report row (anon — public form)
      const { data: report, error: insertErr } = await supabase
        .from('bug_reports')
        .insert({
          name: form.name.trim() || null,
          email: form.email.trim() || null,
          device: form.device.trim() || null,
          app_version: form.app_version.trim() || null,
          category: form.category || null,
          severity: form.severity,
          title: form.title.trim(),
          description: form.description.trim(),
          steps: form.steps.trim() || null,
          status: 'open',
        })
        .select('id')
        .single();

      if (insertErr) throw insertErr;

      // 2. Upload media files
      if (files.length > 0) {
        const uploads = files.map((f) => {
          const ext = f.name.split('.').pop();
          const path = `${report.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          return supabase.storage.from('bug-media').upload(path, f, {
            contentType: f.type,
            upsert: false,
          });
        });
        await Promise.all(uploads);
      }

      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <section id="bug-report" className="py-20 bg-violet-bg">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="inline-flex w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Rapport envoyé !</h2>
          <p className="text-gray-500 mb-8">
            Merci pour votre rapport. Notre équipe va examiner le bug et vous contactera
            si vous avez fourni votre email.
          </p>
          <button
            onClick={() => {
              setForm({ name:'',email:'',device:'',app_version:'',category:'',severity:'medium',title:'',description:'',steps:'' });
              setFiles([]);
              setStatus('idle');
            }}
            className="px-6 py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-90 transition-opacity shadow-md"
          >
            Signaler un autre bug
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="bug-report" className="py-20 bg-violet-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex w-14 h-14 rounded-2xl gradient-bg items-center justify-center mb-4 shadow-lg">
            <Bug className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            Signaler un bug
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Vous avez rencontré un problème ? Décrivez-le avec autant de détails que possible.
            Vous pouvez joindre des captures d'écran ou des vidéos pour nous aider à le reproduire.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* ── Section: Identité ── */}
          <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-violet-mid uppercase tracking-widest mb-5">
              Vos informations <span className="text-gray-400 normal-case font-normal">(optionnel)</span>
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                  placeholder="Votre nom"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 transition-all"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder="Votre email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 transition-all"
                />
              </div>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={form.device} onChange={(e) => set('device', e.target.value)}
                  placeholder="Appareil (ex: Samsung Galaxy S22)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 transition-all"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">v</span>
                <input
                  type="text" value={form.app_version} onChange={(e) => set('app_version', e.target.value)}
                  placeholder="Version de l'app (ex: 1.0.0)"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Section: Classification ── */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-violet-mid uppercase tracking-widest mb-5">
              Classification
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="relative">
                <select
                  value={form.category} onChange={(e) => set('category', e.target.value)}
                  className="w-full appearance-none px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 transition-all bg-white"
                >
                  <option value="">Catégorie du bug</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {/* Severity */}
              <div className="flex gap-2 flex-wrap">
                {SEVERITY.map((s) => (
                  <button
                    key={s.value} type="button"
                    onClick={() => set('severity', s.value)}
                    className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      form.severity === s.value
                        ? s.color + ' ring-2 ring-offset-1 ' + s.color.split(' ')[1].replace('text-', 'ring-')
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Section: Description ── */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-violet-mid uppercase tracking-widest mb-5">
              Description du bug <span className="text-red-400">*</span>
            </h3>
            <div className="space-y-4">
              <input
                type="text" required
                value={form.title} onChange={(e) => set('title', e.target.value)}
                placeholder="Titre court et précis (ex: L'app crash lors de l'envoi d'une photo)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 transition-all"
              />
              <textarea
                required rows={4}
                value={form.description} onChange={(e) => set('description', e.target.value)}
                placeholder="Décrivez le bug en détail. Qu'est-ce qui s'est passé ? Qu'est-ce qui aurait dû se passer ?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 transition-all resize-none"
              />
              <textarea
                rows={3}
                value={form.steps} onChange={(e) => set('steps', e.target.value)}
                placeholder="Étapes pour reproduire le bug (optionnel) :&#10;1. Ouvrir l'app&#10;2. Aller dans...&#10;3. Appuyer sur..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* ── Section: Médias ── */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-violet-mid uppercase tracking-widest mb-5">
              Captures d'écran / Vidéos <span className="text-gray-400 normal-case font-normal">
                (max {MAX_FILES} fichiers · {MAX_SIZE_MB} Mo chacun)
              </span>
            </h3>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer p-6 text-center ${
                dragging
                  ? 'border-violet-accent bg-violet-pale'
                  : 'border-gray-200 hover:border-violet-soft hover:bg-violet-pale/50'
              }`}
            >
              <input
                ref={fileInputRef} type="file" multiple accept={ACCEPTED}
                className="hidden"
                onChange={(e) => addFiles(Array.from(e.target.files || []))}
              />
              <div className="flex flex-col items-center gap-2 pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-violet-pale flex items-center justify-center">
                  <Paperclip className="w-5 h-5 text-violet-accent" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  Glissez vos fichiers ici ou <span className="text-violet-accent">cliquez pour parcourir</span>
                </p>
                <p className="text-xs text-gray-400">Photos, vidéos acceptées</p>
              </div>
            </div>

            {/* Previews */}
            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {files.map((f) => (
                  <FilePreview key={f.name + f.size} file={f} onRemove={removeFile} />
                ))}
                {files.length < MAX_FILES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-violet-soft hover:text-violet-soft transition-all"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Footer: Submit ── */}
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
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer le rapport
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Vos données sont utilisées uniquement pour corriger les bugs et ne seront jamais partagées.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
