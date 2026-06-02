'use client';
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import SimpleBar from 'simplebar-react';
import { Button, Card, Col, Form, Row, Badge, ButtonGroup, Spinner, Alert } from 'react-bootstrap';
import { Zap, Download, Upload, Type, Droplet, Image as ImageIcon, Check, AlertCircle } from 'react-feather';
import BannerGeneratorSidebar from '../BannerGeneratorSidebar';
import BannerGeneratorHeader from '../BannerGeneratorHeader';
import studioAPI from '@/lib/api/services/studio';

const BannerGeneratorBody = () => {
    const [size, setSize] = useState('instagram-post');
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [bgColor, setBgColor] = useState('#FFCC00');
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [font, setFont] = useState('inter');
    const [bgImage, setBgImage] = useState(null);
    const [bgImagePreview, setBgImagePreview] = useState(null);
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedBanner, setGeneratedBanner] = useState(null);
    const [generatingStep, setGeneratingStep] = useState(0);

    // Steps da geração com IA
    const generatingSteps = [
        { id: 1, label: '🎨 Analisando Design', description: 'Processando cores, textos e layout...' },
        { id: 2, label: '✨ Aplicando IA Generativa', description: 'Criando composição visual otimizada...' },
        { id: 3, label: '🖼️ Renderizando Banner', description: 'Gerando imagem em alta qualidade...' },
        { id: 4, label: '✅ Finalizando', description: 'Preparando para download...' },
    ];

    // Banners mockados (imagens da galeria)
    const mockBanners = [
        '/img/gallery/mockGeracaodeBanner.jpeg',
        '/img/gallery/comicio-politico-estrategias.jpg',
        '/img/gallery/mock1.jpg',
        '/img/gallery/mock2.jpg',
        '/img/gallery/mock3.jpg',
    ];

    // Tamanhos disponíveis
    const sizes = [
        { value: 'instagram-post', label: '📷 Instagram Post', dimensions: '1080x1080px', ratio: '1:1' },
        { value: 'instagram-story', label: '📱 Instagram Story', dimensions: '1080x1920px', ratio: '9:16' },
        { value: 'facebook-post', label: '📘 Facebook Post', dimensions: '1200x630px', ratio: '1.91:1' },
        { value: 'twitter-post', label: '🐦 Twitter Post', dimensions: '1200x675px', ratio: '16:9' },
        { value: 'linkedin-post', label: '💼 LinkedIn Post', dimensions: '1200x627px', ratio: '1.91:1' },
        { value: 'youtube-thumbnail', label: '📺 YouTube Thumbnail', dimensions: '1280x720px', ratio: '16:9' },
    ];

    // Fontes disponíveis
    const fonts = [
        { value: 'inter', label: 'Inter (Moderna)' },
        { value: 'roboto', label: 'Roboto (Clean)' },
        { value: 'montserrat', label: 'Montserrat (Elegante)' },
        { value: 'poppins', label: 'Poppins (Friendly)' },
        { value: 'playfair', label: 'Playfair Display (Clássica)' },
    ];

    // Cores pré-definidas
    const presetColors = [
        '#0066FF', '#FF3366', '#00CC66', '#FF9900', '#9933FF',
        '#FF0066', '#00CCFF', '#FFCC00', '#CC0099', '#33CC99',
    ];

    const currentSize = sizes.find(s => s.value === size);

    const handleBgImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBgImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBgImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateWithAI = async () => {
        if (!title.trim()) {
            alert('Por favor, digite um título para gerar o banner.');
            return;
        }

        setIsGenerating(true);
        setGeneratingStep(0);
        setGeneratedBanner(null);

        // Mapear size para format
        const formatMap = {
            'instagram-post': '1080x1080',
            'instagram-story': '1080x1920',
            'facebook-post': '1200x630',
            'twitter-post': '1200x675',
            'linkedin-post': '1200x627',
            'youtube-thumbnail': '1280x720',
        };
        const format = formatMap[size] || '1080x1080';

        // Animação dos steps em paralelo com a API
        const stepsPromise = (async () => {
            const stepDurations = [2000, 3000, 2000, 1000];
            for (let i = 0; i < generatingSteps.length; i++) {
                setGeneratingStep(i);
                await new Promise(resolve => setTimeout(resolve, stepDurations[i]));
            }
        })();

        try {
            // Chamar API real
            const response = await studioAPI.generateBanner(
                title,
                subtitle,
                format,
                size,
                font,
                bgColor,
                textColor,
                bgImage,
                logo
            );

            // Aguardar animação completar
            await stepsPromise;

            if (response.success) {
                setGeneratedBanner({
                    url: response.data.bannerUrl,
                    title: title,
                    subtitle: subtitle,
                    size: size,
                    dimensions: sizes.find(s => s.value === size)?.dimensions,
                    metadata: response.data.metadata,
                });
            } else {
                alert('Erro ao gerar banner. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao gerar banner:', error);
            alert(`Erro: ${error.message || 'Erro ao gerar banner. Tente novamente.'}`);
        } finally {
            setIsGenerating(false);
            setGeneratingStep(0);
        }
    };

    const handleDownload = () => {
        if (generatedBanner) {
            const link = document.createElement('a');
            link.href = generatedBanner.url;
            link.download = `banner-${generatedBanner.size}-${Date.now()}.jpg`;
            link.click();
        } else {
            alert('Gere um banner primeiro para fazer o download!');
        }
    };

    const handleReset = () => {
        setTitle('');
        setSubtitle('');
        setBgColor('#0066FF');
        setTextColor('#FFFFFF');
        setBgImage(null);
        setBgImagePreview(null);
        setLogo(null);
        setLogoPreview(null);
        setGeneratedBanner(null);
    };

    // Calcular aspect ratio para preview
    const getPreviewDimensions = () => {
        const maxWidth = 600;
        const maxHeight = 500;
        
        if (size === 'instagram-post') {
            return { width: maxHeight, height: maxHeight };
        } else if (size === 'instagram-story') {
            return { width: maxHeight * 9 / 16, height: maxHeight };
        } else if (size === 'facebook-post' || size === 'linkedin-post') {
            return { width: maxWidth, height: maxWidth * 630 / 1200 };
        } else if (size === 'twitter-post' || size === 'youtube-thumbnail') {
            return { width: maxWidth, height: maxWidth * 9 / 16 };
        }
        return { width: maxWidth, height: maxHeight };
    };

    const previewDimensions = getPreviewDimensions();

    return (
        <div className="contact-body">
            <SimpleBar className="nicescroll-bar">
                <div className="contact-list-view">
                    <div className="p-4">
                        <Row>
                            <Col lg={5}>
                                <Card className="card-border mb-4">
                                    <Card.Header>
                                        <h5 className="mb-0">Configurações</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">1. Tamanho do Banner</Form.Label>
                                            <Form.Select
                                                value={size}
                                                onChange={(e) => setSize(e.target.value)}
                                            >
                                                {sizes.map((s) => (
                                                    <option key={s.value} value={s.value}>
                                                        {s.label} - {s.dimensions}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                {currentSize?.ratio} • Otimizado para {currentSize?.label}
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">
                                                <Type size={16} className="me-2" />
                                                2. Título
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                maxLength={50}
                                            />
                                            <Form.Text className="text-muted">
                                                {title.length}/50 caracteres
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">3. Subtítulo (opcional)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={subtitle}
                                                onChange={(e) => setSubtitle(e.target.value)}
                                                maxLength={80}
                                            />
                                            <Form.Text className="text-muted">
                                                {subtitle.length}/80 caracteres
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">4. Fonte</Form.Label>
                                            <Form.Select
                                                value={font}
                                                onChange={(e) => setFont(e.target.value)}
                                            >
                                                {fonts.map((f) => (
                                                    <option key={f.value} value={f.value}>
                                                        {f.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-medium">
                                                        <Droplet size={16} className="me-2" />
                                                        5. Cor de Fundo
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="color"
                                                        value={bgColor}
                                                        onChange={(e) => setBgColor(e.target.value)}
                                                    />
                                                    <div className="mt-2 d-flex gap-1 flex-wrap">
                                                        {presetColors.map((color) => (
                                                            <div
                                                                key={color}
                                                                onClick={() => setBgColor(color)}
                                                                style={{
                                                                    width: '30px',
                                                                    height: '30px',
                                                                    backgroundColor: color,
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    border: bgColor === color ? '3px solid #000' : '1px solid #ddd',
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-medium">6. Cor do Texto</Form.Label>
                                                    <Form.Control
                                                        type="color"
                                                        value={textColor}
                                                        onChange={(e) => setTextColor(e.target.value)}
                                                    />
                                                    <ButtonGroup size="sm" className="mt-2 w-100">
                                                        <Button
                                                            variant={textColor === '#FFFFFF' ? 'primary' : 'outline-secondary'}
                                                            onClick={() => setTextColor('#FFFFFF')}
                                                        >
                                                            Branco
                                                        </Button>
                                                        <Button
                                                            variant={textColor === '#000000' ? 'primary' : 'outline-secondary'}
                                                            onClick={() => setTextColor('#000000')}
                                                        >
                                                            Preto
                                                        </Button>
                                                    </ButtonGroup>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">
                                                <ImageIcon size={16} className="me-2" />
                                                7. Imagem de Fundo (opcional)
                                            </Form.Label>
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={handleBgImageUpload}
                                            />
                                            {bgImagePreview && (
                                                <div className="mt-2">
                                                    <img src={bgImagePreview} alt="Background" className="img-thumbnail" style={{ maxHeight: '100px' }} />
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="text-danger"
                                                        onClick={() => { setBgImage(null); setBgImagePreview(null); }}
                                                    >
                                                        Remover
                                                    </Button>
                                                </div>
                                            )}
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-medium">
                                                <Upload size={16} className="me-2" />
                                                8. Logo (opcional)
                                            </Form.Label>
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                            />
                                            {logoPreview && (
                                                <div className="mt-2">
                                                    <img src={logoPreview} alt="Logo" className="img-thumbnail" style={{ maxHeight: '60px' }} />
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="text-danger"
                                                        onClick={() => { setLogo(null); setLogoPreview(null); }}
                                                    >
                                                        Remover
                                                    </Button>
                                                </div>
                                            )}
                                        </Form.Group>

                                        <Alert variant="info" className="mb-3">
                                            <AlertCircle size={16} className="me-2" />
                                            <small>Configure seu banner e clique em "Gerar com IA" para criar uma versão profissional automaticamente.</small>
                                        </Alert>

                                        <div className="d-grid gap-2">
                                            <Button 
                                                variant="primary" 
                                                size="lg"
                                                onClick={handleGenerateWithAI}
                                                disabled={isGenerating || !title.trim()}
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <Spinner
                                                            as="span"
                                                            animation="border"
                                                            size="sm"
                                                            className="me-2"
                                                        />
                                                        Gerando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap size={18} className="me-2" />
                                                        Gerar Banner com IA
                                                    </>
                                                )}
                                            </Button>
                                            <Button variant="outline-secondary" onClick={handleReset}>
                                                Resetar
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={7}>
                                <Card className="card-border mb-3">
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">{generatedBanner ? 'Banner Gerado com IA' : 'Preview ao Vivo'}</h5>
                                        <Badge bg="secondary">{currentSize?.dimensions}</Badge>
                                    </Card.Header>
                                    <Card.Body>
                                        {generatedBanner ? (
                                            <div>
                                                <div className="text-center mb-3">
                                                    <img 
                                                        src={generatedBanner.url} 
                                                        alt="Banner Gerado" 
                                                        className="img-fluid rounded shadow"
                                                        style={{ maxHeight: '500px' }}
                                                    />
                                                </div>
                                                <Alert variant="success" className="mb-3">
                                                    <Check size={16} className="me-2" />
                                                    <strong>Banner gerado com sucesso!</strong> Sua imagem está pronta para download.
                                                </Alert>
                                                <div className="d-grid gap-2">
                                                    <Button
                                                        variant="success"
                                                        size="lg"
                                                        onClick={handleDownload}
                                                    >
                                                        <Download size={18} className="me-2" />
                                                        Baixar Banner ({generatedBanner.dimensions})
                                                    </Button>
                                                    <Row>
                                                        <Col>
                                                            <Button 
                                                                variant="outline-primary" 
                                                                size="sm" 
                                                                className="w-100"
                                                                onClick={handleGenerateWithAI}
                                                            >
                                                                <Zap size={14} className="me-1" />
                                                                Gerar Nova Versão
                                                            </Button>
                                                        </Col>
                                                        <Col>
                                                            <Button 
                                                                variant="outline-secondary" 
                                                                size="sm" 
                                                                className="w-100"
                                                                onClick={() => setGeneratedBanner(null)}
                                                            >
                                                                Ver Preview
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
                                            <div
                                                style={{
                                                    width: `${previewDimensions.width}px`,
                                                    height: `${previewDimensions.height}px`,
                                                    backgroundColor: bgImagePreview ? 'transparent' : bgColor,
                                                    backgroundImage: bgImagePreview ? `url(${bgImagePreview})` : 'none',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    position: 'relative',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    padding: '40px',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {logoPreview && (
                                                    <img
                                                        src={logoPreview}
                                                        alt="Logo"
                                                        style={{
                                                            position: 'absolute',
                                                            top: '20px',
                                                            left: '20px',
                                                            maxWidth: '80px',
                                                            maxHeight: '80px',
                                                            objectFit: 'contain',
                                                        }}
                                                    />
                                                )}
                                                {title && (
                                                    <h1
                                                        style={{
                                                            color: textColor,
                                                            fontFamily: font === 'inter' ? 'Inter, sans-serif' :
                                                                       font === 'roboto' ? 'Roboto, sans-serif' :
                                                                       font === 'montserrat' ? 'Montserrat, sans-serif' :
                                                                       font === 'poppins' ? 'Poppins, sans-serif' : 'Playfair Display, serif',
                                                            fontSize: size === 'instagram-story' ? '32px' : '48px',
                                                            fontWeight: 'bold',
                                                            textAlign: 'center',
                                                            margin: 0,
                                                            textShadow: bgImagePreview ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none',
                                                        }}
                                                    >
                                                        {title}
                                                    </h1>
                                                )}
                                                {subtitle && (
                                                    <p
                                                        style={{
                                                            color: textColor,
                                                            fontFamily: font === 'inter' ? 'Inter, sans-serif' :
                                                                       font === 'roboto' ? 'Roboto, sans-serif' :
                                                                       font === 'montserrat' ? 'Montserrat, sans-serif' :
                                                                       font === 'poppins' ? 'Poppins, sans-serif' : 'Playfair Display, serif',
                                                            fontSize: size === 'instagram-story' ? '16px' : '20px',
                                                            textAlign: 'center',
                                                            marginTop: '16px',
                                                            textShadow: bgImagePreview ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
                                                        }}
                                                    >
                                                        {subtitle}
                                                    </p>
                                                )}
                                                {!title && !subtitle && (
                                                    <div className="text-center">
                                                        <Type size={48} style={{ color: textColor, opacity: 0.3 }} />
                                                        <p style={{ color: textColor, marginTop: '16px', opacity: 0.5 }}>
                                                            Digite um título para ver o preview
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Processing Steps */}
                                {isGenerating && (
                                    <Card className="card-border">
                                        <Card.Body className="py-4">
                                            <div className="text-center mb-4">
                                                <Spinner 
                                                    animation="border" 
                                                    variant="primary" 
                                                    className="mb-3"
                                                    style={{ width: '3rem', height: '3rem' }}
                                                />
                                                <h6>Gerando seu banner com IA...</h6>
                                                <p className="text-muted small mb-0">
                                                    Aguarde alguns segundos
                                                </p>
                                            </div>

                                            <div className="px-3">
                                                {generatingSteps.map((step, index) => (
                                                    <div 
                                                        key={step.id} 
                                                        className={classNames(
                                                            "d-flex align-items-start mb-3 pb-3",
                                                            { "border-bottom": index < generatingSteps.length - 1 }
                                                        )}
                                                    >
                                                        <div className="me-3">
                                                            {generatingStep > index ? (
                                                                <div className="avatar avatar-xs avatar-success avatar-rounded">
                                                                    <span className="initial-wrap">
                                                                        <Check size={12} />
                                                                    </span>
                                                                </div>
                                                            ) : generatingStep === index ? (
                                                                <Spinner 
                                                                    animation="border" 
                                                                    variant="primary" 
                                                                    size="sm"
                                                                />
                                                            ) : (
                                                                <div className="avatar avatar-xs avatar-soft-secondary avatar-rounded">
                                                                    <span className="initial-wrap fs-8">{step.id}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <div className={classNames(
                                                                "fw-medium",
                                                                { "text-primary": generatingStep === index },
                                                                { "text-success": generatingStep > index },
                                                                { "text-muted": generatingStep < index }
                                                            )}>
                                                                {step.label}
                                                            </div>
                                                            <small className="text-muted">{step.description}</small>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                )}
                            </Col>
                        </Row>
                    </div>
                </div>
            </SimpleBar>
        </div>
    );
};

export default function BannerGeneratorPage() {
    const [showSidebar, setShowSidebar] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 1740px)').matches;
    });

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("contactapp-wrap", { "contactapp-sidebar-toggle": showSidebar })}>
                <BannerGeneratorSidebar />
                <div className="contactapp-content">
                    <div className="contactapp-detail-wrap">
                        <BannerGeneratorHeader
                            toggleSidebar={() => setShowSidebar(!showSidebar)}
                            show={showSidebar}
                        />
                        <BannerGeneratorBody />
                    </div>
                </div>
            </div>
        </div>
    );
}
