'use client';
import { useState } from 'react';
import classNames from 'classnames';
import { Button, Card, Col, Row, Form, Alert, Spinner } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import { Edit3, Copy, Download, RefreshCw, Check, FileText, Mail, MessageSquare, Smartphone } from 'react-feather';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import CopywriterSidebar from './CopywriterSidebar';
import CopywriterHeader from './CopywriterHeader';

const CopywriterBody = () => {
    const [formData, setFormData] = useState({
        contentType: 'post',
        theme: '',
        tone: 'professional',
        length: 'medium',
        includeHashtags: true,
        includeEmojis: false,
        optimizeSEO: true,
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [generatedText, setGeneratedText] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [history, setHistory] = useState([]);
    const [copied, setCopied] = useState(false);

    const contentTypeOptions = [
        { value: 'post', label: 'Post para Redes Sociais', icon: <FileText size={16} /> },
        { value: 'ad', label: 'Anúncio Publicitário', icon: <FileText size={16} /> },
        { value: 'email', label: 'E-mail Marketing', icon: <Mail size={16} /> },
        { value: 'sms', label: 'SMS Marketing', icon: <Smartphone size={16} /> },
        { value: 'message', label: 'Mensagem WhatsApp', icon: <MessageSquare size={16} /> },
    ];

    const toneOptions = [
        { value: 'professional', label: 'Profissional' },
        { value: 'casual', label: 'Casual' },
        { value: 'friendly', label: 'Amigável' },
        { value: 'formal', label: 'Formal' },
        { value: 'enthusiastic', label: 'Entusiasta' },
        { value: 'empathetic', label: 'Empático' },
    ];

    const lengthOptions = [
        { value: 'short', label: 'Curto (até 50 palavras)' },
        { value: 'medium', label: 'Médio (50-150 palavras)' },
        { value: 'long', label: 'Longo (150+ palavras)' },
    ];

    const processingSteps = [
        { id: 1, label: 'Analisando contexto e tema...', icon: '🔍', duration: 800 },
        { id: 2, label: 'Aplicando tom de voz selecionado...', icon: '🎯', duration: 600 },
        { id: 3, label: 'Gerando conteúdo com IA...', icon: '✨', duration: 1200 },
        { id: 4, label: 'Otimizando para engajamento...', icon: '📈', duration: 700 },
        { id: 5, label: 'Adicionando hashtags e emojis...', icon: '🏷️', duration: 500 },
        { id: 6, label: 'Aplicando SEO e finalização...', icon: '🎨', duration: 600 },
        { id: 7, label: '✅ Texto gerado com sucesso!', icon: '✅', duration: 400 },
    ];

    const mockTexts = {
        post: {
            professional: "🗳️ Chegou a hora de transformar nossa cidade!\n\nCom 20 anos de experiência em gestão pública, estou pronto para trazer mudanças reais para nossa comunidade. Juntos, vamos construir uma cidade mais justa, com mais oportunidades e qualidade de vida para todos.\n\n✅ Saúde de qualidade\n✅ Educação transformadora\n✅ Segurança efetiva\n✅ Transparência total\n\nVote consciente. Vote 00.\n\n#MarcosdoGás #Renovação #Política #Eleições2026 #NossaCidade #Mudança",
            casual: "Fala, galera! 👋\n\nCheguei para fazer diferente! Cansei de ver promessas vazias e quero REALMENTE mudar nossa cidade. Com vocês ao meu lado, vamos fazer acontecer!\n\n🚀 Mais empregos\n🏥 Saúde que funciona\n📚 Educação de verdade\n\nBora junto? Vote 00! 💪\n\n#MarcosdoGás #MudançaJá #Eleições2026",
            friendly: "Olá, amigos! 😊\n\nVenho com humildade pedir seu apoio para transformarmos juntos nossa cidade. Minha experiência está a serviço do povo, e meu compromisso é com cada família, cada trabalhador, cada sonho que merece se realizar.\n\nVamos construir o futuro que merecemos?\n\nVote 00 - Marcos do Gás\n\n#Juntos #Transformação #Eleições2026 #NossaCidade",
        },
        ad: {
            professional: "🎯 VOTE CONSCIENTE. VOTE TRANSFORMAÇÃO.\n\nMarcos do Gás - Número 00\nPRC - Partido da Renovação Cidadã\n\n✅ 20 anos de experiência em gestão pública\n✅ Projetos aprovados e executados\n✅ Reconhecimento nacional\n\nSua cidade merece um gestor preparado.\nVote 00 em 06 de outubro.\n\n#Eleições2026 #Vote00",
            casual: "Cansou de promessas? 😤\n\nEu também! Por isso vim com AÇÃO! 💪\n\nMarcos do Gás - 00\nMudança de verdade!\n\n🔥 Vote e veja acontecer!\n\n#Vote00 #MudançaReal",
        },
        email: {
            professional: "Assunto: Juntos pela transformação da nossa cidade\n\nCaro eleitor(a),\n\nÉ com grande satisfação que venho apresentar minha candidatura a [cargo] pelo número 00, representando o Partido da Renovação Cidadã (PRC).\n\nMinha trajetória de 20 anos na gestão pública me preparou para este momento. Desenvolvi projetos que impactaram positivamente milhares de famílias e agora quero ampliar esse trabalho.\n\nMinhas prioridades:\n• Saúde: ampliar atendimento e reduzir filas\n• Educação: modernizar escolas e valorizar professores\n• Segurança: mais policiamento e prevenção\n• Emprego: atrair empresas e capacitar trabalhadores\n\nConto com seu apoio para transformarmos juntos nossa cidade.\n\nAtenciosamente,\nMarcos Almeida - Marcos do Gás\nCandidato 00 - PRC",
        },
        sms: {
            professional: "Marcos do Gás - 00 🗳️\nVote MUDANÇA! Vote EXPERIÊNCIA!\nDia 06/10 vote 00.\nPRC - Renovação Cidadã\nSaiba mais: votemarcos.com.br",
            casual: "Oi! Vote MARCOS DO GÁS - 00 💪\nMudança de verdade!\n06/10 - Vote 00\nwww.votemarcos.com.br",
        },
        message: {
            friendly: "Olá! 👋\n\nSou o Marcos do Gás, candidato pelo número 00. Gostaria de contar com seu apoio nessa caminhada!\n\nJuntos vamos transformar nossa cidade com:\n✅ Saúde de qualidade\n✅ Educação para todos\n✅ Segurança efetiva\n\nPosso compartilhar mais sobre minhas propostas?\n\nGrande abraço! 🤝",
        },
    };

    const handleGenerate = async () => {
        if (!formData.theme.trim()) {
            alert('Por favor, descreva o tema ou contexto do texto.');
            return;
        }

        setIsGenerating(true);
        setShowResult(false);
        setCurrentStep(0);

        // Simular processamento com steps
        for (let i = 0; i < processingSteps.length; i++) {
            setCurrentStep(i);
            await new Promise(resolve => setTimeout(resolve, processingSteps[i].duration));
        }

        // Gerar texto mockado
        const mockTextCategory = mockTexts[formData.contentType] || mockTexts.post;
        const mockText = mockTextCategory[formData.tone] || mockTextCategory.professional || Object.values(mockTextCategory)[0];

        setGeneratedText(mockText);
        setShowResult(true);
        setIsGenerating(false);

        // Adicionar ao histórico
        const newItem = {
            id: Date.now(),
            type: formData.contentType,
            theme: formData.theme,
            tone: formData.tone,
            text: mockText.substring(0, 100) + '...',
            createdAt: new Date().toLocaleString('pt-BR'),
        };
        setHistory([newItem, ...history]);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([generatedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `copywriter-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fm-body">
            <SimpleBar className="nicescroll-bar">
                <div className="container-fluid px-4 py-4">
                    <Row className="gx-3">
                        {/* Formulário */}
                        <Col lg={8} md={12}>
                            <Card className="card-border">
                                <Card.Header>
                                    <Card.Title>
                                        <span className="feather-icon me-2">
                                            <Edit3 size={18} />
                                        </span>
                                        Configurações do Texto
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    {/* Tipo de Conteúdo */}
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tipo de Conteúdo</Form.Label>
                                        <Form.Select
                                            value={formData.contentType}
                                            onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                                            disabled={isGenerating}
                                        >
                                            {contentTypeOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    {/* Tema/Contexto */}
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tema ou Contexto</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            placeholder="Ex: Campanha sobre saúde pública, destacando nossa proposta de ampliar o atendimento..."
                                            value={formData.theme}
                                            onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                                            disabled={isGenerating}
                                        />
                                    </Form.Group>

                                    <Row>
                                        {/* Tom de Voz */}
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Tom de Voz</Form.Label>
                                                <Form.Select
                                                    value={formData.tone}
                                                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                                                    disabled={isGenerating}
                                                >
                                                    {toneOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>

                                        {/* Comprimento */}
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Comprimento</Form.Label>
                                                <Form.Select
                                                    value={formData.length}
                                                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                                                    disabled={isGenerating}
                                                >
                                                    {lengthOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Opções Adicionais */}
                                    <Form.Group className="mb-4">
                                        <Form.Label>Opções Adicionais</Form.Label>
                                        <div className="d-flex flex-column gap-2">
                                            <Form.Check
                                                type="checkbox"
                                                id="includeHashtags"
                                                label="Incluir sugestões de hashtags"
                                                checked={formData.includeHashtags}
                                                onChange={(e) => setFormData({ ...formData, includeHashtags: e.target.checked })}
                                                disabled={isGenerating}
                                            />
                                            <Form.Check
                                                type="checkbox"
                                                id="includeEmojis"
                                                label="Incluir emojis"
                                                checked={formData.includeEmojis}
                                                onChange={(e) => setFormData({ ...formData, includeEmojis: e.target.checked })}
                                                disabled={isGenerating}
                                            />
                                            <Form.Check
                                                type="checkbox"
                                                id="optimizeSEO"
                                                label="Otimizar para SEO"
                                                checked={formData.optimizeSEO}
                                                onChange={(e) => setFormData({ ...formData, optimizeSEO: e.target.checked })}
                                                disabled={isGenerating}
                                            />
                                        </div>
                                    </Form.Group>

                                    {/* Botão Gerar */}
                                    <div className="d-grid">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !formData.theme.trim()}
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                        className="me-2"
                                                    />
                                                    Gerando...
                                                </>
                                            ) : (
                                                <>
                                                    <Edit3 size={18} className="me-2" />
                                                    Gerar Texto com IA
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Loading Steps */}
                            {isGenerating && (
                                <Card className="card-border mt-3">
                                    <Card.Body>
                                        <div className="d-flex flex-column gap-3">
                                            {processingSteps.map((step, index) => (
                                                <div
                                                    key={step.id}
                                                    className={`d-flex align-items-center ${
                                                        index < currentStep ? 'opacity-50' :
                                                        index === currentStep ? '' :
                                                        'opacity-25'
                                                    }`}
                                                >
                                                    <span className="me-2" style={{ fontSize: '20px' }}>
                                                        {step.icon}
                                                    </span>
                                                    <span className={index === currentStep ? 'fw-bold' : ''}>
                                                        {step.label}
                                                    </span>
                                                    {index < currentStep && (
                                                        <Check size={16} className="ms-auto text-success" />
                                                    )}
                                                    {index === currentStep && (
                                                        <Spinner
                                                            animation="border"
                                                            size="sm"
                                                            className="ms-auto"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Resultado */}
                            {showResult && generatedText && (
                                <Card className="card-border mt-3">
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <Card.Title className="mb-0">
                                            ✨ Texto Gerado
                                        </Card.Title>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="soft-success"
                                                size="sm"
                                                onClick={handleCopy}
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check size={14} className="me-1" />
                                                        Copiado!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={14} className="me-1" />
                                                        Copiar
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="soft-primary"
                                                size="sm"
                                                onClick={handleDownload}
                                            >
                                                <Download size={14} className="me-1" />
                                                Baixar
                                            </Button>
                                            <Button
                                                variant="soft-secondary"
                                                size="sm"
                                                onClick={handleGenerate}
                                            >
                                                <RefreshCw size={14} className="me-1" />
                                                Regenerar
                                            </Button>
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                                            {generatedText}
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        {/* Sidebar Direita - Info */}
                        <Col lg={4} md={12}>
                            <Card className="card-border">
                                <Card.Header>
                                    <Card.Title>ℹ️ Sobre o Copywriter IA</Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <p className="text-muted">
                                        Gere textos profissionais para suas campanhas políticas em segundos.
                                    </p>
                                    <div className="separator my-3" />
                                    <div className="d-flex flex-column gap-2">
                                        <div>
                                            <HkBadge bg="primary" soft size="sm">5 tipos de conteúdo</HkBadge>
                                        </div>
                                        <div>
                                            <HkBadge bg="success" soft size="sm">6 tons de voz</HkBadge>
                                        </div>
                                        <div>
                                            <HkBadge bg="warning" soft size="sm">Hashtags automáticas</HkBadge>
                                        </div>
                                        <div>
                                            <HkBadge bg="info" soft size="sm">Otimização SEO</HkBadge>
                                        </div>
                                    </div>
                                    <div className="separator my-3" />
                                    <Alert variant="info" className="mb-0">
                                        <div className="alert-heading">💡 Dica</div>
                                        <p className="mb-0 small">
                                            Seja específico no tema para melhores resultados. Inclua detalhes sobre sua proposta ou mensagem principal.
                                        </p>
                                    </Alert>
                                </Card.Body>
                            </Card>

                            {/* Histórico */}
                            {history.length > 0 && (
                                <Card className="card-border mt-3">
                                    <Card.Header>
                                        <Card.Title>📋 Histórico Recente</Card.Title>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        <SimpleBar style={{ maxHeight: '300px' }}>
                                            <div className="list-group list-group-flush">
                                                {history.slice(0, 5).map((item) => (
                                                    <div key={item.id} className="list-group-item">
                                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                                            <HkBadge bg="primary" soft size="sm">
                                                                {contentTypeOptions.find(opt => opt.value === item.type)?.label || item.type}
                                                            </HkBadge>
                                                            <small className="text-muted">{item.createdAt}</small>
                                                        </div>
                                                        <div className="small text-muted">
                                                            <strong>Tema:</strong> {item.theme}
                                                        </div>
                                                        <div className="small text-muted mt-1">
                                                            {item.text}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </SimpleBar>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>
                    </Row>
                </div>
            </SimpleBar>
        </div>
    );
};

const CopywriterPage = () => {
    const [showSidebar, setShowSidebar] = useState(true);

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("fmapp-wrap", { "fmapp-sidebar-toggle": !showSidebar })}>
                <CopywriterSidebar />
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        <CopywriterHeader showSidebar={showSidebar} toggleSidebar={() => setShowSidebar(!showSidebar)} />
                        <CopywriterBody />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CopywriterPage;
