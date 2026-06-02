/**
 * API Service para Análise de Sentimento (com mock localStorage)
 */

const STORAGE_KEY = 'governai_sentiment_messages';

// Sentimentos possíveis
export const SENTIMENT_TYPES = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
};

// Emoções detectadas
export const EMOTIONS = {
  JOY: 'joy',
  SADNESS: 'sadness',
  ANGER: 'anger',
  FEAR: 'fear',
  SURPRISE: 'surprise',
  DISGUST: 'disgust',
};

// Categorias de tópicos
export const CATEGORIES = [
  { id: 'health', name: 'Saúde', icon: '🏥' },
  { id: 'education', name: 'Educação', icon: '📚' },
  { id: 'security', name: 'Segurança', icon: '🚓' },
  { id: 'infrastructure', name: 'Infraestrutura', icon: '🏗️' },
  { id: 'transport', name: 'Transporte', icon: '🚌' },
  { id: 'environment', name: 'Meio Ambiente', icon: '🌳' },
  { id: 'economy', name: 'Economia', icon: '💰' },
  { id: 'culture', name: 'Cultura', icon: '🎭' },
  { id: 'sports', name: 'Esportes', icon: '⚽' },
  { id: 'other', name: 'Outros', icon: '📋' },
];

// Canais de origem
export const CHANNELS = [
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
  { id: 'web', name: 'Site', icon: '🌐' },
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦' },
  { id: 'email', name: 'E-mail', icon: '📧' },
];

// Mensagens mockadas
const initialData = [
  {
    id: '1',
    message: 'Excelente atendimento! Muito obrigado pela atenção e rapidez.',
    author: 'Maria Silva',
    authorId: 'user_001',
    channel: 'whatsapp',
    category: 'health',
    sentiment: SENTIMENT_TYPES.POSITIVE,
    sentimentScore: 0.95,
    emotions: [EMOTIONS.JOY],
    keywords: ['excelente', 'obrigado', 'atenção', 'rapidez'],
    createdAt: new Date('2026-01-24T10:30:00').toISOString(),
    processed: true,
  },
  {
    id: '2',
    message: 'Péssimo! Faz 3 meses que espero o conserto da rua e nada é feito. Descaso total!',
    author: 'João Santos',
    authorId: 'user_002',
    channel: 'web',
    category: 'infrastructure',
    sentiment: SENTIMENT_TYPES.NEGATIVE,
    sentimentScore: -0.88,
    emotions: [EMOTIONS.ANGER, EMOTIONS.SADNESS],
    keywords: ['péssimo', 'espero', 'nada', 'descaso'],
    createdAt: new Date('2026-01-24T09:15:00').toISOString(),
    processed: true,
  },
  {
    id: '3',
    message: 'Gostaria de saber o horário de funcionamento da secretaria de educação.',
    author: 'Ana Costa',
    authorId: 'user_003',
    channel: 'facebook',
    category: 'education',
    sentiment: SENTIMENT_TYPES.NEUTRAL,
    sentimentScore: 0.05,
    emotions: [],
    keywords: ['horário', 'funcionamento', 'secretaria', 'educação'],
    createdAt: new Date('2026-01-24T08:45:00').toISOString(),
    processed: true,
  },
  {
    id: '4',
    message: 'Parabéns pela nova praça! Ficou linda e as crianças adoraram. Continuem assim!',
    author: 'Pedro Oliveira',
    authorId: 'user_004',
    channel: 'instagram',
    category: 'infrastructure',
    sentiment: SENTIMENT_TYPES.POSITIVE,
    sentimentScore: 0.92,
    emotions: [EMOTIONS.JOY, EMOTIONS.SURPRISE],
    keywords: ['parabéns', 'linda', 'adoraram', 'continuem'],
    createdAt: new Date('2026-01-24T07:20:00').toISOString(),
    processed: true,
  },
  {
    id: '5',
    message: 'Estou com medo de sair na rua à noite. A segurança está cada vez pior.',
    author: 'Carla Ferreira',
    authorId: 'user_005',
    channel: 'twitter',
    category: 'security',
    sentiment: SENTIMENT_TYPES.NEGATIVE,
    sentimentScore: -0.75,
    emotions: [EMOTIONS.FEAR, EMOTIONS.SADNESS],
    keywords: ['medo', 'segurança', 'pior'],
    createdAt: new Date('2026-01-24T06:30:00').toISOString(),
    processed: true,
  },
];

const initializeStorage = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(stored);
};

const saveToStorage = (data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const simulateDelay = (ms = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const sentimentAPI = {
  /**
   * Lista mensagens com análise de sentimento
   */
  list: async (filters = {}) => {
    await simulateDelay();
    let data = initializeStorage();

    // Filtros
    if (filters.sentiment) {
      data = data.filter(item => item.sentiment === filters.sentiment);
    }
    if (filters.channel) {
      data = data.filter(item => item.channel === filters.channel);
    }
    if (filters.category) {
      data = data.filter(item => item.category === filters.category);
    }
    if (filters.dateFrom) {
      data = data.filter(item => new Date(item.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      data = data.filter(item => new Date(item.createdAt) <= new Date(filters.dateTo));
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      data = data.filter(item => 
        item.message.toLowerCase().includes(search) ||
        item.author.toLowerCase().includes(search)
      );
    }

    // Ordenar por data (mais recente primeiro)
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      success: true,
      data,
      total: data.length,
    };
  },

  /**
   * Obter estatísticas de sentimento
   */
  getStats: async (filters = {}) => {
    await simulateDelay();
    const messages = initializeStorage();

    // Aplicar filtros de data se houver
    let filtered = messages;
    if (filters.dateFrom) {
      filtered = filtered.filter(m => new Date(m.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(m => new Date(m.createdAt) <= new Date(filters.dateTo));
    }

    const total = filtered.length;
    const positive = filtered.filter(m => m.sentiment === SENTIMENT_TYPES.POSITIVE).length;
    const neutral = filtered.filter(m => m.sentiment === SENTIMENT_TYPES.NEUTRAL).length;
    const negative = filtered.filter(m => m.sentiment === SENTIMENT_TYPES.NEGATIVE).length;

    // Sentimento médio
    const avgScore = filtered.reduce((sum, m) => sum + m.sentimentScore, 0) / (total || 1);

    // Por categoria
    const byCategory = CATEGORIES.map(cat => ({
      category: cat.id,
      name: cat.name,
      count: filtered.filter(m => m.category === cat.id).length,
    })).filter(c => c.count > 0);

    // Por canal
    const byChannel = CHANNELS.map(ch => ({
      channel: ch.id,
      name: ch.name,
      count: filtered.filter(m => m.channel === ch.id).length,
    })).filter(c => c.count > 0);

    // Palavras mais frequentes
    const allKeywords = filtered.flatMap(m => m.keywords);
    const keywordCounts = {};
    allKeywords.forEach(kw => {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    });
    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    return {
      success: true,
      data: {
        total,
        positive,
        neutral,
        negative,
        positivePercent: ((positive / total) * 100).toFixed(1),
        neutralPercent: ((neutral / total) * 100).toFixed(1),
        negativePercent: ((negative / total) * 100).toFixed(1),
        avgScore: avgScore.toFixed(2),
        byCategory,
        byChannel,
        topKeywords,
      },
    };
  },

  /**
   * Obter timeline de sentimento
   */
  getTimeline: async (days = 7) => {
    await simulateDelay();
    const messages = initializeStorage();
    
    // Agrupar por dia
    const timeline = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayMessages = messages.filter(m => {
        const msgDate = new Date(m.createdAt);
        return msgDate >= date && msgDate < nextDate;
      });
      
      timeline.push({
        date: date.toISOString().split('T')[0],
        total: dayMessages.length,
        positive: dayMessages.filter(m => m.sentiment === SENTIMENT_TYPES.POSITIVE).length,
        neutral: dayMessages.filter(m => m.sentiment === SENTIMENT_TYPES.NEUTRAL).length,
        negative: dayMessages.filter(m => m.sentiment === SENTIMENT_TYPES.NEGATIVE).length,
      });
    }
    
    return {
      success: true,
      data: timeline,
    };
  },

  /**
   * Criar nova mensagem (simulado)
   */
  create: async (payload) => {
    await simulateDelay();
    const data = initializeStorage();

    // Simular análise de sentimento
    const message = payload.message.toLowerCase();
    let sentiment = SENTIMENT_TYPES.NEUTRAL;
    let sentimentScore = 0;
    let emotions = [];

    // Lógica simples de detecção
    const positiveWords = ['excelente', 'ótimo', 'bom', 'parabéns', 'obrigado', 'adorei', 'maravilhoso'];
    const negativeWords = ['péssimo', 'ruim', 'horrível', 'descaso', 'medo', 'revoltado', 'indignado'];
    
    const posCount = positiveWords.filter(w => message.includes(w)).length;
    const negCount = negativeWords.filter(w => message.includes(w)).length;

    if (posCount > negCount) {
      sentiment = SENTIMENT_TYPES.POSITIVE;
      sentimentScore = Math.min(0.9, 0.5 + (posCount * 0.2));
      emotions = [EMOTIONS.JOY];
    } else if (negCount > posCount) {
      sentiment = SENTIMENT_TYPES.NEGATIVE;
      sentimentScore = Math.max(-0.9, -0.5 - (negCount * 0.2));
      emotions = [EMOTIONS.ANGER];
    }

    const newMessage = {
      id: generateId(),
      message: payload.message,
      author: payload.author || 'Anônimo',
      authorId: payload.authorId || 'anonymous',
      channel: payload.channel || 'web',
      category: payload.category || 'other',
      sentiment,
      sentimentScore,
      emotions,
      keywords: payload.message.toLowerCase().split(' ').slice(0, 5),
      createdAt: new Date().toISOString(),
      processed: true,
    };

    data.unshift(newMessage);
    saveToStorage(data);

    return {
      success: true,
      data: newMessage,
    };
  },

  /**
   * Resetar dados
   */
  reset: () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return { success: true };
  },
};

export default sentimentAPI;

