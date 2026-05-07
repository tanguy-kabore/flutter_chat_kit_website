import { useEffect, useState } from 'react';
import {
  Bug, RefreshCw, ChevronDown, ChevronUp, ExternalLink,
  User, Mail, Smartphone, Calendar, Tag, AlertTriangle,
  CheckCircle, Clock, XCircle, Trash2, Image, Film, X,
  Download, FileJson, FileText, ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ── Export helpers ──────────────────────────────────────────
function triggerDownload(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function reportsToCsv(rows) {
  const COLS = ['id','title','severity','status','category','name','email','device','app_version','description','steps','created_at','updated_at'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = COLS.join(',');
  const lines  = rows.map((r) => COLS.map((c) => escape(r[c])).join(','));
  return [header, ...lines].join('\n');
}

function exportJson(rows, filename) {
  triggerDownload(JSON.stringify(rows, null, 2), filename, 'application/json');
}

function exportCsv(rows, filename) {
  triggerDownload(reportsToCsv(rows), filename, 'text/csv;charset=utf-8;');
}

function ExportMenu({ onCsv, onJson, label = 'Exporter' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-violet-soft hover:text-violet-deep transition-all shadow-sm"
      >
        <Download className="w-3.5 h-3.5" />
        {label}
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 z-20 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-36">
            <button
              onClick={() => { onCsv(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-violet-pale transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-green-500" /> Export CSV
            </button>
            <button
              onClick={() => { onJson(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-violet-pale transition-colors"
            >
              <FileJson className="w-3.5 h-3.5 text-blue-500" /> Export JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const SEVERITY_STYLE = {
  low:      { label: 'Faible',   cls: 'bg-green-100 text-green-700' },
  medium:   { label: 'Moyen',    cls: 'bg-yellow-100 text-yellow-700' },
  high:     { label: 'Élevé',    cls: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critique', cls: 'bg-red-100 text-red-700' },
};

const STATUS_STYLE = {
  open:        { label: 'Ouvert',    icon: Clock,        cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En cours',  icon: AlertTriangle, cls: 'bg-yellow-100 text-yellow-700' },
  resolved:    { label: 'Résolu',    icon: CheckCircle,  cls: 'bg-green-100 text-green-700' },
  closed:      { label: 'Fermé',     icon: XCircle,      cls: 'bg-gray-100 text-gray-500' },
};

const STATUS_OPTIONS = Object.entries(STATUS_STYLE).map(([v, s]) => ({ value: v, ...s }));

function MediaGallery({ reportId }) {
  const [media, setMedia] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    supabase.storage.from('bug-media').list(reportId).then(({ data }) => {
      setMedia(data || []);
    });
  }, [reportId]);

  if (!media || media.length === 0) return null;

  return (
    <>
      <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-2">
        {media.map((f) => {
          const { data } = supabase.storage.from('bug-media').getPublicUrl(`${reportId}/${f.name}`);
          const url = data.publicUrl;
          const isVideo = f.name.match(/\.(mp4|mov|webm|avi)$/i);
          return (
            <button
              key={f.name}
              type="button"
              onClick={() => setLightbox({ url, isVideo })}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
            >
              {isVideo ? (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <Film className="w-5 h-5 text-white" />
                </div>
              ) : (
                <img src={url} alt={f.name} className="w-full h-full object-cover" />
              )}
            </button>
          );
        })}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          {lightbox.isVideo ? (
            <video src={lightbox.url} controls autoPlay className="max-h-[85vh] max-w-full rounded-xl" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={lightbox.url} alt="preview" className="max-h-[85vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}
    </>
  );
}

function BugCard({ report, onStatusChange, onDelete, onExport }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_STYLE[report.severity] ?? SEVERITY_STYLE.medium;
  const sta = STATUS_STYLE[report.status] ?? STATUS_STYLE.open;
  const StatusIcon = sta.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sev.cls}`}>
                <AlertTriangle className="w-3 h-3" /> {sev.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sta.cls}`}>
                <StatusIcon className="w-3 h-3" /> {sta.label}
              </span>
              {report.category && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-pale text-violet-mid">
                  <Tag className="w-3 h-3" /> {report.category}
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">{report.title}</h3>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(report.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <select
              value={report.status}
              onChange={(e) => onStatusChange(report.id, e.target.value)}
              className="text-xs rounded-lg border border-gray-200 px-2 py-1.5 focus:outline-none focus:border-violet-accent bg-white text-gray-600"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ExportMenu
              label=""
              onCsv={() => onExport(report, 'csv')}
              onJson={() => onExport(report, 'json')}
            />
            <button
              onClick={() => onDelete(report)}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Reporter summary */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
          {report.name && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {report.name}
            </span>
          )}
          {report.email && (
            <a href={`mailto:${report.email}`} className="flex items-center gap-1 hover:text-violet-accent transition-colors">
              <Mail className="w-3 h-3" /> {report.email}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {report.device && (
            <span className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> {report.device}
            </span>
          )}
          {report.app_version && (
            <span className="flex items-center gap-1 font-mono">
              v{report.app_version}
            </span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{report.description}</p>
          </div>
          {report.steps && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Étapes pour reproduire</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 rounded-xl p-3">{report.steps}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Image className="w-3 h-3" /> Médias joints
            </p>
            <MediaGallery reportId={report.id} />
          </div>
        </div>
      )}
    </div>
  );
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
}

export default function BugReportsAdmin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    setLoading(true);
    const { data } = await supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase.from('bug_reports').update({ status }).eq('id', id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }

  function handleExportOne(report, format) {
    const slug = slugify(report.title);
    const ts   = new Date(report.created_at).toISOString().slice(0,10);
    const name = `bug-${ts}-${slug}`;
    if (format === 'csv') exportCsv([report], `${name}.csv`);
    else exportJson([report], `${name}.json`);
  }

  function handleExportAll(format) {
    const ts = new Date().toISOString().slice(0,10);
    const label = filter !== 'all' ? `-${filter}` : '';
    const name = `bugs-export${label}-${ts}`;
    if (format === 'csv') exportCsv(filtered, `${name}.csv`);
    else exportJson(filtered, `${name}.json`);
  }

  async function deleteReport(report) {
    if (!confirm(`Supprimer le rapport "${report.title}" ?`)) return;
    // Delete media
    const { data: files } = await supabase.storage.from('bug-media').list(report.id);
    if (files?.length) {
      await supabase.storage.from('bug-media').remove(files.map((f) => `${report.id}/${f.name}`));
    }
    await supabase.from('bug_reports').delete().eq('id', report.id);
    setReports((prev) => prev.filter((r) => r.id !== report.id));
  }

  const filtered = reports.filter((r) => {
    const matchStatus = filter === 'all' || r.status === filter;
    const matchSev = severityFilter === 'all' || r.severity === severityFilter;
    return matchStatus && matchSev;
  });

  // Stats
  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === 'open').length,
    critical: reports.filter((r) => r.severity === 'critical').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-violet-accent' },
          { label: 'Ouverts', value: stats.open, color: 'text-blue-500' },
          { label: 'Critiques', value: stats.critical, color: 'text-red-500' },
          { label: 'Résolus', value: stats.resolved, color: 'text-green-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Refresh */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={fetchReports}
          className="p-2 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-violet-accent hover:border-violet-soft transition-colors shadow-sm"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        {filtered.length > 0 && (
          <ExportMenu
            label={`Exporter (${filtered.length})`}
            onCsv={() => handleExportAll('csv')}
            onJson={() => handleExportAll('json')}
          />
        )}

        <div className="flex gap-2 flex-wrap">
          {[{ value: 'all', label: 'Tous' }, ...STATUS_OPTIONS].map((o) => (
            <button
              key={o.value}
              onClick={() => setFilter(o.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                filter === o.value
                  ? 'gradient-bg text-white border-transparent shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-violet-soft'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap ml-auto">
          {[{ value: 'all', label: 'Sévérité' }, ...Object.entries(SEVERITY_STYLE).map(([v, s]) => ({ value: v, label: s.label }))].map((o) => (
            <button
              key={o.value}
              onClick={() => setSeverityFilter(o.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                severityFilter === o.value
                  ? 'bg-gray-900 text-white border-transparent'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 rounded-full border-3 border-violet-pale border-t-violet-accent animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-4">Chargement des rapports...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Bug className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">
            {reports.length === 0 ? 'Aucun rapport de bug reçu' : 'Aucun rapport pour ces filtres'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <BugCard
              key={r.id}
              report={r}
              onStatusChange={updateStatus}
              onDelete={deleteReport}
              onExport={handleExportOne}
            />
          ))}
        </div>
      )}
    </div>
  );
}
