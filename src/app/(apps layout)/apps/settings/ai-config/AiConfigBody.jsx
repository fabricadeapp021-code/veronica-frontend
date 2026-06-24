'use client';
import { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Badge, Col, Row, InputGroup } from 'react-bootstrap';
import { Eye, EyeOff, Check, Trash, Key, Brain, BrandGoogle, Stars, Bolt, Robot } from 'tabler-icons-react';
import { apiRequest } from '@/lib/api/client';

const PROVIDERS = [
    {
        id: 'openai',
        label: 'OpenAI',
        description: 'GPT-4o, GPT-4o mini e família GPT',
        placeholder: 'sk-proj-...',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        defaultModel: 'gpt-4o-mini',
        color: '#10a37f',
        bg: '#f0faf5',
    },
    {
        id: 'anthropic',
        label: 'Anthropic',
        description: 'Claude Opus, Sonnet e Haiku',
        placeholder: 'sk-ant-...',
        models: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
        defaultModel: 'claude-sonnet-4-6',
        color: '#d97757',
        bg: '#fdf6f3',
    },
    {
        id: 'google',
        label: 'Google Gemini',
        description: 'Gemini 2.0 Flash e Gemini 1.5 Pro',
        placeholder: 'AIza...',
        models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        defaultModel: 'gemini-2.0-flash',
        color: '#4285f4',
        bg: '#f3f7ff',
    },
    {
        id: 'deepseek',
        label: 'DeepSeek',
        description: 'DeepSeek Chat e DeepSeek Reasoner',
        placeholder: 'sk-...',
        models: ['deepseek-chat', 'deepseek-reasoner'],
        defaultModel: 'deepseek-chat',
        color: '#5b6af0',
        bg: '#f4f5fe',
    },
    {
        id: 'grok',
        label: 'Grok (xAI)',
        description: 'Grok-3 e Grok-3 Mini da xAI',
        placeholder: 'xai-...',
        models: ['grok-3', 'grok-3-mini'],
        defaultModel: 'grok-3',
        color: '#1d9bf0',
        bg: '#f0f8ff',
    },
];

const ProviderIcon = ({ id, size = 28 }) => {
    const style = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size };
    if (id === 'openai')    return <span style={style}><Brain  size={size} color="#10a37f" /></span>;
    if (id === 'anthropic') return <span style={style}><Stars  size={size} color="#d97757" /></span>;
    if (id === 'google')    return <span style={style}><BrandGoogle size={size} color="#4285f4" /></span>;
    if (id === 'deepseek')  return <span style={style}><Robot  size={size} color="#5b6af0" /></span>;
    if (id === 'grok')      return <span style={style}><Bolt   size={size} color="#1d9bf0" /></span>;
    return <span style={style}><Brain size={size} color="#6c757d" /></span>;
};

const ProviderCard = ({ provider, config, primaryProvider, onSave, onRemove, onSetPrimary, saving }) => {
    const [key, setKey] = useState('');
    const [model, setModel] = useState(provider.defaultModel);
    const [showKey, setShowKey] = useState(false);
    const isCurrent = config?.configured;
    const isPrimary = primaryProvider === provider.id;

    useEffect(() => {
        if (config?.model) setModel(config.model);
    }, [config?.model]);

    const handleSave = () => {
        if (!key.trim()) return;
        onSave(provider.id, key.trim(), model);
        setKey('');
    };

    const borderStyle = isPrimary
        ? { border: `2px solid ${provider.color}` }
        : { border: '1px solid #dee2e6' };

    return (
        <Card className="h-100" style={{ ...borderStyle, borderRadius: 12, overflow: 'hidden' }}>
            {/* Header colorido */}
            <div style={{ background: provider.bg, padding: '14px 16px', borderBottom: `1px solid ${isPrimary ? provider.color + '40' : '#f0f0f0'}` }}>
                <div className="d-flex align-items-center gap-2">
                    <ProviderIcon id={provider.id} size={26} />
                    <div className="flex-grow-1 min-w-0">
                        <div className="fw-semibold d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: '0.92rem' }}>
                            {provider.label}
                            {isPrimary && (
                                <Badge style={{ background: provider.color, fontSize: '0.65rem' }} className="fw-normal">
                                    Principal
                                </Badge>
                            )}
                            {isCurrent && !isPrimary && (
                                <Badge bg="secondary" className="fw-normal" style={{ fontSize: '0.65rem' }}>
                                    Configurado
                                </Badge>
                            )}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.76rem', lineHeight: 1.3 }}>{provider.description}</div>
                    </div>
                </div>

                {isCurrent && config?.addedAt && (
                    <div className="mt-2 d-flex align-items-center gap-1" style={{ fontSize: '0.74rem', color: '#6c757d' }}>
                        <Key size={11} />
                        <span>Adicionada em {new Date(config.addedAt).toLocaleDateString('pt-BR')}</span>
                        {config.model && (
                            <Badge bg="light" text="dark" className="ms-auto border" style={{ fontSize: '0.7rem' }}>
                                {config.model}
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {/* Corpo do card */}
            <Card.Body className="d-flex flex-column gap-2 p-3">
                <div>
                    <Form.Label className="fw-medium mb-1" style={{ fontSize: '0.8rem' }}>
                        {isCurrent ? 'Substituir chave' : 'Chave de API'}
                    </Form.Label>
                    <InputGroup size="sm">
                        <Form.Control
                            type={showKey ? 'text' : 'password'}
                            placeholder={provider.placeholder}
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                        />
                        <Button
                            variant="outline-secondary"
                            onClick={() => setShowKey(v => !v)}
                            tabIndex={-1}
                            style={{ padding: '0 8px' }}
                        >
                            {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                        </Button>
                    </InputGroup>
                </div>

                <div>
                    <Form.Label className="fw-medium mb-1" style={{ fontSize: '0.8rem' }}>Modelo padrão</Form.Label>
                    <Form.Select
                        size="sm"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                    >
                        {provider.models.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </Form.Select>
                </div>

                {/* Ações */}
                <div className="d-flex flex-column gap-1 mt-auto pt-1">
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!key.trim() || saving}
                        style={{ background: provider.color, border: 'none', fontSize: '0.8rem' }}
                    >
                        {saving ? <Spinner size="sm" animation="border" className="me-1" /> : <Check size={13} className="me-1" />}
                        {isCurrent ? 'Atualizar chave' : 'Salvar chave'}
                    </Button>

                    {isCurrent && !isPrimary && (
                        <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => onSetPrimary(provider.id)}
                            disabled={saving}
                            style={{ fontSize: '0.8rem' }}
                        >
                            Definir como principal
                        </Button>
                    )}

                    {isCurrent && (
                        <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => onRemove(provider.id)}
                            disabled={saving}
                            style={{ fontSize: '0.8rem' }}
                        >
                            <Trash size={13} className="me-1" />
                            Remover chave
                        </Button>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

const AiConfigBody = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert(null), 4000);
    };

    const loadConfig = async () => {
        try {
            const data = await apiRequest('/settings/ai-config', { method: 'GET' });
            setConfig(data);
        } catch (err) {
            showAlert('danger', err?.message || 'Erro ao carregar configurações.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadConfig(); }, []);

    const handleSave = async (provider, key, model) => {
        setSaving(true);
        try {
            await apiRequest(`/settings/ai-config/${provider}`, {
                method: 'PUT',
                body: { key, model },
            });
            showAlert('success', `Chave ${PROVIDERS.find(p => p.id === provider)?.label} salva.`);
            await loadConfig();
        } catch (err) {
            showAlert('danger', err?.message || 'Erro ao salvar chave.');
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (provider) => {
        if (!confirm(`Remover a chave de ${PROVIDERS.find(p => p.id === provider)?.label}?`)) return;
        setSaving(true);
        try {
            await apiRequest(`/settings/ai-config/${provider}`, { method: 'DELETE' });
            showAlert('success', 'Chave removida.');
            await loadConfig();
        } catch (err) {
            showAlert('danger', err?.message || 'Erro ao remover chave.');
        } finally {
            setSaving(false);
        }
    };

    const handleSetPrimary = async (provider) => {
        setSaving(true);
        try {
            await apiRequest('/settings/ai-config/primary', {
                method: 'POST',
                body: { provider },
            });
            showAlert('success', `${PROVIDERS.find(p => p.id === provider)?.label} definido como provedor principal.`);
            await loadConfig();
        } catch (err) {
            showAlert('danger', err?.message || 'Erro ao definir provedor principal.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    const anyConfigured = PROVIDERS.some(p => config?.[p.id]?.configured);
    const primary = PROVIDERS.find(p => p.id === config?.primaryProvider);

    return (
        <div className="container-fluid py-4" style={{ maxWidth: 1100 }}>
            <div className="mb-3">
                <h4 className="fw-bold mb-1">Chaves de IA</h4>
                <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
                    Configure suas próprias chaves para OpenAI, Anthropic, Google Gemini, DeepSeek e Grok.
                    Cada tenant usa suas chaves de forma isolada — você controla custos e rate limits diretamente.
                </p>
            </div>

            {alert && (
                <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="mb-3" style={{ fontSize: '0.875rem' }}>
                    {alert.msg}
                </Alert>
            )}

            {anyConfigured && primary && (
                <div className="mb-3 px-3 py-2 rounded d-flex align-items-center gap-2" style={{ background: primary.bg, border: `1px solid ${primary.color}30`, fontSize: '0.82rem' }}>
                    <ProviderIcon id={primary.id} size={16} />
                    <span>Provedor ativo: <strong>{primary.label}</strong> — modelo <strong>{config?.[primary.id]?.model || primary.defaultModel}</strong></span>
                </div>
            )}

            {!anyConfigured && (
                <Alert variant="info" className="mb-3" style={{ fontSize: '0.875rem' }}>
                    <strong>Sem chave configurada.</strong> Seus agentes usarão a chave compartilhada da plataforma.
                    Adicione sua própria chave para ter rate limits independentes.
                </Alert>
            )}

            <Row className="g-3">
                {PROVIDERS.map(provider => (
                    <Col key={provider.id} xs={12} sm={6} lg={4}>
                        <ProviderCard
                            provider={provider}
                            config={config?.[provider.id]}
                            primaryProvider={config?.primaryProvider}
                            onSave={handleSave}
                            onRemove={handleRemove}
                            onSetPrimary={handleSetPrimary}
                            saving={saving}
                        />
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default AiConfigBody;
