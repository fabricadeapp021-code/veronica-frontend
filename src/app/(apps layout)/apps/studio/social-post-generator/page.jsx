'use client';

import React, { useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import SimpleBar from 'simplebar-react';
import { Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import {
  Check,
  Download,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Save,
  Upload,
  Zap,
} from 'react-feather';
import { showCustomAlert } from '@/components/CustomAlert';
import SocialPostGeneratorSidebar from '../SocialPostGeneratorSidebar';
import SocialPostGeneratorHeader from '../SocialPostGeneratorHeader';

const WEBHOOK_URL = 'https://nexus-n8n.captain.nexusbr.ai/webhook/criador-de-post';

const FORMAT_OPTIONS = [
  { value: '1', label: 'Classic Bottom' },
  { value: '2', label: 'Centered Editorial' },
  { value: '3', label: 'Color Gradient' },
  { value: '4', label: 'Split Bold' },
  { value: '5', label: 'IG Card Lateral' },
  { value: '6', label: 'Gallery Cards' },
];

const SIZE_OPTIONS = [
  { value: 'auto', ratio: '4:5', dimensions: '1600x2000', description: 'Padrão (Instagram post)' },
  { value: 'square_1_1', ratio: '1:1', dimensions: '1600x1600', description: 'Quadrado' },
  { value: 'portrait_4_5', ratio: '4:5', dimensions: '1600x2000', description: 'Portrait' },
  { value: 'portrait_3_4', ratio: '3:4', dimensions: '1600x2133', description: 'Portrait alto' },
  { value: 'portrait_2_3', ratio: '2:3', dimensions: '1600x2400', description: 'Portrait extra alto' },
  { value: 'story_9_16', ratio: '9:16', dimensions: '1080x1920', description: 'Stories/Reels' },
  { value: 'landscape_5_4', ratio: '5:4', dimensions: '1600x1280', description: 'Landscape suave' },
  { value: 'landscape_4_3', ratio: '4:3', dimensions: '1600x1200', description: 'Landscape clássico' },
  { value: 'landscape_3_2', ratio: '3:2', dimensions: '1600x1067', description: 'Landscape' },
  { value: 'wide_16_9', ratio: '16:9', dimensions: '1600x900', description: 'Widescreen' },
  { value: 'ultrawide_21_9', ratio: '21:9', dimensions: '2100x900', description: 'Ultra-wide' },
];

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'poppins', label: 'Poppins (padrão)' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'raleway', label: 'Raleway' },
  { value: 'oswald', label: 'Oswald' },
  { value: 'lato', label: 'Lato' },
  { value: 'bebas-neue', label: 'Bebas Neue' },
  { value: 'nunito', label: 'Nunito' },
];

const LOGO_SIZE_OPTIONS = [
  { value: 'small', label: 'Pequena (~8%)' },
  { value: 'medium', label: 'Média (~13.7%)' },
  { value: 'large', label: 'Grande (~20%)' },
];

const LOGO_POSITION_OPTIONS = [
  { value: 'top-left', label: 'Topo Esquerda' },
  { value: 'top-center', label: 'Topo Centro' },
  { value: 'top-right', label: 'Topo Direita' },
  { value: 'bottom-left', label: 'Base Esquerda' },
  { value: 'bottom-center', label: 'Base Centro' },
  { value: 'bottom-right', label: 'Base Direita' },
];

const REGISTERED_LOGOS = [
  { id: 'logo-1', label: 'Logo 1', url: 'https://exemplo.com/logo-1.png' },
  { id: 'logo-2', label: 'Logo 2', url: 'https://exemplo.com/logo-2.png' },
  { id: 'logo-3', label: 'Logo 3', url: 'https://exemplo.com/logo-3.png' },
  { id: 'logo-4', label: 'Logo 4', url: 'https://exemplo.com/logo-4.png' },
  { id: 'logo-5', label: 'Logo 5', url: 'https://exemplo.com/logo-5.png' },
  { id: 'logo-6', label: 'Logo 6', url: 'https://exemplo.com/logo-6.png' },
];

const GENERATING_STEPS = [
  'Normalizando dados do post',
  'Definindo layout e tamanho',
  'Compondo imagem e textos',
  'Renderizando resultado final',
];

const INITIAL_FORM = {
  mode: 'create',
  post_id: '',
  adjustment: '',
  format_id: '1',
  size_id: 'auto',
  primary_color: '#1a1a2e',
  secondary_color: '#e94560',
  logo_url: '',
  logo_size: 'medium',
  logo_position: 'top-right',
  font: 'poppins',
  text_source: 'ai',
  topic: '',
  cena: '',
  title: '',
  subtitle: '',
  text: '',
  bg_image_url: '',
  extra_images_source: '',
  extra_image_url_1: '',
  extra_image_url_2: '',
  extra_images_prompt: '',
  version_id: '1',
  telegram_chat_id: '',
};

const sanitizeHex = (value, fallback) => {
  const valid = /^#([0-9a-fA-F]{6})$/;
  return valid.test(value || '') ? value : fallback;
};

const cleanPayload = (payload) => {
  const entries = Object.entries(payload).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  });
  return Object.fromEntries(entries);
};

const TemplatePreview = ({ templateId }) => {
  const base = {
    background: '#bcc1c9',
    borderRadius: '8px',
    height: '180px',
    position: 'relative',
    overflow: 'hidden',
  };
  const line = (top, width, left = '14%') => ({
    position: 'absolute',
    top,
    left,
    width,
    height: '8px',
    background: '#79808d',
    borderRadius: '4px',
  });

  if (templateId === '1') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', top: '8%', left: '8%', width: '24px', height: '16px', background: '#9fa6b2', borderRadius: '4px' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '38%', background: '#a6adb8' }} />
        <div style={{ ...line('67%', '18%', '8%'), background: '#19b2a0' }} />
        <div style={line('74%', '42%', '8%')} />
        <div style={line('80%', '46%', '8%')} />
        <div style={line('86%', '36%', '8%')} />
      </div>
    );
  }

  if (templateId === '2') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', top: '8%', left: '8%', width: '24px', height: '16px', background: '#9fa6b2', borderRadius: '4px' }} />
        <div style={{ ...line('32%', '46%', '26%') }} />
        <div style={{ ...line('40%', '38%', '30%') }} />
        <div style={{ ...line('48%', '22%', '38%'), background: '#19b2a0' }} />
        <div style={{ ...line('56%', '44%', '28%'), height: '5px', opacity: 0.5 }} />
      </div>
    );
  }

  if (templateId === '3') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', top: '8%', left: '8%', width: '24px', height: '16px', background: '#9fa6b2', borderRadius: '4px' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', background: '#98c9c2' }} />
        <div style={{ ...line('66%', '58%', '20%') }} />
        <div style={{ ...line('74%', '44%', '26%') }} />
        <div style={{ ...line('82%', '16%', '43%'), background: '#19b2a0' }} />
      </div>
    );
  }

  if (templateId === '4') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, borderTop: '120px solid #9dcfca', borderRight: '90px solid transparent' }} />
        <div style={{ position: 'absolute', top: '8%', left: '8%', width: '24px', height: '16px', background: '#87a4ab', borderRadius: '4px' }} />
        <div style={{ ...line('26%', '42%', '6%') }} />
        <div style={{ ...line('35%', '38%', '7%') }} />
        <div style={{ ...line('44%', '34%', '8%') }} />
        <div style={{ ...line('53%', '30%', '10%'), background: '#64c0b3', height: '16px' }} />
        <div style={{ position: 'absolute', right: '9%', bottom: '10%', width: '72px', height: '38px', borderRadius: '8px', background: '#7ec1ba' }} />
      </div>
    );
  }

  if (templateId === '5') {
    return (
      <div style={base}>
        <div style={{ position: 'absolute', top: '8%', left: '8%', width: '24px', height: '16px', background: '#9fa6b2', borderRadius: '4px' }} />
        <div style={{ ...line('20%', '38%', '52%') }} />
        <div style={{ ...line('28%', '34%', '56%') }} />
        <div style={{ ...line('36%', '20%', '56%'), background: '#19b2a0' }} />
        <div style={{ ...line('44%', '30%', '56%'), opacity: 0.6 }} />
        <div style={{ position: 'absolute', left: '14%', bottom: '8%', width: '62px', height: '80px', background: '#d6d9df', borderRadius: '6px', transform: 'rotate(-4deg)' }} />
        <div style={{ position: 'absolute', left: '26%', bottom: '6%', width: '62px', height: '80px', background: '#e3e5ea', borderRadius: '6px', transform: 'rotate(3deg)' }} />
      </div>
    );
  }

  return (
    <div style={base}>
      <div style={{ position: 'absolute', top: '8%', left: '8%', width: '24px', height: '16px', background: '#9fa6b2', borderRadius: '4px' }} />
      <div style={{ ...line('22%', '62%', '18%') }} />
      <div style={{ ...line('30%', '20%', '40%'), background: '#19b2a0' }} />
      <div style={{ ...line('38%', '52%', '24%'), opacity: 0.7 }} />
      <div style={{ position: 'absolute', left: '18%', bottom: '22%', width: '58px', height: '74px', background: '#dddfe4', borderRadius: '6px', transform: 'rotate(-4deg)' }} />
      <div style={{ position: 'absolute', left: '42%', bottom: '18%', width: '58px', height: '74px', background: '#e7e8ec', borderRadius: '6px', transform: 'rotate(4deg)' }} />
    </div>
  );
};

const SocialPostGeneratorBody = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [responseData, setResponseData] = useState(null);
  const [isAdjustMode, setIsAdjustMode] = useState(false);

  const logoFileInputRef = useRef(null);
  const extraImg1FileInputRef = useRef(null);
  const extraImg2FileInputRef = useRef(null);

  const isManualText = form.text_source === 'manual';
  const isPostIdMissing = !form.post_id.trim();
  const isTopicMissing = !isManualText && !form.topic.trim();
  const isSceneMissing = !isManualText && !form.cena.trim();
  const isTitleMissing = isManualText && !form.title.trim();
  const selectedSize = useMemo(
    () => SIZE_OPTIONS.find((item) => item.value === form.size_id),
    [form.size_id],
  );

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setField('logo_url', e.target.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const makeExtraImageUploadHandler = (fieldName) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setField(fieldName, e.target.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setIsAdjustMode(false);
    setResponseData(null);
    setCurrentStep(-1);
  };

  const getMissingRequiredFields = (modeValue = 'create') => {
    const missing = [];

    if (!form.post_id.trim()) {
      missing.push('ID do Post');
    }

    if (modeValue === 'edit') {
      if (!form.adjustment.trim()) {
        missing.push('Ajustes / Instruções');
      }
      return missing;
    }

    if (isManualText) {
      if (!form.title.trim()) {
        missing.push('Título');
      }
      return missing;
    }

    if (!form.topic.trim()) {
      missing.push('Tópico / Tema');
    }

    if (!form.cena.trim()) {
      missing.push('Cena (descrição visual)');
    }

    return missing;
  };

  const buildPayload = (modeValue = 'create') => {
    const { extra_image_url_1, extra_image_url_2, ...restForm } = form;
    const extraImageUrls = [form.extra_image_url_1, form.extra_image_url_2]
      .map((url) => (url || '').trim())
      .filter(Boolean);

    const payload = {
      ...restForm,
      mode: modeValue,
      primary_color: sanitizeHex(form.primary_color, '#1a1a2e'),
      secondary_color: sanitizeHex(form.secondary_color, '#e94560'),
      adjustment: modeValue === 'edit' ? form.adjustment : '',
      title: isManualText ? form.title : '',
      subtitle: isManualText ? form.subtitle : '',
      text: isManualText ? form.text : '',
      topic: form.topic,
      cena: form.cena,
      extra_image_urls: extraImageUrls,
    };

    return cleanPayload(payload);
  };

  const submitPost = async (modeValue = 'create') => {
    const missingRequiredFields = getMissingRequiredFields(modeValue);
    if (missingRequiredFields.length > 0) {
      await showCustomAlert({
        variant: 'warning',
        title: 'Campos obrigatórios',
        html: `
          <div style="text-align:left">
            <p style="margin-bottom:8px;">Preencha os campos obrigatórios:</p>
            <ul style="margin:0;padding-left:18px;">
              ${missingRequiredFields.map((field) => `<li>${field}</li>`).join('')}
            </ul>
          </div>
        `,
        confirmButtonText: 'Entendi',
      });
      return;
    }

    setResponseData(null);
    setIsGenerating(true);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= GENERATING_STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 900);

    try {
      const payload = buildPayload(modeValue);

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.message || `Falha ao gerar post (HTTP ${response.status}).`);
      }

      setCurrentStep(GENERATING_STEPS.length - 1);
      setResponseData(data);

      setForm((prev) => ({
        ...prev,
        post_id: data?.post_id || prev.post_id,
        version_id: data?.version_id || prev.version_id,
      }));
    } catch (error) {
      await showCustomAlert({
        variant: 'danger',
        title: 'Não foi possível gerar o post',
        text: error?.message || 'Erro inesperado ao gerar post.',
        confirmButtonText: 'Entendi',
      });
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  const handleGeneratePost = async () => {
    await submitPost('create');
  };

  const handleApplyAdjustments = async () => {
    await submitPost('edit');
  };

  const handleDownload = () => {
    if (!responseData?.render_url) return;
    const link = document.createElement('a');
    link.href = responseData.render_url;
    link.download = `${responseData.post_id || 'post'}-v${responseData.version_id || '1'}.jpg`;
    link.target = '_blank';
    link.click();
  };

  const handleSaveToDocuments = () => {
    if (!responseData?.render_url) return;
    const link = document.createElement('a');
    link.href = responseData.render_url;
    link.download = `documento-${responseData.post_id || 'post'}-v${responseData.version_id || '1'}.jpg`;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="fm-body">
      <div className="container-fluid px-4 py-4 h-100">
        <Row className="g-4 h-100">
          <Col xl={5}>
            <SimpleBar style={{ maxHeight: 'calc(100vh - 170px)' }}>
              <Card className="card-border mb-4">
                <Card.Header className="d-flex justify-content-between align-items-start">
                  <div>
                    <Card.Title as="h5" className="mb-1">Gerador de Posts</Card.Title>
                    {/* <div className="small text-muted">Fluxo create/edit integrado ao webhook Posts 3.0</div> */}
                  </div>
                  <Button variant="outline-secondary" size="sm" onClick={resetForm}>
                    <RefreshCw size={14} className="me-1" />
                    Limpar
                  </Button>
                </Card.Header>

                <Card.Body>
                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Label className="fw-semibold">Criar novo post</Form.Label>
                      <Button
                        variant="primary"
                        className="w-100"
                        onClick={() => {
                          setField('mode', 'create');
                          setIsAdjustMode(false);
                        }}
                        active={form.mode === 'create'}
                      >
                        <Plus size={14} className="me-2" />
                        Novo Post
                      </Button>
                    </Col>
                    <Col md={6}>
                      <Form.Label className="fw-semibold">ID do Post <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        placeholder="ex: campanha-verao-01"
                        value={form.post_id}
                        onChange={(event) => setField('post_id', event.target.value)}
                      />
                      {isPostIdMissing && <div className="small text-danger mt-1">Campo obrigatório</div>}
                    </Col>
                  </Row>

                  <div className="text-uppercase fw-bold text-muted small mb-2">Conteúdo</div>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Texto</Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check
                        type="radio"
                        id="text-ai"
                        label="IA gera o texto"
                        name="text-source"
                        checked={form.text_source === 'ai'}
                        onChange={() => setField('text_source', 'ai')}
                      />
                      <Form.Check
                        type="radio"
                        id="text-manual"
                        label="Texto manual"
                        name="text-source"
                        checked={form.text_source === 'manual'}
                        onChange={() => setField('text_source', 'manual')}
                      />
                    </div>
                  </Form.Group>

                  {isManualText && (
                    <>
                      <Row className="g-3 mb-3">
                        <Col md={6}>
                          <Form.Label className="fw-semibold">Título <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            placeholder="Título do post"
                            value={form.title}
                            onChange={(event) => setField('title', event.target.value)}
                            maxLength={50}
                          />
                          {isTitleMissing && <div className="small text-danger mt-1">Campo obrigatório</div>}
                          <Form.Text className="text-muted">{form.title.length}/50</Form.Text>
                        </Col>
                        <Col md={6}>
                          <Form.Label className="fw-semibold">Subtítulo (opcional)</Form.Label>
                          <Form.Control
                            placeholder="Subtítulo do post"
                            value={form.subtitle}
                            onChange={(event) => setField('subtitle', event.target.value)}
                            maxLength={80}
                          />
                          <Form.Text className="text-muted">{form.subtitle.length}/80</Form.Text>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Texto</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Texto principal do post"
                          value={form.text}
                          onChange={(event) => setField('text', event.target.value)}
                          maxLength={600}
                        />
                      </Form.Group>
                    </>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Tópico / Tema {!isManualText && <span className="text-danger">*</span>}
                    </Form.Label>
                    <Form.Control
                      placeholder="Ex: Promoção de verão 50% off"
                      value={form.topic}
                      onChange={(event) => setField('topic', event.target.value)}
                      maxLength={200}
                    />
                    {isTopicMissing && <div className="small text-danger mt-1">Campo obrigatório</div>}
                    <Form.Text className="text-muted">{form.topic.length}/200 caracteres</Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      Cena (descrição visual) {!isManualText && <span className="text-danger">*</span>}
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Ex: SUV azul de luxo em hall moderno com iluminação dourada"
                      value={form.cena}
                      onChange={(event) => setField('cena', event.target.value)}
                      maxLength={500}
                    />
                    {isSceneMissing && <div className="small text-danger mt-1">Campo obrigatório</div>}
                    <Form.Text className="text-muted">{form.cena.length}/500 caracteres</Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Imagem de Fundo (opcional)</Form.Label>
                    <Form.Control
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={form.bg_image_url}
                      onChange={(event) => setField('bg_image_url', event.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Se vazio, a IA gera a imagem. Se preenchido, o sistema usa sua URL.
                    </Form.Text>
                  </Form.Group>

                  <div className="text-uppercase fw-bold text-muted small mb-2">Visual</div>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Layout do post</Form.Label>
                    <div className="d-flex gap-3 mb-3">
                      <Form.Check
                        type="radio"
                        id="layout-choose"
                        name="layout-mode"
                        label="Escolher"
                        checked={form.format_id !== 'ai'}
                        onChange={() => setField('format_id', form.format_id === 'ai' ? '1' : form.format_id)}
                      />
                      <Form.Check
                        type="radio"
                        id="layout-ai"
                        name="layout-mode"
                        label="Definido por IA"
                        checked={form.format_id === 'ai'}
                        onChange={() => setField('format_id', 'ai')}
                      />
                    </div>
                    {form.format_id !== 'ai' && (
                      <Row className="g-3">
                        {FORMAT_OPTIONS.map((option) => (
                          <Col md={4} key={option.value}>
                            <Card
                              className={classNames('h-100', {
                                'border-primary': form.format_id === option.value,
                              })}
                              onClick={() => setField('format_id', option.value)}
                              style={{
                                cursor: 'pointer',
                                borderWidth: form.format_id === option.value ? '2px' : '1px',
                              }}
                            >
                              <Card.Body className="p-2">
                                <TemplatePreview templateId={option.value} />
                                <div className="small text-center mt-2">{option.label}</div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </Form.Group>

                  <Row className="g-3 mb-3">
                    <Col md={6}>
                      <Form.Label className="fw-semibold">Tamanho</Form.Label>
                      <Form.Select value={form.size_id} onChange={(event) => setField('size_id', event.target.value)}>
                        {SIZE_OPTIONS.map((size) => (
                          <option key={size.value} value={size.value}>
                            {size.value} - {size.dimensions}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={6}>
                      <Form.Label className="fw-semibold">Fonte</Form.Label>
                      <Form.Select value={form.font} onChange={(event) => setField('font', event.target.value)}>
                        {FONT_OPTIONS.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>

                  <Row className="g-3 mb-4">
                    <Col md={6}>
                      <Form.Label className="fw-semibold">Cor primaria</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control
                          type="color"
                          value={form.primary_color}
                          onChange={(event) => setField('primary_color', event.target.value)}
                          style={{ maxWidth: '62px' }}
                        />
                        <Form.Control
                          value={form.primary_color}
                          onChange={(event) => setField('primary_color', event.target.value)}
                        />
                      </div>
                    </Col>
                    <Col md={6}>
                      <Form.Label className="fw-semibold">Cor secundaria</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control
                          type="color"
                          value={form.secondary_color}
                          onChange={(event) => setField('secondary_color', event.target.value)}
                          style={{ maxWidth: '62px' }}
                        />
                        <Form.Control
                          value={form.secondary_color}
                          onChange={(event) => setField('secondary_color', event.target.value)}
                        />
                      </div>
                    </Col>
                  </Row>

                  <div className="text-uppercase fw-bold text-muted small mb-2">Mídia</div>

                  <Card
                    className="mb-3"
                    style={{
                      borderColor: '#91dbd2',
                      background: '#edf8f7',
                    }}
                  >
                    <Card.Body>
                      <div className="fw-semibold mb-3" style={{ color: '#049a86' }}>Logo</div>

                      {/* Hidden file input for logo upload */}
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleLogoUpload}
                      />

                      <div className="d-flex gap-2 mb-2 align-items-center">
                        {/* Logo preview thumbnail */}
                        {form.logo_url && (
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 6,
                              border: '1.5px solid #91dbd2',
                              overflow: 'hidden',
                              flexShrink: 0,
                              background: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={form.logo_url}
                              alt="logo preview"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}
                        <Form.Control
                          placeholder="URL da logo ou faça upload"
                          value={form.logo_url}
                          onChange={(event) => setField('logo_url', event.target.value)}
                        />
                        <Button
                          variant="light"
                          className="border"
                          title="Fazer upload da logo"
                          onClick={() => logoFileInputRef.current?.click()}
                        >
                          <Upload size={16} />
                        </Button>
                        {form.logo_url && (
                          <Button
                            variant="light"
                            className="border text-danger"
                            title="Remover logo"
                            onClick={() => setField('logo_url', '')}
                          >
                            ×
                          </Button>
                        )}
                      </div>

                      <div className="small text-muted mb-2">Logos cadastradas</div>
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        {REGISTERED_LOGOS.map((logo) => {
                          const isSelected = form.logo_url === logo.url;
                          return (
                            <Button
                              key={logo.id}
                              variant="light"
                              className={classNames('border', { 'border-primary': isSelected })}
                              style={{
                                width: '74px',
                                height: '60px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#7c7f86',
                                background: isSelected ? '#dceff0' : '#eef0f3',
                              }}
                              onClick={() => setField('logo_url', logo.url)}
                            >
                              {logo.label}
                            </Button>
                          );
                        })}
                      </div>

                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Label className="fw-semibold mb-1">Tamanho</Form.Label>
                          <Form.Select value={form.logo_size} onChange={(event) => setField('logo_size', event.target.value)}>
                            {LOGO_SIZE_OPTIONS.map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={6}>
                          <Form.Label className="fw-semibold mb-1">Posição</Form.Label>
                          <Form.Select value={form.logo_position} onChange={(event) => setField('logo_position', event.target.value)}>
                            {LOGO_POSITION_OPTIONS.map((item) => (
                              <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                          </Form.Select>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Imagens extras (máximo 2)</Form.Label>

                    {/* Hidden file inputs */}
                    <input
                      ref={extraImg1FileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={makeExtraImageUploadHandler('extra_image_url_1')}
                    />
                    <input
                      ref={extraImg2FileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={makeExtraImageUploadHandler('extra_image_url_2')}
                    />

                    <div className="d-flex gap-2 mb-2 align-items-center">
                      {form.extra_image_url_1 && (
                        <div style={{ width: 40, height: 40, borderRadius: 6, border: '1.5px solid #dee2e6', overflow: 'hidden', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={form.extra_image_url_1} alt="extra 1" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                      )}
                      <Form.Control
                        placeholder="Imagem extra 1"
                        value={form.extra_image_url_1}
                        onChange={(event) => setField('extra_image_url_1', event.target.value)}
                      />
                      <Button variant="light" className="border" title="Fazer upload da imagem extra 1" onClick={() => extraImg1FileInputRef.current?.click()}>
                        <Upload size={16} />
                      </Button>
                      {form.extra_image_url_1 && (
                        <Button variant="light" className="border text-danger" title="Remover imagem extra 1" onClick={() => setField('extra_image_url_1', '')}>
                          ×
                        </Button>
                      )}
                    </div>

                    <div className="d-flex gap-2 align-items-center">
                      {form.extra_image_url_2 && (
                        <div style={{ width: 40, height: 40, borderRadius: 6, border: '1.5px solid #dee2e6', overflow: 'hidden', flexShrink: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={form.extra_image_url_2} alt="extra 2" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                      )}
                      <Form.Control
                        placeholder="Imagem extra 2"
                        value={form.extra_image_url_2}
                        onChange={(event) => setField('extra_image_url_2', event.target.value)}
                      />
                      <Button variant="light" className="border" title="Fazer upload da imagem extra 2" onClick={() => extraImg2FileInputRef.current?.click()}>
                        <Upload size={16} />
                      </Button>
                      {form.extra_image_url_2 && (
                        <Button variant="light" className="border text-danger" title="Remover imagem extra 2" onClick={() => setField('extra_image_url_2', '')}>
                          ×
                        </Button>
                      )}
                    </div>
                  </Form.Group>

                  <Button className="w-100" variant="primary" onClick={handleGeneratePost} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Gerando post...
                      </>
                    ) : (
                      <>
                        <Zap size={16} className="me-2" />
                        Gerar post
                      </>
                    )}
                  </Button>
                </Card.Body>
              </Card>
            </SimpleBar>
          </Col>

          <Col xl={7}>
            <SimpleBar style={{ maxHeight: 'calc(100vh - 170px)' }}>
              <Card className="card-border mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title as="h5" className="mb-1">Preview</Card.Title>
                    <div className="small text-muted">
                      {selectedSize ? `${selectedSize.dimensions} (${selectedSize.ratio})` : 'Tamanho padrão'}
                    </div>
                  </div>
                  {responseData?.version_id && (
                    <Badge bg="light" text="dark">versão {responseData.version_id}</Badge>
                  )}
                </Card.Header>
                <Card.Body>
                  {isGenerating && (
                    <div className="mb-4">
                      {GENERATING_STEPS.map((step, index) => (
                        <div
                          key={step}
                          className={classNames('rounded p-2 mb-2', {
                            'bg-light-success text-success': currentStep > index,
                            'bg-primary text-white': currentStep === index,
                            'bg-light text-muted': currentStep < index,
                          })}
                        >
                          <div className="d-flex align-items-center">
                            {currentStep > index ? (
                              <Check size={14} className="me-2" />
                            ) : currentStep === index ? (
                              <Spinner animation="border" size="sm" className="me-2" />
                            ) : (
                              <span className="me-2">•</span>
                            )}
                            <span className="small fw-semibold">{step}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {responseData?.render_url ? (
                    <>
                      <div className="border rounded overflow-hidden mb-3 bg-light">
                        <img
                          src={responseData.render_url}
                          alt="Post renderizado"
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                      </div>

                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <Badge bg="success">ok</Badge>
                        {responseData.post_id && <Badge bg="light" text="dark">post_id: {responseData.post_id}</Badge>}
                        {responseData.bg_url && <Badge bg="light" text="dark">bg_url disponível</Badge>}
                      </div>

                    </>
                  ) : (
                    <div className="text-center py-5 text-muted">
                      <ImageIcon size={54} strokeWidth={1.5} className="mb-3" />
                      <div className="fw-semibold mb-1">Sua imagem será gerada aqui</div>
                      <div className="small">Configure os campos e clique em Gerar post.</div>
                    </div>
                  )}
                </Card.Body>
              </Card>

              <Row className="g-2 mb-3">
                <Col md={6}>
                  <Button
                    variant="light"
                    className="w-100 border"
                    onClick={handleDownload}
                    disabled={!responseData?.render_url}
                  >
                    <Download size={15} className="me-2" />
                    Baixar imagem
                  </Button>
                </Col>
                <Col md={6}>
                  <Button
                    variant="light"
                    className="w-100 border"
                    onClick={handleSaveToDocuments}
                    disabled={!responseData?.render_url}
                  >
                    <Save size={15} className="me-2" />
                    Salvar em Documentos
                  </Button>
                </Col>
              </Row>

              <Card className="card-border mb-4">
                <Card.Header className="d-flex align-items-center justify-content-between">
                  <Card.Title as="h6" className="mb-0">Ajustes / Instruções</Card.Title>
                  <div className="d-flex align-items-center gap-2">
                    <span className="small text-muted">Ajustar imagem</span>
                    <Form.Check
                      type="switch"
                      id="mode-edit-switch"
                      checked={isAdjustMode}
                      onChange={(event) => setIsAdjustMode(event.target.checked)}
                    />
                  </div>
                </Card.Header>
                {isAdjustMode && (
                  <Card.Body>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder='Ex: "Mude a cor para azul e aumente o título"'
                      value={form.adjustment}
                      onChange={(event) => setField('adjustment', event.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Descreva alterações em linguagem natural para gerar nova versão automaticamente.
                    </Form.Text>
                    <Button
                      className="w-100 mt-3"
                      variant="primary"
                      onClick={handleApplyAdjustments}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Aplicando ajustes...
                        </>
                      ) : (
                        <>
                          <Zap size={16} className="me-2" />
                          Aplicar ajustes
                        </>
                      )}
                    </Button>
                  </Card.Body>
                )}
              </Card>

            </SimpleBar>
          </Col>
        </Row>
      </div>
    </div>
  );
};

const SocialPostGeneratorPage = () => {
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="hk-pg-body py-0">
      <div className={classNames("fmapp-wrap", { "fmapp-sidebar-toggle": !showSidebar })} >
        <SocialPostGeneratorSidebar />
        <div className="fmapp-content">
          <div className="fmapp-detail-wrap">
            <SocialPostGeneratorHeader
              showSidebar={showSidebar}
              toggleSidebar={() => setShowSidebar(!showSidebar)}
            />
            <SocialPostGeneratorBody />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialPostGeneratorPage;

