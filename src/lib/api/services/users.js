import { apiRequest } from '@/lib/api/client';

/**
 * Lista todos os usuários do tenant
 */
export async function listUsers(filters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.email) params.append('email', filters.email);
  
  const query = params.toString();
  return await apiRequest(`/admin/users${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

/**
 * Busca um usuário por ID
 */
export async function getUserById(userId) {
  return await apiRequest(`/admin/users/${userId}`, {
    method: 'GET',
  });
}

/**
 * Cria um novo usuário (ADMIN ou EMPLOYEE)
 */
export async function createUser(data) {
  return await apiRequest('/admin/users', {
    method: 'POST',
    body: data,
  });
}

/**
 * Atualiza um usuário
 */
export async function updateUser(userId, data) {
  return await apiRequest(`/admin/users/${userId}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Deleta um usuário
 */
export async function deleteUser(userId) {
  return await apiRequest(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}


/**
 * Lista usuários por role específico (via filtro de listUsers)
 */
export async function getUsersByRole(role) {
  return await apiRequest(`/admin/users?role=${role}`, {
    method: 'GET',
  });
}

// ============================================
// 🎯 FUNÇÕES ESPECÍFICAS PARA ADMIN/POLÍTICO
// ============================================

/**
 * Cria um novo perfil de político (Admin)
 * @param {Object} data - Dados do político (campos básicos, bio, política, social, etc)
 * @returns {Promise<Object>} Admin criado com user e profile
 */
export async function createAdmin(data) {
  return await apiRequest('/admin/users', {
    method: 'POST',
    body: data,
  });
}

/**
 * Lista todos os admins/políticos do tenant
 */
export async function listAdmins(filters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.cargo) params.append('cargo', filters.cargo);
  if (filters.status) params.append('status', filters.status);

  const query = params.toString();
  return await apiRequest(`/admin/users${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

/**
 * Busca um admin/político por ID (com profile completo)
 */
export async function getAdminById(adminId) {
  return await apiRequest(`/admin/users/${adminId}`, {
    method: 'GET',
  });
}

/**
 * Atualiza perfil de um admin/político
 */
export async function updateAdmin(adminId, data) {
  return await apiRequest(`/admin/users/${adminId}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Deleta um admin/político
 */
export async function deleteAdmin(adminId) {
  return await apiRequest(`/admin/users/${adminId}`, {
    method: 'DELETE',
  });
}

/**
 * Upload de mídias para um admin/político (fotos, logos, vídeo, áudio)
 * @param {string} adminId - ID do admin
 * @param {Object} files - Objeto com os arquivos { fotoPrincipal, fotoBanner, ... }
 * @param {Function} onProgress - Callback para progresso (opcional)
 * @returns {Promise<Object>} URLs das mídias enviadas
 */
export async function uploadAdminMedia(adminId, files, onProgress) {
  const formData = new FormData();
  
  // Adicionar cada arquivo ao FormData (apenas os que existem)
  const fileFields = [
    'fotoPrincipal', 'fotoBanner', 'fotoCorpoInteiro',
    'fotoPerfilEsquerda', 'fotoPerfilDireita', 'fotoEvento',
    'videoTreinamento', 'audioVoz'
  ];
  
  fileFields.forEach(field => {
    if (files[field]) {
      formData.append(field, files[field]);
    }
  });
  
  // Se tiver onProgress, usar XMLHttpRequest para tracking
  if (onProgress && typeof onProgress === 'function') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
      
      // Success
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Erro ao processar resposta do servidor'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || `Erro HTTP ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Erro HTTP ${xhr.status}`));
          }
        }
      });
      
      // Error
      xhr.addEventListener('error', () => {
        reject(new Error('Erro de rede ao fazer upload'));
      });
      
      // Abort
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelado'));
      });
      
      // Get token and send
      import('@/lib/auth/session').then(({ getAccessToken, resolveApiBaseUrl }) => {
        Promise.all([
          getAccessToken(),
          import('../config').then(m => m.resolveApiBaseUrl())
        ]).then(([token, baseUrl]) => {
          const url = `${baseUrl}/admin/users/${adminId}/upload-media`;
          xhr.open('POST', url);
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
          xhr.send(formData);
        });
      });
    });
  }
  
  // Sem tracking de progresso, usar apiRequest normal
  return await apiRequest(`/admin/users/${adminId}/upload-media`, {
    method: 'POST',
    body: formData, // apiRequest detecta FormData automaticamente
  });
}

/**
 * Deleta uma mídia específica de um admin/político (fotos e IA)
 * @param {string} adminId - ID do admin
 * @param {string} mediaType - Tipo da mídia: 'foto', 'video', 'audio'
 * @param {string} mediaKey - Chave da mídia (ex: 'principal', 'banner')
 * @returns {Promise<Object>} Confirmação
 */
export async function deleteAdminMedia(adminId, mediaType, mediaKey) {
  return await apiRequest(`/admin/users/${adminId}/media/${mediaType}/${mediaKey}`, {
    method: 'DELETE',
  });
}

/**
 * Upload de uma logo para o array do político (máx. 20)
 * @param {string} adminId - ID do admin
 * @param {File} file - Arquivo PNG da logo
 * @param {string} nome - Nome/label da logo (opcional)
 * @returns {Promise<Object>} Array atualizado de logos
 */
export async function uploadAdminLogo(adminId, file, nome = '') {
  const formData = new FormData();
  formData.append('file', file);
  if (nome) formData.append('nome', nome);
  return await apiRequest(`/admin/users/${adminId}/upload-logo`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Remove uma logo do array pelo índice
 * @param {string} adminId - ID do admin
 * @param {number} index - Índice no array de logos
 * @returns {Promise<Object>} Array atualizado de logos
 */
export async function deleteAdminLogo(adminId, index) {
  return await apiRequest(`/admin/users/${adminId}/logo/${index}`, {
    method: 'DELETE',
  });
}

