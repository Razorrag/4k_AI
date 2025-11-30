/**
 * Upload hook - handles image upload to backend
 */

import { useState } from 'react';
import { uploadImage } from '../api/client';
import type { UploadResponse } from '../types/index';

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File): Promise<UploadResponse | null> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 50MB.');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Supported: JPEG, PNG, WebP');
      }

      setProgress(25);
      const result = await uploadImage(file);
      setProgress(100);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploading(false);
    setError(null);
    setProgress(0);
  };

  return {
    upload,
    uploading,
    error,
    progress,
    reset,
  };
}
