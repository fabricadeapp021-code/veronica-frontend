'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import SimpleBar from 'simplebar-react';
import { Button, Card, Col, Form, Row, Alert, Badge, ProgressBar, Spinner } from 'react-bootstrap';
import { Zap, Video, Download, Play, Volume2, Type, Clock, Settings, Upload } from 'react-feather';
import ImageGeneratorSidebar from '../ImageGeneratorSidebar';
import VideoGeneratorHeader from '../VideoGeneratorHeader';

const WEBHOOK_URL =
    process.env.NEXT_PUBLIC_VIDEO_WEBHOOK_URL ||
    'https://nexus-n8n.captain.nexusbr.ai/webhook/video-generator';

const SUPABASE_PUBLIC_BASE =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://erehebbcacbnnzlzutsy.supabase.co';

const POLL_INTERVAL_MS = 70_000;
const MAX_POLL_ATTEMPTS = 4;

const VideoGeneratorBody = () => {
    const [script, setScript] = useState('');
    const [duration, setDuration] = useState(4);
    const [language, setLanguage] = useState('pt-BR');
    const [voice, setVoice] = useState('neural-male-1');
    const [aspectRatio, setAspectRatio] = useState('auto');
    const [seed, setSeed] = useState(70);
    const [subtitles, setSubtitles] = useState(true);

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [pollAttempt, setPollAttempt] = useState(0);
    const [taskId, setTaskId] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);
    const pollTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            clearTimeout(pollTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isProcessing) return;
        const timer = setTimeout(() => {
            const el = document.querySelector('.contact-body .simplebar-content-wrapper');
            if (el) el.scrollTop = 0;
        }, 100);
        return () => clearTimeout(timer);
    }, [isProcessing]);

    const stopPolling = useCallback(() => {
        clearTimeout(pollTimerRef.current);
    }, []);

    const checkVideoReady = useCallback(
        async (tid, attempt) => {
            const videoUrl = `${SUPABASE_PUBLIC_BASE}/storage/v1/object/public/temp-videos/${tid}.mp4`;
            try {
                const res = await fetch(videoUrl, { method: 'HEAD' });
                if (res.ok) {
                    stopPolling();
                    setProgress(100);
                    setResult({ videoUrl, taskId: tid });
                    setIsProcessing(false);
                    return;
                }
            } catch (_) {
                // arquivo ainda não existe
            }

            if (attempt >= MAX_POLL_ATTEMPTS) {
                stopPolling();
                setIsProcessing(false);
                setError(
                    'Tempo limite excedido. O vídeo está demorando mais que o esperado. Tente novamente mais tarde.'
                );
                return;
            }

            const next = attempt + 1;
            setPollAttempt(next);
            setProgress(Math.round((next / MAX_POLL_ATTEMPTS) * 85) + 10);
            pollTimerRef.current = setTimeout(() => checkVideoReady(tid, next), POLL_INTERVAL_MS);
        },
        [stopPolling]
    );

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImage(file);

        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            // redimensiona mantendo proporção, máx 512px no maior lado
            const MAX = 512;
            let { width, height } = img;
            if (width > height) {
                if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
            } else {
                if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);

            // reduz qualidade até ficar abaixo de ~150 KB em base64
            const MAX_B64_BYTES = 150 * 1024;
            let dataUrl;
            for (const quality of [0.7, 0.5, 0.3]) {
                dataUrl = canvas.toDataURL('image/jpeg', quality);
                const b64 = dataUrl.split(',')[1] || '';
                if (b64.length <= MAX_B64_BYTES) break;
            }

            setImagePreview(dataUrl);
            setImageBase64(dataUrl.split(',')[1] || dataUrl);
        };
        img.src = objectUrl;
    };

    const handleGenerate = async () => {
        if (!script.trim()) {
            setError('Por favor, escreva o script do vídeo.');
            return;
        }
        if (script.trim().split(/\s+/).length < 10) {
            setError('O script deve ter pelo menos 10 palavras.');
            return;
        }

        stopPolling();
        setIsProcessing(true);
        setError(null);
        setResult(null);
        setProgress(5);
        setPollAttempt(0);
        setTaskId(null);

        try {
            const body = {
                script: script.trim(),
                duration,
                ...(imageBase64 ? { image: imageBase64 } : {}),
            };

            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error(`Webhook retornou status ${res.status}`);

            const data = await res.json();
            if (!data.task_id) throw new Error('task_id não retornado pelo webhook.');

            setTaskId(data.task_id);
            setProgress(10);
            setPollAttempt(1);
            pollTimerRef.current = setTimeout(
                () => checkVideoReady(data.task_id, 1),
                POLL_INTERVAL_MS
            );
        } catch (err) {
            stopPolling();
            setIsProcessing(false);
            setError(err.message || 'Erro ao iniciar geração do vídeo.');
        }
    };

    const handleReset = () => {
        stopPolling();
        setScript('');
        setResult(null);
        setError(null);
        setProgress(0);
        setPollAttempt(0);
        setTaskId(null);
        setImage(null);
        setImagePreview(null);
        setImageBase64(null);
        setIsProcessing(false);
    };

    const languages = [
        { value: 'pt-BR', label: '🇧🇷 Português (Brasil)' },
        { value: 'en-US', label: '🇺🇸 English (US)' },
        { value: 'es-ES', label: '🇪🇸 Español' },
        { value: 'fr-FR', label: '🇫🇷 Français' },
    ];

    const voices = [
        { value: 'neural-male-1', label: '🎙️ Masculina Neural 1' },
        { value: 'neural-male-2', label: '🎙️ Masculina Neural 2' },
        { value: 'neural-female-1', label: '🎙️ Feminina Neural 1' },
        { value: 'neural-female-2', label: '🎙️ Feminina Neural 2' },
    ];

    const exampleScripts = [
        'Olá, sou Marcos Almeida, candidato a prefeito da nossa cidade. Trabalhei toda minha vida ao lado das pessoas, conhecendo a realidade de cada família, de cada trabalhador. Agora é hora de renovação, de união e trabalho. Juntos, vamos construir um futuro melhor, com mais saúde, educação e oportunidades para todos. Conte comigo!',
        'É hora de mudança! Nossa campanha representa o novo, o futuro. Queremos mais saúde, mais educação e mais segurança. Vote consciente, vote 15!',
        'Trabalhei muito para chegar até aqui. Conheço a realidade de cada bairro. Com sua confiança, vamos fazer a diferença juntos.',
    ];

    return (
        <div className="contact-body">
            <SimpleBar className="nicescroll-bar">
                <div className="contact-list-view">
                    <div className="p-4">
                        <Row>
                            <Col lg={5}>
                                <Card className="card-border mb-4">
                                    <Card.Header>
                                        <h5 className="mb-0">
                                            <Settings size={18} className="me-2" />
                                            Configurações do Vídeo
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">
                                                <Upload size={16} className="me-2" />
                                                1. Imagem/Foto do Avatar (opcional)
                                            </Form.Label>
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={isProcessing}
                                                ref={fileInputRef}
                                            />
                                            {imagePreview && (
                                                <div className="mt-2">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="img-thumbnail"
                                                        style={{ maxHeight: '100px' }}
                                                    />
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="text-danger"
                                                        onClick={() => {
                                                            setImage(null);
                                                            setImagePreview(null);
                                                            setImageBase64(null);
                                                        }}
                                                    >
                                                        Remover
                                                    </Button>
                                                </div>
                                            )}
                                            <Form.Text className="text-muted">
                                                Envie uma foto para usar como avatar no vídeo
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">
                                                <Type size={16} className="me-2" />
                                                2. Escreva o Script
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={6}
                                                value={script}
                                                onChange={(e) => setScript(e.target.value)}
                                                disabled={isProcessing}
                                                placeholder="Escreva o script que será narrado no vídeo..."
                                            />
                                            <Form.Text className="text-muted">
                                                {script.trim().split(' ').filter((w) => w).length} palavras
                                            </Form.Text>
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-medium">3. Idioma</Form.Label>
                                                    <Form.Select
                                                        value={language}
                                                        onChange={(e) => setLanguage(e.target.value)}
                                                        disabled={isProcessing}
                                                    >
                                                        {languages.map((l) => (
                                                            <option key={l.value} value={l.value}>
                                                                {l.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-medium">
                                                        <Volume2 size={16} className="me-2" />
                                                        4. Voz
                                                    </Form.Label>
                                                    <Form.Select
                                                        value={voice}
                                                        onChange={(e) => setVoice(e.target.value)}
                                                        disabled={isProcessing}
                                                    >
                                                        {voices.map((v) => (
                                                            <option key={v.value} value={v.value}>
                                                                {v.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-medium">
                                                        <Clock size={16} className="me-2" />
                                                        5. Duração (segundos)
                                                    </Form.Label>
                                                    <Form.Select
                                                        value={duration}
                                                        onChange={(e) => setDuration(Number(e.target.value))}
                                                        disabled={isProcessing}
                                                    >
                                                        <option value={4}>4 segundos</option>
                                                        <option value={6}>6 segundos</option>
                                                        <option value={8}>8 segundos</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-medium">6. Proporção</Form.Label>
                                                    <Form.Select
                                                        value={aspectRatio}
                                                        onChange={(e) => setAspectRatio(e.target.value)}
                                                        disabled={isProcessing}
                                                    >
                                                        <option value="auto">Auto</option>
                                                        <option value="16:9">16:9 (Paisagem)</option>
                                                        <option value="9:16">9:16 (Retrato)</option>
                                                        <option value="1:1">1:1 (Quadrado)</option>
                                                        <option value="4:3">4:3</option>
                                                        <option value="3:4">3:4</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-medium">7. Seed (Aleatoriedade)</Form.Label>
                                            <Form.Range
                                                min={1}
                                                max={100}
                                                value={seed}
                                                onChange={(e) => setSeed(Number(e.target.value))}
                                                disabled={isProcessing}
                                            />
                                            <Form.Text className="text-muted">
                                                Seed: {seed} (valores diferentes geram resultados variados)
                                            </Form.Text>
                                        </Form.Group>

                                        {error && (
                                            <Alert variant="danger" className="mb-4">
                                                {error}
                                            </Alert>
                                        )}

                                        <div className="d-grid gap-2">
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={handleGenerate}
                                                disabled={isProcessing || !script.trim()}
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Spinner
                                                            as="span"
                                                            animation="border"
                                                            size="sm"
                                                            className="me-2"
                                                        />
                                                        Gerando Vídeo...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Zap size={18} className="me-2" />
                                                        Gerar Vídeo
                                                    </>
                                                )}
                                            </Button>
                                            {(result || error) && !isProcessing && (
                                                <Button variant="outline-secondary" onClick={handleReset}>
                                                    Novo Vídeo
                                                </Button>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="card-border">
                                    <Card.Header>
                                        <h6 className="mb-0">💡 Scripts de Exemplo</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex flex-column gap-2">
                                            {exampleScripts.map((example, idx) => (
                                                <Button
                                                    key={idx}
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="text-start"
                                                    onClick={() => setScript(example)}
                                                    disabled={isProcessing}
                                                >
                                                    {example.substring(0, 80)}...
                                                </Button>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={7}>
                                <Card className="card-border">
                                    <Card.Header>
                                        <h5 className="mb-0">
                                            <Video size={18} className="me-2" />
                                            Preview do Vídeo
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {result ? (
                                            <div>
                                                <div className="ratio ratio-16x9 mb-3">
                                                    <video controls className="rounded">
                                                        <source src={result.videoUrl} type="video/mp4" />
                                                        Seu navegador não suporta vídeo.
                                                    </video>
                                                </div>

                                                <Row className="mb-3">
                                                    <Col>
                                                        <div className="d-flex align-items-center">
                                                            <Clock size={16} className="me-2 text-muted" />
                                                            <small className="text-muted">Duração:</small>
                                                            <strong className="ms-2">{duration}s</strong>
                                                        </div>
                                                    </Col>
                                                    <Col>
                                                        <div className="d-flex align-items-center">
                                                            <small className="text-muted me-2">Task ID:</small>
                                                            <Badge bg="secondary" className="text-truncate" style={{ maxWidth: 160 }}>
                                                                {result.taskId}
                                                            </Badge>
                                                        </div>
                                                    </Col>
                                                </Row>

                                                <div className="d-grid gap-2">
                                                    <Button
                                                        variant="success"
                                                        size="lg"
                                                        as="a"
                                                        href={result.videoUrl}
                                                        download="video-gerado.mp4"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Download size={18} className="me-2" />
                                                        Baixar Vídeo (MP4)
                                                    </Button>
                                                    <Row>
                                                        <Col>
                                                            <Button variant="outline-primary" size="sm" className="w-100">
                                                                <Play size={14} className="me-1" />
                                                                Compartilhar
                                                            </Button>
                                                        </Col>
                                                        <Col>
                                                            <Button
                                                                variant="outline-secondary"
                                                                size="sm"
                                                                className="w-100"
                                                                onClick={handleReset}
                                                            >
                                                                Novo Vídeo
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </div>
                                        ) : isProcessing ? (
                                            <div className="text-center py-5">
                                                <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
                                                <h6 className="mb-3">Gerando seu vídeo...</h6>
                                                <ProgressBar now={progress} label={`${progress}%`} className="mb-3" style={{ height: '25px' }} />
                                                <p className="text-muted mb-0">
                                                    {progress < 30 && '🎙️ Sintetizando voz...'}
                                                    {progress >= 30 && progress < 60 && '👤 Sincronizando avatar...'}
                                                    {progress >= 60 && progress < 90 && '🎬 Renderizando vídeo...'}
                                                    {progress >= 90 && '✨ Finalizando...'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-5">
                                                <Video
                                                    size={64}
                                                    className="text-muted opacity-25 mb-3"
                                                />
                                                <h5 className="text-muted">Aguardando geração</h5>
                                                <p className="text-muted mb-0">
                                                    Escreva o script e clique em "Gerar Vídeo"
                                                </p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>

                                {result && (
                                    <Alert variant="success" className="mt-3">
                                        <Video size={16} className="me-2" />
                                        <strong>Sucesso!</strong> Seu vídeo foi gerado. Você pode baixar ou criar uma nova versão.
                                    </Alert>
                                )}
                            </Col>
                        </Row>
                    </div>
                </div>
            </SimpleBar>

        </div>
    );
};

export default function VideoGeneratorPage() {
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
                        <VideoGeneratorHeader
                            toggleSidebar={() => setShowSidebar(!showSidebar)}
                            show={showSidebar}
                        />
                        <VideoGeneratorBody />
                    </div>
                </div>
            </div>
        </div>
    );
}
