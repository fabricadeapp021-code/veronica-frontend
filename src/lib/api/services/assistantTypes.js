/**
 * API Service para Tipos de Assistentes (com mock localStorage)
 */

// Chave do localStorage
const STORAGE_KEY = 'governai_assistant_types';

// Dados iniciais mockados
const initialData = [
  {
    id: '1',
    name: 'Assistente Agenda',
    description: 'Assistente especializado em gerenciar agendas e compromissos',
    tools: ['google_calendar', 'google_email'],
    webhookType: 'multiple', // 'unique' ou 'multiple'
    status: 'active', // 'active' ou 'inactive'
    createdAt: new Date('2026-01-20').toISOString(),
    updatedAt: new Date('2026-01-20').toISOString(),
  },
  {
    id: '2',
    name: 'Assistente Email',
    description: 'Assistente para gerenciar emails e notificações',
    tools: ['google_email'],
    webhookType: 'unique',
    status: 'active',
    createdAt: new Date('2026-01-21').toISOString(),
    updatedAt: new Date('2026-01-21').toISOString(),
  },
  {
    id: '3',
    name: 'Assistente Completo',
    description: 'Assistente com acesso a todas as ferramentas Google',
    tools: ['google_calendar', 'google_email', 'google_drive', 'google_docs', 'google_sheets'],
    webhookType: 'multiple',
    status: 'active',
    createdAt: new Date('2026-01-22').toISOString(),
    updatedAt: new Date('2026-01-22').toISOString(),
  },
];

// Ferramentas disponíveis
export const AVAILABLE_TOOLS = [
  { id: 'google_calendar', name: 'Google Calendar', icon: '📅', category: 'google' },
  { id: 'google_email', name: 'Google Email (Gmail)', icon: '📧', category: 'google' },
  { id: 'google_drive', name: 'Google Drive', icon: '💾', category: 'google' },
  { id: 'google_docs', name: 'Google Docs', icon: '📄', category: 'google' },
  { id: 'google_sheets', name: 'Google Sheets', icon: '📊', category: 'google' },
  { id: 'google_meet', name: 'Google Meet', icon: '🎥', category: 'google' },
  { id: 'google_contacts', name: 'Google Contacts', icon: '👥', category: 'google' },
  { id: 'google_tasks', name: 'Google Tasks', icon: '✅', category: 'google' },
];

// Tipos de webhook
export const WEBHOOK_TYPES = [
  { value: 'unique', label: 'Único', description: 'Um webhook para todas as requisições' },
  { value: 'multiple', label: 'Múltiplo', description: 'Um webhook por ferramenta/evento' },
];

/**
 * Inicializa o localStorage com dados mockados
 */
const initializeStorage = () => {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(stored);
};

/**
 * Salva dados no localStorage
 */
const saveToStorage = (data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

/**
 * Gera ID único
 */
const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

/**
 * Simula delay de API
 */
const simulateDelay = (ms = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const assistantTypesAPI = {
  /**
   * Lista todos os tipos de assistentes
   * @param {Object} filters - Filtros (status, search)
   * @returns {Promise<Object>} Lista de tipos
   */
  list: async (filters = {}) => {
    await simulateDelay();
    
    let data = initializeStorage();
    
    // Aplicar filtros
    if (filters.status) {
      data = data.filter(item => item.status === filters.status);
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      data = data.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search)
      );
    }
    
    // Ordenar por data de atualização (mais recente primeiro)
    data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    return {
      success: true,
      data,
      total: data.length,
    };
  },

  /**
   * Obtém um tipo de assistente por ID
   * @param {string} id - ID do tipo
   * @returns {Promise<Object>} Tipo de assistente
   */
  get: async (id) => {
    await simulateDelay();
    
    const data = initializeStorage();
    const item = data.find(item => item.id === id);
    
    if (!item) {
      throw new Error('Tipo de assistente não encontrado');
    }
    
    return {
      success: true,
      data: item,
    };
  },

  /**
   * Cria um novo tipo de assistente
   * @param {Object} payload - Dados do tipo
   * @returns {Promise<Object>} Tipo criado
   */
  create: async (payload) => {
    await simulateDelay();
    
    const data = initializeStorage();
    
    // Validações
    if (!payload.name || !payload.name.trim()) {
      throw new Error('Nome é obrigatório');
    }
    
    if (!payload.tools || payload.tools.length === 0) {
      throw new Error('Selecione pelo menos uma ferramenta');
    }
    
    // Verificar se já existe um tipo com esse nome
    if (data.some(item => item.name.toLowerCase() === payload.name.trim().toLowerCase())) {
      throw new Error('Já existe um tipo de assistente com este nome');
    }
    
    const newItem = {
      id: generateId(),
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      tools: payload.tools || [],
      webhookType: payload.webhookType || 'unique',
      status: payload.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    data.push(newItem);
    saveToStorage(data);
    
    return {
      success: true,
      data: newItem,
      message: 'Tipo de assistente criado com sucesso!',
    };
  },

  /**
   * Atualiza um tipo de assistente
   * @param {string} id - ID do tipo
   * @param {Object} payload - Dados a atualizar
   * @returns {Promise<Object>} Tipo atualizado
   */
  update: async (id, payload) => {
    await simulateDelay();
    
    const data = initializeStorage();
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error('Tipo de assistente não encontrado');
    }
    
    // Validações
    if (payload.name && !payload.name.trim()) {
      throw new Error('Nome não pode ser vazio');
    }
    
    if (payload.tools && payload.tools.length === 0) {
      throw new Error('Selecione pelo menos uma ferramenta');
    }
    
    // Verificar duplicidade de nome (exceto o próprio)
    if (payload.name) {
      const nameExists = data.some(
        item => item.id !== id && 
        item.name.toLowerCase() === payload.name.trim().toLowerCase()
      );
      if (nameExists) {
        throw new Error('Já existe um tipo de assistente com este nome');
      }
    }
    
    // Atualizar
    const updatedItem = {
      ...data[index],
      ...payload,
      name: payload.name?.trim() || data[index].name,
      description: payload.description?.trim() !== undefined ? payload.description.trim() : data[index].description,
      updatedAt: new Date().toISOString(),
    };
    
    data[index] = updatedItem;
    saveToStorage(data);
    
    return {
      success: true,
      data: updatedItem,
      message: 'Tipo de assistente atualizado com sucesso!',
    };
  },

  /**
   * Deleta um tipo de assistente
   * @param {string} id - ID do tipo
   * @returns {Promise<Object>} Mensagem de sucesso
   */
  delete: async (id) => {
    await simulateDelay();
    
    const data = initializeStorage();
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error('Tipo de assistente não encontrado');
    }
    
    data.splice(index, 1);
    saveToStorage(data);
    
    return {
      success: true,
      message: 'Tipo de assistente deletado com sucesso!',
    };
  },

  /**
   * Duplica um tipo de assistente
   * @param {string} id - ID do tipo a duplicar
   * @returns {Promise<Object>} Novo tipo criado
   */
  duplicate: async (id) => {
    await simulateDelay();
    
    const data = initializeStorage();
    const original = data.find(item => item.id === id);
    
    if (!original) {
      throw new Error('Tipo de assistente não encontrado');
    }
    
    // Criar cópia com novo nome
    let newName = `${original.name} (Cópia)`;
    let counter = 1;
    
    // Garantir nome único
    while (data.some(item => item.name === newName)) {
      counter++;
      newName = `${original.name} (Cópia ${counter})`;
    }
    
    const newItem = {
      ...original,
      id: generateId(),
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    data.push(newItem);
    saveToStorage(data);
    
    return {
      success: true,
      data: newItem,
      message: 'Tipo de assistente duplicado com sucesso!',
    };
  },

  /**
   * Alterna o status de um tipo de assistente
   * @param {string} id - ID do tipo
   * @returns {Promise<Object>} Tipo atualizado
   */
  toggleStatus: async (id) => {
    await simulateDelay();
    
    const data = initializeStorage();
    const index = data.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error('Tipo de assistente não encontrado');
    }
    
    data[index].status = data[index].status === 'active' ? 'inactive' : 'active';
    data[index].updatedAt = new Date().toISOString();
    
    saveToStorage(data);
    
    return {
      success: true,
      data: data[index],
      message: `Tipo ${data[index].status === 'active' ? 'ativado' : 'desativado'} com sucesso!`,
    };
  },

  /**
   * Limpa todos os dados (apenas para desenvolvimento)
   */
  clearAll: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    return { success: true, message: 'Todos os dados foram removidos' };
  },

  /**
   * Reseta para dados iniciais
   */
  reset: () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return { success: true, message: 'Dados resetados para o padrão' };
  },
};

export default assistantTypesAPI;

