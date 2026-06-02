/**
 * API Service para Monitoramento de Crise 24/7 (com mock localStorage)
 */

const STORAGE_KEY = 'governai_crisis_incidents';
const KEYWORDS_KEY = 'governai_crisis_keywords';

// Níveis de severidade
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Status de incidente
export const INCIDENT_STATUS = {
  OPEN: 'open',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

// Tipos de crise
export const CRISIS_TYPES = [
  { id: 'protest', name: 'Manifestação', icon: '📢', color: 'warning' },
  { id: 'scandal', name: 'Escândalo', icon: '⚠️', color: 'danger' },
  { id: 'service_failure', name: 'Falha de Serviço', icon: '🔧', color: 'info' },
  { id: 'disaster', name: 'Desastre Natural', icon: '🌪️', color: 'danger' },
  { id: 'violence', name: 'Violência', icon: '🚨', color: 'danger' },
  { id: 'health_crisis', name: 'Crise de Saúde', icon: '🏥', color: 'danger' },
  { id: 'rumors', name: 'Boatos', icon: '💬', color: 'warning' },
  { id: 'other', name: 'Outros', icon: '📋', color: 'secondary' },
];

// Palavras-chave padrão para monitoramento
const defaultKeywords = [
  { word: 'protesto', weight: 3, category: 'protest' },
  { word: 'manifestação', weight: 3, category: 'protest' },
  { word: 'escândalo', weight: 5, category: 'scandal' },
  { word: 'corrupção', weight: 5, category: 'scandal' },
  { word: 'revoltado', weight: 2, category: 'protest' },
  { word: 'indignado', weight: 2, category: 'protest' },
  { word: 'desastre', weight: 4, category: 'disaster' },
  { word: 'emergência', weight: 4, category: 'health_crisis' },
  { word: 'violência', weight: 4, category: 'violence' },
  { word: 'agressão', weight: 4, category: 'violence' },
  { word: 'boato', weight: 2, category: 'rumors' },
  { word: 'fake news', weight: 3, category: 'rumors' },
];

// Incidentes mockados
const initialIncidents = [
  {
    id: '1',
    title: 'Volume anormal de reclamações sobre coleta de lixo',
    description: 'Detectado pico de 250% nas menções sobre falta de coleta de lixo no bairro Centro nas últimas 3 horas.',
    type: 'service_failure',
    severity: SEVERITY_LEVELS.HIGH,
    status: INCIDENT_STATUS.INVESTIGATING,
    affectedArea: 'Centro',
    messagesCount: 87,
    keywords: ['lixo', 'coleta', 'centro', 'ruas sujas'],
    detectedAt: new Date('2026-01-24T08:00:00').toISOString(),
    updatedAt: new Date('2026-01-24T09:30:00').toISOString(),
    assignedTo: 'Secretaria de Limpeza Urbana',
    notes: 'Equipe já foi acionada para verificar a situação.',
  },
  {
    id: '2',
    title: 'Possível manifestação agendada para próxima semana',
    description: 'Detectadas múltiplas menções sobre organização de manifestação no centro da cidade.',
    type: 'protest',
    severity: SEVERITY_LEVELS.MEDIUM,
    status: INCIDENT_STATUS.OPEN,
    affectedArea: 'Centro',
    messagesCount: 43,
    keywords: ['manifestação', 'protesto', 'segunda-feira', 'praça'],
    detectedAt: new Date('2026-01-23T16:00:00').toISOString(),
    updatedAt: new Date('2026-01-23T16:00:00').toISOString(),
    assignedTo: 'Secretaria de Segurança',
    notes: '',
  },
  {
    id: '3',
    title: 'Boatos sobre falta de vacinas resolvido',
    description: 'Circularam boatos sobre falta de vacinas nos postos de saúde. Situação esclarecida com nota oficial.',
    type: 'rumors',
    severity: SEVERITY_LEVELS.LOW,
    status: INCIDENT_STATUS.RESOLVED,
    affectedArea: 'Toda a cidade',
    messagesCount: 156,
    keywords: ['vacina', 'falta', 'posto de saúde'],
    detectedAt: new Date('2026-01-22T10:00:00').toISOString(),
    updatedAt: new Date('2026-01-22T18:00:00').toISOString(),
    resolvedAt: new Date('2026-01-22T18:00:00').toISOString(),
    assignedTo: 'Secretaria de Saúde',
    notes: 'Nota oficial publicada esclarecendo a situação. Estoque de vacinas normalizado.',
  },
];

const initializeIncidents = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialIncidents));
    return initialIncidents;
  }
  return JSON.parse(stored);
};

const initializeKeywords = () => {
  if (typeof window === 'undefined') return defaultKeywords;
  const stored = localStorage.getItem(KEYWORDS_KEY);
  if (!stored) {
    localStorage.setItem(KEYWORDS_KEY, JSON.stringify(defaultKeywords));
    return defaultKeywords;
  }
  return JSON.parse(stored);
};

const saveIncidents = (data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const saveKeywords = (data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYWORDS_KEY, JSON.stringify(data));
};

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const simulateDelay = (ms = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const crisisAPI = {
  /**
   * Lista incidentes
   */
  listIncidents: async (filters = {}) => {
    await simulateDelay();
    let data = initializeIncidents();

    // Filtros
    if (filters.status) {
      data = data.filter(item => item.status === filters.status);
    }
    if (filters.severity) {
      data = data.filter(item => item.severity === filters.severity);
    }
    if (filters.type) {
      data = data.filter(item => item.type === filters.type);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      data = data.filter(item => 
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search)
      );
    }

    // Ordenar por data (mais recente primeiro)
    data.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));

    return {
      success: true,
      data,
      total: data.length,
    };
  },

  /**
   * Obter dashboard de status
   */
  getDashboard: async () => {
    await simulateDelay();
    const incidents = initializeIncidents();

    const total = incidents.length;
    const open = incidents.filter(i => i.status === INCIDENT_STATUS.OPEN).length;
    const investigating = incidents.filter(i => i.status === INCIDENT_STATUS.INVESTIGATING).length;
    const resolved = incidents.filter(i => i.status === INCIDENT_STATUS.RESOLVED).length;

    // Determinar status geral
    let overallStatus = 'normal';
    const critical = incidents.filter(i => 
      i.severity === SEVERITY_LEVELS.CRITICAL && 
      i.status !== INCIDENT_STATUS.RESOLVED
    ).length;
    const high = incidents.filter(i => 
      i.severity === SEVERITY_LEVELS.HIGH && 
      i.status !== INCIDENT_STATUS.RESOLVED
    ).length;

    if (critical > 0) {
      overallStatus = 'critical';
    } else if (high > 1) {
      overallStatus = 'high';
    } else if (high === 1 || investigating > 0) {
      overallStatus = 'attention';
    }

    // Por tipo
    const byType = CRISIS_TYPES.map(type => ({
      type: type.id,
      name: type.name,
      count: incidents.filter(i => i.type === type.id).length,
    })).filter(t => t.count > 0);

    // Últimas 24h
    const last24h = incidents.filter(i => {
      const diff = Date.now() - new Date(i.detectedAt).getTime();
      return diff < 24 * 60 * 60 * 1000;
    }).length;

    return {
      success: true,
      data: {
        overallStatus,
        total,
        open,
        investigating,
        resolved,
        critical,
        high,
        last24h,
        byType,
      },
    };
  },

  /**
   * Criar incidente
   */
  createIncident: async (payload) => {
    await simulateDelay();
    const data = initializeIncidents();

    const newIncident = {
      id: generateId(),
      title: payload.title,
      description: payload.description || '',
      type: payload.type || 'other',
      severity: payload.severity || SEVERITY_LEVELS.MEDIUM,
      status: INCIDENT_STATUS.OPEN,
      affectedArea: payload.affectedArea || '',
      messagesCount: payload.messagesCount || 0,
      keywords: payload.keywords || [],
      detectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: payload.assignedTo || '',
      notes: '',
    };

    data.unshift(newIncident);
    saveIncidents(data);

    return {
      success: true,
      data: newIncident,
    };
  },

  /**
   * Atualizar incidente
   */
  updateIncident: async (id, payload) => {
    await simulateDelay();
    const data = initializeIncidents();
    const index = data.findIndex(i => i.id === id);

    if (index === -1) {
      throw new Error('Incidente não encontrado');
    }

    const updated = {
      ...data[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    if (payload.status === INCIDENT_STATUS.RESOLVED && !updated.resolvedAt) {
      updated.resolvedAt = new Date().toISOString();
    }

    data[index] = updated;
    saveIncidents(data);

    return {
      success: true,
      data: updated,
    };
  },

  /**
   * Lista palavras-chave monitoradas
   */
  listKeywords: async () => {
    await simulateDelay();
    const keywords = initializeKeywords();

    return {
      success: true,
      data: keywords,
    };
  },

  /**
   * Adicionar palavra-chave
   */
  addKeyword: async (payload) => {
    await simulateDelay();
    const keywords = initializeKeywords();

    const newKeyword = {
      word: payload.word.toLowerCase(),
      weight: payload.weight || 1,
      category: payload.category || 'other',
    };

    keywords.push(newKeyword);
    saveKeywords(keywords);

    return {
      success: true,
      data: newKeyword,
    };
  },

  /**
   * Remover palavra-chave
   */
  removeKeyword: async (word) => {
    await simulateDelay();
    let keywords = initializeKeywords();
    keywords = keywords.filter(k => k.word !== word.toLowerCase());
    saveKeywords(keywords);

    return {
      success: true,
    };
  },

  /**
   * Resetar dados
   */
  reset: () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialIncidents));
    localStorage.setItem(KEYWORDS_KEY, JSON.stringify(defaultKeywords));
    return { success: true };
  },
};

export default crisisAPI;

