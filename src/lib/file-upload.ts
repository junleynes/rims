/**
 * Upload a file to local server storage.
 * Returns the relative file path stored in the DB.
 */
export async function uploadFile(
  file: File,
  folder: 'knowledge-base' | 'budget-attachments' | 'avatars' = 'budget-attachments'
): Promise<{ filePath: string; fileName: string; fileType: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? 'Upload failed');
  }

  return res.json();
}

/**
 * Delete a file from local server storage.
 */
export async function deleteFile(filePath: string): Promise<void> {
  await fetch(`/api/files/${filePath}`, { method: 'DELETE' });
}

/**
 * Get the URL to view/download a stored file.
 * All files go through /api/files/... which verifies session first.
 */
export function getFileUrl(filePath: string): string {
  if (!filePath) return '';
  // Already a full URL or base64 data URI (legacy) — return as-is
  if (filePath.startsWith('http') || filePath.startsWith('data:')) return filePath;
  return `/api/files/${filePath}`;
}

/**
 * Returns true if this looks like a legacy base64 data URI
 */
export function isLegacyBase64(value: string): boolean {
  return value.startsWith('data:');
}
