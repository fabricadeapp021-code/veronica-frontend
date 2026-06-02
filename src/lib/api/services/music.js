import { apiRequest } from '../client';

/**
 * API Service para Music - VERSÃO MELHORADA COM CONTROLE DE DURAÇÃO
 * 
 * ESTRATÉGIA PARA CONTROLAR DURAÇÃO:
 * 1. Usar METATAGS [30 second song] no prompt
 * 2. Definir estrutura musical explícita [Intro][Chorus][Outro]
 * 3. Colocar duração também no campo 'style' (tem mais peso!)
 * 4. Simplificar prompt (menos texto = mais foco na duração)
 * 5. Aumentar styleWeight para 85% (mais fiel ao style que contém duração)
 * 6. Reduzir weirdnessConstraint para 30% (menos criativo = mais preciso)
 */
export const musicAPI = {
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

  waitForCompletion: async (taskId, onProgress = null, options = {}) => {
    const { interval = 5000, maxAttempts = 60 } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`⏳ Polling status (tentativa ${attempt}/${maxAttempts})...`);

      const status = await musicAPI.getStatus(taskId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'SUCCESS') {
        console.log('✅ Música gerada com sucesso!');
        return status;
      }

      if (status.status === 'FAILED') {
        console.error('❌ Falha na geração:', status.errorMessage);
        throw new Error(status.errorMessage || 'Falha na geração da música');
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('Timeout: A geração da música demorou mais que o esperado');
  },

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
   * NOVA ESTRATÉGIA DE PROMPT PARA CONTROLAR DURAÇÃO
   * 
   * Baseado em testes e documentação do Suno AI:
   * - Metatags [tag] têm ALTO peso na geração
   * - Estrutura musical explícita funciona MELHOR que descrição textual
   * - Campo 'style' tem MAIS peso que o 'prompt'
   * - Prompt CURTO e FOCADO funciona melhor
   */
  buildMusicDto: (formData) => {
    const { prompt, style, tone, voiceType, duration } = formData;

    // ========================================================================
    // ESTILOS BRASILEIROS - COM DESCRIÇÕES DETALHADAS
    // ========================================================================
    // IMPORTANTE: Piseiro é um subgênero do Forró (eletrônico/moderno)
    // Todos os estilos são BRASILEIROS e POPULARES - sem metal, rock pesado!
    // ========================================================================
    const styleMap = {
      'pop-brasileiro': 'Brazilian Pop, melodic, light instruments, acoustic guitar, soft percussion',
      'sertanejo': 'Sertanejo, Brazilian Country, accordion, viola caipira, romantic, acoustic',
      'forro': 'Forró, Brazilian Folk, accordion, zabumba, triangle, traditional northeastern rhythm',
      'funk': 'Brazilian Funk, funk carioca, electronic beats, bass-heavy, dance rhythm',
      'samba': 'Samba, Brazilian percussion, surdo, tamborim, cavaquinho, festive rhythm',
      'pagode': 'Pagode, samba variation, banjo, tantã, hand claps, relaxed groove',
      'piseiro': 'Piseiro, electronic forró, synthesizer, zabumba eletrônica, modern northeastern beat',
      'rap': 'Brazilian Rap, hip-hop brasileiro, urban poetry, rhythmic vocals',
      'axe': 'Axé, Bahia carnival music, brass section, afro-brazilian percussion, festive',
      'mpb': 'MPB, Brazilian Popular Music, sophisticated melodies, acoustic arrangements'
    };

    const toneMap = {
      'animado': 'upbeat',
      'emocional': 'emotional',
      'energetico': 'energetic',
      'calmo': 'calm'
    };

    const voiceMap = {
      'masculina': 'male vocals',
      'feminina': 'female vocals',
      'coro': 'choir vocals'
    };

    // ========================================================================
    // ESTRUTURAS MUSICAIS POR DURAÇÃO
    // ========================================================================
    // Cada duração tem:
    // - metatags: Tags que a Suno entende nativamente
    // - structure: Estrutura musical explícita (FUNCIONA MUITO BEM!)
    // - styleKeywords: Palavras-chave para o campo 'style'
    // ========================================================================
    const durationConfigs = {
      '30s': {
        metatags: '[30 second song][short song][quick jingle][flash]',
        structure: `[Intro: 3 seconds]
[Chorus: 24 seconds]
[Outro: 3 seconds]`,
        styleKeywords: '30 seconds, short, quick, jingle, flash',
        instruction: 'Ultra-short 30-second jingle with just one repeated chorus.'
      },
      '45s': {
        metatags: '[45 second song][compact song][medium jingle]',
        structure: `[Intro: 4 seconds]
[Verse: 12 seconds]
[Chorus: 25 seconds]
[Outro: 4 seconds]`,
        styleKeywords: '45 seconds, compact, medium length, jingle',
        instruction: 'Compact 45-second jingle with one short verse and chorus.'
      },
      '60s': {
        metatags: '[60 second song][one minute][standard jingle]',
        structure: `[Intro: 5 seconds]
[Verse: 15 seconds]
[Chorus: 20 seconds]
[Bridge: 8 seconds]
[Chorus: 12 seconds]
[Outro: 5 seconds]`,
        styleKeywords: '60 seconds, one minute, standard length, jingle',
        instruction: 'Standard 60-second jingle with verse, chorus, bridge, and final chorus.'
      }
    };

    const config = durationConfigs[duration];
    const styleText = styleMap[style];
    const toneText = toneMap[tone];
    const voiceText = voiceMap[voiceType];

    // ========================================================================
    // CONSTRUIR PROMPT OTIMIZADO
    // ========================================================================
    // FORMATO:
    // 1. METATAGS (duração + tipo)
    // 2. Descrição musical concisa
    // 3. Conteúdo (prompt do usuário - CURTO!)
    // 4. Estrutura musical EXPLÍCITA (isso é CRÍTICO!)
    // ========================================================================
    
    const cleanPrompt = prompt
      .substring(0, 150) // Limitar para focar na duração
      .trim();

    const finalPrompt = `${config.metatags}

${styleText}, ${toneText}, ${voiceText}. ${config.instruction}

${cleanPrompt}

${config.structure}`;

    // ========================================================================
    // CAMPO 'STYLE' COM DURAÇÃO EMBUTIDA
    // Este campo tem MAIS PESO que o prompt na geração!
    // ========================================================================
    const styleWithDuration = `${styleText}, ${config.styleKeywords}, ${toneText}, political jingle`;

    // Mapear tipo de voz para gênero
    let vocalGender = undefined;
    if (voiceType === 'masculina') vocalGender = 'm';
    else if (voiceType === 'feminina') vocalGender = 'f';

    console.log('');
    console.log('🎵 ═══════════════════════════════════════════════════════');
    console.log('🎵 PROMPT OTIMIZADO PARA CONTROLE DE DURAÇÃO');
    console.log('🎵 ═══════════════════════════════════════════════════════');
    console.log('📏 Duração solicitada:', duration);
    console.log('🎨 Style (com duração):', styleWithDuration);
    console.log('📝 Prompt final:\n', finalPrompt);
    console.log('🎵 ═══════════════════════════════════════════════════════');
    console.log('');

    return {
      // Modo automático (IA cria tudo)
      customMode: false,
      instrumental: false,
      
      // Modelo V5 (mais recente)
      model: 'V5',
      
      // PROMPT com metatags + estrutura explícita
      prompt: finalPrompt,
      
      // STYLE com duração embutida (ALTO peso!)
      style: styleWithDuration,
      
      // Gênero vocal
      vocalGender,
      
      // PARÂMETROS OTIMIZADOS PARA PRECISÃO:
      styleWeight: 0.85,              // AUMENTADO: 85% fidelidade (inclui duração!)
      weirdnessConstraint: 0.25,      // REDUZIDO: 25% criatividade (mais conservador)
      
      // ====================================================================
      // NEGATIVE TAGS: Evitar TUDO que não seja brasileiro popular
      // ====================================================================
      // 1. Evitar músicas longas
      // 2. Evitar estilos PESADOS (metal, rock pesado, screaming)
      // 3. Evitar estilos AGRESSIVOS (death metal, hardcore, heavy metal)
      // 4. Garantir que seja APENAS estilos brasileiros populares
      // ====================================================================
      negativeTags: 'metal, heavy metal, death metal, black metal, thrash metal, hardcore, metalcore, screamo, screaming, harsh vocals, growling, aggressive, distorted guitar, heavy guitar, electric guitar solo, rock pesado, hard rock, punk rock, grunge, long song, extended mix, epic, 3 minutes, 4 minutes, 5 minutes, full length, album version, extended version, progressive, long intro, long outro, drum solo',
    };
  },
};

export default musicAPI;
