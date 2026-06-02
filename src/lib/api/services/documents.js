import { apiRequest } from '../client';
import { getAccessToken } from '@/lib/auth/session';

/**
 * API Service para Documents
 */
export const documentsAPI = {
  /**
   * Upload de documento
   * @param {File} file - Arquivo a ser enviado
   * @param {Object} metadata - Metadados do documento
   * @param {Function} onProgress - Callback para progresso (opcional)
   * @returns {Promise<Object>} Documento criado
   */
  upload: async (file, metadata, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    
    formData.append('category', metadata.category);
    
    if (metadata.tags && metadata.tags.length > 0) {
      formData.append('tags', metadata.tags.join(','));
    }
    
    if (metadata.isFavorite !== undefined) {
      formData.append('isFavorite', metadata.isFavorite.toString());
    }

    return apiRequest('/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Não definir Content-Type, o browser define automaticamente para multipart/form-data
      },
      onUploadProgress: onProgress,
    });
  },

  /**
   * Lista documentos com filtros
   * @param {Object} filters - Filtros de listagem
   * @returns {Promise<Object>} Lista de documentos
   */
  list: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.isFavorite !== undefined) params.append('isFavorite', filters.isFavorite.toString());
    if (filters.mimeType) params.append('mimeType', filters.mimeType);
    if (filters.uploadedBy) params.append('uploadedBy', filters.uploadedBy);
    if (filters.uploadedAfter) params.append('uploadedAfter', filters.uploadedAfter);
    if (filters.uploadedBefore) params.append('uploadedBefore', filters.uploadedBefore);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return apiRequest(`/documents?${params.toString()}`);
  },

  /**
   * Obtém um documento por ID
   * @param {string} id - ID do documento
   * @returns {Promise<Object>} Documento
   */
  get: async (id) => {
    return apiRequest(`/documents/${id}`);
  },

  /**
   * Atualiza metadados de um documento
   * @param {string} id - ID do documento
   * @param {Object} data - Dados a atualizar
   * @returns {Promise<Object>} Documento atualizado
   */
  update: async (id, data) => {
    return apiRequest(`/documents/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * Deleta um documento (soft delete)
   * @param {string} id - ID do documento
   * @returns {Promise<Object>} Mensagem de sucesso
   */
  delete: async (id) => {
    return apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Deleta permanentemente um documento
   * @param {string} id - ID do documento
   * @returns {Promise<Object>} Mensagem de sucesso
   */
  permanentlyDelete: async (id) => {
    return apiRequest(`/documents/${id}/permanent`, {
      method: 'DELETE',
    });
  },

  /**
   * Obtém URL de download temporária
   * @param {string} id - ID do documento
   * @returns {Promise<{url: string}>} URL de download
   */
  getDownloadUrl: async (id) => {
    return apiRequest(`/documents/${id}/download-url`);
  },

  /**
   * Faz download de um documento
   * @param {string} id - ID do documento
   * @returns {Promise<void>} Inicia o download
   */
  download: async (id) => {
    try {
      console.log('📥 Iniciando download do documento:', id);
      
      const token = getAccessToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }
      
      console.log('✅ Token encontrado:', token.substring(0, 20) + '...');

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = `${baseUrl}/documents/${id}/download`;
      
      console.log('📥 URL de download:', url);
      
      // Usar fetch para fazer download
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro ao baixar arquivo: ${response.status} ${response.statusText}`);
      }

      // Obter nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'documento-download';
      
      if (contentDisposition) {
        console.log('📥 Content-Disposition:', contentDisposition);
        
        // Tentar extrair filename de diferentes formatos
        // Suporta: filename="file.pdf", filename*=UTF-8''file.pdf
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)/);
        const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
        
        if (filenameStarMatch && filenameStarMatch[1]) {
          fileName = decodeURIComponent(filenameStarMatch[1]);
        } else if (filenameMatch && filenameMatch[1]) {
          fileName = decodeURIComponent(filenameMatch[1]);
        }
      }

      // Mapeamento de MIME types para extensões (fallback caso não tenha extensão)
      const mimeToExtension = {
        'application/pdf': 'pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/msword': 'doc',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/zip': 'zip',
        'application/x-rar-compressed': 'rar',
        'text/plain': 'txt',
        'text/csv': 'csv',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
      };

      // Adicionar extensão apenas se o arquivo não tiver uma
      if (!fileName.includes('.')) {
        const contentType = response.headers.get('Content-Type');
        if (contentType) {
          const ext = mimeToExtension[contentType] || contentType.split('/')[1]?.split('.')[0];
          if (ext) {
            fileName += `.${ext}`;
          }
        }
      }

      console.log('📥 Nome do arquivo final:', fileName);

      // Criar blob e fazer download
      const blob = await response.blob();
      console.log('📥 Tamanho do blob:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        console.log('✅ Download concluído!');
      }, 100);

    } catch (error) {
      console.error('❌ Erro ao fazer download:', error);
      throw error;
    }
  },

  /**
   * Obtém URL de streaming para áudio/vídeo
   * @param {string} id - ID do documento
   * @returns {string} URL de streaming
   */
  getStreamUrl: (id) => {
    const token = getAccessToken();
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/documents/${id}/stream?token=${token}`;
  },

  /**
   * Marca/desmarca documento como favorito
   * @param {string} id - ID do documento
   * @param {boolean} isFavorite - Se é favorito ou não
   * @returns {Promise<Object>} Documento atualizado
   */
  toggleFavorite: async (id, isFavorite) => {
    return documentsAPI.update(id, { isFavorite });
  },

  /**
   * Filtra documentos por tipo de arquivo
   * @param {string} type - Tipo (video, audio, image, application)
   * @returns {Promise<Object>} Lista de documentos
   */
  filterByType: async (type, page = 1, limit = 20) => {
    return documentsAPI.list({
      mimeType: type,
      page,
      limit,
    });
  },
};

export default documentsAPI;

