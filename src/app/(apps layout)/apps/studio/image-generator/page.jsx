'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import SimpleBar from 'simplebar-react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Check, Download, Image as ImageIcon, RefreshCw, Save, Upload, X, Zap } from 'react-feather';
import ImageGeneratorHeader from '../ImageGeneratorHeader';
import ImageGeneratorSidebar from '../ImageGeneratorSidebar';
import { studioAPI } from '@/lib/api/services/studio';
import { useColorMode } from '@/hooks/useColorMode';

const STYLE_OPTIONS = [
  { value: 'realistic',    apiStyle: 'realistic',    label: 'Realista',        description: 'Fotografia ultra-realista, iluminação natural' },
  { value: 'cinematic',    apiStyle: 'cinematic',     label: 'Cinematográfico', description: 'Composição cinematográfica, iluminação dramática' },
  { value: 'illustration', apiStyle: 'illustration', label: 'Ilustração',      description: 'Ilustração digital de alta qualidade' },
  { value: 'anime',        apiStyle: 'anime',        label: 'Anime',           description: 'Estilo anime japonês, linhas nítidas' },
  { value: 'fantasy',      apiStyle: 'fantasy',     label: 'Fantasia',        description: 'Arte fantástica detalhada, atmosfera épica' },
  { value: '3d',     apiStyle: '3d',           label: 'Pixar 3D',        description: 'Personagens 3D estilizados com visual cinematográfico' },
];

const SIZE_GROUPS = [
  {
    label: 'PORTRAIT',
    options: [
      { value: 'portrait_4_5',     icon: '[IG]', label: 'Feed Instagram (padrão)', ratio: '4:5',  dimensions: '1600x2000', apiSize: '1024x1792' },
      // { value: 'portrait_4_5_alt', icon: '[IG]', label: 'Portrait',               ratio: '4:5',  dimensions: '1600x2000', apiSize: '1024x1792' },
      { value: 'portrait_3_4',     icon: '[IG]', label: 'Portrait mais alto',      ratio: '3:4',  dimensions: '1600x2133', apiSize: '1024x1792' },
      { value: 'portrait_2_3',     icon: '[IG]', label: 'Portrait bem alto',       ratio: '2:3',  dimensions: '1600x2400', apiSize: '1024x1792' },
      { value: 'story_9_16',       icon: '[IG]', label: 'Stories, Reels',          ratio: '9:16', dimensions: '1080x1920', apiSize: '1024x1792' },
    ],
  },
  {
    label: 'QUADRADO',
    options: [
      { value: 'square_1_1', icon: '[SQ]', label: 'Quadrado, perfil', ratio: '1:1', dimensions: '1600x1600', apiSize: '1024x1024' },
    ],
  },
  {
    label: 'LANDSCAPE',
    options: [
      { value: 'landscape_5_4', icon: '[LS]', label: 'Landscape suave',    ratio: '5:4', dimensions: '1600x1280', apiSize: '1792x1024' },
      { value: 'landscape_4_3', icon: '[LS]', label: 'Landscape clássico', ratio: '4:3', dimensions: '1600x1200', apiSize: '1792x1024' },
      { value: 'landscape_3_2', icon: '[LS]', label: 'Landscape',          ratio: '3:2', dimensions: '1600x1067', apiSize: '1792x1024' },
    ],
  },
  {
    label: 'WIDESCREEN',
    options: [
      { value: 'wide_16_9',      icon: '[WD]', label: 'YouTube, LinkedIn', ratio: '16:9', dimensions: '1600x900', apiSize: '1792x1024' },
      { value: 'ultrawide_21_9', icon: '[WD]', label: 'Banner ultrawide',  ratio: '21:9', dimensions: '2100x900', apiSize: '1792x1024' },
    ],
  },
];

const SIZE_OPTIONS = SIZE_GROUPS.flatMap((group) => group.options);

const PlaceholderPreview = () => (
  <div className="position-relative" style={{ width: 240, height: 240 }}>
    <div
      className="position-absolute"
      style={{
        inset: '8px 48px 48px 8px',
        borderRadius: 18,
        background: 'rgba(41, 170, 152, 0.14)',
        transform: 'rotate(-6deg)',
      }}
    />
    <div
      className="position-absolute"
      style={{
        inset: '24px 28px 24px 28px',
        borderRadius: 18,
        background: 'rgba(41, 170, 152, 0.22)',
        transform: 'rotate(2deg)',
      }}
    />
    <div
      className="position-absolute d-flex flex-column align-items-center justify-content-center"
      style={{
        inset: '28px 36px 22px 36px',
        borderRadius: 16,
        border: '2px solid rgba(41, 170, 152, 0.28)',
        color: '#48b4a6',
      }}
    >
      <ImageIcon size={34} />
      <div className="mt-3" style={{ width: 74, height: 8, borderRadius: 6, background: 'rgba(65, 176, 159, 0.38)' }} />
      <div className="mt-2" style={{ width: 52, height: 8, borderRadius: 6, background: 'rgba(65, 176, 159, 0.22)' }} />
    </div>
    <div className="position-absolute rounded-circle" style={{ width: 10, height: 10, top: 16, right: 12, background: 'rgba(77, 183, 170, 0.5)' }} />
    <div className="position-absolute rounded-circle" style={{ width: 7, height: 7, top: 68, right: 0, background: 'rgba(77, 183, 170, 0.36)' }} />
    <div className="position-absolute rounded-circle" style={{ width: 11, height: 11, left: 0, bottom: 18, background: 'rgba(77, 183, 170, 0.42)' }} />
  </div>
);

const ImageGeneratorBody = () => {
  const MAX_REFERENCE_IMAGES = 6;
  const { isDark } = useColorMode();

  // Cada item: { file: File, previewUrl: string }
  const [referenceImages, setReferenceImages] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [sizeId, setSizeId] = useState('portrait_4_5');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState('');
  const [generatedCount, setGeneratedCount] = useState(0);
  const fileInputRef = useRef(null);

  const processingSteps = [
    { id: 1, label: 'Processando com Governa AI Machine Learning', description: 'Analisando o prompt e preparando a geração...' },
    { id: 2, label: 'Aplicando Estilo Visual', description: 'Configurando parâmetros de estilo e composição...' },
    { id: 3, label: 'Geração de Alta Resolução', description: 'Renderizando detalhes e aplicando ajustes finais...' },
    { id: 4, label: 'Finalizando', description: 'Preparando sua imagem...' },
  ];

  const selectedSize = useMemo(
    () => SIZE_OPTIONS.find((option) => option.value === sizeId) || SIZE_OPTIONS[0],
    [sizeId],
  );
  const selectedStyle = useMemo(
    () => STYLE_OPTIONS.find((option) => option.value === style) || STYLE_OPTIONS[0],
    [style],
  );
  const selectedSizePreviewStyle = useMemo(() => {
    const [rawW, rawH] = String(selectedSize?.ratio || '1:1').split(':');
    const ratioW = Number(rawW) || 1;
    const ratioH = Number(rawH) || 1;
    const base = 60;
    const width = ratioW >= ratioH ? base : Math.max(24, Math.round((base * ratioW) / ratioH));
    const height = ratioH >= ratioW ? base : Math.max(24, Math.round((base * ratioH) / ratioW));

    return {
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [selectedSize]);

  const addReferenceFiles = (newFiles) => {
    const imageFiles = Array.from(newFiles).filter((f) => f.type?.startsWith('image/'));
    if (!imageFiles.length) return;

    setReferenceImages((prev) => {
      const remaining = MAX_REFERENCE_IMAGES - prev.length;
      if (remaining <= 0) {
        setError(`Máximo de ${MAX_REFERENCE_IMAGES} imagens de referência.`);
        return prev;
      }
      const toAdd = imageFiles.slice(0, remaining).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...toAdd];
    });
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeReferenceImage = (index) => {
    setReferenceImages((prev) => {
      URL.revokeObjectURL(prev[index]?.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAllReferenceImages = () => {
    setReferenceImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return [];
    });
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files?.length) addReferenceFiles(files);
  };

  const handleReferenceDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = event.dataTransfer?.files;
    if (files?.length) addReferenceFiles(files);
  };

  useEffect(() => () => referenceImages.forEach((img) => URL.revokeObjectURL(img.previewUrl)), []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Informe a descrição da imagem para continuar.');
      return;
    }

    setIsProcessing(true);
    setProcessingStep(0);
    setError('');

    // Animação de steps enquanto aguarda o endpoint
    const stepDurations = [5000, 5000, 6000, 4000];
    (async () => {
      for (let i = 0; i < processingSteps.length; i++) {
        setProcessingStep(i);
        await new Promise((resolve) => setTimeout(resolve, stepDurations[i]));
      }
    })();

    try {
      const response = await studioAPI.generateImage(
        prompt.trim(),
        selectedStyle.apiStyle,
        selectedSize.apiSize,
        1,
        referenceImages.length > 0 ? referenceImages.map((r) => r.file) : null,
        selectedSize.value,
      );

      const imageUrl = response?.data?.imageUrl || response?.data?.url || response?.imageUrl;
      if (!imageUrl) {
        throw new Error('A API não retornou a URL da imagem.');
      }

      setGeneratedImage({
        id: response?.data?.taskId || `image-${Date.now()}`,
        url: imageUrl,
      });
      setGeneratedCount((prev) => Math.min(prev + 1, 50));
    } catch (apiError) {
      setError(apiError?.message || 'Erro ao gerar imagem. Tente novamente.');
    } finally {
      setProcessingStep(0);
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage?.url) return;
    const link = document.createElement('a');
    link.href = generatedImage.url;
    link.download = `${selectedSize.label.toLowerCase().replaceAll(' ', '-')}-${Date.now()}.png`;
    link.target = '_blank';
    link.click();
  };

  const handleSaveToDocuments = () => {
    if (!generatedImage?.url) return;
    const link = document.createElement('a');
    link.href = generatedImage.url;
    link.download = `documento-imagem-${Date.now()}.png`;
    link.target = '_blank';
    link.click();
  };

  const handleReset = () => {
    clearAllReferenceImages();
    setPrompt('');
    setStyle('realistic');
    setSizeId('portrait_4_5');
    setGeneratedImage(null);
    setError('');
  };

  return (
    <div className="fm-body">
      <div className="container-fluid px-4 py-4 h-100">
        <Row className="g-0 h-100">
          <Col xl={6} className="pe-xl-4 border-end">
            <SimpleBar style={{ maxHeight: 'calc(100vh - 170px)', paddingRight: '12px' }}>
              <Form onSubmit={(event) => event.preventDefault()}>
                <Form.Group className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <Form.Label className="fw-semibold mb-0">
                      Imagens de Referência <span className="text-muted fw-normal">(opcional)</span>
                    </Form.Label>
                    <span className="small text-muted">{referenceImages.length}/{MAX_REFERENCE_IMAGES}</span>
                  </div>
                  <div className="small text-muted mb-2">
                    Envie até {MAX_REFERENCE_IMAGES} imagens para a IA usar como base. Sem imagem, a IA gera do zero.
                  </div>

                  {/* Drop zone + botão de upload */}
                  {referenceImages.length < MAX_REFERENCE_IMAGES && (
                    <div
                      className="rounded border d-flex align-items-center justify-content-center mb-2"
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleReferenceDrop}
                      onClick={() => !isProcessing && fileInputRef.current?.click()}
                      style={{
                        height: 64,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        borderStyle: 'dashed',
                        borderColor: isDragOver ? '#19b2a0' : '#ced4da',
                        background: isDragOver ? (isDark ? '#0a2e22' : '#f2fbf9') : (isDark ? '#1a1d27' : '#fafafa'),
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Upload size={15} className="me-2 text-muted" />
                      <span className="small text-muted">
                        Clique ou arraste imagens aqui
                      </span>
                    </div>
                  )}

                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="d-none"
                    onChange={handleFileUpload}
                  />

                  {/* Grid de previews */}
                  {referenceImages.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {referenceImages.map((img, index) => (
                        <div key={index} className="position-relative">
                          <img
                            src={img.previewUrl}
                            alt={`Referência ${index + 1}`}
                            style={{
                              width: 72,
                              height: 72,
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid #d9dee5',
                              display: 'block',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeReferenceImage(index)}
                            disabled={isProcessing}
                            style={{
                              position: 'absolute',
                              top: -6,
                              right: -6,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: '#dc3545',
                              border: 'none',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0,
                              lineHeight: 1,
                            }}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold mb-2">
                    Descrição da imagem <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Descreva a imagem que você quer criar... Ex: Me coloque de terno, fazendo um discurso em praça pública com bandeiras do Brasil em volta"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    disabled={isProcessing}
                  />
                  <Form.Text className="text-muted">
                    Pode ser simples ou detalhado. A IA aprimora o prompt automaticamente.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold mb-3">Estilo Visual</Form.Label>
                  <Row className="g-2">
                    {STYLE_OPTIONS.map((option) => {
                      const active = style === option.value;
                      return (
                        <Col md={6} xl={6} key={option.value}>
                          <Card
                            className="card-border h-100"
                            onClick={() => !isProcessing && setStyle(option.value)}
                            style={{
                              cursor: isProcessing ? 'not-allowed' : 'pointer',
                              borderColor: active ? '#21b89e' : undefined,
                              borderWidth: active ? '2px' : '1px',
                              background: active ? (isDark ? '#0a2e22' : '#effaf8') : undefined,
                            }}
                          >
                            <Card.Body className="py-3">
                              <div className="fw-semibold mb-1" style={{ color: active ? '#0f9a84' : undefined }}>
                                {option.label}
                              </div>
                              <div className="small text-muted">{option.description}</div>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold mb-2">Tamanho / Formato</Form.Label>
                  <Form.Select
                    value={sizeId}
                    onChange={(event) => setSizeId(event.target.value)}
                    disabled={isProcessing}
                  >
                    {SIZE_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {`${option.icon} ${option.label} (${option.ratio}) - ${option.dimensions}`}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Form.Select>
                  <Card className="card-border mt-3">
                    <Card.Body className="py-2 d-flex align-items-center gap-2">
                      <div
                        className="rounded border"
                        style={{
                          ...selectedSizePreviewStyle,
                          background: isDark ? '#0a2020' : '#f2f7f6',
                          borderColor: '#84d3c7',
                          borderWidth: '2px',
                        }}
                      />
                      <div>
                        <div className="fw-semibold">{selectedSize.label}</div>
                        <div className="small text-muted">{selectedSize.ratio} - {selectedSize.dimensions}</div>
                      </div>
                    </Card.Body>
                  </Card>
                </Form.Group>

                <Alert
                  className="d-flex align-items-center gap-2 mb-4"
                  style={{ borderColor: '#9fd8ce', background: isDark ? '#0a2e22' : '#eaf7f4', color: isDark ? '#4ade80' : '#158a78' }}
                >
                  <Zap size={15} />
                  A IA aprimora seu prompt automaticamente com termos profissionais de fotografia antes de gerar.
                </Alert>

                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}

                <div className="d-flex gap-2">
                  <Button
                    type="button"
                    className="flex-grow-1"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isProcessing || !prompt.trim()}
                  >
                    {isProcessing ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Gerando imagem...
                      </>
                    ) : (
                      <>
                        <Zap size={16} className="me-2" />
                        Gerar imagem
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    size="lg"
                    onClick={handleReset}
                    disabled={isProcessing}
                  >
                    <RefreshCw size={15} className="me-2" />
                    Limpar
                  </Button>
                </div>
              </Form>
            </SimpleBar>
          </Col>

          <Col xl={6} className="ps-xl-4 mt-4 mt-xl-0">
            <SimpleBar style={{ maxHeight: 'calc(100vh - 170px)', paddingLeft: '8px' }}>
              <Card className="card-border" style={{ minHeight: '640px' }}>
                <Card.Header className="d-flex align-items-center justify-content-between">
                  <Card.Title as="h5" className="mb-0">Pré-visualização</Card.Title>
                  <Badge bg="light" text="dark" className="border">
                    # {generatedCount} de 50 Geradas
                  </Badge>
                </Card.Header>
                <Card.Body className="d-flex flex-column">
                  <div className="flex-grow-1 rounded border d-flex align-items-center justify-content-center mb-4 bg-light">
                    {isProcessing ? (
                      <div className="w-100 p-4">
                        <div className="text-center mb-4">
                          <Spinner
                            animation="border"
                            variant="primary"
                            className="mb-3"
                            style={{ width: '3rem', height: '3rem' }}
                          />
                          <h6 className="mb-1">Gerando sua imagem...</h6>
                          <p className="text-muted small mb-0">Isso pode levar até 2 minutos</p>
                        </div>

                        <div className="px-2">
                          {processingSteps.map((step, index) => (
                            <div
                              key={step.id}
                              className={classNames(
                                'd-flex align-items-start mb-3 pb-3',
                                { 'border-bottom': index < processingSteps.length - 1 },
                              )}
                            >
                              <div className="me-3 mt-1">
                                {processingStep > index ? (
                                  <div className="avatar avatar-xs avatar-success avatar-rounded">
                                    <span className="initial-wrap">
                                      <Check size={12} />
                                    </span>
                                  </div>
                                ) : processingStep === index ? (
                                  <Spinner animation="border" variant="primary" size="sm" />
                                ) : (
                                  <div className="avatar avatar-xs avatar-soft-secondary avatar-rounded">
                                    <span className="initial-wrap fs-8">{step.id}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow-1">
                                <div
                                  className={classNames(
                                    'fw-medium small',
                                    { 'text-primary': processingStep === index },
                                    { 'text-success': processingStep > index },
                                    { 'text-muted': processingStep < index },
                                  )}
                                >
                                  {step.label}
                                </div>
                                <small className="text-muted">{step.description}</small>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : generatedImage?.url ? (
                      <img
                        src={generatedImage.url}
                        alt="Imagem gerada"
                        style={{ width: '100%', maxHeight: '430px', objectFit: 'contain' }}
                      />
                    ) : (
                      <div className="text-center">
                        <PlaceholderPreview />
                        <div className="mt-4 text-muted">Sua imagem será gerada aqui</div>
                      </div>
                    )}
                  </div>

                  <Row className="g-2">
                    <Col md={6}>
                      <Button
                        type="button"
                        variant="light"
                        className="w-100 border"
                        onClick={handleDownload}
                        disabled={!generatedImage?.url}
                      >
                        <Download size={15} className="me-2" />
                        Baixar imagem
                      </Button>
                    </Col>
                    <Col md={6}>
                      <Button
                        type="button"
                        variant="light"
                        className="w-100 border"
                        onClick={handleSaveToDocuments}
                        disabled={!generatedImage?.url}
                      >
                        <Save size={15} className="me-2" />
                        Salvar em Documentos
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </SimpleBar>
          </Col>
        </Row>
      </div>
    </div>
  );
};

const ImageGeneratorPage = () => {
  const [showSidebar, setShowSidebar] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1740px)').matches;
  });

  return (
    <div className="hk-pg-body py-0">
      <div className={classNames('contactapp-wrap', { 'contactapp-sidebar-toggle': showSidebar })}>
        <ImageGeneratorSidebar />
        <div className="contactapp-content">
          <div className="contactapp-detail-wrap">
            <ImageGeneratorHeader toggleSidebar={() => setShowSidebar(!showSidebar)} />
            <ImageGeneratorBody />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGeneratorPage;

