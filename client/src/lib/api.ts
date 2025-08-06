const getApiBaseUrl = () => {
  // Use network IP if accessed via network, otherwise localhost
  const hostname = window.location.hostname;
  if (hostname === '192.168.1.71') {
    return 'http://192.168.1.71:3001/api';
  }
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

export const api = {
  // Upload file
  async uploadFile(file: File): Promise<{ success: boolean; message: string; file?: any }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      return result;
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  },

  // Get list of uploaded files
  async getUploadedFiles(): Promise<{ success: boolean; files?: any[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/files`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to get files');
      }

      return result;
    } catch (error) {
      console.error('Get files error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get files'
      };
    }
  }
}; 