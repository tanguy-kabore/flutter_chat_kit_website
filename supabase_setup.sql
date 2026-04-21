-- ============================================================
-- SUPABASE SETUP: ChatKit Website
-- ============================================================

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
