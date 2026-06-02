import { apiRequest } from '../client';

/**
 * API Service para Music (Gerador de Jingles com Suno AI)
 */
export const musicAPI = {
  /**
   * Gera música/jingle com IA
   * @param {Object} dto - Dados da música
   * @param {string} dto.prompt - Descrição/letras da música
   * @param {boolean} dto.customMode - Modo customizado (false = auto-gerar letras)
   * @param {boolean} dto.instrumental - Apenas instrumental (sem vocais)
   * @param {string} dto.model - Modelo de IA (V4, V4_5, V4_5ALL, V5)
   * @param {string} [dto.style] - Estilo musical (obrigatório se customMode=true)
   * @param {string} [dto.title] - Título da música (obrigatório se customMode=true)
   * @param {string} [dto.vocalGender] - Gênero vocal ('m' ou 'f')
   * @returns {Promise<Object>} { success: true, taskId: string, message: string }
   */
  generateMusic: async (dto) => {
    console.log('Gerando música:', {
      prompt: dto.prompt?.substring(0, 100) + '...',
      model: dto.model,
      customMode: dto.customMode,
      instrumental: dto.instrumental,
    });

    try {
      const response = await apiRequest('/music/generate', {
        method: 'POST',
        body: dto,
      });

      console.log('Música iniciada:', response);
      return response;
    } catch (error) {
      console.error('Erro ao gerar música:', error);
      throw error;
    }
  },

  /**
   * Consulta status de uma geração de música
   * @param {string} taskId - ID da task retornado por generateMusic()
   * @returns {Promise<Object>} { success: true, taskId: string, status: string, tracks: Array }
   */
  getStatus: async (taskId) => {
    try {
      const response = await apiRequest(`/music/status/${taskId}`, {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Erro ao consultar status:', error);
      throw error;
    }
  },

  /**
   * Aguarda até a música ser gerada (polling)
   * @param {string} taskId - ID da task
   * @param {Function} onProgress - Callback chamado a cada poll com o status
   * @param {Object} options - Opções de polling
   * @param {number} [options.interval=5000] - Intervalo entre polls (ms)
   * @param {number} [options.maxAttempts=60] - Máximo de tentativas
   * @returns {Promise<Object>} Status final com tracks
   */
  waitForCompletion: async (taskId, onProgress = null, options = {}) => {
    const { interval = 5000, maxAttempts = 60 } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`⏳ Polling status (tentativa ${attempt}/${maxAttempts})...`);

      const status = await musicAPI.getStatus(taskId);

      // Callback de progresso
      if (onProgress) {
        onProgress(status);
      }

      // Estados finais
      if (status.status === 'SUCCESS') {
        console.log('✅ Música gerada com sucesso!');
        return status;
      }

      if (status.status === 'FAILED') {
        console.error('❌ Falha na geração:', status.errorMessage);
        throw new Error(status.errorMessage || 'Falha na geração da música');
      }

      // Aguardar antes da próxima tentativa
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('Timeout: A geração da música demorou mais que o esperado');
  },

  /**
   * Consulta créditos disponíveis
   * @returns {Promise<Object>} { success: true, credits: number, status: string }
   */
  getCredits: async () => {
    try {
      const response = await apiRequest('/music/credits', {
        method: 'GET',
      });

      return response;
    } catch (error) {
      console.error('Erro ao consultar créditos:', error);
      throw error;
    }
  },

  /**
   * Gera letras com IA
   * @param {Object} dto - Dados para geração de letras
   * @param {string} dto.prompt - Tema/descrição das letras
   * @returns {Promise<Object>} { success: true, taskId: string }
   */
  generateLyrics: async (dto) => {
    try {
      const response = await apiRequest('/music/lyrics', {
        method: 'POST',
        body: dto,
      });

      return response;
    } catch (error) {
      console.error('Erro ao gerar letras:', error);
      throw error;
    }
  },

  /**
   * Mapeia valores do formulário UI para DTO da API
   * @param {Object} formData - Dados do formulário
   * @returns {Object} DTO para API
   */
  buildMusicDto: (formData) => {
    const { prompt, style, tone, voiceType, duration } = formData;

    // Mapear estilo para texto legível
    const styleLabels = {
      'pop-brasileiro': 'pop brasileiro',
      'sertanejo': 'sertanejo',
      'forro': 'forró',
      'funk': 'funk brasileiro',
      'samba': 'samba',
      'pagode': 'pagode',
      'piseiro': 'piseiro',
      'rap': 'rap',
      'axe': 'axé',
      'mpb': 'mpb'
    };

    const toneLabels = {
      'animado': 'animado e positivo',
      'emocional': 'emocional e inspirador',
      'energetico': 'energético e motivador',
      'calmo': 'calmo e confiante'
    };

    const voiceLabels = {
      'masculina': 'voz masculina',
      'feminina': 'voz feminina',
      'coro': 'coro'
    };

    // Mapear duração para instruções SUPER ENFÁTICAS com estrutura específica
    const durationInstructions = {
      '30s': {
        prefix: '⏱️ DURAÇÃO OBRIGATÓRIA: 30 SEGUNDOS! MÁXIMO 30s!',
        structure: 'Estrutura: intro 3s + refrão 12s + refrão repetido 12s + outro 3s = 30s TOTAL',
        emphasis: 'IMPERATIVO: NÃO EXCEDA 30 SEGUNDOS! Música ultra-curta! SEM versos longos! APENAS refrão repetido 2x!'
      },
      '45s': {
        prefix: '⏱️ DURAÇÃO OBRIGATÓRIA: 45 SEGUNDOS! MÁXIMO 45s!',
        structure: 'Estrutura: intro 4s + verso 10s + refrão 15s + refrão 12s + outro 4s = 45s TOTAL',
        emphasis: 'IMPERATIVO: NÃO EXCEDA 45 SEGUNDOS! Música compacta! 1 verso curto + 1 refrão repetido!'
      },
      '60s': {
        prefix: '⏱️ DURAÇÃO OBRIGATÓRIA: 60 SEGUNDOS! MÁXIMO 60s!',
        structure: 'Estrutura: intro 5s + verso 12s + refrão 18s + ponte 8s + refrão 12s + outro 5s = 60s TOTAL',
        emphasis: 'IMPERATIVO: NÃO EXCEDA 60 SEGUNDOS! 1 minuto EXATO! Estrutura simples: verso + refrão + ponte + refrão!'
      }
    };

    const durationConfig = durationInstructions[duration];
    const durationText = duration.replace('s', ' segundos');
    
    // Formato: DURAÇÃO no início + estrutura + características + prompt + DURAÇÃO no final
    // Usar múltiplas menções de tempo em diferentes formatos
    const enrichedPrompt = `${durationConfig.prefix} ${durationConfig.structure} ${styleLabels[style]} ${toneLabels[tone]} ${voiceLabels[voiceType]}. ${prompt}. ${durationConfig.emphasis} TEMPO MÁXIMO: ${durationText}!`.substring(0, 490);

    // Mapear tipo de voz para gênero vocal
    let vocalGender = undefined;
    if (voiceType === 'masculina') vocalGender = 'm';
    else if (voiceType === 'feminina') vocalGender = 'f';
    // 'coro' = undefined (deixa Suno decidir mix de vozes)

    console.log('🎵 Prompt final:', enrichedPrompt);
    console.log('📏 Tamanho:', enrichedPrompt.length, 'caracteres');

    return {
      // Modo automático: IA cria TUDO (letra, melodia, arranjo)
      customMode: false,
      instrumental: false,
      
      // Modelo mais recente e expressivo
      model: 'V5',
      
      // Prompt conciso (máximo 500 chars) com duração no início
      prompt: enrichedPrompt,
      
      // Gênero vocal
      vocalGender,
      
      // Parâmetros de qualidade e controle
      styleWeight: 0.70,              // 70% fidelidade ao estilo
      weirdnessConstraint: 0.45,      // 45% criatividade (conservador para jingles)
      negativeTags: 'Heavy Metal, Death Metal, Screaming, Harsh Vocals, Long Songs, Extended Version, Full Length, Epic, Progressive, Instrumental Solo, Long Intro, Long Outro', // Evitar estilos agressivos e músicas longas
    };
  },
};

export default musicAPI;
