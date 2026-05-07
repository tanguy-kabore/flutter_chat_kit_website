import { useEffect, useState, useRef } from 'react';
import {
  LogOut, Upload, Trash2, Package, Calendar, Download,
  FileText, Plus, X, MessageCircle, RefreshCw, Edit3, Check,
} from 'lucide-react';
import { supabase, BUCKET } from '../lib/supabase';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Upload via Edge Function (proxy vers GitHub — contourne CORS de uploads.github.com)
function uploadToGitHub(version, file, onProgress) {
  return new Promise(async (resolve, reject) => {
    try {
      // Refresh pour avoir un token valide (évite le 502 token expiré)
      const { data } = await supabase.auth.refreshSession();
      const token = data?.session?.access_token ?? SUPABASE_ANON;

      const url = `${SUPABASE_URL}/functions/v1/upload-release?version=${encodeURIComponent(version)}`;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', 'application/vnd.android.package-archive');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 95));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText).download_url);
          } catch {
            reject(new Error('Réponse invalide de la fonction'));
          }
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body.error || `Erreur Edge Function: ${xhr.status}`));
          } catch {
            reject(new Error(`Erreur serveur: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Erreur réseau'));
      xhr.timeout = 0;
      xhr.send(file);
    } catch (e) {
      reject(e);
    }
  });
}

export default function AdminDashboard({ onLogout }) {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editChangelog, setEditChangelog] = useState('');
  const fileRef = useRef(null);

  // Form state
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [apkFile, setApkFile] = useState(null);

  useEffect(() => {
    fetchReleases();
  }, []);

  async function fetchReleases() {
    setLoading(true);
    const { data } = await supabase
      .from('releases')
      .select('*')
      .order('created_at', { ascending: false });
    setReleases(data || []);
    setLoading(false);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!apkFile || !version.trim()) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadStep('Préparation du fichier...');

    try {
      setUploadStep('Upload vers GitHub Releases...');
      setUploadProgress(0);

      // Upload APK to GitHub Releases (no size limit on free plan)
      const downloadUrl = await uploadToGitHub(
        version.trim(),
        apkFile,
        (pct) => setUploadProgress(pct)
      );

      setUploadProgress(96);
      setUploadStep('Enregistrement de la version...');

      // Store metadata in Supabase (file_name = GitHub download URL)
      const { error: dbErr } = await supabase.from('releases').insert({
        version: version.trim(),
        changelog: changelog.trim() || null,
        file_name: downloadUrl,
        file_size: apkFile.size,
        download_count: 0,
      });

      if (dbErr) throw dbErr;

      setUploadProgress(100);
      setUploadStep('Publication terminée !');

      // Reset form
      setTimeout(() => {
        setVersion('');
        setChangelog('');
        setApkFile(null);
        if (fileRef.current) fileRef.current.value = '';
        setUploading(false);
        setUploadProgress(0);
        setUploadStep('');
        setShowForm(false);
        fetchReleases();
      }, 800);
    } catch (err) {
      setUploadStep('');
      setUploadProgress(0);
      setUploading(false);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('maximum size') || msg.includes('413')) {
        alert(
          'Fichier trop volumineux (limite Supabase dépassée).\n\n' +
          'Pour corriger :\n' +
          '1. Ouvrez votre Dashboard Supabase\n' +
          '2. Storage → Buckets → apk-releases → Modifier\n' +
          '3. Augmentez "Max upload size" (ex: 500 MB)\n\n' +
          'Ou : Project Settings → Storage → File Size Limit'
        );
      } else {
        alert('Erreur: ' + msg);
      }
    }
  }

  async function handleDelete(release) {
    if (!confirm(`Supprimer la version ${release.version} ?`)) return;

    // Delete from storage
    await supabase.storage.from(BUCKET).remove([release.file_name]);

    // Delete from database
    await supabase.from('releases').delete().eq('id', release.id);

    fetchReleases();
  }

  async function handleUpdateChangelog(id) {
    await supabase
      .from('releases')
      .update({ changelog: editChangelog.trim() || null })
      .eq('id', id);

    setEditingId(null);
    setEditChangelog('');
    fetchReleases();
  }

  async function handleReplaceApk(release) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.apk';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const { error: storageErr } = await supabase.storage
        .from(BUCKET)
        .upload(release.file_name, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/vnd.android.package-archive',
        });

      if (storageErr) {
        alert('Erreur: ' + storageErr.message);
        return;
      }

      await supabase
        .from('releases')
        .update({ file_size: file.size })
        .eq('id', release.id);

      fetchReleases();
    };
    input.click();
  }

  function formatSize(bytes) {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} Mo`;
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-bg via-white to-violet-pale/20">
      {/* Top bar */}
      <header className="gradient-bg shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">ChatKit Admin</h1>
              <p className="text-white/50 text-xs">Gestion des versions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchReleases}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Add button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold gradient-bg shadow-md hover:shadow-lg hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle version
          </button>
        )}

        {/* Upload form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="gradient-bg px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Publier une version
              </h2>
              <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Version *
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 outline-none transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fichier APK *
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".apk"
                    onChange={(e) => setApkFile(e.target.files[0] || null)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-violet-pale file:text-violet-deep file:font-medium file:cursor-pointer"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes de version
                </label>
                <textarea
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  placeholder="Décrivez les changements de cette version..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 outline-none transition-all text-sm resize-none"
                />
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{uploadStep}</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-bg transition-all duration-500 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold gradient-bg hover:opacity-95 transition-all disabled:opacity-60 shadow-md"
                >
                  {uploading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {uploading ? 'Publication...' : 'Publier'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!uploading) setShowForm(false);
                  }}
                  disabled={uploading}
                  className="px-6 py-3 rounded-xl font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Releases list */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 rounded-full border-3 border-violet-pale border-t-violet-accent animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-4">Chargement des versions...</p>
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Package className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Aucune version publiée</p>
            <p className="text-sm text-gray-300 mt-1">Cliquez sur "Nouvelle version" pour commencer</p>
          </div>
        ) : (
          <div className="space-y-4">
            {releases.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-violet-pale flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-violet-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900">v{r.version}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(r.created_at)}
                          </span>
                          <span>{formatSize(r.file_size)}</span>
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {r.download_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleReplaceApk(r)}
                        className="p-2 rounded-lg text-violet-accent hover:bg-violet-pale transition-colors"
                        title="Remplacer l'APK"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(r.id);
                          setEditChangelog(r.changelog || '');
                        }}
                        className="p-2 rounded-lg text-violet-mid hover:bg-violet-pale transition-colors"
                        title="Modifier les notes"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Changelog display / edit */}
                  {editingId === r.id ? (
                    <div className="mt-4 space-y-2">
                      <textarea
                        value={editChangelog}
                        onChange={(e) => setEditChangelog(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-violet-soft/50 focus:border-violet-accent focus:ring-2 focus:ring-violet-accent/20 outline-none transition-all text-sm resize-none"
                        placeholder="Notes de version..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateChangelog(r.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium gradient-bg"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : r.changelog ? (
                    <div className="mt-4 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-violet-soft mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{r.changelog}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
