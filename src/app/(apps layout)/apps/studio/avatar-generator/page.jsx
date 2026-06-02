
'use client';
import React, { useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import SimpleBar from 'simplebar-react';
import { Button, Card, Col, Form, Row, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { Upload, Zap, Image as ImageIcon, AlertCircle, Check, Download, X, Droplet } from 'react-feather';
import AvatarGeneratorSidebar from '../AvatarGeneratorSidebar';
import AvatarGeneratorHeader from '../AvatarGeneratorHeader';
import studioAPI from '@/lib/api/services/studio';

const MAX_IMAGES = 4;
const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Mapeamento de valores do frontend para a API
 */
const mapBackgroundType = (type) => {
    const map = {
        cor_solida: 'solid',
        cor_da_marca: 'solid',
        gradiente_suave: 'gradient',
        desfocado: 'blur',
        transparente: 'transparent',
    };
    return map[type] || 'solid';
};

const mapStylePreset = (style) => {
    const map = {
        'Realista': 'realistic',
        'Pixar': 'artistic',
        'Cartoon': 'cartoon',
        'Mangá / Anime': 'anime',
        'Preto & Branco (B/W)': 'bw',
        'Sépia': 'sepia',
    };
    return map[style] || 'realistic';
};

const mapFraming = (framing) => {
    const map = {
        fechado: 'close',
        medio: 'medium',
        inteiro: 'full',
        amplo: 'wide',
    };
    return map[framing] || 'medium';
};

const mapAspectRatioToFormat = (ratio) => {
    const map = {
        '1:1': '1080x1080',
        '4:5': '1080x1920',
        '3:4': '1080x1920',
        '2:3': '1080x1920',
        '9:16': '1080x1920',
        '5:4': '1350x1080',
        '4:3': '1350x1080',
        '3:2': '1920x1080',
        '16:9': '1920x1080',
        '21:9': '1920x1080',
    };
    return map[ratio] || '1080x1080';
};

const normalizeAspectRatio = (ratio) => {
    const validRatios = ['1:1', '21:9', '16:9', '9:16', '3:4', '4:5', '5:4', '4:3', '3:2', '2:3'];
    if (validRatios.includes(ratio)) return ratio;
    return '1:1';
};

const AvatarGeneratorBody = () => {
    const [selectedImages, setSelectedImages] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [backgroundType, setBackgroundType] = useState('cor_solida');
    const [backgroundColor, setBackgroundColor] = useState('#FFCC00');
    const [stylePreset, setStylePreset] = useState('Realista');
    const [aspectRatio, setAspectRatio] = useState('4:5');
    const [framing, setFraming] = useState('medio');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const progressTimerRef = useRef(null);
    const dragCounterRef = useRef(0);
    const fileInputRef = useRef(null);

    const aspectRatioGroups = useMemo(() => ([
        {
            label: 'PORTRAIT',
            options: [
                { value: '4:5', icon: '[IG]', label: 'Feed Instagram (padrao)', ratio: '4:5', dimensions: '1080x1350' },
                { value: '3:4', icon: '[IG]', label: 'Portrait mais alto', ratio: '3:4', dimensions: '1080x1440' },
                { value: '2:3', icon: '[IG]', label: 'Portrait bem alto', ratio: '2:3', dimensions: '1080x1620' },
                { value: '9:16', icon: '[IG]', label: 'Stories, Reels', ratio: '9:16', dimensions: '1080x1920' },
            ],
        },
        {
            label: 'QUADRADO',
            options: [
                { value: '1:1', icon: '[SQ]', label: 'Quadrado, perfil', ratio: '1:1', dimensions: '1080x1080' },
            ],
        },
        {
            label: 'LANDSCAPE',
            options: [
                { value: '5:4', icon: '[LS]', label: 'Landscape suave', ratio: '5:4', dimensions: '1350x1080' },
                { value: '4:3', icon: '[LS]', label: 'Landscape classico', ratio: '4:3', dimensions: '1440x1080' },
                { value: '3:2', icon: '[LS]', label: 'Landscape', ratio: '3:2', dimensions: '1620x1080' },
            ],
        },
        {
            label: 'WIDESCREEN',
            options: [
                { value: '16:9', icon: '[WD]', label: 'YouTube, LinkedIn', ratio: '16:9', dimensions: '1920x1080' },
                { value: '21:9', icon: '[WD]', label: 'Banner ultrawide', ratio: '21:9', dimensions: '2520x1080' },
            ],
        },
    ]), []);

    const aspectRatioOptions = useMemo(
        () => aspectRatioGroups.flatMap((group) => group.options),
        [aspectRatioGroups]
    );

    const selectedAspectRatio = useMemo(
        () => aspectRatioOptions.find((option) => option.value === aspectRatio) || aspectRatioOptions[0],
        [aspectRatio, aspectRatioOptions]
    );

    const selectedAspectRatioPreviewStyle = useMemo(() => {
        const base = 54;
        const [rawW, rawH] = String(selectedAspectRatio?.ratio || '1:1').split(':');
        const ratioW = Number(rawW) || 1;
        const ratioH = Number(rawH) || 1;
        const width = ratioW >= ratioH ? base : Math.max(24, Math.round((base * ratioW) / ratioH));
        const height = ratioH >= ratioW ? base : Math.max(24, Math.round((base * ratioH) / ratioW));
        return {
            width,
            height,
            borderRadius: 8,
            border: '2px solid #9fd8ce',
            background: 'rgba(65, 176, 159, 0.12)',
        };
    }, [selectedAspectRatio]);

    const framingOptions = useMemo(() => ([
        { value: 'fechado', label: 'Fechado (rosto)' },
        { value: 'medio', label: 'Médio (busto)' },
        { value: 'inteiro', label: 'Corpo inteiro' },
        { value: 'amplo', label: 'Amplo (com cenário)' },
    ]), []);

    const backgroundTypes = useMemo(() => ([
        { value: 'cor_solida', label: 'Cor sólida' },
        { value: 'cor_da_marca', label: 'Cor da marca' },
        { value: 'gradiente_suave', label: 'Gradiente suave' },
        { value: 'desfocado', label: 'Desfocado' },
        { value: 'transparente', label: 'Transparente' },
    ]), []);

    const styleOptions = useMemo(() => ([
        'Realista',
        'Pixar',
        'Cartoon',
        'Mangá / Anime',
        'Preto & Branco (B/W)',
        'Sépia',
    ]), []);

    const presetColors = useMemo(() => ([
        '#FFFFFF', '#000000', '#adadad', '#eaff00', '#029914',
        '#ff0000', '#0000ff', '#ffa600', '#00ccc5', '#cc3391',
    ]), []);

    const isBackgroundColorDisabled = isProcessing || backgroundType === 'transparente';

    const handleBackgroundTypeChange = (value) => {
        setBackgroundType(value);
        if (value === 'transparente') {
            setBackgroundColor('');
            return;
        }
        setBackgroundColor((prev) => prev || '#FFCC00');
    };

    const processingSteps = [
        { id: 1, label: 'Processando com Governa AI Machine Learning', description: 'Analisando suas imagens e aplicando melhorias...' },
        { id: 2, label: 'Revisão de Qualidade', description: 'Verificando detalhes e consistência...' },
        { id: 3, label: 'Customização Vetorial de IA', description: 'Aplicando camadas de vetorização e ajustes finais...' },
        { id: 4, label: 'Finalizando', description: 'Preparando seu avatar...' },
    ];

    const processFiles = (files) => {
        if (!files || files.length === 0) return;

        const incoming = Array.from(files);
        const currentCount = selectedImages.length;
        if (currentCount >= MAX_IMAGES) {
            setError(`Limite de ${MAX_IMAGES} imagens atingido.`);
            return;
        }

        const availableSlots = MAX_IMAGES - currentCount;
        const toAdd = incoming.slice(0, availableSlots);

        const nextImages = [];
        let hasError = false;

        for (const file of toAdd) {
            if (!VALID_TYPES.includes(file.type)) {
                setError('Formato inválido. Use JPG, PNG ou WEBP.');
                hasError = true;
                continue;
            }
            if (file.size > MAX_SIZE) {
                setError('Arquivo muito grande. Máximo: 5MB.');
                hasError = true;
                continue;
            }

            const id = `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;
            nextImages.push({
                id,
                file,
                preview: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
                type: file.type,
            });
        }

        if (!hasError) setError(null);
        if (nextImages.length > 0) {
            setSelectedImages((prev) => [...prev, ...nextImages]);
        }
    };

    const handleImageChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) processFiles(files);
        e.target.value = '';
    };

    const handlePickFiles = () => {
        if (isProcessing) return;
        if (selectedImages.length >= MAX_IMAGES) return;
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current += 1;
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current <= 0) {
            dragCounterRef.current = 0;
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
    };

    const handleRemoveImage = (id) => {
        setSelectedImages((prev) => {
            const target = prev.find((img) => img.id === id);
            if (target?.preview) URL.revokeObjectURL(target.preview);
            return prev.filter((img) => img.id !== id);
        });
        setUploadProgress((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const handleReorder = (sourceId, targetId) => {
        if (sourceId === targetId) return;
        setSelectedImages((prev) => {
            const sourceIndex = prev.findIndex((img) => img.id === sourceId);
            const targetIndex = prev.findIndex((img) => img.id === targetId);
            if (sourceIndex === -1 || targetIndex === -1) return prev;
            const next = [...prev];
            const [moved] = next.splice(sourceIndex, 1);
            next.splice(targetIndex, 0, moved);
            return next;
        });
    };

    const startProgressSimulation = (imageIds) => {
        setUploadProgress((prev) => {
            const next = { ...prev };
            imageIds.forEach((id) => {
                next[id] = 0;
            });
            return next;
        });

        progressTimerRef.current = setInterval(() => {
            setUploadProgress((prev) => {
                const next = { ...prev };
                imageIds.forEach((id) => {
                    const current = next[id] ?? 0;
                    if (current < 90) {
                        const bump = Math.floor(Math.random() * 12) + 4;
                        next[id] = Math.min(90, current + bump);
                    }
                });
                return next;
            });
        }, 700);
    };

    const stopProgressSimulation = (imageIds) => {
        if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
        }
        setUploadProgress((prev) => {
            const next = { ...prev };
            imageIds.forEach((id) => {
                next[id] = 100;
            });
            return next;
        });
    };

    const handleGenerate = async () => {
        if (selectedImages.length === 0) {
            setError('Por favor, faça upload de ao menos uma imagem.');
            return;
        }
        if (selectedImages.length > MAX_IMAGES) {
            setError(`No máximo ${MAX_IMAGES} imagens.`);
            return;
        }
        if (!prompt.trim()) {
            setError('Por favor, descreva como deseja o avatar.');
            return;
        }

        setIsProcessing(true);
        setProcessingStep(0);
        setError(null);
        setResult(null);

        const imageIds = selectedImages.map((img) => img.id);
        startProgressSimulation(imageIds);

        const apiPromise = studioAPI.generateAvatar(
            selectedImages.map((img) => img.file),
            prompt,
            mapBackgroundType(backgroundType),
            backgroundColor,
            mapStylePreset(stylePreset),
            mapFraming(framing),
            normalizeAspectRatio(aspectRatio),
            mapAspectRatioToFormat(aspectRatio)
        );

        const stepDurations = [30000, 30000, 40000, 20000];
        (async () => {
            for (let i = 0; i < processingSteps.length; i++) {
                setProcessingStep(i);
                await new Promise(resolve => setTimeout(resolve, stepDurations[i]));
            }
        })();

        try {
            const response = await apiPromise;

            if (response.success) {
                setResult({
                    success: true,
                    message: 'Avatar gerado com sucesso!',
                    generatedImage: response.data.generatedImage,
                    processedPrompt: response.data.processedPrompt,
                    metadata: response.data.metadata,
                });
            } else {
                setError('Erro ao gerar avatar. Tente novamente.');
            }
        } catch (err) {
            setError(err.message || 'Erro ao gerar avatar. Tente novamente.');
            console.error('Erro:', err);
        } finally {
            setIsProcessing(false);
            setProcessingStep(0);
            stopProgressSimulation(imageIds);
        }
    };

    const handleDownload = async () => {
        if (!result?.generatedImage) return;

        try {
            const response = await fetch(result.generatedImage);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `avatar-${aspectRatio}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Erro ao baixar imagem:', error);
            const link = document.createElement('a');
            link.href = result.generatedImage;
            link.download = `avatar-${aspectRatio}-${Date.now()}.png`;
            link.target = '_blank';
            link.click();
        }
    };

    const handleReset = () => {
        selectedImages.forEach((img) => {
            if (img.preview) URL.revokeObjectURL(img.preview);
        });
        setSelectedImages([]);
        setPrompt('');
        setResult(null);
        setError(null);
        setUploadProgress({});
        if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
        }
    };

    return (
        <div className="contact-body">
            <SimpleBar className="nicescroll-bar">
                <div className="contact-list-view">
                    <div className="p-4">
                        <Row>
                            <Col lg={6}>
                                <Card className="card-border mb-4">
                                    <Card.Header>
                                        <h5 className="mb-0">
                                            <Upload size={18} className="me-2" />
                                            Dados de Entrada
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {error && (
                                            <Alert variant="danger" className="d-flex align-items-center mb-4">
                                                <AlertCircle size={18} className="me-2" />
                                                {error}
                                            </Alert>
                                        )}
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-medium">
                                                1. Faça upload das suas fotos
                                            </Form.Label>
                                            <div
                                                className={classNames(
                                                    'border rounded p-4 text-center transition-all',
                                                    {
                                                        'bg-light': !isDragging,
                                                        'bg-primary bg-opacity-10 border-primary border-2': isDragging,
                                                    }
                                                )}
                                                onClick={handlePickFiles}
                                                onDragEnter={handleDragEnter}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                style={{
                                                    minHeight: '200px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    cursor: selectedImages.length >= MAX_IMAGES ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.3s ease',
                                                }}
                                            >
                                                <Upload
                                                    size={48}
                                                    className={classNames('mb-3', {
                                                        'text-muted': !isDragging,
                                                        'text-primary': isDragging,
                                                    })}
                                                />
                                                <p
                                                    className={classNames('mb-3 fw-medium', {
                                                        'text-muted': !isDragging,
                                                        'text-primary': isDragging,
                                                    })}
                                                >
                                                    {isDragging
                                                        ? 'Solte as imagens aqui!'
                                                        : 'Arraste e solte até 4 imagens ou clique para selecionar'}
                                                </p>
                                                <Form.Control
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    onChange={handleImageChange}
                                                    multiple
                                                    disabled={selectedImages.length >= MAX_IMAGES}
                                                    className="d-none"
                                                />
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePickFiles();
                                                    }}
                                                    disabled={selectedImages.length >= MAX_IMAGES}
                                                >
                                                    Escolher arquivos
                                                </Button>
                                            </div>
                                            {selectedImages.length > 0 && (
                                                <div className="mt-3">
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <small className="text-muted">
                                                            {selectedImages.length} de {MAX_IMAGES} imagens selecionadas
                                                        </small>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={handleReset}
                                                        >
                                                            Remover todas
                                                        </Button>
                                                    </div>
                                                    <div className="row g-2">
                                                        {selectedImages.map((img) => (
                                                            <div key={img.id} className="col-auto">
                                                                <div
                                                                    className="border rounded p-2"
                                                                    style={{ width: '120px' }}
                                                                    draggable
                                                                    onDragStart={(e) => {
                                                                        e.dataTransfer.setData('text/plain', img.id);
                                                                    }}
                                                                    onDragOver={(e) => {
                                                                        e.preventDefault();
                                                                    }}
                                                                    onDrop={(e) => {
                                                                        const sourceId = e.dataTransfer.getData('text/plain');
                                                                        handleReorder(sourceId, img.id);
                                                                    }}
                                                                >
                                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                                        <small className="text-muted text-truncate me-2" style={{ maxWidth: '84px' }}>
                                                                            {img.name}
                                                                        </small>
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size="xs"
                                                                            onClick={() => handleRemoveImage(img.id)}
                                                                            aria-label="Remover imagem"
                                                                        >
                                                                            <X size={12} />
                                                                        </Button>
                                                                    </div>
                                                                    <div
                                                                        className="mb-2"
                                                                        style={{
                                                                            width: '100px',
                                                                            height: '100px',
                                                                            overflow: 'hidden',
                                                                            borderRadius: '6px',
                                                                            background: '#f1f3f5',
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src={img.preview}
                                                                            alt="Preview"
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                                        />
                                                                    </div>
                                                                    {isProcessing ? (
                                                                        <ProgressBar
                                                                            now={uploadProgress[img.id] || 0}
                                                                            variant="primary"
                                                                            style={{ height: '6px' }}
                                                                        />
                                                                    ) : (
                                                                        <small className="text-muted d-block">Arraste para reordenar</small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <Form.Text className="text-muted">
                                                Formatos aceitos: JPG, PNG, WEBP (máx. 5MB) • até {MAX_IMAGES} imagens
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-medium">
                                                2. Descreva como deseja o avatar
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={4}
                                                placeholder="Exemplo: Quero uma foto de terno no fundo azul, com iluminação profissional, estilo executivo..."
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                disabled={isProcessing}
                                            />
                                            <Form.Text className="text-muted">
                                                Seja específico sobre roupa, fundo, iluminação, estilo, etc.
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-medium">
                                                3. Tipo de fundo
                                            </Form.Label>
                                            <Form.Select
                                                value={backgroundType}
                                                onChange={(e) => handleBackgroundTypeChange(e.target.value)}
                                                disabled={isProcessing}
                                            >
                                                {backgroundTypes.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                Defina o tipo de fundo do avatar
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-medium">
                                                {/* <Droplet size={16} className="me-2" /> */}
                                                4. Cor do fundo
                                            </Form.Label>
                                            {backgroundType === 'transparente' ? (
                                                <Form.Control
                                                    type="text"
                                                    value="Sem cor (fundo transparente)"
                                                    disabled
                                                    readOnly
                                                />
                                            ) : (
                                                <Form.Control
                                                    type="color"
                                                    value={backgroundColor || '#FFCC00'}
                                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                                    disabled={isBackgroundColorDisabled}
                                                />
                                            )}
                                            <div className="mt-2 d-flex gap-1 flex-wrap">
                                                {presetColors.map((color) => (
                                                    <div
                                                        key={color}
                                                        onClick={() => {
                                                            if (isBackgroundColorDisabled) return;
                                                            setBackgroundColor(color);
                                                        }}
                                                        style={{
                                                            width: '30px',
                                                            height: '30px',
                                                            backgroundColor: color,
                                                            borderRadius: '4px',
                                                            cursor: isBackgroundColorDisabled ? 'not-allowed' : 'pointer',
                                                            opacity: isBackgroundColorDisabled ? 0.5 : 1,
                                                            border: !isBackgroundColorDisabled && backgroundColor === color ? '3px solid #000' : '1px solid #ddd',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <Form.Text className="text-muted">
                                                Use o seletor ou escolha uma cor pré-definida
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-medium">
                                                5. Estilo
                                            </Form.Label>
                                            <Form.Select
                                                value={stylePreset}
                                                onChange={(e) => setStylePreset(e.target.value)}
                                                disabled={isProcessing}
                                            >
                                                {styleOptions.map((option) => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                Defina o estilo visual do avatar
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-medium">
                                                6. Ângulo / Enquadramento
                                            </Form.Label>
                                            <Form.Select
                                                value={framing}
                                                onChange={(e) => setFraming(e.target.value)}
                                                disabled={isProcessing}
                                            >
                                                {framingOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                Escolha o enquadramento do avatar
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-medium">
                                                7. Formato (Aspect Ratio)
                                            </Form.Label>
                                            <Form.Select
                                                value={aspectRatio}
                                                onChange={(e) => setAspectRatio(e.target.value)}
                                                disabled={isProcessing}
                                            >
                                                {aspectRatioGroups.map((group) => (
                                                    <optgroup key={group.label} label={group.label}>
                                                        {group.options.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {`${option.icon} ${option.label} (${option.ratio}) - ${option.dimensions}`}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </Form.Select>
                                            <div className="mt-2 rounded border px-3 py-2 d-flex align-items-center gap-3">
                                                <div
                                                    style={{
                                                        ...selectedAspectRatioPreviewStyle,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                                <div>
                                                    <div className="fw-semibold">{selectedAspectRatio.label}</div>
                                                    <div className="small text-muted">
                                                        {selectedAspectRatio.ratio} - {selectedAspectRatio.dimensions}
                                                    </div>
                                                </div>
                                            </div>
                                            <Form.Text className="text-muted">
                                                Selecione a proporção ideal para o uso
                                            </Form.Text>
                                        </Form.Group>

                                        <Alert variant="info" className="d-flex align-items-start mb-4">
                                            <AlertCircle size={18} className="me-2 mt-1" />
                                            <div>
                                                <strong>Tempo de processamento:</strong>
                                                <p className="mb-0 small">
                                                    A geração do avatar pode levar até 2 minutos. Durante esse tempo,
                                                    aplicamos IA de última geração da Governa AI Studio, revisão de
                                                    qualidade e customização vetorial.
                                                </p>
                                            </div>
                                        </Alert>

                                        <div className="d-grid gap-2">
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={handleGenerate}
                                                disabled={isProcessing || selectedImages.length === 0 || !prompt.trim()}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Spinner
                                                            as="span"
                                                            animation="border"
                                                            size="sm"
                                                            role="status"
                                                            className="me-2"
                                                        />
                                                        Gerando Avatar...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap size={18} className="me-2" />
                                                        Gerar Avatar
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="card-border card-simple-hover">
                                    <Card.Body>
                                        <h6 className="mb-3">
                                            <AlertCircle size={16} className="me-2" />
                                            Como funciona?
                                        </h6>
                                        <ol className="mb-0 ps-3">
                                            <li className="mb-2">Faça upload das suas fotos</li>
                                            <li className="mb-2">Descreva como deseja o avatar (roupa, fundo, estilo)</li>
                                            <li className="mb-2">Escolha o tipo e a cor do fundo</li>
                                            <li className="mb-2">Defina o estilo visual</li>
                                            <li className="mb-2">Escolha o ângulo/enquadramento</li>
                                            <li className="mb-2">Defina o formato (aspect ratio)</li>
                                            <li className="mb-2">Nossa IA melhora seu prompt automaticamente</li>
                                            <li>Receba seu avatar profissional em segundos!</li>
                                        </ol>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={6}>
                                <Card className="card-border">
                                    <Card.Header>
                                        <h5 className="mb-0">
                                            <ImageIcon size={18} className="me-2" />
                                            Resultado
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {result ? (
                                            <div>
                                                <Alert variant="success" className="d-flex align-items-center mb-4">
                                                    <Check size={18} className="me-2" />
                                                    {result.message}
                                                </Alert>

                                                <div className="text-center mb-4">
                                                    <img
                                                        src={result.generatedImage}
                                                        alt="Avatar gerado"
                                                        className="img-fluid rounded shadow"
                                                        style={{ maxHeight: '400px' }}
                                                    />
                                                </div>

                                                {result.processedPrompt && result.processedPrompt !== prompt && (
                                                    <div className="mb-3">
                                                        <small className="text-muted fw-medium">Prompt Melhorado pela IA:</small>
                                                        <p className="text-muted small mb-0">{result.processedPrompt}</p>
                                                    </div>
                                                )}

                                                {result.metadata && (
                                                    <div className="mb-4">
                                                        <small className="text-muted">
                                                            Formato: {result.metadata.format || aspectRatio}
                                                        </small>
                                                    </div>
                                                )}

                                                <div className="d-grid gap-2">
                                                    <Button variant="success" size="lg" onClick={handleDownload}>
                                                        <Download size={18} className="me-2" />
                                                        Baixar Avatar
                                                    </Button>
                                                    <Button variant="outline-primary" onClick={handleReset}>
                                                        Gerar Novo Avatar
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-5">
                                                <div className="text-muted mb-3">
                                                    <ImageIcon size={64} className="opacity-25" />
                                                </div>
                                                <h5 className="text-muted">Aguardando geração</h5>
                                                <p className="text-muted mb-0">
                                                    Faça upload das suas fotos e descreva seu avatar para começar
                                                </p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>

                                {isProcessing && (
                                    <Card className="card-border mt-4">
                                        <Card.Body className="py-4">
                                            <div className="text-center mb-4">
                                                <Spinner
                                                    animation="border"
                                                    variant="primary"
                                                    className="mb-3"
                                                    style={{ width: '3rem', height: '3rem' }}
                                                />
                                                <h6>Gerando seu avatar...</h6>
                                                <p className="text-muted small mb-0">Isso pode levar até 2 minutos</p>
                                            </div>

                                            <div className="px-3">
                                                {processingSteps.map((step, index) => (
                                                    <div
                                                        key={step.id}
                                                        className={classNames(
                                                            'd-flex align-items-start mb-3 pb-3',
                                                            { 'border-bottom': index < processingSteps.length - 1 }
                                                        )}
                                                    >
                                                        <div className="me-3">
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
                                                                    'fw-medium',
                                                                    { 'text-primary': processingStep === index },
                                                                    { 'text-success': processingStep > index },
                                                                    { 'text-muted': processingStep < index }
                                                                )}
                                                            >
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

export default function AvatarGeneratorPage() {
    const [showSidebar, setShowSidebar] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 1740px)').matches;
    });

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames('contactapp-wrap', { 'contactapp-sidebar-toggle': showSidebar })}>
                <AvatarGeneratorSidebar />
                <div className="contactapp-content">
                    <div className="contactapp-detail-wrap">
                        <AvatarGeneratorHeader
                            toggleSidebar={() => setShowSidebar(!showSidebar)}
                            show={showSidebar}
                        />
                        <AvatarGeneratorBody />
                    </div>
                </div>
            </div>
        </div>
    );
}
