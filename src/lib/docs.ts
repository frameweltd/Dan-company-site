export const BUCKET = 'client-documents';
export const MAX_FILES = 5;
export const MAX_BYTES = 10 * 1024 * 1024;
export const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
};
export const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.docx,.xlsx';
export const PATH_RE = /^[0-9a-f-]{36}\/[0-4]-[A-Za-z0-9._-]{1,80}$/;

export const safeName = (n: string) => n.normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(-80) || 'file';
export const displayName = (path: string) => (path.split('/').pop() ?? path).replace(/^\d-/, '');
export const size = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
