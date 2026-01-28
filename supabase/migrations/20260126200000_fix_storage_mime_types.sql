-- Supprimer les anciennes politiques du bucket documents si elles existent
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_policy" ON storage.objects;

-- Créer le bucket documents s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

-- Politique pour permettre l'upload (INSERT) - authentifié ou service role
CREATE POLICY "documents_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Politique pour lecture publique (SELECT)
CREATE POLICY "documents_public_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Politique pour suppression - authentifié ou propriétaire
CREATE POLICY "documents_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Politique pour update
CREATE POLICY "documents_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');
