/**
 * API Service para Pesquisa de Intenção de Voto (com mock localStorage)
 */

const SURVEYS_KEY = 'governai_vote_surveys';
const RESPONSES_KEY = 'governai_vote_responses';

// Status da pesquisa
export const SURVEY_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
};

// Tipos de pesquisa
export const SURVEY_TYPES = {
  SPONTANEOUS: 'spontaneous', // Espontânea
  STIMULATED: 'stimulated',   // Estimulada
  REJECTION: 'rejection',     // Rejeição
  APPROVAL: 'approval',       // Aprovação
};

// Dados demográficos
export const DEMOGRAPHICS = {
  AGE_RANGES: [
    { id: '16-24', label: '16-24 anos' },
    { id: '25-34', label: '25-34 anos' },
    { id: '35-44', label: '35-44 anos' },
    { id: '45-59', label: '45-59 anos' },
    { id: '60+', label: '60+ anos' },
  ],
  GENDERS: [
    { id: 'male', label: 'Masculino' },
    { id: 'female', label: 'Feminino' },
    { id: 'other', label: 'Outro' },
  ],
  REGIONS: [
    { id: 'north', label: 'Zona Norte' },
    { id: 'south', label: 'Zona Sul' },
    { id: 'east', label: 'Zona Leste' },
    { id: 'west', label: 'Zona Oeste' },
    { id: 'center', label: 'Centro' },
  ],
  EDUCATION: [
    { id: 'fundamental', label: 'Fundamental' },
    { id: 'medio', label: 'Médio' },
    { id: 'superior', label: 'Superior' },
    { id: 'pos', label: 'Pós-graduação' },
  ],
};

// Candidatos mockados
export const CANDIDATES = [
  { 
    id: 'cand_1', 
    name: 'João Silva', 
    party: 'PMDB',
    number: '15',
    color: '#0066cc',
    photo: '/img/avatar1.jpg',
  },
  { 
    id: 'cand_2', 
    name: 'Maria Santos', 
    party: 'PSDB',
    number: '45',
    color: '#0088ff',
    photo: '/img/avatar2.jpg',
  },
  { 
    id: 'cand_3', 
    name: 'Pedro Costa', 
    party: 'PT',
    number: '13',
    color: '#cc0000',
    photo: '/img/avatar3.jpg',
  },
  { 
    id: 'cand_4', 
    name: 'Ana Oliveira', 
    party: 'PDT',
    number: '12',
    color: '#cc6600',
    photo: '/img/avatar4.jpg',
  },
];

// Pesquisas mockadas
const initialSurveys = [
  {
    id: 'survey_1',
    title: 'Pesquisa Eleitoral - Janeiro 2026',
    description: 'Pesquisa de intenção de voto para prefeito',
    type: SURVEY_TYPES.STIMULATED,
    status: SURVEY_STATUS.ACTIVE,
    candidates: ['cand_1', 'cand_2', 'cand_3', 'cand_4'],
    sampleSize: 1000,
    marginError: 3.1,
    confidenceLevel: 95,
    startDate: new Date('2026-01-20').toISOString(),
    endDate: new Date('2026-01-27').toISOString(),
    createdAt: new Date('2026-01-20').toISOString(),
    updatedAt: new Date('2026-01-24').toISOString(),
  },
  {
    id: 'survey_2',
    title: 'Avaliação de Governo - Dezembro 2025',
    description: 'Pesquisa de aprovação do governo municipal',
    type: SURVEY_TYPES.APPROVAL,
    status: SURVEY_STATUS.CLOSED,
    candidates: [],
    sampleSize: 800,
    marginError: 3.5,
    confidenceLevel: 95,
    startDate: new Date('2025-12-15').toISOString(),
    endDate: new Date('2025-12-22').toISOString(),
    createdAt: new Date('2025-12-15').toISOString(),
    updatedAt: new Date('2025-12-22').toISOString(),
  },
];

// Respostas mockadas para survey_1
const initialResponses = [
  // Candidato 1 - João Silva: 32%
  ...Array(320).fill(null).map((_, i) => ({
    id: `resp_1_${i}`,
    surveyId: 'survey_1',
    candidateId: 'cand_1',
    respondentAge: DEMOGRAPHICS.AGE_RANGES[Math.floor(Math.random() * 5)].id,
    respondentGender: DEMOGRAPHICS.GENDERS[Math.floor(Math.random() * 2)].id,
    respondentRegion: DEMOGRAPHICS.REGIONS[Math.floor(Math.random() * 5)].id,
    respondentEducation: DEMOGRAPHICS.EDUCATION[Math.floor(Math.random() * 4)].id,
    createdAt: new Date(2026, 0, 20 + Math.floor(Math.random() * 4)).toISOString(),
  })),
  // Candidato 2 - Maria Santos: 28%
  ...Array(280).fill(null).map((_, i) => ({
    id: `resp_2_${i}`,
    surveyId: 'survey_1',
    candidateId: 'cand_2',
    respondentAge: DEMOGRAPHICS.AGE_RANGES[Math.floor(Math.random() * 5)].id,
    respondentGender: DEMOGRAPHICS.GENDERS[Math.floor(Math.random() * 2)].id,
    respondentRegion: DEMOGRAPHICS.REGIONS[Math.floor(Math.random() * 5)].id,
    respondentEducation: DEMOGRAPHICS.EDUCATION[Math.floor(Math.random() * 4)].id,
    createdAt: new Date(2026, 0, 20 + Math.floor(Math.random() * 4)).toISOString(),
  })),
  // Candidato 3 - Pedro Costa: 22%
  ...Array(220).fill(null).map((_, i) => ({
    id: `resp_3_${i}`,
    surveyId: 'survey_1',
    candidateId: 'cand_3',
    respondentAge: DEMOGRAPHICS.AGE_RANGES[Math.floor(Math.random() * 5)].id,
    respondentGender: DEMOGRAPHICS.GENDERS[Math.floor(Math.random() * 2)].id,
    respondentRegion: DEMOGRAPHICS.REGIONS[Math.floor(Math.random() * 5)].id,
    respondentEducation: DEMOGRAPHICS.EDUCATION[Math.floor(Math.random() * 4)].id,
    createdAt: new Date(2026, 0, 20 + Math.floor(Math.random() * 4)).toISOString(),
  })),
  // Candidato 4 - Ana Oliveira: 12%
  ...Array(120).fill(null).map((_, i) => ({
    id: `resp_4_${i}`,
    surveyId: 'survey_1',
    candidateId: 'cand_4',
    respondentAge: DEMOGRAPHICS.AGE_RANGES[Math.floor(Math.random() * 5)].id,
    respondentGender: DEMOGRAPHICS.GENDERS[Math.floor(Math.random() * 2)].id,
    respondentRegion: DEMOGRAPHICS.REGIONS[Math.floor(Math.random() * 5)].id,
    respondentEducation: DEMOGRAPHICS.EDUCATION[Math.floor(Math.random() * 4)].id,
    createdAt: new Date(2026, 0, 20 + Math.floor(Math.random() * 4)).toISOString(),
  })),
  // Brancos/Nulos/Indecisos: 6%
  ...Array(60).fill(null).map((_, i) => ({
    id: `resp_5_${i}`,
    surveyId: 'survey_1',
    candidateId: 'blank',
    respondentAge: DEMOGRAPHICS.AGE_RANGES[Math.floor(Math.random() * 5)].id,
    respondentGender: DEMOGRAPHICS.GENDERS[Math.floor(Math.random() * 2)].id,
    respondentRegion: DEMOGRAPHICS.REGIONS[Math.floor(Math.random() * 5)].id,
    respondentEducation: DEMOGRAPHICS.EDUCATION[Math.floor(Math.random() * 4)].id,
    createdAt: new Date(2026, 0, 20 + Math.floor(Math.random() * 4)).toISOString(),
  })),
];

const initializeSurveys = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(SURVEYS_KEY);
  if (!stored) {
    localStorage.setItem(SURVEYS_KEY, JSON.stringify(initialSurveys));
    return initialSurveys;
  }
  return JSON.parse(stored);
};

const initializeResponses = () => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(RESPONSES_KEY);
  if (!stored) {
    localStorage.setItem(RESPONSES_KEY, JSON.stringify(initialResponses));
    return initialResponses;
  }
  return JSON.parse(stored);
};

const saveSurveys = (data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SURVEYS_KEY, JSON.stringify(data));
};

const saveResponses = (data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(data));
};

const generateId = () => {
  return 'survey_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

const simulateDelay = (ms = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const voteSurveyAPI = {
  /**
   * Lista pesquisas
   */
  listSurveys: async (filters = {}) => {
    await simulateDelay();
    let data = initializeSurveys();

    if (filters.status) {
      data = data.filter(s => s.status === filters.status);
    }
    if (filters.type) {
      data = data.filter(s => s.type === filters.type);
    }

    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      success: true,
      data,
      total: data.length,
    };
  },

  /**
   * Obter pesquisa por ID
   */
  getSurvey: async (id) => {
    await simulateDelay();
    const surveys = initializeSurveys();
    const survey = surveys.find(s => s.id === id);

    if (!survey) {
      throw new Error('Pesquisa não encontrada');
    }

    return {
      success: true,
      data: survey,
    };
  },

  /**
   * Obter resultados da pesquisa
   */
  getResults: async (surveyId) => {
    await simulateDelay();
    const responses = initializeResponses().filter(r => r.surveyId === surveyId);
    const survey = initializeSurveys().find(s => s.id === surveyId);

    if (!survey) {
      throw new Error('Pesquisa não encontrada');
    }

    const total = responses.length;
    
    // Por candidato
    const byCandidateMap = {};
    responses.forEach(r => {
      if (!byCandidateMap[r.candidateId]) {
        byCandidateMap[r.candidateId] = 0;
      }
      byCandidateMap[r.candidateId]++;
    });

    const byCandidate = Object.entries(byCandidateMap).map(([candidateId, count]) => {
      const candidate = CANDIDATES.find(c => c.id === candidateId);
      return {
        candidateId,
        candidateName: candidate ? candidate.name : 'Brancos/Nulos',
        party: candidate ? candidate.party : '',
        count,
        percentage: ((count / total) * 100).toFixed(1),
      };
    }).sort((a, b) => b.count - a.count);

    // Por faixa etária
    const byAge = DEMOGRAPHICS.AGE_RANGES.map(age => ({
      age: age.id,
      label: age.label,
      count: responses.filter(r => r.respondentAge === age.id).length,
    }));

    // Por gênero
    const byGender = DEMOGRAPHICS.GENDERS.map(gender => ({
      gender: gender.id,
      label: gender.label,
      count: responses.filter(r => r.respondentGender === gender.id).length,
    }));

    // Por região
    const byRegion = DEMOGRAPHICS.REGIONS.map(region => ({
      region: region.id,
      label: region.label,
      count: responses.filter(r => r.respondentRegion === region.id).length,
    }));

    return {
      success: true,
      data: {
        total,
        byCandidate,
        byAge,
        byGender,
        byRegion,
        marginError: survey.marginError,
        confidenceLevel: survey.confidenceLevel,
      },
    };
  },

  /**
   * Criar pesquisa
   */
  createSurvey: async (payload) => {
    await simulateDelay();
    const surveys = initializeSurveys();

    if (!payload.title) {
      throw new Error('Título é obrigatório');
    }

    const newSurvey = {
      id: generateId(),
      title: payload.title,
      description: payload.description || '',
      type: payload.type || SURVEY_TYPES.STIMULATED,
      status: SURVEY_STATUS.DRAFT,
      candidates: payload.candidates || [],
      sampleSize: payload.sampleSize || 1000,
      marginError: payload.marginError || 3.1,
      confidenceLevel: payload.confidenceLevel || 95,
      startDate: payload.startDate || new Date().toISOString(),
      endDate: payload.endDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    surveys.unshift(newSurvey);
    saveSurveys(surveys);

    return {
      success: true,
      data: newSurvey,
      message: 'Pesquisa criada com sucesso!',
    };
  },

  /**
   * Atualizar pesquisa
   */
  updateSurvey: async (id, payload) => {
    await simulateDelay();
    const surveys = initializeSurveys();
    const index = surveys.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error('Pesquisa não encontrada');
    }

    const updated = {
      ...surveys[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    surveys[index] = updated;
    saveSurveys(surveys);

    return {
      success: true,
      data: updated,
      message: 'Pesquisa atualizada com sucesso!',
    };
  },

  /**
   * Deletar pesquisa
   */
  deleteSurvey: async (id) => {
    await simulateDelay();
    let surveys = initializeSurveys();
    surveys = surveys.filter(s => s.id !== id);
    saveSurveys(surveys);

    // Deletar respostas também
    let responses = initializeResponses();
    responses = responses.filter(r => r.surveyId !== id);
    saveResponses(responses);

    return {
      success: true,
      message: 'Pesquisa deletada com sucesso!',
    };
  },

  /**
   * Resetar dados
   */
  reset: () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SURVEYS_KEY, JSON.stringify(initialSurveys));
    localStorage.setItem(RESPONSES_KEY, JSON.stringify(initialResponses));
    return { success: true };
  },
};

export default voteSurveyAPI;

