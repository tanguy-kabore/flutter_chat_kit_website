-- ============================================================
-- SUPABASE SETUP: ChatKit Website
-- ============================================================

-- 0. EXTENSIONS
-- -------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLE releases
-- -----------------
CREATE TABLE IF NOT EXISTS releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  changelog TEXT,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- Supprimer et recréer les policies (évite les conflits)
DO $$
BEGIN
  -- SELECT
  BEGIN
    DROP POLICY "Public read releases" ON releases;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Public read releases" ON releases
    FOR SELECT USING (true);

  -- INSERT
  BEGIN
    DROP POLICY "Authenticated insert releases" ON releases;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Authenticated insert releases" ON releases
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

  -- UPDATE
  BEGIN
    DROP POLICY "Authenticated update releases" ON releases;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Authenticated update releases" ON releases
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

  -- DELETE
  BEGIN
    DROP POLICY "Authenticated delete releases" ON releases;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Authenticated delete releases" ON releases
    FOR DELETE USING (auth.role() = 'authenticated');
END $$;

-- 2. BUCKET & STORAGE POLICIES
-- ----------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('apk-releases', 'apk-releases', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  -- SELECT (public download)
  BEGIN
    DROP POLICY "Public download APK" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Public download APK" ON storage.objects
    FOR SELECT USING (bucket_id = 'apk-releases');

  -- INSERT
  BEGIN
    DROP POLICY "Admin upload APK" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Admin upload APK" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'apk-releases' AND auth.role() = 'authenticated'
    );

  -- UPDATE
  BEGIN
    DROP POLICY "Admin update APK" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Admin update APK" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'apk-releases' AND auth.role() = 'authenticated'
    );

  -- DELETE
  BEGIN
    DROP POLICY "Admin delete APK" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Admin delete APK" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'apk-releases' AND auth.role() = 'authenticated'
    );
END $$;

-- 3. TABLE bug_reports
-- --------------------
CREATE TABLE IF NOT EXISTS bug_reports (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Reporter info (optional)
  name        TEXT,
  email       TEXT,
  device      TEXT,
  app_version TEXT,
  -- Classification
  category    TEXT,
  severity    TEXT NOT NULL DEFAULT 'medium'
                CHECK (severity IN ('low','medium','high','critical')),
  -- Content
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  steps       TEXT,
  -- Workflow
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','in_progress','resolved','closed')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bug_reports_updated_at ON bug_reports;
CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Anyone can submit a bug report (anon)
  BEGIN
    DROP POLICY "Public insert bug_reports" ON bug_reports;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Public insert bug_reports" ON bug_reports
    FOR INSERT WITH CHECK (true);

  -- Only authenticated admins can read/update/delete
  BEGIN
    DROP POLICY "Admin read bug_reports" ON bug_reports;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Admin read bug_reports" ON bug_reports
    FOR SELECT USING (auth.role() = 'authenticated');

  BEGIN
    DROP POLICY "Admin update bug_reports" ON bug_reports;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Admin update bug_reports" ON bug_reports
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

  BEGIN
    DROP POLICY "Admin delete bug_reports" ON bug_reports;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Admin delete bug_reports" ON bug_reports
    FOR DELETE USING (auth.role() = 'authenticated');
END $$;

-- 4. BUCKET bug-media (public read, anon upload, admin delete)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-media', 'bug-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  BEGIN
    DROP POLICY "Public read bug media" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Public read bug media" ON storage.objects
    FOR SELECT USING (bucket_id = 'bug-media');

  BEGIN
    DROP POLICY "Anon upload bug media" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Anon upload bug media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'bug-media');

  BEGIN
    DROP POLICY "Admin delete bug media" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  CREATE POLICY "Admin delete bug media" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'bug-media' AND auth.role() = 'authenticated'
    );
END $$;
