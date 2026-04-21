# ChatKit Website

Site vitrine pour l'application ChatKit avec téléchargement d'APK et panneau admin.

Les APKs sont hébergés sur **GitHub Releases** (gratuit, jusqu'à 2 Go par fichier).  
Seules les métadonnées (version, taille, changelog) sont stockées dans **Supabase**.

---

## Installation

```bash
cd website
npm install
```

---

## Configuration complète

### Étape 1 — Variables d'environnement

Copier `.env.example` en `.env` :

```bash
cp .env.example .env
```

Remplir avec vos valeurs :

```env
# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon

# GitHub (pour héberger les APKs)
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
VITE_GITHUB_OWNER=votre-username-github
VITE_GITHUB_REPO=flutter_chat_kit
```

---

### Étape 2 — Configuration Supabase

#### 2a. Table `releases`

Dans **Supabase Dashboard → SQL Editor**, exécuter :

```sql
CREATE TABLE releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  changelog TEXT,
  file_name TEXT NOT NULL,       -- contient l'URL GitHub de téléchargement
  file_size BIGINT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON releases
  FOR SELECT USING (true);

CREATE POLICY "Auth insert" ON releases
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Auth update" ON releases
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth delete" ON releases
  FOR DELETE USING (auth.role() = 'authenticated');
```

#### 2b. Compte administrateur

1. **Authentication → Users → Add user → Create new user**
2. Saisir un email et un mot de passe
3. Ces identifiants serviront à se connecter sur `/admin`

---

### Étape 3 — GitHub Personal Access Token

Le token GitHub est utilisé par l'Edge Function pour créer des releases et uploader les APKs.

1. Aller sur [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. **Note** : `ChatKit APK Upload`
3. **Expiration** : selon votre préférence
4. **Scopes** : cocher `public_repo` (repo public) ou `repo` (repo privé)
5. Cliquer **Generate token** et copier le token (`ghp_xxx...`)
6. Le mettre dans `.env` sous `VITE_GITHUB_TOKEN`

> **Sécurité** : le token est aussi configuré comme secret Supabase (voir étape 4)
> pour que l'upload réel se fasse côté serveur sans exposer le token dans le navigateur.

---

### Étape 4 — Déploiement de l'Edge Function Supabase

L'Edge Function agit comme proxy entre le navigateur et GitHub.
Elle reçoit l'APK et le transfère vers GitHub Releases sans bufferiser en mémoire.

#### 4a. Installer le CLI Supabase (Windows)

```powershell
# Télécharger le binaire
Invoke-WebRequest -Uri "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.tar.gz" -OutFile "$env:TEMP\supabase.tar.gz"
tar -xzf "$env:TEMP\supabase.tar.gz" -C "$env:TEMP"
Copy-Item "$env:TEMP\supabase.exe" "$env:USERPROFILE\supabase.exe"
```

#### 4b. Obtenir un token CLI Supabase

1. Aller sur [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
2. **Generate new token** → nommer "ChatKit Deploy"
3. Copier le token (commence par `sbp_`)

#### 4c. Lier le projet et configurer les secrets

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_votre_token_cli"

# Lier le projet (remplacer par votre project-ref)
& "$env:USERPROFILE\supabase.exe" link --project-ref VOTRE_PROJECT_REF

# Configurer les secrets GitHub côté serveur
& "$env:USERPROFILE\supabase.exe" secrets set `
  GITHUB_TOKEN=ghp_votre_token_github `
  GH_OWNER=votre-username-github `
  GH_REPO=flutter_chat_kit `
  --project-ref VOTRE_PROJECT_REF
```

> Le **project-ref** se trouve dans l'URL de votre dashboard Supabase :
> `https://supabase.com/dashboard/project/VOTRE_PROJECT_REF`

#### 4d. Déployer la fonction

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_votre_token_cli"

& "$env:USERPROFILE\supabase.exe" functions deploy upload-release `
  --project-ref VOTRE_PROJECT_REF `
  --no-verify-jwt
```

Le message `Deployed Functions on project ...: upload-release` confirme le succès.
L'avertissement `WARNING: Docker is not running` est normal et peut être ignoré.

#### 4e. Redéploiement après modification

Si vous modifiez `supabase/functions/upload-release/index.ts`, redéployez avec la même commande :

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_votre_token_cli"
& "$env:USERPROFILE\supabase.exe" functions deploy upload-release --project-ref VOTRE_PROJECT_REF --no-verify-jwt
```

---

### Étape 5 — Vérification du flux d'upload

Une fois tout configuré, le flux d'un upload APK est :

```
Navigateur (admin)
  → XHR vers Supabase Edge Function /functions/v1/upload-release?version=X.Y.Z
  → Edge Function crée la GitHub Release via api.github.com
  → Edge Function pipe le corps brut vers uploads.github.com
  → GitHub stocke l'APK et retourne l'URL de téléchargement
  → Edge Function retourne l'URL au navigateur
  → Navigateur enregistre les métadonnées dans la table Supabase `releases`
```

---

## Lancement en développement

```bash
npm run dev
```

- **Page d'accueil** : `http://localhost:3000`
- **Admin** : `http://localhost:3000/admin`

## Build production

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`.
