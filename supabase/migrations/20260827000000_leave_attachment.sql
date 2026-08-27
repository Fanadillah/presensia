-- Fase 11 Opsi C: surat sakit foto opsional
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS attachment_public_id text;
CREATE INDEX IF NOT EXISTS idx_leave_attachment ON public.leave_requests(attachment_public_id) WHERE attachment_public_id IS NOT NULL;
