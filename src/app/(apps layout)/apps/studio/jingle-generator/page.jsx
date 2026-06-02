'use client';
import React, { useState, useRef } from 'react';
import classNames from 'classnames';
import SimpleBar from 'simplebar-react';
import { Button, Card, Col, Form, Row, Badge, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { Zap, Music, Download, Play, Pause, Volume2, Clock, Check, AlertCircle } from 'react-feather';
// import JingleGeneratorSidebar from '../JingleGeneratorSidebar';
import ImageGeneratorSidebar from '../ImageGeneratorSidebar';
import JingleGeneratorHeader from '../JingleGeneratorHeader';
import { musicAPI } from '@/lib/api/services/music';

const JingleGeneratorBody = () => {
    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState('pop-brasileiro');
    const [duration, setDuration] = useState('60s'); // ⚠️ FIXO EM 60s - OCULTO DO USUÁRIO
    const [tone, setTone] = useState('animado');
    const [voiceType, setVoiceType] = useState('masculina');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingStep, setGeneratingStep] = useState(0);
    const [generatedJingle, setGeneratedJingle] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    // Steps da geração
    const generatingSteps = [
        { id: 1, label: '🎼 Analisando Prompt', description: 'Processando descrição e tema...' },
        { id: 2, label: '🎵 Gerando com Governa AI Studio', description: 'Criando composição musical...' },
        { id: 3, label: '🎤 Sintetizando Vocais', description: 'Aplicando voz e letras...' },
        { id: 4, label: '🎚️ Mixagem e Masterização', description: 'Ajustando qualidade de áudio...' },
        { id: 5, label: '✅ Finalizando', description: 'Preparando arquivo MP3...' },
    ];

    // Estilos musicais
    const styles = [
        { value: 'pop-brasileiro', label: '🎸 Pop Brasileiro', description: 'Animado e moderno' },
        { value: 'sertanejo', label: '🎺 Sertanejo', description: 'Popular e tradicional' },
        { value: 'forro', label: '🥁 Forró', description: 'Festivo e dançante' },
        { value: 'funk', label: '🔊 Funk', description: 'Batida marcante e dançante' },
        { value: 'samba', label: '🥁 Samba', description: 'Tradicional e animado' },
        { value: 'pagode', label: '🎵 Pagode', description: 'Descontraído e popular' },
        { value: 'piseiro', label: '🎹 Piseiro', description: 'Moderno e contagiante' },
        { value: 'rap', label: '🎤 Rap/Hip-Hop', description: 'Urbano e direto' },
        { value: 'axe', label: '🎹 Axé/Carnaval', description: 'Alegre e contagiante' },
        { value: 'mpb', label: '🎻 MPB', description: 'Sofisticado e melódico' },
        { value: 'reggae', label: '🌿 Reggae', description: 'Relaxante e consciente' },
    ];

    // Durações (apenas sugestão para a IA)
    const durations = [
        { value: '30s', label: '30 segundos (Flash)' },
        { value: '45s', label: '45 segundos (Compacto)' },
        { value: '60s', label: '60 segundos (Padrão)' },
    ];

    // Tons
    const tones = [
        { value: 'animado', label: '😄 Animado e Positivo' },
        { value: 'emocional', label: '❤️ Emocional e Inspirador' },
        { value: 'energetico', label: '⚡ Energético e Motivador' },
        { value: 'calmo', label: '😌 Calmo e Confiante' },
    ];

    // Tipos de voz
    const voices = [
        { value: 'masculina', label: '👨 Voz Masculina' },
        { value: 'feminina', label: '👩 Voz Feminina' },
        { value: 'coro', label: '👥 Coro (Múltiplas vozes)' },
    ];

    // Prompts de exemplo
    const examplePrompts = [
        "Jingle para Marcos do Gás, candidato a vereador número 15. Mensagem sobre trabalho, honestidade e compromisso com a comunidade. Tom positivo e inspirador. Refrão marcante repetindo nome e número.",
        "Jingle político para candidata Ana Paula, número 22. Jovem líder focada em educação, juventude e tecnologia. Mensagem de renovação e futuro. Tom energético e moderno.",
        "Jingle eleitoral para João da Silva, vereador número 45. Mensagem sobre experiência, seriedade e realizações na cidade. Destaque para saúde e infraestrutura. Tom confiante e experiente.",
    ];

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            alert('Por favor, descreva seu jingle.');
            return;
        }

        setIsGenerating(true);
        setGeneratingStep(0);
        setGeneratedJingle(null);

        try {
            // Step 0-1: Preparando e enviando para API
            setGeneratingStep(0);
            
            // Construir DTO da API
            const dto = musicAPI.buildMusicDto({
                prompt,
                style,        // ✅ Passar o value direto (ex: 'pop-brasileiro')
                duration,
                tone,         // ✅ Passar o value direto (ex: 'animado')
                voiceType,    // ✅ Passar o value direto (ex: 'masculina')
            });

            console.log('🎵 Enviando para Suno API:', dto);

            // Iniciar geração
            const { taskId } = await musicAPI.generateMusic(dto);
            console.log('✅ Task iniciada:', taskId);

            setGeneratingStep(1);

            // Polling com feedback visual
            let pollCount = 0;
            const result = await musicAPI.waitForCompletion(
                taskId,
                (status) => {
                    pollCount++;
                    console.log(`⏳ Poll ${pollCount}:`, status.status);

                    // Atualizar steps baseado no status real da API
                    if (status.status === 'TEXT_SUCCESS' && generatingStep < 2) {
                        setGeneratingStep(2); // Letras prontas
                    } else if (status.status === 'FIRST_SUCCESS' && generatingStep < 3) {
                        setGeneratingStep(3); // Primeiro áudio pronto
                    } else if (status.status === 'SUCCESS' && generatingStep < 4) {
                        setGeneratingStep(4); // Finalizado
                    }
                },
                {
                    interval: 5000, // Poll a cada 5 segundos
                    maxAttempts: 60, // Até 5 minutos
                }
            );

            // Sucesso! Usar apenas tracks[0] (primeira versão)
            const firstTrack = result.tracks[0];

            setGeneratedJingle({
                // URLs do áudio
                url: firstTrack.audioUrl,
                streamUrl: firstTrack.streamAudioUrl,
                sourceUrl: firstTrack.sourceAudioUrl,
                
                // Metadados
                title: firstTrack.title || 'Jingle Eleitoral',
                duration: Math.round(firstTrack.duration), // segundos
                
                // Dados do formulário
                style: styles.find(s => s.value === style)?.label || style,
                tone: tones.find(t => t.value === tone)?.label || tone,
                prompt: prompt,
                
                // Dados da API
                imageUrl: firstTrack.imageUrl,
                lyrics: firstTrack.prompt, // Letras geradas pela IA
                tags: firstTrack.tags,
                modelName: firstTrack.modelName,
                
                // IDs para referência
                taskId: result.taskId,
                audioId: firstTrack.id,
            });

            console.log('🎉 Jingle gerado com sucesso!');
            setIsGenerating(false);
            setGeneratingStep(0);

        } catch (error) {
            console.error('❌ Erro ao gerar jingle:', error);
            alert(`Erro ao gerar jingle: ${error.message || 'Erro desconhecido'}`);
            setIsGenerating(false);
            setGeneratingStep(0);
        }
    };

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleDownload = () => {
        if (generatedJingle) {
            const link = document.createElement('a');
            link.href = generatedJingle.url;
            link.download = `jingle-eleitoral-${Date.now()}.mp3`;
            link.click();
        }
    };

    const handleReset = () => {
        setPrompt('');
        setGeneratedJingle(null);
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const handleUseExample = (example) => {
        setPrompt(example);
    };

    return (
        <div className="contact-body">
            <SimpleBar className="nicescroll-bar">
                <div className="contact-list-view">
                    <div className="p-4">
                        <Row>
                            <Col lg={5}>
                                <Card className="card-border mb-4">
                                    <Card.Header>
                                        <h5 className="mb-0">Configurações do Jingle</h5>
                                    </Card.Header>
                                    <Card.Body>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-medium">1. Descreva seu jingle</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={6}
                                                placeholder="Exemplo: Jingle eleitoral para candidato João Silva, número 15. Mensagem sobre mudança, progresso e trabalho para a cidade. Destacar compromisso com educação e saúde."
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                disabled={isGenerating}
                                            />
                                            <Form.Text className="text-muted">
                                                💡 Descreva o candidato, número, mensagem principal e temas. A IA criará letra e melodia automaticamente.
                                            </Form.Text>
                                        </Form.Group>

                                        <Row>
                                            <Col md={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-medium">
                                                        <Music size={16} className="me-2" />
                                                        2. Estilo Musical
                                                    </Form.Label>
                                                    <Form.Select
                                                        value={style}
                                                        onChange={(e) => setStyle(e.target.value)}
                                                        disabled={isGenerating}
                                                    >
                                                        {styles.map((s) => (
                                                            <option key={s.value} value={s.value}>
                                                                {s.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            {/* ⚠️ CAMPO DE DURAÇÃO REMOVIDO - FIXO EM 60s */}
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-medium">3. Tom</Form.Label>
                                                    <Form.Select
                                                        value={tone}
                                                        onChange={(e) => setTone(e.target.value)}
                                                        disabled={isGenerating}
                                                    >
                                                        {tones.map((t) => (
                                                            <option key={t.value} value={t.value}>
                                                                {t.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-medium">
                                                        <Volume2 size={16} className="me-2" />
                                                        4. Tipo de Voz
                                                    </Form.Label>
                                                    <Form.Select
                                                        value={voiceType}
                                                        onChange={(e) => setVoiceType(e.target.value)}
                                                        disabled={isGenerating}
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

                                        <Alert variant="info" className="mb-3">
                                            <AlertCircle size={16} className="me-2" />
                                            <small>
                                                <strong>🎵 Governa AI Studio Automático:</strong> A IA criará letra, melodia e arranjo completos baseados na sua descrição.
                                                <br />
                                                <strong>Modelo:</strong> Suno V5 (mais recente e expressivo)
                                            </small>
                                        </Alert>

                                        <div className="d-grid gap-2">
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                onClick={handleGenerate}
                                                disabled={isGenerating || !prompt.trim()}
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
                                                        Gerar Jingle com Governa AI Studio
                                                    </>
                                                )}
                                            </Button>
                                            <Button variant="outline-secondary" onClick={handleReset}>
                                                Resetar
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="card-border">
                                    <Card.Header>
                                        <h6 className="mb-0">💡 Prompts de Exemplo</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex flex-column gap-2">
                                            {examplePrompts.map((example, idx) => (
                                                <Button
                                                    key={idx}
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="text-start"
                                                    onClick={() => handleUseExample(example)}
                                                    disabled={isGenerating}
                                                >
                                                    {example.substring(0, 100)}...
                                                </Button>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col lg={7}>
                                <Card className="card-border mb-3">
                                    <Card.Header>
                                        <h5 className="mb-0">
                                            <Music size={18} className="me-2" />
                                            {generatedJingle ? 'Seu Jingle Está Pronto!' : 'Player de Áudio'}
                                        </h5>
                                    </Card.Header>
                                    <Card.Body>
                                        {generatedJingle ? (
                                            <div>
                                                <Alert variant="success" className="mb-4">
                                                    <Check size={16} className="me-2" />
                                                    <strong>Jingle gerado com sucesso!</strong> Seu áudio está pronto para download e uso.
                                                </Alert>

                                                <div className="text-center mb-4 p-4 bg-light rounded">
                                                    {generatedJingle.imageUrl ? (
                                                        <img 
                                                            src={generatedJingle.imageUrl} 
                                                            alt={generatedJingle.title}
                                                            className="mb-3 rounded"
                                                            style={{ 
                                                                maxWidth: '300px', 
                                                                width: '100%',
                                                                height: 'auto'
                                                            }}
                                                        />
                                                    ) : (
                                                        <Music size={64} className="text-primary mb-3" />
                                                    )}
                                                    <h4 className="mb-2">{generatedJingle.title}</h4>
                                                    <div className="d-flex gap-2 justify-content-center flex-wrap mb-3">
                                                        <Badge bg="primary">{generatedJingle.style}</Badge>
                                                        <Badge bg="secondary">{generatedJingle.duration}s</Badge>
                                                        <Badge bg="info">{generatedJingle.tone}</Badge>
                                                        {generatedJingle.modelName && (
                                                            <Badge bg="dark">{generatedJingle.modelName}</Badge>
                                                        )}
                                                    </div>

                                                    <audio
                                                        ref={audioRef}
                                                        src={generatedJingle.url}
                                                        onEnded={() => setIsPlaying(false)}
                                                        className="w-100 mb-3"
                                                        controls
                                                    />

                                                    <div className="d-flex gap-2 justify-content-center">
                                                        <Button
                                                            variant={isPlaying ? 'danger' : 'success'}
                                                            size="lg"
                                                            onClick={handlePlayPause}
                                                        >
                                                            {isPlaying ? (
                                                                <>
                                                                    <Pause size={18} className="me-2" />
                                                                    Pausar
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Play size={18} className="me-2" />
                                                                    Reproduzir
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="d-grid gap-2">
                                                    <Button
                                                        variant="success"
                                                        size="lg"
                                                        onClick={handleDownload}
                                                    >
                                                        <Download size={18} className="me-2" />
                                                        Baixar Jingle (MP3)
                                                    </Button>
                                                    <Row>
                                                        <Col>
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                className="w-100"
                                                                onClick={handleGenerate}
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
                                                            >
                                                                Salvar Favorito
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </div>

                                                {/* Letras geradas pela IA */}
                                                {generatedJingle.lyrics && (
                                                    <Card className="card-border mt-3">
                                                        <Card.Header className="bg-light">
                                                            <h6 className="mb-0">📝 Letras Geradas pela IA</h6>
                                                        </Card.Header>
                                                        <Card.Body>
                                                            <pre className="mb-0" style={{ 
                                                                whiteSpace: 'pre-wrap', 
                                                                fontFamily: 'inherit',
                                                                fontSize: '0.9rem',
                                                                lineHeight: '1.6'
                                                            }}>
                                                                {generatedJingle.lyrics}
                                                            </pre>
                                                        </Card.Body>
                                                    </Card>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-5">
                                                <Music size={64} className="text-muted opacity-25 mb-3" />
                                                <h5 className="text-muted">Aguardando geração</h5>
                                                <p className="text-muted mb-0">
                                                    Descreva seu jingle e clique em "Gerar com Governa AI Studio"
                                                </p>
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
                                                <h6>Gerando seu jingle com Governa AI Studio...</h6>
                                                <p className="text-muted small mb-0">
                                                    Isso pode levar ~2 minutos
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

export default function JingleGeneratorPage() {
    const [showSidebar, setShowSidebar] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 1740px)').matches;
    });

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("contactapp-wrap", { "contactapp-sidebar-toggle": showSidebar })}>
                <ImageGeneratorSidebar />
                <div className="contactapp-content">
                    <div className="contactapp-detail-wrap">
                        <JingleGeneratorHeader
                            toggleSidebar={() => setShowSidebar(!showSidebar)}
                            show={showSidebar}
                        />
                        <JingleGeneratorBody />
                    </div>
                </div>
            </div>
        </div>
    );
}
