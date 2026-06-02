
import { apiRequest } from '../client';

/**
 * API Service para Studio (Gerador de Avatares)
 */
export const studioAPI = {
  /**
   * Gera avatar a partir de imagens e prompt (suporta até 4 imagens)
   * @param {File[]|File} imageFiles - Arquivos de imagem (PNG, JPG, JPEG, WEBP) - até 4
   * @param {string} prompt - Prompt para geração do avatar
   * @param {string} backgroundType - Tipo de fundo (solid, gradient, blur, transparent)
   * @param {string} backgroundColor - Cor do fundo (hex) ex: #0A3D91
   * @param {string} stylePreset - Estilo (realistic, artistic, professional, cinematic)
   * @param {string} framing - Enquadramento (close, medium, full, wide)
   * @param {string} aspectRatio - Aspect ratio (1:1, 4:3, 16:9, 9:16)
   * @param {string} format - Formato/resolução (1080x1080, 1350x1080, 1920x1080, 1080x1920)
   * @returns {Promise<Object>} Dados da imagem gerada
   */
  generateAvatar: async (
    imageFiles,
    prompt,
    backgroundType,
    backgroundColor,
    stylePreset,
    framing,
    aspectRatio,
    format
  ) => {
    const files = Array.isArray(imageFiles)
      ? imageFiles
      : imageFiles
        ? [imageFiles]
        : [];

    console.log('Gerando avatar:', {
      files: files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
      prompt: prompt ? prompt.substring(0, 50) + '...' : '',
      aspectRatio,
      framing,
      backgroundType,
      backgroundColor,
      stylePreset,
    });

    // Validações locais
    if (!files.length) {
      throw new Error('Arquivo de imagem é obrigatório');
    }

    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt é obrigatório');
    }

    if (!format) {
      throw new Error('Formato é obrigatório');
    }

    if (files.length === 0) {
      throw new Error('Pelo menos uma imagem é obrigatória');
    }

    if (files.length > 4) {
      throw new Error('No máximo 4 imagens');
    }

    // Validar tipo e tamanho de arquivos
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Formato de imagem inválido. Use PNG, JPG, JPEG ou WEBP');
      }
      if (file.size > maxSize) {
        throw new Error('Imagem muito grande. Máximo: 5MB');
      }
    }

    // Criar FormData
    const formData = new FormData();
    
    // Adicionar todas as imagens (suporte para múltiplos arquivos)
    files.forEach((file, index) => {
      console.log(`🔍 [Avatar Debug] Adding file ${index}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
      });
      formData.append('images', file);
    });

    // Adicionar dados do prompt e configurações
    formData.append('prompt', prompt.trim());
    const effectiveBackgroundType = backgroundType || 'solid';
    formData.append('backgroundType', effectiveBackgroundType);
    if (effectiveBackgroundType !== 'transparent' && backgroundColor) {
      formData.append('backgroundColor', backgroundColor);
    }
    formData.append('style', stylePreset || 'realistic');
    formData.append('framing', framing || 'medium');
    formData.append('aspectRatio', aspectRatio || '1:1');
    formData.append('format', format || '1080x1080');

    // Debug FormData
    console.log('🔍 [Avatar Debug] FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    try {
      const response = await apiRequest('/studio/generate-avatar', {
        method: 'POST',
        body: formData,
        // Não definir Content-Type, deixar o browser definir para multipart/form-data
      });

      console.log('Avatar gerado com sucesso:', response);

      return response;
    } catch (error) {
      console.error('Erro ao gerar avatar:', error);
      throw error;
    }
  },

  /**
   * Gera banner com IA
   * @param {string} titulo - Título do banner (obrigatório)
   * @param {string} subtitle - Subtítulo (opcional)
   * @param {string} format - Formato (1080x1080, 1350x1080, etc.)
   * @param {string} size - Tipo (instagram-post, facebook-post, etc.)
   * @param {string} fonte - Fonte (inter, roboto, etc.)
   * @param {string} cordefundo - Cor de fundo (hex ou nome)
   * @param {string} textColor - Cor do texto (hex ou nome)
   * @param {File} bgImage - Imagem de fundo (opcional)
   * @param {File} logo - Logo (opcional)
   * @returns {Promise<Object>} Dados do banner gerado
   */
  generateBanner: async (
    titulo,
    subtitle,
    format,
    size,
    fonte,
    cordefundo,
    textColor,
    bgImage,
    logo
  ) => {
    console.log('🎨 [Banner] Gerando banner:', {
      titulo,
      subtitle,
      format,
      size,
      fonte,
      cordefundo,
      textColor,
      hasBgImage: !!bgImage,
      hasLogo: !!logo,
    });

    // Validações locais
    if (!titulo || !titulo.trim()) {
      throw new Error('Título é obrigatório');
    }

    if (!format) {
      throw new Error('Formato é obrigatório');
    }

    // Criar FormData
    const formData = new FormData();

    // Adicionar imagem (se houver logo ou bgImage, usar o primeiro disponível)
    // O webhook espera "image" como campo único
    if (logo) {
      formData.append('image', logo);
      console.log('🖼️ [Banner] Logo adicionado:', logo.name);
    } else if (bgImage) {
      formData.append('image', bgImage);
      console.log('🖼️ [Banner] BgImage adicionado:', bgImage.name);
    }

    // Adicionar campos obrigatórios
    formData.append('titulo', titulo.trim());
    formData.append('format', format);

    // Adicionar campos opcionais
    if (subtitle && subtitle.trim()) {
      formData.append('subtitle', subtitle.trim());
    }

    // Construir prompt automático
    const prompt = `banner ${size || 'instagram'} ${titulo} ${subtitle || ''}`.trim();
    formData.append('prompt', prompt);

    formData.append('fonte', fonte || 'inter');
    formData.append('cordefundo', cordefundo || '#0066FF');
    
    if (textColor) {
      formData.append('textColor', textColor);
    }
    
    if (size) {
      formData.append('size', size);
    }

    // Debug FormData
    console.log('🔍 [Banner] FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    try {
      const response = await apiRequest('/studio/generate-banner', {
        method: 'POST',
        body: formData,
      });

      console.log('✅ [Banner] Banner gerado com sucesso:', response);

      return response;
    } catch (error) {
      console.error('❌ [Banner] Erro ao gerar banner:', error);
      throw error;
    }
  },

  /**
   * Gera vídeo com IA
   * @param {File} image - Imagem/foto do avatar (opcional)
   * @param {string} script - Roteiro do vídeo (obrigatório)
   * @param {number} duration - Duração em segundos (padrão: 5)
   * @param {string} aspect_ratio - Proporção (auto, 16:9, 9:16, 1:1)
   * @param {number} seed - Seed para geração (padrão: 70)
   * @returns {Promise<Object>} Dados do vídeo gerado
   */
  generateVideo: async (image, script, duration, aspect_ratio, seed) => {
    console.log('🎬 [Video] Gerando vídeo:', {
      hasImage: !!image,
      scriptLength: script?.length,
      duration,
      aspect_ratio,
      seed,
    });

    // Validações locais
    if (!script || !script.trim()) {
      throw new Error('Script é obrigatório');
    }

    const wordCount = script.trim().split(/\s+/).length;
    if (wordCount < 10) {
      throw new Error('O script deve ter pelo menos 10 palavras');
    }

    // Criar FormData
    const formData = new FormData();

    // Adicionar imagem (opcional)
    if (image) {
      formData.append('image', image);
      console.log('🖼️ [Video] Imagem adicionada:', image.name);
    }

    // Adicionar campos obrigatórios
    formData.append('script', script.trim());
    formData.append('duration', String(duration || 5));
    formData.append('aspect_ratio', aspect_ratio || 'auto');
    formData.append('seed', String(seed || 70));

    // Debug FormData
    console.log('🔍 [Video] FormData entries:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    try {
      const response = await apiRequest('/studio/generate-video', {
        method: 'POST',
        body: formData,
      });

      console.log('✅ [Video] Vídeo gerado com sucesso:', response);

      return response;
    } catch (error) {
      console.error('❌ [Video] Erro ao gerar vídeo:', error);
      throw error;
    }
  },

  /**
   * Formatos disponíveis para geração de avatar
   */
  getAvailableFormats: () => {
    return [
      {
        value: '1080x1080',
        label: '1080x1080 (Quadrado)',
        description: 'Instagram Post',
      },
      {
        value: '1350x1080',
        label: '1350x1080 (Retrato)',
        description: 'Portrait',
      },
      {
        value: '1920x1080',
        label: '1920x1080 (Paisagem)',
        description: 'YouTube Thumbnail',
      },
      {
        value: '1080x1920',
        label: '1080x1920 (Stories)',
        description: 'Instagram/TikTok Stories',
      },
    ];
  },

  /**
   * Gera imagem a partir de um prompt usando IA
   * @param {string} prompt - Descrição da imagem
   * @param {string} style - Estilo da imagem (realistic, artistic, 3d, illustration, anime, cartoon)
   * @param {string} size - Tamanho (1024x1024, 1024x1792, 1792x1024)
   * @param {number} variations - Número de variações (1-4)
   * @returns {Promise<Object>} Dados da imagem gerada
   */
  /**
   * Gera imagem a partir de um prompt usando IA
   * @param {string} prompt
   * @param {string} style
   * @param {string} size
   * @param {number} variations
   * @param {File|File[]|null} referenceImages - até 6 imagens de referência
   */
  generateImage: async (prompt, style = 'realistic', size = '1024x1024', variations = 1, referenceImages = null, sizeId = null) => {
    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt é obrigatório');
    }

    if (variations < 1 || variations > 4) {
      throw new Error('Variações deve ser entre 1 e 4');
    }

    // Normalizar para array
    const files = referenceImages
      ? (Array.isArray(referenceImages) ? referenceImages : [referenceImages]).filter(Boolean)
      : [];

    if (files.length > 6) {
      throw new Error('Máximo de 6 imagens de referência');
    }

    try {
      let body;

      if (files.length > 0) {
        // Envia como multipart/form-data com a imagem de referência
        const formData = new FormData();
        formData.append('image', files[0]); // campo singular, 1 imagem
        formData.append('prompt', prompt.trim());
        formData.append('style', style);
        formData.append('size', size);
        if (sizeId) formData.append('size_id', sizeId);
        formData.append('variations', String(variations));
        body = formData;
      } else {
        // Envia como JSON quando não há imagens
        body = { prompt: prompt.trim(), style, size, ...(sizeId ? { size_id: sizeId } : {}), variations };
      }

      const response = await apiRequest('/studio/generate-image', {
        method: 'POST',
        body,
      });

      return response;
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      throw error;
    }
  },
};

export default studioAPI;
