import { useEffect, useState } from 'react';
import { Download, Package, Calendar, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DownloadSection() {
  const [release, setRelease] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatest();
  }, []);

  async function fetchLatest() {
    try {
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) setRelease(data);
    } catch (_) {
      // no release yet
    } finally {
      setLoading(false);
    }
  }

  function formatSize(bytes) {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} Mo`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  async function handleDownload() {
    if (!release) return;

    // Increment download count
    supabase
      .from('releases')
      .update({ download_count: (release.download_count || 0) + 1 })
      .eq('id', release.id)
      .then();

    // file_name stores the GitHub download URL directly
    const url = release.file_name;
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    }
  }

  return (
    <section id="download" className="py-24 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-0 w-80 h-80 rounded-full bg-violet-accent/5 blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-violet-soft/8 blur-3xl -translate-y-1/2" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <button
            onClick={handleDownload}
            disabled={!release}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-pale border border-violet-soft/30 text-violet-deep text-xs font-semibold mb-4 hover:bg-violet-soft/20 hover:border-violet-accent/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            <Download className="w-3.5 h-3.5" />
            Téléchargement
          </button>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Téléchargez{' '}
            <span className="gradient-text">ChatKit</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Installez l'application sur votre appareil Android et commencez à communiquer dès maintenant.
          </p>
        </div>

        {/* Download card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-violet-accent/5 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-10 h-10 rounded-full border-3 border-violet-pale border-t-violet-accent animate-spin mx-auto" />
              <p className="text-sm text-gray-400 mt-4">Chargement...</p>
            </div>
          ) : !release ? (
            <div className="p-16 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Aucune version disponible pour le moment</p>
              <p className="text-sm text-gray-300 mt-1">Revenez bientôt !</p>
            </div>
          ) : (
            <>
              {/* Header gradient */}
              <div className="gradient-bg px-6 sm:px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">ChatKit v{release.version}</h3>
                    <p className="text-white/60 text-sm">Dernière version disponible</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8">
                {/* Meta info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-violet-pale/50">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Version</p>
                    <p className="font-bold text-violet-deep">{release.version}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-violet-pale/50">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Taille</p>
                    <p className="font-bold text-violet-deep">{formatSize(release.file_size)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-violet-pale/50 col-span-2 sm:col-span-1">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-1">Date</p>
                    <p className="font-bold text-violet-deep">{formatDate(release.created_at)}</p>
                  </div>
                </div>

                {/* Changelog */}
                {release.changelog && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-violet-accent" />
                      <h4 className="font-semibold text-sm text-gray-700">Notes de version</h4>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {release.changelog}
                    </div>
                  </div>
                )}

                {/* Download button */}
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white font-semibold gradient-bg shadow-lg hover:shadow-xl hover:opacity-95 transition-all text-lg"
                >
                  <Download className="w-5 h-5" />
                  Télécharger l'APK ({formatSize(release.file_size)})
                </button>

                {release.download_count > 0 && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    {release.download_count.toLocaleString('fr-FR')} téléchargement{release.download_count > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
