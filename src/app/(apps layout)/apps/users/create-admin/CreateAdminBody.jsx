'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Col, Container, Form, Nav, Row, Tab, Alert, Badge, Card, Accordion, ProgressBar, Dropdown } from 'react-bootstrap';
import { ArrowLeft, Save, User, Image as ImageIcon, FileText, Target, Globe, Bot, Video, Mic, Play, StopCircle, Trash2, Copy, Check as CheckIcon, Upload, List, ChevronDown, Eye, EyeOff } from 'react-feather';
import { useAuth } from '@/lib/auth/AuthProvider';
import { createAdmin, uploadAdminMedia, uploadAdminLogo, deleteAdminLogo, getAdminById, updateAdmin, listUsers, listAdmins, deleteAdminMedia } from '@/lib/api/services/users';
import { getTenantSettings } from '@/lib/api/services/tenant';
import { showCustomAlert } from '@/components/CustomAlert';

const CreateAdminBody = ({ mode = 'create', adminId = null }) => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const isEditMode = mode === 'edit' && adminId;
  
  // CSS para animação de pulso
  const pulseStyle = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .rich-text-editor:empty:before {
      content: attr(data-placeholder);
      color: #6c757d;
      pointer-events: none;
    }

    .rich-text-editor ul,
    .rich-text-editor ol {
      margin-bottom: 0;
      padding-left: 1.25rem;
    }

    .rich-text-editor ul {
      list-style: disc !important;
      list-style-position: outside;
    }

    .rich-text-editor ol {
      list-style: decimal !important;
      list-style-position: outside;
    }

    .rich-toolbar-btn {
      min-width: 40px;
      height: 32px;
      padding: 0 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      border-radius: 4px;
      border: none !important;
      box-shadow: none !important;
      background: transparent !important;
      color: #6c757d !important;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .rich-toolbar-btn:hover,
    .rich-toolbar-btn:focus,
    .rich-toolbar-btn:active,
    .rich-toolbar-btn.show {
      background: rgba(108, 117, 125, 0.12) !important;
      color: #495057 !important;
    }

    .rich-toolbar-toggle::after {
      display: none !important;
    }

    .rich-toolbar-group {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 2px;
      background: #fff;
    }
  `;
  
  // States do formulário
  const [formData, setFormData] = useState({
    // Tab 1 - Básico
    nomeCompleto: '',
    nomePolitico: '',
    email: '',
    senha: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    cargo: '',
    status: 'candidato',
    territorio: '',
    partido: '',
    anoEleicao: '',
    numeroCandidato: '',
    coligacao: '',

    // Dados TSE
    sqCandidatoTSE: '',
    uf: '',
    municipio: '',
    siglaPartido: '',
    numeroPartido: '',
    
    // Tab 2 - Visual
    fotoPrincipal: null,
    fotoBanner: null,
    fotoCorpoInteiro: null,
    fotoPerfilEsquerda: null,
    fotoPerfilDireita: null,
    fotoEvento: null,
    corPrimaria: '#1a73e8',
    corSecundaria: '#34a853',
    slogan: '',
    
    // Tab 3 - Bio
    bioShort: '',
    bioFull: '',
    formacao: '',
    experiencia: '',
    realizacoes: '',
    
    // Tab 4 - Política
    ideologia: '',
    areasFoco: '',
    valores: '',
    manifesto: '',
    propostas: '',
    posicionamentos: {
      educacao: '',
      saude: '',
      economia: '',
      seguranca: '',
      meioAmbiente: '',
      infraestrutura: '',
      outros: ''
    },
    
    // Tab 5 - Social
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: '',
    linkedin: '',
    threads: '',
    emailCampanha: '',
    telefoneGabinete: '',
    enderecoComite: '',
    
    // Tab 6 - IA
    videoTreinamento: null,
    audioVoz: null
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedScript, setSelectedScript] = useState('medio');
  const [showCopied, setShowCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');
  const [uploadProgress, setUploadProgress] = useState(0);
  const richTextRefs = useRef({});
  const [existingMedia, setExistingMedia] = useState({
    videoTreinamento: null,
    audioVoz: null,
    logos: [],
  });
  const [pendingLogos, setPendingLogos] = useState([]); // { file, previewUrl, nome } — modo criação
  const [logoUploading, setLogoUploading] = useState(false);
  const additionalPhotoPlaceholders = {
    fotoPerfilEsquerda: '/img/placeholders/admin/Perfil-3.png',
    fotoPerfilDireita: '/img/placeholders/admin/Perfil-2.png',
    fotoEvento: '/img/placeholders/admin/Perfil-1.png',
  };
  const [currentStep, setCurrentStep] = useState(''); // 'creating', 'uploading', 'complete'

  const escapeHtml = (value = '') =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const formatErrorHtml = (message = '') => {
    const normalizedMessage = String(message || '').trim();
    const [, details = ''] = normalizedMessage.split(':');
    const errorItems = details
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean);
    const requiredItems = errorItems
      .filter((item) => item.toLowerCase().includes('é obrigatório'))
      .map((item) => item.replace(/\s*é obrigatório\s*$/i, '').trim())
      .filter(Boolean);

    if (!normalizedMessage.includes('Corrija os erros na etapa') || errorItems.length === 0) {
      return `<p style="margin: 0; text-align: left;">${escapeHtml(normalizedMessage)}</p>`;
    }

    const listItems = (requiredItems.length > 0 ? requiredItems : errorItems)
      .map((item) => `<li style="margin-bottom: 6px;">${escapeHtml(item)}</li>`)
      .join('');

    return `
      <div style="text-align: left;">
        <p style="margin-bottom: 12px;">Algumas informações obrigatórias não foram preenchidas.</p>
        <p style="margin-bottom: 12px;">Os campos necessário estão destacados no formulário.</p>
        <ul style="margin: 0; padding-left: 24px; list-style-type: disc; list-style-position: outside;">
          ${listItems}
        </ul>
      </div>
    `;
  };

  const isRequiredFieldsError = (message = '') =>
    String(message || '').includes('Corrija os erros na etapa');
  
  const isOwner = currentUser?.role === 'owner';
  const canEditParty = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  // Pré-preencher partido a partir das configurações do tenant (apenas no modo criação)
  useEffect(() => {
    const loadPartyFromTenant = async () => {
      if (isEditMode || !currentUser?.tenantId) return;
      try {
        const response = await getTenantSettings(currentUser.tenantId);
        const partyName = response?.organization?.partyName;
        if (partyName) {
          setFormData(prev => ({ ...prev, partido: partyName }));
        }
      } catch {
        // silencioso — campo fica vazio e o usuário preenche manualmente
      }
    };
    loadPartyFromTenant();
  }, [isEditMode, currentUser?.tenantId]);

  // Carregar dados do político no modo edição
  useEffect(() => {
    const loadAdminData = async () => {
      if (!isEditMode) return;
      
      setLoadingData(true);
      setError('');
      
      try {
        const response = await getAdminById(adminId);
        
        if (!response?.data) {
          throw new Error('Resposta inválida do servidor');
        }
        
        const admin = response.data;
        
        if (!admin.profile) {
          throw new Error('Perfil de político não encontrado');
        }
        
        const profile = admin.profile;
        const user = admin.user || admin; // Fallback para caso user não venha separado
        
        // Preencher formData com dados existentes
        setFormData({
          // Dados básicos
          nomeCompleto: profile.nomeCompleto || '',
          nomePolitico: profile.nomePolitico || '',
          email: user.email || admin.email || '',
          senha: '', // Não carregar senha por segurança
          cpf: profile.cpf || '',
          dataNascimento: profile.dataNascimento || '',
          telefone: profile.telefone || '',
          cargo: profile.cargo || '',
          status: profile.status || 'candidato',
          territorio: profile.territorio || '',
          partido: profile.partido || 'Sigla - Nome do Partido',
          anoEleicao: profile.anoEleicao || '',
          numeroCandidato: profile.numeroCandidato || '',
          coligacao: profile.coligacao || '',

          // Dados TSE
          sqCandidatoTSE: profile.sqCandidatoTSE || '',
          uf: profile.uf || '',
          municipio: profile.municipio || '',
          siglaPartido: profile.siglaPartido || '',
          numeroPartido: profile.numeroPartido || '',
          
          // Visual (URLs das mídias, não arquivos)
          fotoPrincipal: null, // Manter null, URLs serão mostradas separadamente
          fotoBanner: null,
          fotoCorpoInteiro: null,
          fotoPerfilEsquerda: null,
          fotoPerfilDireita: null,
          fotoEvento: null,
          corPrimaria: profile.cores?.primaria || '#1a73e8',
          corSecundaria: profile.cores?.secundaria || '#34a853',
          slogan: profile.slogan || '',
          
          // Bio
          bioShort: profile.bioShort || '',
          bioFull: profile.bioFull || '',
          formacao: profile.formacao || '',
          experiencia: profile.experiencia || '',
          realizacoes: profile.realizacoes || '',
          
          // Política
          ideologia: profile.ideologia || '',
          areasFoco: profile.areasFoco || '',
          valores: profile.valores || '',
          manifesto: profile.manifesto || '',
          propostas: profile.propostas || '',
          posicionamentos: {
            educacao: profile.posicionamentos?.educacao || '',
            saude: profile.posicionamentos?.saude || '',
            economia: profile.posicionamentos?.economia || '',
            seguranca: profile.posicionamentos?.seguranca || '',
            meioAmbiente: profile.posicionamentos?.meioAmbiente || '',
            infraestrutura: profile.posicionamentos?.infraestrutura || '',
            outros: profile.posicionamentos?.outros || ''
          },
          
          // Social
          website: profile.social?.website || '',
          facebook: profile.social?.facebook || '',
          instagram: profile.social?.instagram || '',
          twitter: profile.social?.twitter || '',
          youtube: profile.social?.youtube || '',
          tiktok: profile.social?.tiktok || '',
          linkedin: profile.social?.linkedin || '',
          threads: profile.social?.threads || '',
          emailCampanha: profile.social?.emailCampanha || '',
          telefoneGabinete: profile.social?.telefoneGabinete || '',
          enderecoComite: profile.social?.enderecoComite || '',
          
          // IA (URLs, não arquivos)
          videoTreinamento: null,
          audioVoz: null
        });
        
        
        // Armazenar URLs existentes de mídia para exibir
        // Fotos
        if (profile.media?.fotos?.principal) {
          setExistingMedia(prev => ({
            ...prev,
            fotoPrincipal: profile.media.fotos.principal
          }));
        }
        if (profile.media?.fotos?.banner) {
          setExistingMedia(prev => ({
            ...prev,
            fotoBanner: profile.media.fotos.banner
          }));
        }
        if (profile.media?.fotos?.corpoInteiro) {
          setExistingMedia(prev => ({
            ...prev,
            fotoCorpoInteiro: profile.media.fotos.corpoInteiro
          }));
        }
        if (profile.media?.fotos?.perfilEsquerda) {
          setExistingMedia(prev => ({
            ...prev,
            fotoPerfilEsquerda: profile.media.fotos.perfilEsquerda
          }));
        }
        if (profile.media?.fotos?.perfilDireita) {
          setExistingMedia(prev => ({
            ...prev,
            fotoPerfilDireita: profile.media.fotos.perfilDireita
          }));
        }
        if (profile.media?.fotos?.evento) {
          setExistingMedia(prev => ({
            ...prev,
            fotoEvento: profile.media.fotos.evento
          }));
        }
        
        // Logos (array dinâmico)
        if (profile.media?.logos && Array.isArray(profile.media.logos)) {
          setExistingMedia(prev => ({
            ...prev,
            logos: profile.media.logos,
          }));
        }
        
        // IA
        if (profile.ia?.videoTreinamento) {
          setExistingMedia(prev => ({
            ...prev,
            videoTreinamento: profile.ia.videoTreinamento
          }));
        }
        
        if (profile.ia?.audioVoz) {
          setExistingMedia(prev => ({
            ...prev,
            audioVoz: profile.ia.audioVoz
          }));
        }
        
        console.log('✅ Dados do político carregados:', profile.nomePolitico);
        
      } catch (err) {
        console.error('❌ Erro ao carregar político:', err);
        const msg = err?.body?.message || err?.message || '';
        setError(msg || 'Erro ao carregar dados do político');
      } finally {
        setLoadingData(false);
      }
    };
    
    loadAdminData();
  }, [isEditMode, adminId]);

  useEffect(() => {
    if (!error) return;
    const requiredFieldsError = isRequiredFieldsError(error);
    showCustomAlert({
      variant: 'danger',
      title: requiredFieldsError ? 'Revise os campos obrigatórios' : 'Erro',
      html: requiredFieldsError ? formatErrorHtml(error) : undefined,
      text: requiredFieldsError ? undefined : error,
      confirmButtonText: requiredFieldsError ? 'Corrigir agora' : 'OK',
      width: 560,
    }).finally(() => setError(''));
  }, [error]);

  useEffect(() => {
    if (!success) return;
    showCustomAlert({
      variant: 'success',
      title: 'Sucesso',
      text: success,
    }).finally(() => setSuccess(''));
  }, [success]);
  
  // Definição das tabs para o stepper
  const tabs = [
    { key: 'tab1', number: 1, icon: '🤖', label: 'IA', shortLabel: 'IA' },
    { key: 'tab2', number: 2, icon: '👤', label: 'Básico', shortLabel: 'Básico' },
    { key: 'tab3', number: 3, icon: '🎨', label: 'Visual', shortLabel: 'Visual' },
    { key: 'tab4', number: 4, icon: '📜', label: 'Bio', shortLabel: 'Bio' },
    { key: 'tab5', number: 5, icon: '🎯', label: 'Política', shortLabel: 'Política' },
    { key: 'tab6', number: 6, icon: '🌐', label: 'Social', shortLabel: 'Social' }
  ];
  
  // Textos para gravação de voz
  const voiceScripts = {
    curto: {
      name: 'Texto Curto',
      duration: '30-45 segundos',
      text: `Olá, meu nome é {nome} e sou candidato a {cargo} por {territorio}.

Acredito na transformação através da educação, saúde e trabalho. Juntos, vamos construir um futuro melhor para todos!

Meu número é {numero}. Vote consciente, vote transformação!`
    },
    medio: {
      name: 'Texto Médio',
      duration: '1-2 minutos',
      recommended: true,
      text: `Olá, meu nome é {nome} e sou candidato a {cargo} por {territorio}.

Acredito que a educação é fundamental para transformar nossa sociedade. Precisamos investir em saúde de qualidade para todos os cidadãos.

Minha proposta é criar mais empregos e desenvolver nossa economia local. Vou trabalhar pela segurança, infraestrutura e bem-estar de cada família.

Quero ouvir você, conhecer suas necessidades e lutar pelos seus direitos. Minha porta estará sempre aberta para o diálogo.

Juntos, vamos construir um futuro melhor! Conte comigo! Meu número é {numero}. Vote consciente, vote transformação!`
    },
    longo: {
      name: 'Texto Longo',
      duration: '2-3 minutos',
      text: `Olá, meu nome é {nome} e sou candidato a {cargo} por {territorio}.

Quero começar agradecendo a oportunidade de conversar com você. Acredito profundamente que a política deve ser feita com o povo, ouvindo suas necessidades e trabalhando juntos pelas soluções.

Nossa educação precisa de investimento real. Professores valorizados, escolas equipadas e ensino de qualidade são prioridades absolutas. Nossas crianças merecem o melhor!

A saúde não pode esperar. Vou lutar por mais médicos, equipamentos modernos e atendimento humanizado. Saúde é direito, não privilégio!

Empregos e oportunidades são fundamentais. Vou trabalhar para atrair empresas, apoiar pequenos negócios e criar programas de capacitação profissional.

Segurança, iluminação pública, saneamento básico, transporte de qualidade - são direitos seus e serão minhas prioridades.

Mas nada disso será possível sem transparência. Vou prestar contas, manter canais de comunicação abertos e governar com honestidade.

Quero construir esse futuro junto com você. Minha porta estará sempre aberta. Conte comigo!

Meu número é {numero}. Vote consciente, vote transformação! Muito obrigado!`
    }
  };
  
  // Função para substituir placeholders no texto
  const getPersonalizedScript = (scriptKey) => {
    const script = voiceScripts[scriptKey];
    if (!script) return '';
    
    return script.text
      .replace(/{nome}/g, formData.nomePolitico || formData.nomeCompleto || '[Seu Nome]')
      .replace(/{cargo}/g, formData.cargo ? formData.cargo.replace(/_/g, ' ') : '[Seu Cargo]')
      .replace(/{territorio}/g, formData.territorio || '[Seu Território]')
      .replace(/{numero}/g, formData.numeroCandidato || '[Seu Número]');
  };
  
  // Função para copiar texto
  const handleCopyScript = () => {
    const text = getPersonalizedScript(selectedScript);
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const formatCPF = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  };

  const formatPhoneBR = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };
  
  const handleInputChange = (field, value) => {
    if (field === 'cpf') {
      value = formatCPF(value);
    }
    if (field === 'telefone' || field === 'telefoneGabinete') {
      value = formatPhoneBR(value);
    }
    console.log(`📝 handleInputChange: ${field} =`, value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('📦 New formData:', { audioVoz: newData.audioVoz?.name });
      return newData;
    });
  };
  
  const handlePosicionamentoChange = (tema, value) => {
    setFormData(prev => ({
      ...prev,
      posicionamentos: {
        ...prev.posicionamentos,
        [tema]: value
      }
    }));
  };

  const setRichTextRef = (field) => (element) => {
    if (element) {
      richTextRefs.current[field] = element;
    }
  };

  const normalizeRichTextValue = (value = '') => {
    if (!value) return '';
    const hasHtmlTags = /<[^>]+>/.test(value);
    if (hasHtmlTags) return value;
    return escapeHtml(value).replace(/\n/g, '<br>');
  };

  const applyRichTextCommand = (field, command) => {
    const editor = richTextRefs.current[field];
    if (!editor) return;

    editor.focus();
    document.execCommand(command, false, null);
    handleInputChange(field, editor.innerHTML);
  };

  const renderRichTextToolbar = (field) => (
    <div className="mb-2">
      <div className="rich-toolbar-group">
        <Dropdown>
          <Dropdown.Toggle
            variant="outline-secondary"
            size="sm"
            className="rich-toolbar-btn rich-toolbar-toggle"
            id={`dropdown-list-${field}`}
          >
            <List size={14} />
            <ChevronDown size={12} />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => applyRichTextCommand(field, 'insertUnorderedList')}>
              Lista com bullet
            </Dropdown.Item>
            <Dropdown.Item onClick={() => applyRichTextCommand(field, 'insertOrderedList')}>
              Lista numerada
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Button
          type="button"
          variant="outline-secondary"
          size="sm"
          className="rich-toolbar-btn"
          onClick={() => applyRichTextCommand(field, 'bold')}
        >
          <span className="fw-semibold">N</span>
        </Button>
      </div>
    </div>
  );

  const renderRichTextEditor = (field, placeholder, minHeight = 120) => (
    <>
      {renderRichTextToolbar(field)}
      <div
        className="form-control rich-text-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        ref={setRichTextRef(field)}
        onInput={(e) => handleInputChange(field, e.currentTarget.innerHTML)}
        style={{ minHeight: `${minHeight}px`, height: 'auto', overflowY: 'auto' }}
      />
    </>
  );

  useEffect(() => {
    ['formacao', 'experiencia', 'realizacoes', 'valores', 'manifesto', 'propostas'].forEach((field) => {
      const editor = richTextRefs.current[field];
      if (!editor) return;

      const normalizedValue = normalizeRichTextValue(formData[field] || '');
      if (document.activeElement !== editor && editor.innerHTML !== normalizedValue) {
        editor.innerHTML = normalizedValue;
      }
    });
  }, [formData.formacao, formData.experiencia, formData.realizacoes, formData.valores, formData.manifesto, formData.propostas]);
  
  const calcularProgresso = () => {
    let total = 0;
    const pontos = {
      nomeCompleto: 5, nomePolitico: 5, email: 5, cpf: 5, cargo: 10,
      territorio: 5, status: 5, fotoPrincipal: 10, fotoBanner: 5,
      logoPrincipal: 5, corPrimaria: 3, corSecundaria: 2, slogan: 5,
      bioShort: 5, bioFull: 5, experiencia: 5, ideologia: 3,
      manifesto: 4, propostas: 3, website: 3, facebook: 1, instagram: 1,
      videoTreinamento: 5, audioVoz: 5
    };
    
    Object.keys(pontos).forEach(campo => {
      if (formData[campo] && formData[campo] !== '') {
        total += pontos[campo];
      }
    });
    
    return Math.min(total, 100);
  };
  
  // Gravar áudio
  const startRecording = async () => {
    console.log('🎙 startRecording chamado');
    try {
      // Configuração de áudio de alta qualidade para clonagem de voz
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 48000,      // 48kHz (ideal para voz)
          channelCount: 1,         // Mono (suficiente para voz)
          echoCancellation: true,  // Remove eco
          noiseSuppression: true,  // Remove ruído de fundo
          autoGainControl: true    // Normaliza volume
        }
      });
      
      console.log('🎙 Stream de áudio obtido');
      
      // Configurar MediaRecorder com codec de alta qualidade
      const options = {
        mimeType: 'audio/webm;codecs=opus', // Opus: melhor codec para voz
        audioBitsPerSecond: 256000          // 256kbps (acima do mínimo 192kbps)
      };
      
      // Fallback se navegador não suporta Opus
      const recorder = MediaRecorder.isTypeSupported(options.mimeType) 
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream); // Usa codec padrão do navegador
      
      console.log('🎙 MediaRecorder criado. MimeType:', recorder.mimeType);
      
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        console.log('📦 Chunk de dados recebido:', e.data.size, 'bytes');
        chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        console.log('🛑 recorder.onstop disparado! Total chunks:', chunks.length);
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const file = new File([blob], 'audio-voz.webm', { type: recorder.mimeType || 'audio/webm' });
        console.log('✅ Áudio gravado:', file.name, `${(file.size / 1024).toFixed(2)} KB`);
        handleInputChange('audioVoz', file);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      console.log('🎙 Gravação iniciada');
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // Timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      recorder.addEventListener('stop', () => {
        clearInterval(interval);
        setRecordingTime(0);
      });
      
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      setError('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };
  
  const stopRecording = () => {
    console.log('🛑 stopRecording chamado. State:', mediaRecorder?.state);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      console.log('🛑 Parando gravação...');
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      console.warn('⚠️ MediaRecorder não está ativo ou não existe');
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Validações por etapa
  const validateBasicStep = () => {
    const errors = [];
    
    // Campos obrigatórios básicos
    if (!formData.nomeCompleto?.trim()) errors.push('Nome completo é obrigatório');
    if (!formData.nomePolitico?.trim()) errors.push('Nome político é obrigatório');
    
    // Email e senha: obrigatórios apenas no modo criação
    if (!isEditMode) {
      if (!formData.email?.trim()) errors.push('E-mail é obrigatório');
      if (!formData.senha || formData.senha.length < 8) errors.push('Senha deve ter no mínimo 8 caracteres');
    }
    
    if (!formData.cpf?.trim()) errors.push('CPF é obrigatório');
    if (!formData.cargo) errors.push('Cargo é obrigatório');
    if (!formData.territorio?.trim()) errors.push('Território é obrigatório');
    
    // Validação de e-mail (se fornecido)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.push('E-mail inválido');
      }
    }
    
    // Validação de CPF (formato básico)
    if (formData.cpf) {
      const cpfClean = formData.cpf.replace(/\D/g, '');
      if (cpfClean.length !== 11) {
        errors.push('CPF deve ter 11 dígitos');
      }
    }

    if (formData.telefone) {
      const phoneClean = formData.telefone.replace(/\D/g, '');
      if (phoneClean.length !== 10 && phoneClean.length !== 11) {
        errors.push('Telefone deve ter 10 ou 11 dígitos (DDD + número)');
      }
    }

    return errors;
  };

  const validateStep = (stepKey) => {
    if (stepKey === 'tab2') {
      return validateBasicStep();
    }
    
    return [];
  };

  const checkEmailAlreadyInUse = async (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || isEditMode) return false;

    const [usersResponse, adminsResponse] = await Promise.all([
      listUsers({ email: normalizedEmail }),
      listAdmins(),
    ]);

    const users = Array.isArray(usersResponse?.users)
      ? usersResponse.users
      : Array.isArray(usersResponse)
        ? usersResponse
        : [];

    const admins = Array.isArray(adminsResponse?.data)
      ? adminsResponse.data
      : Array.isArray(adminsResponse)
        ? adminsResponse
        : [];

    const emailMatches = (record) =>
      String(record?.email || '').trim().toLowerCase() === normalizedEmail;

    return users.some(emailMatches) || admins.some(emailMatches);
  };

  const attemptTabChange = async (targetKey) => {
    if (!targetKey) return;
    if (targetKey === activeTab) return;

    const currentIndex = tabs.findIndex((tab) => tab.key === activeTab);
    const targetIndex = tabs.findIndex((tab) => tab.key === targetKey);
    if (targetIndex < 0 || currentIndex < 0) return;

    // Retroceder sempre é permitido
    if (targetIndex <= currentIndex) {
      setError('');
      setActiveTab(targetKey);
      return;
    }

    // Avançar valida etapa por etapa até o destino
    for (let i = currentIndex; i < targetIndex; i += 1) {
      const stepKey = tabs[i].key;
      const stepLabel = tabs[i].label;
      const stepErrors = validateStep(stepKey);

      if (stepErrors.length > 0) {
        setError(`Corrija os erros na etapa "${stepLabel}": ${stepErrors.join('; ')}`);
        return;
      }

      if (stepKey === 'tab2' && !isEditMode && formData.email?.trim()) {
        try {
          const emailAlreadyInUse = await checkEmailAlreadyInUse(formData.email);
          if (emailAlreadyInUse) {
            setError(`O e-mail "${formData.email.trim()}" já está sendo usado por outro usuário.`);
            return;
          }
        } catch (err) {
          console.error('Erro ao validar e-mail na mudança de etapa:', err);
          setError(err?.message || 'Não foi possível validar o e-mail informado.');
          return;
        }
      }
    }

    setError('');
    setActiveTab(targetKey);
  };

  // Validação final para salvar
  const validateForm = () => {
    const errors = [];
    errors.push(...validateBasicStep());
    
    return errors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    setCurrentStep('validating');
    
    try {
      // 1. Validar formulário
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(validationErrors.join('; '));
        setLoading(false);
        setCurrentStep('');
        return;
      }
      
      // 2. Criar ou Atualizar Admin
      if (isEditMode) {
        // ========== MODO EDIÇÃO ==========
        setCurrentStep('updating');
        console.log('📝 Atualizando perfil de político...');
        
        const updateData = {
          // Dados Básicos (não enviar email e senha em edição)
          nomeCompleto: formData.nomeCompleto,
          nomePolitico: formData.nomePolitico,
          cpf: formData.cpf,
          dataNascimento: formData.dataNascimento || undefined,
          telefone: formData.telefone || undefined,
          
          // Cargo e Mandato
          cargo: formData.cargo,
          status: formData.status || 'candidato',
          territorio: formData.territorio,
          partido: formData.partido || undefined,
          anoEleicao: formData.anoEleicao || undefined,
          numeroCandidato: formData.numeroCandidato || undefined,
          coligacao: formData.coligacao || undefined,

          // Dados TSE
          sqCandidatoTSE: formData.sqCandidatoTSE || undefined,
          uf: formData.uf || undefined,
          municipio: formData.municipio || undefined,
          siglaPartido: formData.siglaPartido || undefined,
          numeroPartido: formData.numeroPartido || undefined,
          
          // Visual
          cores: {
            primaria: formData.corPrimaria || '#1a73e8',
            secundaria: formData.corSecundaria || '#34a853'
          },
          slogan: formData.slogan || undefined,
          
          // Bio
          bioShort: formData.bioShort || undefined,
          bioFull: formData.bioFull || undefined,
          formacao: formData.formacao || undefined,
          experiencia: formData.experiencia || undefined,
          realizacoes: formData.realizacoes || undefined,
          
          // Política
          ideologia: formData.ideologia || undefined,
          areasFoco: formData.areasFoco || undefined,
          valores: formData.valores || undefined,
          manifesto: formData.manifesto || undefined,
          propostas: formData.propostas || undefined,
          posicionamentos: {
            educacao: formData.posicionamentos.educacao || undefined,
            saude: formData.posicionamentos.saude || undefined,
            economia: formData.posicionamentos.economia || undefined,
            seguranca: formData.posicionamentos.seguranca || undefined,
            meioAmbiente: formData.posicionamentos.meioAmbiente || undefined,
            infraestrutura: formData.posicionamentos.infraestrutura || undefined,
            outros: formData.posicionamentos.outros || undefined
          },
          
          // Social
          social: {
            website: formData.website || undefined,
            facebook: formData.facebook || undefined,
            instagram: formData.instagram || undefined,
            twitter: formData.twitter || undefined,
            youtube: formData.youtube || undefined,
            tiktok: formData.tiktok || undefined,
            linkedin: formData.linkedin || undefined,
            threads: formData.threads || undefined,
            emailCampanha: formData.emailCampanha || undefined,
            telefoneGabinete: formData.telefoneGabinete || undefined,
            enderecoComite: formData.enderecoComite || undefined
          }
        };
        
        await updateAdmin(adminId, updateData);
        console.log('✅ Perfil atualizado com sucesso!');
        
      } else {
        // ========== MODO CRIAÇÃO ==========
        setCurrentStep('creating');
        console.log('📝 Criando perfil de político...');
        
        const adminData = {
          // Autenticação (só na criação)
          email: formData.email,
          senha: formData.senha,
          
          // Dados Básicos
          nomeCompleto: formData.nomeCompleto,
          nomePolitico: formData.nomePolitico,
          cpf: formData.cpf,
          dataNascimento: formData.dataNascimento || undefined,
          telefone: formData.telefone || undefined,
          
          // Cargo e Mandato
          cargo: formData.cargo,
          status: formData.status || 'candidato',
          territorio: formData.territorio,
          partido: formData.partido || undefined,
          anoEleicao: formData.anoEleicao || undefined,
          numeroCandidato: formData.numeroCandidato || undefined,
          coligacao: formData.coligacao || undefined,

          // Dados TSE
          sqCandidatoTSE: formData.sqCandidatoTSE || undefined,
          uf: formData.uf || undefined,
          municipio: formData.municipio || undefined,
          siglaPartido: formData.siglaPartido || undefined,
          numeroPartido: formData.numeroPartido || undefined,
          
          // Visual
          cores: {
            primaria: formData.corPrimaria || '#1a73e8',
            secundaria: formData.corSecundaria || '#34a853'
          },
          slogan: formData.slogan || undefined,
          
          // Bio
          bioShort: formData.bioShort || undefined,
          bioFull: formData.bioFull || undefined,
          formacao: formData.formacao || undefined,
          experiencia: formData.experiencia || undefined,
          realizacoes: formData.realizacoes || undefined,
          
          // Política
          ideologia: formData.ideologia || undefined,
          areasFoco: formData.areasFoco || undefined,
          valores: formData.valores || undefined,
          manifesto: formData.manifesto || undefined,
          propostas: formData.propostas || undefined,
          posicionamentos: {
            educacao: formData.posicionamentos.educacao || undefined,
            saude: formData.posicionamentos.saude || undefined,
            economia: formData.posicionamentos.economia || undefined,
            seguranca: formData.posicionamentos.seguranca || undefined,
            meioAmbiente: formData.posicionamentos.meioAmbiente || undefined,
            infraestrutura: formData.posicionamentos.infraestrutura || undefined,
            outros: formData.posicionamentos.outros || undefined
          },
          
          // Social
          social: {
            website: formData.website || undefined,
            facebook: formData.facebook || undefined,
            instagram: formData.instagram || undefined,
            twitter: formData.twitter || undefined,
            youtube: formData.youtube || undefined,
            tiktok: formData.tiktok || undefined,
            linkedin: formData.linkedin || undefined,
            threads: formData.threads || undefined,
            emailCampanha: formData.emailCampanha || undefined,
            telefoneGabinete: formData.telefoneGabinete || undefined,
            enderecoComite: formData.enderecoComite || undefined
          }
        };
        
        const createResponse = await createAdmin(adminData);
        const newAdminId = createResponse.data?.user?._id || createResponse.data?.profile?.userId;
        
        if (!newAdminId) {
          throw new Error('ID do admin não foi retornado pela API');
        }
        
        // Usar o ID recém-criado para upload de mídias
        adminId = newAdminId;
        console.log('✅ Perfil criado com sucesso! ID:', adminId);
      }
      
      // 3. Upload de Mídias (fotos + IA)
      const hasMedia = formData.fotoPrincipal || formData.fotoBanner || formData.fotoCorpoInteiro ||
                        formData.fotoPerfilEsquerda || formData.fotoPerfilDireita || formData.fotoEvento ||
                        formData.videoTreinamento || formData.audioVoz;
      
      if (hasMedia) {
        setCurrentStep('uploading');
        console.log('📤 Fazendo upload de mídias...');
        
        const mediaFiles = {
          fotoPrincipal: formData.fotoPrincipal,
          fotoBanner: formData.fotoBanner,
          fotoCorpoInteiro: formData.fotoCorpoInteiro,
          fotoPerfilEsquerda: formData.fotoPerfilEsquerda,
          fotoPerfilDireita: formData.fotoPerfilDireita,
          fotoEvento: formData.fotoEvento,
          videoTreinamento: formData.videoTreinamento,
          audioVoz: formData.audioVoz
        };
        
        await uploadAdminMedia(adminId, mediaFiles, (progress) => {
          setUploadProgress(Math.round(progress));
        });
        
        console.log('✅ Upload de mídias concluído!');
      }

      // 3b. Upload de logos pendentes (modo criação)
      if (pendingLogos.length > 0) {
        setCurrentStep('uploading');
        console.log(`📤 Fazendo upload de ${pendingLogos.length} logo(s)...`);
        for (const logoItem of pendingLogos) {
          await uploadAdminLogo(adminId, logoItem.file, logoItem.nome);
        }
        setPendingLogos([]);
        console.log('✅ Logos enviadas!');
      }
      
      // 4. Sucesso!
      setCurrentStep('complete');
      const successMessage = isEditMode 
        ? 'Perfil de político atualizado com sucesso!' 
        : 'Perfil de político criado com sucesso!';
      setSuccess(successMessage);
      
      // Se estiver editando, recarregar dados para mostrar mídia atualizada
      if (isEditMode) {
        console.log('🔄 Recarregando dados do político...');
        setTimeout(async () => {
          try {
            const response = await getAdminById(adminId);
            if (response?.data?.profile) {
              const profile = response.data.profile;
              
              // Atualizar existingMedia com novos uploads
              if (profile.ia?.videoTreinamento) {
                setExistingMedia(prev => ({
                  ...prev,
                  videoTreinamento: profile.ia.videoTreinamento
                }));
              }
              
              if (profile.ia?.audioVoz) {
                setExistingMedia(prev => ({
                  ...prev,
                  audioVoz: profile.ia.audioVoz
                }));
              }
              
              // Limpar arquivos do formData para mostrar apenas mídia do backend
              setFormData(prev => ({
                ...prev,
                audioVoz: null,
                videoTreinamento: null
              }));
              
              console.log('✅ Dados recarregados! Áudio:', profile.ia?.audioVoz);
            }
          } catch (err) {
            console.error('⚠️ Erro ao recarregar dados:', err);
          }
        }, 1500);
      } else {
        // Se estiver criando, redireciona para lista
        setTimeout(() => {
          router.push('/apps/users/list');
        }, 2000);
      }
      
    } catch (err) {
      console.error('❌ Erro ao salvar perfil:', err);
      setError(err?.message || 'Erro ao salvar perfil. Tente novamente.');
      setCurrentStep('');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletar mídia salva no servidor
   */
  const handleDeleteMedia = async (fieldName) => {
    if (!isEditMode || !adminId) {
      console.error('❌ Só é possível deletar mídia em modo edição');
      return;
    }

    // Mapear fieldName para mediaType e mediaKey
    const photoMap = {
      fotoPrincipal: { type: 'foto', key: 'principal' },
      fotoBanner: { type: 'foto', key: 'banner' },
      fotoCorpoInteiro: { type: 'foto', key: 'corpoInteiro' },
      fotoPerfilEsquerda: { type: 'foto', key: 'perfilEsquerda' },
      fotoPerfilDireita: { type: 'foto', key: 'perfilDireita' },
      fotoEvento: { type: 'foto', key: 'evento' },
      videoTreinamento: { type: 'video', key: 'videoTreinamento' },
      audioVoz: { type: 'audio', key: 'audioVoz' },
    };

    const mediaInfo = photoMap[fieldName];
    if (!mediaInfo) {
      console.error(`❌ Campo desconhecido: ${fieldName}`);
      return;
    }

    const confirmationResult = await showCustomAlert({
      variant: 'warning',
      title: 'Confirmar remoção',
      text: 'Tem certeza que deseja remover esta mídia? Esta ação não pode ser desfeita.',
      confirmButtonText: 'Remover',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!confirmationResult.isConfirmed) {
      return;
    }

    try {
      console.log(`🗑️ Removendo ${fieldName}...`);
      await deleteAdminMedia(adminId, mediaInfo.type, mediaInfo.key);
      
      // Remover do estado existingMedia
      setExistingMedia(prev => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
      
      setSuccess(`Mídia removida com sucesso!`);
      console.log(`✅ ${fieldName} removido com sucesso`);
    } catch (err) {
      console.error(`❌ Erro ao remover ${fieldName}:`, err);
      setError(err?.message || 'Erro ao remover mídia');
    }
  };

  /**
   * Adicionar uma logo (edit = upload imediato; create = staging)
   */
  const handleLogoAdd = async (file) => {
    if (!file) return;
    const totalLogos = existingMedia.logos.length + pendingLogos.length;
    if (totalLogos >= 20) {
      setError('Limite de 20 logos atingido. Remova uma antes de adicionar.');
      return;
    }
    if (isEditMode && adminId) {
      try {
        setLogoUploading(true);
        const res = await uploadAdminLogo(adminId, file, file.name.replace(/\.[^.]+$/, ''));
        setExistingMedia(prev => ({ ...prev, logos: res.data?.logos || prev.logos }));
      } catch (err) {
        setError(err?.message || 'Erro ao fazer upload da logo');
      } finally {
        setLogoUploading(false);
      }
    } else {
      const previewUrl = URL.createObjectURL(file);
      setPendingLogos(prev => [...prev, { file, previewUrl, nome: file.name.replace(/\.[^.]+$/, '') }]);
    }
  };

  /**
   * Remover logo pelo índice (edit = DELETE na API; create = remove do staging)
   */
  const handleLogoRemove = async (index, isPending = false) => {
    const confirmationResult = await showCustomAlert({
      variant: 'warning',
      title: 'Remover logo',
      text: 'Tem certeza que deseja remover esta logo?',
      confirmButtonText: 'Remover',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!confirmationResult.isConfirmed) return;

    if (isPending) {
      setPendingLogos(prev => prev.filter((_, i) => i !== index));
      return;
    }
    if (isEditMode && adminId) {
      try {
        setLogoUploading(true);
        const res = await deleteAdminLogo(adminId, index);
        setExistingMedia(prev => ({ ...prev, logos: res.data?.logos || prev.logos.filter((_, i) => i !== index) }));
      } catch (err) {
        setError(err?.message || 'Erro ao remover logo');
      } finally {
        setLogoUploading(false);
      }
    }
  };

  return (
    <>
      <style>{pulseStyle}</style>
      <Container>
      
      {/* Loading state para modo edição */}
      {loadingData && (
        <div className="hk-pg-body py-5">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="mt-3 text-muted">Carregando dados do político...</p>
          </div>
        </div>
      )}
      
      {/* Perfil não encontrado — candidato sem AdminProfile */}
      {!loadingData && isEditMode && error && (error.toLowerCase().includes('não encontrado') || error.toLowerCase().includes('not found')) && (
        <div className="hk-pg-body py-0">
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
            <div className="text-center" style={{ maxWidth: 480 }}>
              <div style={{ fontSize: 64 }}>👤</div>
              <h3 className="mt-3 mb-2">Perfil Político Não Encontrado</h3>
              <p className="text-muted mb-2">
                Este usuário ainda não possui um perfil político completo no sistema.
              </p>
              <p className="text-muted mb-4">
                Para criar o perfil, use o botão abaixo. O usuário existente será vinculado ao novo perfil.
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <Button variant="primary" onClick={() => router.push('/apps/users/create-admin')}>
                  Criar Perfil Político
                </Button>
                <Button variant="outline-secondary" onClick={() => router.push('/apps/users/list')}>
                  Voltar à Lista
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal (oculto durante loading ou quando há erro de perfil não encontrado) */}
      {!loadingData && !(isEditMode && error && (error.toLowerCase().includes('não encontrado') || error.toLowerCase().includes('not found'))) && (
      <>
      {/* Header */}
      <div className="hk-pg-header pt-7 pb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="pg-title">
              {isEditMode ? 'Editar Perfil de Político' : 'Criar Perfil de Político'}
            </h1>
            <p>
              {isEditMode 
                ? 'Atualize as informações do político e gerencie seu perfil completo.'
                : 'Preencha as informações do político para criar seu perfil completo no sistema.'
              }
            </p>
          </div>
          <Button variant="outline-secondary" onClick={() => router.push('/apps/users/list')}>
            <ArrowLeft size={16} className="me-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Progress Indicator durante Save */}
      {loading && (
        <Alert variant="info" className="mb-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <strong>
              {currentStep === 'validating' && '🔍 Validando dados...'}
              {currentStep === 'creating' && '📝 Criando perfil...'}
              {currentStep === 'uploading' && '📤 Enviando mídias...'}
              {currentStep === 'complete' && '✅ Concluído!'}
            </strong>
            {currentStep === 'uploading' && (
              <Badge bg="primary">{uploadProgress}%</Badge>
            )}
          </div>
          {currentStep === 'uploading' && (
            <ProgressBar 
              now={uploadProgress} 
              label={`${uploadProgress}%`}
              animated 
              striped
              variant="success"
            />
          )}
          {currentStep !== 'uploading' && (
            <ProgressBar animated now={100} variant="primary" style={{ height: '4px' }} />
          )}
        </Alert>
      )}

      {/* Body */}
      <div className="hk-pg-body">
        {/* Steps Indicator */}
        <div className="mb-4">
          <Card>
            <Card.Body className="py-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                {tabs.map((tab, index) => {
                  const currentIndex = tabs.findIndex(t => t.key === activeTab);
                  const tabIndex = index;
                  const isActive = tab.key === activeTab;
                  const isCompleted = tabIndex < currentIndex;
                  const isPending = tabIndex > currentIndex;
                  
                  return (
                    <div key={tab.key} className="d-flex align-items-center">
                      {/* Step Circle */}
                      <div 
                        className="d-flex align-items-center"
                        style={{ cursor: 'pointer' }}
                        onClick={() => attemptTabChange(tab.key)}
                      >
                        <div 
                          className="d-flex align-items-center justify-content-center rounded-circle"
                          style={{ 
                            width: '40px', 
                            height: '40px',
                            backgroundColor: isCompleted ? '#28a745' : isActive ? '#1a73e8' : '#e0e0e0',
                            color: 'white',
                            fontWeight: 'bold',
                            transition: 'all 0.3s'
                          }}
                        >
                          {isCompleted ? '✓' : tab.number}
                        </div>
                        <div className="ms-2 d-none d-md-block">
                          <div style={{ 
                            fontSize: '14px', 
                            fontWeight: isActive ? 'bold' : 'normal',
                            color: isActive ? '#1a73e8' : isCompleted ? '#28a745' : '#666'
                          }}>
                            {tab.icon} {tab.label}
                          </div>
                          {isActive && (
                            <small className="text-primary">📍 Você está aqui</small>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      {index < tabs.length - 1 && (
                        <div className="mx-2 mx-md-3 text-muted">→</div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Mobile - Tab atual */}
              <div className="d-md-none mt-3 text-center">
                <Badge bg="primary" className="py-2 px-3">
                  {tabs.find(t => t.key === activeTab)?.icon} {tabs.find(t => t.key === activeTab)?.label}
                  <span className="ms-2">({tabs.findIndex(t => t.key === activeTab) + 1}/6)</span>
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </div>

        <Tab.Container activeKey={activeTab} onSelect={(k) => attemptTabChange(k)}>
          <Row className="edit-profile-wrap">
            {/* Tabs Sidebar */}
            <Col xs={4} sm={3} lg={2}>
              <div className="nav-profile mt-4">
                <div className="nav-header">
                  <span>Perfil Político</span>
                </div>
                <Nav as="ul" variant="tabs" className="nav-light nav-vertical">
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tab1">
                      <span className="nav-icon me-2">🤖</span>
                      <span className="nav-link-text">IA</span>
                      <Badge bg="primary" className="ms-2" size="sm">1º</Badge>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tab2">
                      <span className="nav-icon me-2">👤</span>
                      <span className="nav-link-text">Básico</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tab3">
                      <span className="nav-icon me-2">🎨</span>
                      <span className="nav-link-text">Visual</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tab4">
                      <span className="nav-icon me-2">📜</span>
                      <span className="nav-link-text">Bio</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tab5">
                      <span className="nav-icon me-2">🎯</span>
                      <span className="nav-link-text">Política</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tab6">
                      <span className="nav-icon me-2">🌐</span>
                      <span className="nav-link-text">Social</span>
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>
            </Col>

            {/* Content */}
            <Col lg={7} sm={6} xs={8}>
              <Tab.Content>
                {/* Tab 1: IA (PRIMEIRA TAB) */}
                <Tab.Pane eventKey="tab1">
                  <Form>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Treinamento de IA</span>
                    </div>

                    <Alert variant="info" className="mb-4">
                      <strong>🤖 Como funciona?</strong> A IA será treinada com sua voz e imagem para gerar 
                      conteúdos personalizados, responder perguntas e criar materiais de campanha com sua identidade.
                    </Alert>

                    {/* Upload de Vídeo */}
                    <Card className="mb-4">
                      <Card.Body>
                        <h6 className="mb-3">
                          <Video size={18} className="me-2" />
                          Vídeo de Treinamento
                        </h6>
                        <Alert variant="warning" className="mb-3">
                          <strong>📹 Especificações:</strong>
                          <ul className="mb-0 mt-2">
                            <li>Duração: 1-5 minutos</li>
                            <li>Formato: MP4, MOV ou WebM</li>
                            <li>Tamanho máximo: 100MB</li>
                            <li>Fale olhando para a câmera, em ambiente silencioso</li>
                            <li>Dica: Fale sobre suas propostas, sua história, seus valores</li>
                          </ul>
                        </Alert>

                        {formData.videoTreinamento ? (
                          <div className="mb-3">
                            <div 
                              className="d-flex align-items-center justify-content-between p-3 rounded"
                              style={{ backgroundColor: '#f8f9fa', border: '2px solid #28a745' }}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <div 
                                  className="d-flex align-items-center justify-content-center rounded"
                                  style={{ width: '60px', height: '60px', backgroundColor: '#28a745' }}
                                >
                                  <Video size={30} className="text-white" />
                                </div>
                                <div>
                                  <strong className="d-block">{formData.videoTreinamento.name}</strong>
                                  <small className="text-muted">
                                    {(formData.videoTreinamento.size / (1024 * 1024)).toFixed(2)} MB
                                  </small>
                                </div>
                              </div>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleInputChange('videoTreinamento', null)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                            
                            {/* Preview do vídeo */}
                            <div className="mt-3">
                              <video 
                                controls 
                                style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' }}
                                src={URL.createObjectURL(formData.videoTreinamento)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="text-center p-5 rounded"
                            style={{ 
                              border: '2px dashed #ccc', 
                              backgroundColor: '#f8f9fa',
                              cursor: 'pointer' 
                            }}
                            onClick={() => document.getElementById('videoUpload').click()}
                          >
                            <Video size={48} className="text-muted mb-3" />
                            <p className="mb-3">Clique aqui ou arraste um vídeo</p>
                            <Button variant="primary">
                              Selecionar Vídeo
                            </Button>
                            <Form.Control 
                              id="videoUpload"
                              type="file" 
                              accept="video/mp4,video/quicktime,video/webm"
                              onChange={(e) => handleInputChange('videoTreinamento', e.target.files[0])}
                              style={{ display: 'none' }}
                            />
                          </div>
                        )}
                      </Card.Body>
                    </Card>

                    {/* Gravação de Áudio */}
                    <Card className="mb-4">
                      <Card.Body>
                        <h6 className="mb-3">
                          <Mic size={18} className="me-2" />
                          Amostra de Voz (Áudio)
                        </h6>
                        <Alert variant="warning" className="mb-3">
                          <strong>🎤 Especificações:</strong>
                          <ul className="mb-0 mt-2">
                            <li>Duração: 30 segundos a 3 minutos</li>
                            <li>Formato: MP3, WAV ou WebM</li>
                            <li>Fale de forma natural e clara</li>
                            <li>Dica: Leia um texto ou fale sobre suas propostas</li>
                          </ul>
                        </Alert>

                        {/* Áudio/Vídeo Existente */}
                        {(existingMedia.audioVoz || existingMedia.videoTreinamento) && (
                          <Card className="mb-4" style={{ backgroundColor: '#e8f5e9', border: '2px solid #4caf50' }}>
                            <Card.Body>
                              <h6 className="mb-3">🎧 Mídia Existente</h6>
                              
                              {existingMedia.audioVoz && (
                                <div className="mb-3">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <strong>Áudio de Voz (última gravação):</strong>
                                    <Badge bg="success">Disponível</Badge>
                                  </div>
                                  <audio 
                                    controls 
                                    className="w-100" 
                                    src={existingMedia.audioVoz}
                                    style={{ maxHeight: '40px' }}
                                  />
                                  <small className="text-muted d-block mt-1">
                                    Esta é a amostra de voz atualmente sendo usada para IA.
                                  </small>
                                </div>
                              )}
                              
                              {existingMedia.videoTreinamento && (
                                <div className="mb-3">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <strong>Vídeo de Treinamento (último upload):</strong>
                                    <Badge bg="success">Disponível</Badge>
                                  </div>
                                  <video 
                                    controls 
                                    className="w-100 rounded" 
                                    src={existingMedia.videoTreinamento}
                                    style={{ maxHeight: '300px' }}
                                  />
                                  <small className="text-muted d-block mt-1">
                                    Este é o vídeo atualmente sendo usado para IA.
                                  </small>
                                </div>
                              )}
                              
                              <Alert variant="info" className="mb-0 mt-3">
                                <small>
                                  <strong>💡 Dica:</strong> Você pode gravar/enviar novos arquivos abaixo para substituir os existentes.
                                </small>
                              </Alert>
                            </Card.Body>
                          </Card>
                        )}

                        {/* Textos para Gravação */}
                        {!formData.audioVoz && (
                          <Card className="mb-4" style={{ backgroundColor: '#f0f8ff', border: '2px solid #1a73e8' }}>
                            <Card.Body>
                              <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6 className="mb-0">
                                  📄 Texto para Leitura (Recomendado)
                                </h6>
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={handleCopyScript}
                                  className="d-flex align-items-center gap-1"
                                >
                                  {showCopied ? (
                                    <>
                                      <CheckIcon size={14} />
                                      Copiado!
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={14} />
                                      Copiar
                                    </>
                                  )}
                                </Button>
                              </div>

                              <Alert variant="info" className="mb-3">
                                <small>
                                  <strong>💡 Por que ler um texto?</strong> Garante qualidade máxima da clonagem de voz, 
                                  capturando todos os fonemas e entonações necessários para gerar músicas, áudios e conteúdo personalizado.
                                </small>
                              </Alert>

                              {/* Seleção de Texto */}
                              <div className="mb-3">
                                <Form.Label className="fw-medium">Escolha o texto:</Form.Label>
                                <Row className="gx-2">
                                  {Object.entries(voiceScripts).map(([key, script]) => (
                                    <Col md={4} key={key}>
                                      <Card 
                                        className={`cursor-pointer ${selectedScript === key ? 'border-primary' : 'border'}`}
                                        onClick={() => setSelectedScript(key)}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        <Card.Body className="p-3">
                                          <div className="d-flex align-items-center justify-content-between mb-1">
                                            <Form.Check 
                                              type="radio"
                                              name="script"
                                              checked={selectedScript === key}
                                              onChange={() => setSelectedScript(key)}
                                              label={<strong>{script.name}</strong>}
                                            />
                                            {script.recommended && (
                                              <Badge bg="success" className="badge-sm">⭐</Badge>
                                            )}
                                          </div>
                                          <small className="text-muted">{script.duration}</small>
                                        </Card.Body>
                                      </Card>
                                    </Col>
                                  ))}
                                </Row>
                              </div>

                              {/* Teleprompter */}
                              <div 
                                className="p-4 rounded"
                                style={{ 
                                  backgroundColor: 'white',
                                  border: '2px solid #e0e0e0',
                                  maxHeight: '300px',
                                  overflowY: 'auto',
                                  fontSize: '16px',
                                  lineHeight: '1.8'
                                }}
                              >
                                <div style={{ whiteSpace: 'pre-wrap' }}>
                                  {getPersonalizedScript(selectedScript)}
                                </div>
                              </div>

                              <Alert variant="success" className="mt-3 mb-0">
                                <small>
                                  <strong>✅ Dica:</strong> Leia com calma, pausas naturais e boa dicção. 
                                  O texto já está personalizado com seus dados!
                                </small>
                              </Alert>
                            </Card.Body>
                          </Card>
                        )}

                        {/* DEBUG: Verificar audioVoz */}
                        {console.log('🎤 Renderizando seção de áudio. formData.audioVoz:', formData.audioVoz)}

                        {formData.audioVoz ? (
                          <div className="mb-3">
                            <div 
                              className="d-flex align-items-center justify-content-between p-3 rounded mb-3"
                              style={{ backgroundColor: '#f8f9fa', border: '2px solid #28a745' }}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <div 
                                  className="d-flex align-items-center justify-content-center rounded"
                                  style={{ width: '60px', height: '60px', backgroundColor: '#28a745' }}
                                >
                                  <Mic size={30} className="text-white" />
                                </div>
                                <div>
                                  <strong className="d-block">{formData.audioVoz.name}</strong>
                                  <small className="text-muted">
                                    {(formData.audioVoz.size / 1024).toFixed(2)} KB
                                  </small>
                                </div>
                              </div>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleInputChange('audioVoz', null)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                            
                            {/* Player de áudio */}
                            <audio 
                              controls 
                              style={{ width: '100%' }}
                              src={URL.createObjectURL(formData.audioVoz)}
                            />
                          </div>
                        ) : (
                          <>
                            {/* Botões de gravação */}
                            <div className="text-center mb-3">
                              {!isRecording ? (
                                <Button 
                                  variant="danger" 
                                  size="lg"
                                  onClick={startRecording}
                                  className="d-flex align-items-center justify-content-center mx-auto gap-2"
                                  style={{ width: '200px' }}
                                >
                                  <Mic size={20} />
                                  Gravar Áudio
                                </Button>
                              ) : (
                                <div>
                                  <div className="mb-3">
                                    <div 
                                      className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded"
                                      style={{ backgroundColor: '#dc3545', color: 'white' }}
                                    >
                                      <div 
                                        style={{ 
                                          width: '12px', 
                                          height: '12px', 
                                          backgroundColor: 'white', 
                                          borderRadius: '50%',
                                          animation: 'pulse 1s infinite'
                                        }}
                                      />
                                      <strong>Gravando... {formatTime(recordingTime)}</strong>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="dark" 
                                    size="lg"
                                    onClick={stopRecording}
                                    className="d-flex align-items-center justify-content-center mx-auto gap-2"
                                    style={{ width: '200px' }}
                                  >
                                    <StopCircle size={20} />
                                    Parar Gravação
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Divisor */}
                            <div className="text-center text-muted my-3">
                              <span>ou</span>
                            </div>

                            {/* Upload de arquivo */}
                            <div 
                              className="text-center p-4 rounded"
                              style={{ 
                                border: '2px dashed #ccc', 
                                backgroundColor: '#f8f9fa',
                                cursor: 'pointer' 
                              }}
                              onClick={() => document.getElementById('audioUpload').click()}
                            >
                              <Mic size={36} className="text-muted mb-2" />
                              <p className="mb-2">Ou faça upload de um arquivo de áudio</p>
                              <Button variant="outline-primary" size="sm">
                                Selecionar Arquivo
                              </Button>
                              <Form.Control 
                                id="audioUpload"
                                type="file" 
                                accept="audio/mp3,audio/wav,audio/webm,audio/mpeg"
                                onChange={(e) => handleInputChange('audioVoz', e.target.files[0])}
                                style={{ display: 'none' }}
                              />
                            </div>
                          </>
                        )}
                      </Card.Body>
                    </Card>

                    {/* Informações adicionais */}
                    <Alert variant="success">
                      <strong>✅ Por que isso é importante?</strong>
                      <p className="mb-0 mt-2">
                        Com esses dados, a IA poderá gerar vídeos personalizados, áudios para WhatsApp, 
                        respostas automáticas e conteúdo para redes sociais mantendo sua identidade e tom de voz únicos.
                      </p>
                    </Alert>

                    <Button variant="primary" className="mt-5" onClick={() => attemptTabChange('tab2')}>
                      Continuar para Dados Básicos
                    </Button>
                  </Form>
                </Tab.Pane>

                {/* Tab 2: Básico (era tab 1) */}
                <Tab.Pane eventKey="tab2">
                  <Form>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Dados Pessoais</span>
                    </div>
                    <Row className="gx-3">
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nome Completo <span className="text-danger">*</span></Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="João Pedro da Silva Santos"
                            value={formData.nomeCompleto}
                            onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nome Político/Urna <span className="text-danger">*</span></Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="João Silva"
                            value={formData.nomePolitico}
                            onChange={(e) => handleInputChange('nomePolitico', e.target.value)}
                            required
                          />
                          <Form.Text className="text-muted">
                            Nome usado em campanhas
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="gx-3">
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>E-mail {!isEditMode && <span className="text-danger">*</span>}</Form.Label>
                          <Form.Control 
                            type="email"
                            placeholder="joao.silva@partido.com.br"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required={!isEditMode}
                            disabled={isEditMode}
                          />
                          {isEditMode && (
                            <Form.Text className="text-muted">
                              O e-mail não pode ser alterado
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Senha {!isEditMode && <span className="text-danger">*</span>}</Form.Label>
                          <div className="position-relative">
                            <Form.Control 
                              type={showPassword ? "text" : "password"}
                              placeholder={isEditMode ? "Deixe em branco para não alterar" : "Mínimo 8 caracteres"}
                              value={formData.senha}
                              onChange={(e) => {
                                const { value } = e.target;
                                if (!value) setShowPassword(false);
                                handleInputChange('senha', value);
                              }}
                              className="pe-5"
                              required={!isEditMode}
                            />
                            {!!formData.senha && (
                              <Button
                                type="button"
                                variant="link"
                                className="position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </Button>
                            )}
                          </div>
                          {isEditMode ? (
                            <Form.Text className="text-muted">
                              Deixe em branco para manter a senha atual
                            </Form.Text>
                          ) : (
                            <Form.Text className="text-muted">
                              É necessário o mínimo de 8 caracteres.
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="gx-3">
                      <Col sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>CPF <span className="text-danger">*</span></Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={(e) => handleInputChange('cpf', e.target.value)}
                            inputMode="numeric"
                            maxLength={14}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Data de Nascimento</Form.Label>
                          <Form.Control 
                            type="date"
                            value={formData.dataNascimento}
                            onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Telefone/WhatsApp</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="(11) 99999-9999"
                            value={formData.telefone}
                            onChange={(e) => handleInputChange('telefone', e.target.value)}
                            inputMode="numeric"
                            maxLength={15}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Cargo e Mandato</span>
                    </div>
                    
                    <Row className="gx-3">
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Cargo Político <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.cargo}
                            onChange={(e) => handleInputChange('cargo', e.target.value)}
                            required
                          >
                            <option value="">Selecione...</option>
                            <optgroup label="Executivo Municipal">
                              <option value="prefeito">Prefeito</option>
                              <option value="vice_prefeito">Vice-Prefeito</option>
                            </optgroup>
                            <optgroup label="Executivo Estadual">
                              <option value="governador">Governador</option>
                              <option value="vice_governador">Vice-Governador</option>
                            </optgroup>
                            <optgroup label="Executivo Federal">
                              <option value="presidente">Presidente</option>
                              <option value="vice_presidente">Vice-Presidente</option>
                            </optgroup>
                            <optgroup label="Legislativo">
                              <option value="vereador">Vereador</option>
                              <option value="deputado_estadual">Deputado Estadual</option>
                              <option value="deputado_federal">Deputado Federal</option>
                              <option value="senador">Senador</option>
                            </optgroup>
                            <optgroup label="Equipe">
                              <option value="gerente_campanha">Gerente de Campanha</option>
                              <option value="coordenador">Coordenador</option>
                            </optgroup>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            required
                          >
                            <option value="candidato">Candidato</option>
                            <option value="eleito">Eleito</option>
                            <option value="em_mandato">Em Mandato</option>
                            <option value="ex_mandato">Ex-Mandatário</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="gx-3">
                      <Col sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Território <span className="text-danger">*</span></Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="Ex: São Paulo"
                            value={formData.territorio}
                            onChange={(e) => handleInputChange('territorio', e.target.value)}
                            required
                          />
                          <Form.Text className="text-muted">
                            Cidade, Estado ou País
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Ano da Eleição</Form.Label>
                          <Form.Select
                            value={formData.anoEleicao}
                            onChange={(e) => handleInputChange('anoEleicao', e.target.value)}
                          >
                            <option value="">Selecione...</option>
                            <option value="2024">2024</option>
                            <option value="2026">2026</option>
                            <option value="2028">2028</option>
                            <option value="2030">2030</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Número do Candidato</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="Ex: 15"
                            maxLength="5"
                            value={formData.numeroCandidato}
                            onChange={(e) => handleInputChange('numeroCandidato', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="gx-3">
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Partido</Form.Label>
                          {canEditParty ? (
                            <>
                              <Form.Control
                                type="text"
                                placeholder="Ex: Sigla - Nome do Partido"
                                value={formData.partido}
                                onChange={(e) => handleInputChange('partido', e.target.value)}
                              />
                              <Form.Text className="text-muted">
                                Preenchido automaticamente a partir do{' '}
                                <a href="/apps/admin/settings">Perfil do Partido</a>.
                                Você pode editar se necessário.
                              </Form.Text>
                            </>
                          ) : (
                            <>
                              <div
                                className="form-control bg-light text-muted"
                                style={{ cursor: 'not-allowed', userSelect: 'none' }}
                              >
                                {formData.partido || '—'}
                              </div>
                              <Form.Text className="text-muted">
                                <span className="text-warning fw-semibold">🔒</span>{' '}
                                Gerenciado pelo partido. Apenas administradores podem alterar.
                              </Form.Text>
                            </>
                          )}
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Coligação</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="Ex: Unidos por São Paulo"
                            value={formData.coligacao}
                            onChange={(e) => handleInputChange('coligacao', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* ── Dados TSE ─────────────────────────────────── */}
                    <Accordion className="mt-4 mb-2">
                      <Accordion.Item eventKey="tse">
                        <Accordion.Header>
                          <span className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                            📋 Dados para Prestação de Contas (TSE)
                            <Badge bg="secondary" className="ms-2 fw-normal" style={{ fontSize: '0.68rem' }}>Opcional</Badge>
                          </span>
                        </Accordion.Header>
                        <Accordion.Body className="pt-3 pb-2">
                          <p className="text-muted small mb-3">
                            Campos exigidos pelo SPCE/TSE para geração do CSV de prestação de contas. Preencha após obter o número de registro no portal do TSE.
                          </p>
                          <Row className="gx-3">
                            <Col sm={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Nº Sequencial TSE <small className="text-muted">(SQ_CANDIDATO)</small></Form.Label>
                                <Form.Control
                                  type="text"
                                  placeholder="Ex: 123456"
                                  value={formData.sqCandidatoTSE}
                                  onChange={(e) => handleInputChange('sqCandidatoTSE', e.target.value)}
                                />
                                <Form.Text className="text-muted">Gerado pelo TSE no ato do registro</Form.Text>
                              </Form.Group>
                            </Col>
                            <Col sm={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>UF <small className="text-muted">(SG_UF)</small></Form.Label>
                                <Form.Select
                                  value={formData.uf}
                                  onChange={(e) => handleInputChange('uf', e.target.value)}
                                >
                                  <option value="">Selecione...</option>
                                  {['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col sm={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Município <small className="text-muted">(NM_MUNICIPIO)</small></Form.Label>
                                <Form.Control
                                  type="text"
                                  placeholder="Ex: Rio de Janeiro"
                                  value={formData.municipio}
                                  onChange={(e) => handleInputChange('municipio', e.target.value)}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          <Row className="gx-3">
                            <Col sm={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Sigla do Partido <small className="text-muted">(SG_PARTIDO)</small></Form.Label>
                                <Form.Control
                                  type="text"
                                  placeholder="Ex: PT"
                                  maxLength={20}
                                  value={formData.siglaPartido}
                                  onChange={(e) => handleInputChange('siglaPartido', e.target.value.toUpperCase())}
                                />
                              </Form.Group>
                            </Col>
                            <Col sm={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Número do Partido <small className="text-muted">(NR_PARTIDO)</small></Form.Label>
                                <Form.Control
                                  type="text"
                                  placeholder="Ex: 13"
                                  maxLength={4}
                                  inputMode="numeric"
                                  value={formData.numeroPartido}
                                  onChange={(e) => handleInputChange('numeroPartido', e.target.value.replace(/\D/g, ''))}
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>

                    <div className="d-flex gap-2 mt-5">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => attemptTabChange('tab1')}
                      >
                        Voltar
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => attemptTabChange('tab3')}
                      >
                        Continuar para Identidade Visual
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>

                {/* Tab 3: Visual (era tab 2) */}
                <Tab.Pane eventKey="tab3">
                  <Form>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Fotos do Político</span>
                    </div>
                    
                    {/* Fotos Principais */}
                    <h6 className="mb-3">Fotos Principais</h6>
                    <Row className="gx-3 mb-4">
                      <Col md={4}>
                        <Card className="mb-3 h-100">
                          <Card.Body>
                            <div className="text-center">
                              <h6 className="mb-1">Foto Principal</h6>
                              <Badge bg="danger" className="mb-2" size="sm">Principal</Badge>
                              <div className="avatar avatar-xxl avatar-rounded mx-auto mb-3 bg-light">
                                {formData.fotoPrincipal ? (
                                  <img src={URL.createObjectURL(formData.fotoPrincipal)} alt="Preview" className="avatar-img" />
                                ) : existingMedia.fotoPrincipal ? (
                                  <img src={existingMedia.fotoPrincipal} alt="Foto salva" className="avatar-img" />
                                ) : (
                                  <div className="d-flex align-items-center justify-content-center h-100">
                                    <ImageIcon size={40} className="text-muted" />
                                  </div>
                                )}
                              </div>
                              <Button variant="soft-primary" size="sm" className="btn-file w-100">
                                {formData.fotoPrincipal ? 'Trocar Foto' : 'Upload Foto'}
                                <Form.Control 
                                  type="file" 
                                  className="upload"
                                  accept="image/jpeg,image/png"
                                  onChange={(e) => handleInputChange('fotoPrincipal', e.target.files[0])}
                                />
                              </Button>
                              {formData.fotoPrincipal && (
                                <Button
                                  type="button"
                                  variant="soft-danger"
                                  size="sm"
                                  className="w-100 mt-2"
                                  onClick={() => handleInputChange('fotoPrincipal', null)}
                                >
                                  Cancelar Upload
                                </Button>
                              )}
                              {!formData.fotoPrincipal && existingMedia.fotoPrincipal && isEditMode && (
                                <Button
                                  type="button"
                                  variant="outline-danger"
                                  size="sm"
                                  className="w-100 mt-2"
                                  onClick={() => handleDeleteMedia('fotoPrincipal')}
                                >
                                  <Trash2 size={14} className="me-1" />
                                  Remover do Servidor
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col md={4}>
                        <Card className="mb-3 h-100">
                          <Card.Body>
                            <div className="text-center">
                              <h6 className="mb-2">Foto de Meio Corpo</h6>
                              <div className="mb-3" style={{ height: '120px', backgroundColor: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {formData.fotoBanner ? (
                                  <img src={URL.createObjectURL(formData.fotoBanner)} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
                                ) : existingMedia.fotoBanner ? (
                                  <img src={existingMedia.fotoBanner} alt="Foto salva" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }} />
                                ) : (
                                  <ImageIcon size={40} className="text-muted" />
                                )}
                              </div>
                              <Button variant="soft-primary" size="sm" className="btn-file w-100">
                                {formData.fotoBanner ? 'Trocar Foto' : 'Upload Foto'}
                                <Form.Control 
                                  type="file" 
                                  className="upload"
                                  accept="image/jpeg,image/png"
                                  onChange={(e) => handleInputChange('fotoBanner', e.target.files[0])}
                                />
                              </Button>
                              {formData.fotoBanner && (
                                <Button
                                  type="button"
                                  variant="soft-danger"
                                  size="sm"
                                  className="w-100 mt-2"
                                  onClick={() => handleInputChange('fotoBanner', null)}
                                >
                                  Remover Foto
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col md={4}>
                        <Card className="mb-3 h-100">
                          <Card.Body>
                            <div className="text-center">
                              <h6 className="mb-2">Corpo Inteiro</h6>
                              <div className="mb-3" style={{ height: '120px', backgroundColor: '#f5f5f5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {formData.fotoCorpoInteiro ? (
                                  <img src={URL.createObjectURL(formData.fotoCorpoInteiro)} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                                ) : existingMedia.fotoCorpoInteiro ? (
                                  <img src={existingMedia.fotoCorpoInteiro} alt="Foto salva" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                                ) : (
                                  <ImageIcon size={40} className="text-muted" />
                                )}
                              </div>
                              <Button variant="soft-primary" size="sm" className="btn-file w-100">
                                {formData.fotoCorpoInteiro ? 'Trocar Foto' : 'Upload Foto'}
                                <Form.Control 
                                  type="file" 
                                  className="upload"
                                  accept="image/jpeg,image/png"
                                  onChange={(e) => handleInputChange('fotoCorpoInteiro', e.target.files[0])}
                                />
                              </Button>
                              {formData.fotoCorpoInteiro && (
                                <Button
                                  type="button"
                                  variant="soft-danger"
                                  size="sm"
                                  className="w-100 mt-2"
                                  onClick={() => handleInputChange('fotoCorpoInteiro', null)}
                                >
                                  Remover Foto
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    {/* Fotos Adicionais */}
                    <h6 className="mb-3">Fotos Adicionais</h6>
                    <Row className="gx-3 mb-4">
                      <Col md={4}>
                        <Card className="mb-3 h-100">
                          <Card.Body>
                            <div className="text-center">
                              <h6 className="mb-2">Perfil Esquerda</h6>
                              <small className="text-muted d-block mb-3">Ângulo esquerdo</small>
                              <div className="mb-3" style={{ height: '160px', backgroundColor: 'transparent', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}>
                                {formData.fotoPerfilEsquerda ? (
                                  <img src={URL.createObjectURL(formData.fotoPerfilEsquerda)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', borderRadius: '8px' }} />
                                ) : existingMedia.fotoPerfilEsquerda ? (
                                  <img src={existingMedia.fotoPerfilEsquerda} alt="Foto salva" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', borderRadius: '8px' }} />
                                ) : (
                                  <img
                                    src={additionalPhotoPlaceholders.fotoPerfilEsquerda}
                                    alt="Placeholder Perfil Esquerda"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', borderRadius: '8px' }}
                                  />
                                )}
                              </div>
                              <Button variant="soft-primary" size="sm" className="btn-file w-100">
                                {formData.fotoPerfilEsquerda ? 'Trocar Foto' : 'Upload'}
                                <Form.Control 
                                  type="file" 
                                  className="upload"
                                  accept="image/jpeg,image/png"
                                  onChange={(e) => handleInputChange('fotoPerfilEsquerda', e.target.files[0])}
                                />
                              </Button>
                              {formData.fotoPerfilEsquerda && (
                                <Button
                                  type="button"
                                  variant="soft-danger"
                                  size="sm"
                                  className="w-100 mt-2"
                                  onClick={() => handleInputChange('fotoPerfilEsquerda', null)}
                                >
                                  Remover
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col md={4}>
                        <Card className="mb-3 h-100">
                          <Card.Body>
                            <div className="text-center">
                              <h6 className="mb-2">Perfil Direita</h6>
                              <small className="text-muted d-block mb-3">Ângulo direito</small>
                              <div className="mb-3" style={{ height: '160px', backgroundColor: 'transparent', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}>
                                {formData.fotoPerfilDireita ? (
                                  <img src={URL.createObjectURL(formData.fotoPerfilDireita)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', borderRadius: '8px' }} />
                                ) : existingMedia.fotoPerfilDireita ? (
                                  <img src={existingMedia.fotoPerfilDireita} alt="Foto salva" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', borderRadius: '8px' }} />
                                ) : (
                                  <img
                                    src={additionalPhotoPlaceholders.fotoPerfilDireita}
                                    alt="Placeholder Perfil Direita"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', borderRadius: '8px' }}
                                  />
                                )}
                              </div>
                              <Button variant="soft-primary" size="sm" className="btn-file w-100">
                                {formData.fotoPerfilDireita ? 'Trocar Foto' : 'Upload'}
                                <Form.Control 
                                  type="file" 
                                  className="upload"
                                  accept="image/jpeg,image/png"
                                  onChange={(e) => handleInputChange('fotoPerfilDireita', e.target.files[0])}
                                />
                              </Button>
                              {formData.fotoPerfilDireita && (
                                <Button
                                  type="button"
                                  variant="soft-danger"
                                  size="sm"
                                  className="w-100 mt-2"
                                  onClick={() => handleInputChange('fotoPerfilDireita', null)}
                                >
                                  Remover
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col md={4}>
                        <Card className="mb-3 h-100">
                          <Card.Body>
                            <div className="text-center">
                              <h6 className="mb-2">Foto de Frente</h6>
                              <small className="text-muted d-block mb-3">Rosto e ombros</small>
                              <div className="mb-3" style={{ height: '160px', backgroundColor: 'transparent', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0' }}>
                                {formData.fotoEvento ? (
                                  <img src={URL.createObjectURL(formData.fotoEvento)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', transform: 'scale(1.08)', borderRadius: '8px' }} />
                                ) : existingMedia.fotoEvento ? (
                                  <img src={existingMedia.fotoEvento} alt="Foto salva" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', transform: 'scale(1.08)', borderRadius: '8px' }} />
                                ) : (
                                  <img
                                    src={additionalPhotoPlaceholders.fotoEvento}
                                    alt="Placeholder Foto de Frente"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', transform: 'scale(1.08)', borderRadius: '8px' }}
                                  />
                                )}
                              </div>
                              <Button variant="soft-primary" size="sm" className="btn-file w-100">
                                {formData.fotoEvento ? 'Trocar Foto' : 'Upload'}
                                <Form.Control 
                                  type="file" 
                                  className="upload"
                                  accept="image/jpeg,image/png"
                                  onChange={(e) => handleInputChange('fotoEvento', e.target.files[0])}
                                />
                              </Button>
                              {formData.fotoEvento && (
                                <Button
                                  type="button"
                                  variant="soft-danger"
                                  size="sm"
                                  className="w-100 mt-2"
                                  onClick={() => handleInputChange('fotoEvento', null)}
                                >
                                  Remover
                                </Button>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>

                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Logos e Branding</span>
                    </div>

                    <Alert variant="info" className="mb-3">
                      <strong>💡 Dica:</strong> Use logos em PNG com fundo transparente para melhor resultado.
                      <span className="ms-3 fw-bold">
                        {existingMedia.logos.length + pendingLogos.length} / 20 logos
                      </span>
                    </Alert>

                    {logoUploading && (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                        <span className="text-muted">Processando logo...</span>
                      </div>
                    )}

                    <Row className="gx-3 mb-4">
                      {/* Logos salvas no servidor */}
                      {existingMedia.logos.map((logo, idx) => (
                        <Col key={`saved-${idx}`} xs={6} sm={4} md={3} className="mb-3">
                          <Card className="h-100">
                            <Card.Body className="text-center p-2">
                              <div className="mb-2" style={{ height: '90px', backgroundColor: '#f5f5f5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <img src={logo.url} alt={logo.nome || `Logo ${idx + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                              </div>
                              <small className="text-muted d-block text-truncate mb-2" title={logo.nome}>{logo.nome || `Logo ${idx + 1}`}</small>
                              <Button
                                type="button"
                                variant="soft-danger"
                                size="sm"
                                className="w-100"
                                disabled={logoUploading}
                                onClick={() => handleLogoRemove(idx, false)}
                              >
                                <Trash2 size={12} className="me-1" />
                                Remover
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}

                      {/* Logos pendentes (modo criação) */}
                      {pendingLogos.map((item, idx) => (
                        <Col key={`pending-${idx}`} xs={6} sm={4} md={3} className="mb-3">
                          <Card className="h-100 border-success">
                            <Card.Body className="text-center p-2">
                              <Badge bg="success" className="mb-1" style={{ fontSize: '10px' }}>Novo</Badge>
                              <div className="mb-2" style={{ height: '90px', backgroundColor: '#f5f5f5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <img src={item.previewUrl} alt={item.nome} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                              </div>
                              <small className="text-muted d-block text-truncate mb-2" title={item.nome}>{item.nome}</small>
                              <Button
                                type="button"
                                variant="soft-danger"
                                size="sm"
                                className="w-100"
                                onClick={() => handleLogoRemove(idx, true)}
                              >
                                <Trash2 size={12} className="me-1" />
                                Remover
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}

                      {/* Botão Adicionar Logo */}
                      {(existingMedia.logos.length + pendingLogos.length) < 20 && (
                        <Col xs={6} sm={4} md={3} className="mb-3">
                          <Card className="h-100 border-dashed" style={{ border: '2px dashed #dee2e6', cursor: 'pointer' }}>
                            <Card.Body className="text-center p-2 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '170px' }}>
                              <Upload size={28} className="text-muted mb-2" />
                              <small className="text-muted mb-2">PNG • até 5MB</small>
                              <Button variant="soft-primary" size="sm" className="btn-file w-100" disabled={logoUploading}>
                                Adicionar Logo
                                <Form.Control
                                  type="file"
                                  className="upload"
                                  accept="image/png"
                                  onChange={(e) => {
                                    if (e.target.files[0]) {
                                      handleLogoAdd(e.target.files[0]);
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      )}
                    </Row>

                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Cores e Identidade</span>
                    </div>

                    <Row className="gx-3">
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Cor Principal</Form.Label>
                          <div className="d-flex gap-2 align-items-center">
                            <Form.Control 
                              type="color"
                              value={formData.corPrimaria}
                              onChange={(e) => handleInputChange('corPrimaria', e.target.value)}
                              style={{ width: '60px', height: '40px' }}
                            />
                            <Form.Control 
                              type="text"
                              value={formData.corPrimaria}
                              onChange={(e) => handleInputChange('corPrimaria', e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                          <Form.Text>Cor primária da campanha</Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Cor Secundária</Form.Label>
                          <div className="d-flex gap-2 align-items-center">
                            <Form.Control 
                              type="color"
                              value={formData.corSecundaria}
                              onChange={(e) => handleInputChange('corSecundaria', e.target.value)}
                              style={{ width: '60px', height: '40px' }}
                            />
                            <Form.Control 
                              type="text"
                              value={formData.corSecundaria}
                              onChange={(e) => handleInputChange('corSecundaria', e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                          <Form.Text>Cor secundária/destaque</Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Slogan de Campanha</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="Ex: Por uma cidade melhor"
                            maxLength="80"
                            value={formData.slogan}
                            onChange={(e) => handleInputChange('slogan', e.target.value)}
                          />
                          <Form.Text>Máximo 80 caracteres</Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2 mt-5">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => attemptTabChange('tab2')}
                      >
                        Voltar
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => attemptTabChange('tab4')}
                      >
                        Continuar para Biografia
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>

                {/* Tab 4: Bio (era tab 3) */}
                <Tab.Pane eventKey="tab4">
                  <Form>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Biografia</span>
                    </div>

                    <Form.Group className="mb-4">
                      <div className="form-label-group">
                        <Form.Label>
                          Descrição Curta (Bio)
                          <Badge bg="info" className="ms-2">Redes Sociais</Badge>
                        </Form.Label>
                        <small className="text-muted">
                          {formData.bioShort.length}/280
                        </small>
                      </div>
                      <Form.Control 
                        as="textarea"
                        rows={3}
                        placeholder="Breve descrição em até 280 caracteres (ideal para Twitter/Instagram)"
                        maxLength={280}
                        value={formData.bioShort}
                        onChange={(e) => handleInputChange('bioShort', e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        💡 Use uma frase impactante que resuma quem você é
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Biografia Completa</Form.Label>
                      <Form.Control 
                        as="textarea"
                        rows={8}
                        placeholder="Conte sua história: origem, família, motivações para a política, principais realizações..."
                        value={formData.bioFull}
                        onChange={(e) => handleInputChange('bioFull', e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        💡 Seja autêntico e conecte-se emocionalmente com os eleitores
                      </Form.Text>
                    </Form.Group>

                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Formação e Experiência</span>
                    </div>

                    <Form.Group className="mb-4">
                      <Form.Label>Formação Acadêmica</Form.Label>
                      {renderRichTextEditor('formacao', 'Liste formações com lista bullet ou numerada', 120)}
                      <Form.Control 
                        className="d-none"
                        as="textarea"
                        rows={4}
                        placeholder="Ex:
• Graduação em Direito - USP (2005-2009)
• Especialização em Gestão Pública - FGV (2012)
• MBA em Políticas Públicas - Harvard (2015)"
                        value={formData.formacao}
                        onChange={(e) => handleInputChange('formacao', e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Experiência Profissional e Política</Form.Label>
                      {renderRichTextEditor('experiencia', 'Liste experiências profissionais e políticas', 150)}
                      <Form.Control 
                        className="d-none"
                        as="textarea"
                        rows={6}
                        placeholder="Ex:
• Vereador - Câmara Municipal (2016-2020)
• Secretário Municipal de Educação (2020-2024)
• Presidente da Comissão de Educação (2018-2019)"
                        value={formData.experiencia}
                        onChange={(e) => handleInputChange('experiencia', e.target.value)}
                      />
                    </Form.Group>

                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Realizações</span>
                    </div>

                    <Form.Group className="mb-4">
                      <Form.Label>Principais Realizações</Form.Label>
                      {renderRichTextEditor('realizacoes', 'Liste as principais conquistas e resultados', 150)}
                      <Form.Control 
                        className="d-none"
                        as="textarea"
                        rows={6}
                        placeholder="Liste suas principais conquistas, projetos implementados, leis aprovadas, etc."
                        value={formData.realizacoes}
                        onChange={(e) => handleInputChange('realizacoes', e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        💡 Use números e dados concretos quando possível (Ex: "Construí 15 creches", "Reduzi em 30%...")
                      </Form.Text>
                    </Form.Group>

                    <div className="d-flex gap-2 mt-5">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => attemptTabChange('tab3')}
                      >
                        Voltar
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => attemptTabChange('tab5')}
                      >
                        Continuar para Política
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>

                {/* Tab 5: Política (era tab 4) */}
                <Tab.Pane eventKey="tab5">
                  <Form>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Ideologia e Posicionamento</span>
                    </div>

                    <Row className="gx-3">
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Ideologia</Form.Label>
                          <Form.Select
                            value={formData.ideologia}
                            onChange={(e) => handleInputChange('ideologia', e.target.value)}
                          >
                            <option value="">Selecione...</option>
                            <option value="centro">Centro</option>
                            <option value="centro_direita">Centro-Direita</option>
                            <option value="centro_esquerda">Centro-Esquerda</option>
                            <option value="direita">Direita</option>
                            <option value="esquerda">Esquerda</option>
                            <option value="liberal">Liberal</option>
                            <option value="conservador">Conservador</option>
                            <option value="progressista">Progressista</option>
                            <option value="socdem">Social-Democrata</option>
                            <option value="outro">Outro</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={8}>
                        <Form.Group className="mb-3">
                          <Form.Label>Áreas de Foco Prioritárias</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="Ex: Educação, Saúde, Segurança Pública, Infraestrutura"
                            value={formData.areasFoco}
                            onChange={(e) => handleInputChange('areasFoco', e.target.value)}
                          />
                          <Form.Text>Separe por vírgula (até 5 áreas)</Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label>Valores e Princípios</Form.Label>
                      {renderRichTextEditor('valores', 'Descreva os valores que guiam sua atuação política', 130)}
                      <Form.Control 
                        className="d-none"
                        as="textarea"
                        rows={5}
                        placeholder="Descreva os valores que guiam sua atuação política: ética, transparência, compromisso social..."
                        value={formData.valores}
                        onChange={(e) => handleInputChange('valores', e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Manifesto Político</Form.Label>
                      {renderRichTextEditor('manifesto', 'Seu manifesto político: visão de futuro, compromissos e transformações', 180)}
                      <Form.Control 
                        className="d-none"
                        as="textarea"
                        rows={8}
                        placeholder="Seu manifesto político: visão de futuro, compromissos, transformações que deseja realizar..."
                        value={formData.manifesto}
                        onChange={(e) => handleInputChange('manifesto', e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        💡 Este é seu documento principal - seja claro e inspirador
                      </Form.Text>
                    </Form.Group>

                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Plano de Governo</span>
                    </div>

                    <Form.Group className="mb-4">
                      <Form.Label>Propostas Principais</Form.Label>
                      {renderRichTextEditor('propostas', 'Liste as principais propostas do plano de governo', 220)}
                      <Form.Control 
                        className="d-none"
                        as="textarea"
                        rows={10}
                        placeholder="Liste as principais propostas do seu plano de governo:

EDUCAÇÃO
• Ampliar vagas em creches municipais
• Modernizar escolas com tecnologia

SAÚDE
• Construir 5 novas UPAs
• Reduzir filas de especialistas

SEGURANÇA
• Ampliar iluminação pública
• Criar programa de segurança comunitária"
                        value={formData.propostas}
                        onChange={(e) => handleInputChange('propostas', e.target.value)}
                      />
                      <Form.Text className="text-muted">
                        💡 Organize por áreas temáticas com bullet points
                      </Form.Text>
                    </Form.Group>

                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Posicionamentos sobre Temas</span>
                    </div>

                    <Alert variant="info" className="mb-3">
                      <strong>💡 Para que serve?</strong> Seus posicionamentos serão usados pela IA 
                      para responder perguntas de eleitores de forma consistente com suas convicções.
                    </Alert>

                    <Accordion className="mb-4">
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>🏫 Educação</Accordion.Header>
                        <Accordion.Body>
                          <Form.Control 
                            as="textarea"
                            rows={4}
                            placeholder="Seu posicionamento sobre educação, políticas educacionais, valorização de professores..."
                            value={formData.posicionamentos.educacao}
                            onChange={(e) => handlePosicionamentoChange('educacao', e.target.value)}
                          />
                        </Accordion.Body>
                      </Accordion.Item>

                      <Accordion.Item eventKey="1">
                        <Accordion.Header>🏥 Saúde</Accordion.Header>
                        <Accordion.Body>
                          <Form.Control 
                            as="textarea"
                            rows={4}
                            placeholder="Seu posicionamento sobre saúde pública, infraestrutura hospitalar, atendimento..."
                            value={formData.posicionamentos.saude}
                            onChange={(e) => handlePosicionamentoChange('saude', e.target.value)}
                          />
                        </Accordion.Body>
                      </Accordion.Item>

                      <Accordion.Item eventKey="2">
                        <Accordion.Header>💼 Economia</Accordion.Header>
                        <Accordion.Body>
                          <Form.Control 
                            as="textarea"
                            rows={4}
                            placeholder="Seu posicionamento sobre economia, geração de empregos, desenvolvimento econômico..."
                            value={formData.posicionamentos.economia}
                            onChange={(e) => handlePosicionamentoChange('economia', e.target.value)}
                          />
                        </Accordion.Body>
                      </Accordion.Item>

                      <Accordion.Item eventKey="3">
                        <Accordion.Header>🚔 Segurança</Accordion.Header>
                        <Accordion.Body>
                          <Form.Control 
                            as="textarea"
                            rows={4}
                            placeholder="Seu posicionamento sobre segurança pública, policiamento, prevenção à violência..."
                            value={formData.posicionamentos.seguranca}
                            onChange={(e) => handlePosicionamentoChange('seguranca', e.target.value)}
                          />
                        </Accordion.Body>
                      </Accordion.Item>

                      <Accordion.Item eventKey="4">
                        <Accordion.Header>🌳 Meio Ambiente</Accordion.Header>
                        <Accordion.Body>
                          <Form.Control 
                            as="textarea"
                            rows={4}
                            placeholder="Seu posicionamento sobre meio ambiente, sustentabilidade, preservação..."
                            value={formData.posicionamentos.meioAmbiente}
                            onChange={(e) => handlePosicionamentoChange('meioAmbiente', e.target.value)}
                          />
                        </Accordion.Body>
                      </Accordion.Item>

                      <Accordion.Item eventKey="5">
                        <Accordion.Header>🏗️ Infraestrutura</Accordion.Header>
                        <Accordion.Body>
                          <Form.Control 
                            as="textarea"
                            rows={4}
                            placeholder="Seu posicionamento sobre infraestrutura, mobilidade urbana, saneamento..."
                            value={formData.posicionamentos.infraestrutura}
                            onChange={(e) => handlePosicionamentoChange('infraestrutura', e.target.value)}
                          />
                        </Accordion.Body>
                      </Accordion.Item>

                      <Accordion.Item eventKey="6">
                        <Accordion.Header>📝 Outros</Accordion.Header>
                        <Accordion.Body>
                          <Form.Control 
                            as="textarea"
                            rows={4}
                            placeholder="Outros posicionamentos sobre temas que você considera importantes..."
                            value={formData.posicionamentos.outros}
                            onChange={(e) => handlePosicionamentoChange('outros', e.target.value)}
                          />
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>

                    <div className="d-flex gap-2 mt-5">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => attemptTabChange('tab4')}
                      >
                        Voltar
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => attemptTabChange('tab6')}
                      >
                        Continuar para Redes Sociais
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>

                {/* Tab 6: Social (era tab 5) */}
                <Tab.Pane eventKey="tab6">
                  <Form>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Redes Sociais</span>
                    </div>

                    <Alert variant="info" className="mb-3">
                      <strong>💡 Dica:</strong> URLs completas facilitam o compartilhamento e links automáticos.
                    </Alert>

                    <Row className="gx-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>🌐 Site Oficial</Form.Label>
                          <Form.Control 
                            type="url"
                            placeholder="https://joaosilva.com.br"
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>📘 Facebook</Form.Label>
                          <Form.Control 
                            type="url"
                            placeholder="https://facebook.com/joaosilvaoficial"
                            value={formData.facebook}
                            onChange={(e) => handleInputChange('facebook', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="gx-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>📸 Instagram</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="@joaosilvaoficial"
                            value={formData.instagram}
                            onChange={(e) => handleInputChange('instagram', e.target.value)}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>🐦 Twitter / X</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="@joaosilva"
                            value={formData.twitter}
                            onChange={(e) => handleInputChange('twitter', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="gx-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>▶️ YouTube</Form.Label>
                          <Form.Control 
                            type="url"
                            placeholder="https://youtube.com/@joaosilva"
                            value={formData.youtube}
                            onChange={(e) => handleInputChange('youtube', e.target.value)}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>🎵 TikTok</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="@joaosilva"
                            value={formData.tiktok}
                            onChange={(e) => handleInputChange('tiktok', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="gx-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>💼 LinkedIn</Form.Label>
                          <Form.Control 
                            type="url"
                            placeholder="https://linkedin.com/in/joaosilva"
                            value={formData.linkedin}
                            onChange={(e) => handleInputChange('linkedin', e.target.value)}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>🧵 Threads</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="@joaosilva"
                            value={formData.threads}
                            onChange={(e) => handleInputChange('threads', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Contatos de Campanha</span>
                    </div>

                    <Row className="gx-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>📧 E-mail de Campanha</Form.Label>
                          <Form.Control 
                            type="email"
                            placeholder="contato@joaosilva.com.br"
                            value={formData.emailCampanha}
                            onChange={(e) => handleInputChange('emailCampanha', e.target.value)}
                          />
                          <Form.Text>E-mail público para contato</Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>📞 Telefone do Gabinete</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="(11) 3000-0000"
                            value={formData.telefoneGabinete}
                            onChange={(e) => handleInputChange('telefoneGabinete', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="gx-3">
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>📍 Endereço do Comitê/Gabinete</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="Rua, número, bairro, cidade - UF, CEP"
                            value={formData.enderecoComite}
                            onChange={(e) => handleInputChange('enderecoComite', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2 mt-5">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => attemptTabChange('tab5')}
                      >
                        Voltar
                      </Button>
                      <Button 
                        variant="success"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {currentStep === 'creating' && 'Criando...'}
                            {currentStep === 'uploading' && `Enviando (${uploadProgress}%)...`}
                            {currentStep === 'validating' && 'Validando...'}
                          </>
                        ) : (
                          <>
                            <Save size={16} className="me-2" />
                            Salvar Perfil Completo
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>
              </Tab.Content>
            </Col>

            {/* Preview Sidebar */}
            <Col lg={3} className="d-none d-lg-block">
              <div className="preview-sidebar" style={{ position: 'sticky', top: '100px' }}>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">📸 Preview</h6>
                  </Card.Header>
                  <Card.Body className="text-center">
                    <div className="avatar avatar-xxl avatar-rounded mx-auto mb-3">
                      <div className="avatar-img bg-light d-flex align-items-center justify-content-center">
                        {formData.fotoPrincipal ? (
                          <img
                            src={URL.createObjectURL(formData.fotoPrincipal)}
                            alt="Foto principal"
                            className="avatar-img"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : existingMedia.fotoPrincipal ? (
                          <img
                            src={existingMedia.fotoPrincipal}
                            alt="Foto principal"
                            className="avatar-img"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <User size={40} className="text-muted" />
                        )}
                      </div>
                    </div>

                    <h5 className="mb-1">
                      {formData.nomePolitico || formData.nomeCompleto || 'Nome do Político'}
                    </h5>

                    {formData.cargo && (
                      <Badge bg="warning" className="mb-2">
                        {formData.cargo.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}

                    {formData.territorio && (
                      <p className="text-muted small mb-3">
                        📍 {formData.territorio}
                      </p>
                    )}

                    {formData.slogan && (
                      <Alert variant="primary" className="py-2 small mb-3">
                        <strong>"{formData.slogan}"</strong>
                      </Alert>
                    )}

                    <hr />

                    <small className="text-muted d-block mb-2">Progresso do Perfil:</small>
                    <div className="progress mb-2" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar bg-success"
                        style={{ width: `${calcularProgresso()}%` }}
                      />
                    </div>
                    <small className="text-muted">
                      {calcularProgresso()}% completo
                    </small>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Tab.Container>
      </div>

      {/* Bottom Actions */}
      <div className="hk-pg-footer py-4">
        <div className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={() => router.push('/apps/users/list')}>
            Cancelar
          </Button>
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              Salvar Rascunho
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {currentStep === 'creating' && 'Criando...'}
                  {currentStep === 'updating' && 'Atualizando...'}
                  {currentStep === 'uploading' && `Enviando (${uploadProgress}%)...`}
                  {currentStep === 'validating' && 'Validando...'}
                </>
              ) : (
                <>
                  <Save size={16} className="me-2" />
                  {isEditMode ? 'Salvar Alterações' : 'Salvar e Finalizar'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      </>
      )}
    </Container>
    </>
  );
};

export default CreateAdminBody;
