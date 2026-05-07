import { useEffect, useState, useCallback } from 'react';
import {
  Building2, Mail, Phone, Globe, Users, Calendar,
  MessageSquare, RefreshCw, Trash2, ChevronDown, ChevronUp,
  ExternalLink, Tag, CheckCircle, Clock, XCircle, AlertTriangle,
  FileText, FileJson, ChevronRight, Download, Star, Briefcase, Timer,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const SLA_MS = 48 * 60 * 60 * 1000;

function useCountdown(createdAt) {
  const deadline = new Date(createdAt).getTime() + SLA_MS;
  const calc = useCallback(() => {
    const diff = deadline - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, diff, pct: Math.max(0, (diff / SLA_MS) * 100) };
  }, [deadline]);
  const [tick, setTick] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTick(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return tick;
}

function Countdown({ createdAt, status }) {
  const tick = useCountdown(createdAt);
  if (status !== 'new' && status !== 'contacted') return null;
  if (!tick) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold">
        <Timer className="w-3 h-3" /> SLA dépassé
      </div>
    );
  }
  const urgent = tick.pct < 25;
  const warning = tick.pct < 50;
  const color = urgent ? 'bg-red-100 text-red-600' : warning ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700';
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
      <Timer className="w-3 h-3" />
      {pad(tick.h)}h {pad(tick.m)}m {pad(tick.s)}s
    </div>
  );
}

const STATUS_STYLE = {
  new:         { label: 'Nouveau',      icon: Star,          cls: 'bg-blue-100 text-blue-700' },
  contacted:   { label: 'Contacté',     icon: Clock,         cls: 'bg-yellow-100 text-yellow-700' },
  negotiating: { label: 'Négociation',  icon: AlertTriangle, cls: 'bg-orange-100 text-orange-700' },
  won:         { label: 'Signé',        icon: CheckCircle,   cls: 'bg-green-100 text-green-700' },
  lost:        { label: 'Perdu',        icon: XCircle,       cls: 'bg-gray-100 text-gray-500' },
};

const STATUS_OPTIONS = Object.entries(STATUS_STYLE).map(([v, s]) => ({ value: v, ...s }));

// ── Export helpers ─────────────────────────────────────────────────────────────
function triggerDownload(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

const EXPORT_COLS = ['id','contact_name','contact_email','contact_phone','company_name','company_size','sector','website','budget','timeline','message','status','created_at'];

function toCsv(rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [EXPORT_COLS.join(','), ...rows.map((r) => EXPORT_COLS.map((c) => esc(c === 'features' ? (r[c] || []).join(';') : r[c])).join(','))].join('\n');
}

function ExportMenu({ onCsv, onJson, label = 'Exporter' }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-violet-soft hover:text-violet-deep transition-all shadow-sm">
        <Download className="w-3.5 h-3.5" />{label}
        <ChevronRight className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 z-20 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-36">
            <button onClick={() => { onCsv(); setOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-violet-pale transition-colors">
              <FileText className="w-3.5 h-3.5 text-green-500" /> Export CSV
            </button>
            <button onClick={() => { onJson(); setOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-violet-pale transition-colors">
              <FileJson className="w-3.5 h-3.5 text-blue-500" /> Export JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function LeadCard({ lead, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const sta = STATUS_STYLE[lead.status] ?? STATUS_STYLE.new;
  const StatusIcon = sta.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sta.cls}`}>
                <StatusIcon className="w-3 h-3" /> {sta.label}
              </span>
              <Countdown createdAt={lead.created_at} status={lead.status} />
              {lead.sector && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-pale text-violet-mid">
                  <Briefcase className="w-3 h-3" /> {lead.sector}
                </span>
              )}
              {lead.company_size && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  <Users className="w-3 h-3" /> {lead.company_size}
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">{lead.company_name}</h3>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(lead.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <select
              value={lead.status}
              onChange={(e) => onStatusChange(lead.id, e.target.value)}
              className="text-xs rounded-lg border border-gray-200 px-2 py-1.5 focus:outline-none focus:border-violet-accent bg-white text-gray-600"
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ExportMenu
              label=""
              onCsv={() => triggerDownload(toCsv([lead]), `lead-${lead.company_name.toLowerCase().replace(/\s+/g,'-')}.csv`, 'text/csv')}
              onJson={() => triggerDownload(JSON.stringify(lead, null, 2), `lead-${lead.company_name.toLowerCase().replace(/\s+/g,'-')}.json`, 'application/json')}
            />
            <button onClick={() => onDelete(lead)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Supprimer">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Contact summary */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {lead.contact_name}
          </span>
          {lead.contact_email && (
            <a href={`mailto:${lead.contact_email}`} className="flex items-center gap-1 hover:text-violet-accent transition-colors">
              <Mail className="w-3 h-3" /> {lead.contact_email} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
          {lead.contact_phone && (
            <a href={`tel:${lead.contact_phone}`} className="flex items-center gap-1 hover:text-violet-accent transition-colors">
              <Phone className="w-3 h-3" /> {lead.contact_phone}
            </a>
          )}
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-violet-accent transition-colors">
              <Globe className="w-3 h-3" /> {lead.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
          {lead.features?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Fonctionnalités souhaitées</p>
              <div className="flex flex-wrap gap-1.5">
                {lead.features.map((f) => (
                  <span key={f} className="px-2.5 py-1 rounded-full bg-violet-pale text-violet-mid text-xs font-medium">{f}</span>
                ))}
              </div>
            </div>
          )}
          {lead.message && (
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-violet-soft mt-0.5 flex-shrink-0" />
              <div><p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Message</p><p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{lead.message}</p></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EnterpriseAdmin() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data } = await supabase.from('enterprise_leads').select('*').order('created_at', { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase.from('enterprise_leads').update({ status }).eq('id', id);
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
  }

  async function deleteLead(lead) {
    if (!confirm(`Supprimer la demande de "${lead.company_name}" ?`)) return;
    await supabase.from('enterprise_leads').delete().eq('id', lead.id);
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
  }

  const filtered = statusFilter === 'all' ? leads : leads.filter((l) => l.status === statusFilter);

  const stats = {
    total:       leads.length,
    new:         leads.filter((l) => l.status === 'new').length,
    negotiating: leads.filter((l) => l.status === 'negotiating').length,
    won:         leads.filter((l) => l.status === 'won').length,
  };

  const ts = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-violet-accent' },
          { label: 'Nouveaux', value: stats.new, color: 'text-blue-500' },
          { label: 'Négociation', value: stats.negotiating, color: 'text-orange-500' },
          { label: 'Signés', value: stats.won, color: 'text-green-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={fetchLeads} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-violet-accent hover:border-violet-soft transition-colors shadow-sm" title="Actualiser">
          <RefreshCw className="w-4 h-4" />
        </button>
        {filtered.length > 0 && (
          <ExportMenu
            label={`Exporter (${filtered.length})`}
            onCsv={() => triggerDownload(toCsv(filtered), `leads-enterprise-${ts}.csv`, 'text/csv')}
            onJson={() => triggerDownload(JSON.stringify(filtered, null, 2), `leads-enterprise-${ts}.json`, 'application/json')}
          />
        )}
        <div className="flex gap-2 flex-wrap">
          {[{ value: 'all', label: 'Tous' }, ...STATUS_OPTIONS].map((o) => (
            <button key={o.value} onClick={() => setStatusFilter(o.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${statusFilter === o.value ? 'gradient-bg text-white border-transparent shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-violet-soft'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 rounded-full border-2 border-violet-pale border-t-violet-accent animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-4">Chargement des demandes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Building2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">
            {leads.length === 0 ? 'Aucune demande entreprise reçue' : 'Aucune demande pour ce filtre'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((l) => (
            <LeadCard key={l.id} lead={l} onStatusChange={updateStatus} onDelete={deleteLead} />
          ))}
        </div>
      )}
    </div>
  );
}
