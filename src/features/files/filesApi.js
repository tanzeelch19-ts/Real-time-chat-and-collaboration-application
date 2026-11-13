import { api } from '@/services/api/client';

export const filesApi = {
  /**
   * Sends the raw bytes. onProgress receives a percentage (0 to 100) while the upload runs.
   */
  async upload(roomId, file, caption = '', onProgress) {
    const { data } = await api.post(`/rooms/${encodeURIComponent(roomId)}/attachments`, file, {
      headers: {
        'Content-Type': file.type,
        'X-File-Name': encodeURIComponent(file.name),
        'X-Caption': encodeURIComponent(caption),
      },
      transformRequest: [(body) => body],
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total));
      },
    });
    return data.message;
  },

  /** Fetches a file through the API so the access token is sent. */
  async downloadBlob(url) {
    const path = url.replace(/^\/api/, '');
    const { data } = await api.get(path, { responseType: 'blob' });
    return data;
  },
};