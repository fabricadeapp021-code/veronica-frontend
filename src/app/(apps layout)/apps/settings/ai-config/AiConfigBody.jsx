'use client';
import { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Badge, Row, Col, InputGroup } from 'react-bootstrap';
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
    },
    {
        id: 'anthropic',
        label: 'Anthropic',
        description: 'Claude Opus, Sonnet e Haiku',
        placeholder: 'sk-ant-...',
        models: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
        defaultModel: 'claude-sonnet-4-6',
        color: '#d97757',
    },
    {
        id: 'google',
        label: 'Google Gemini',
        description: 'Gemini 2.0 Flash e Gemini 1.5 Pro',
        placeholder: 'AIza...',
        models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        defaultModel: 'gemini-2.0-flash',
        color: '#4285f4',
    },
    {
        id: 'deepseek',
        label: 'DeepSeek',
        description: 'DeepSeek Chat e DeepSeek Reasoner',
        placeholder: 'sk-...',
        models: ['deepseek-chat', 'deepseek-reasoner'],
        defaultModel: 'deepseek-chat',
        color: '#5b6af0',
    },
    {
        id: 'grok',
        label: 'Grok (xAI)',
        description: 'Grok-3 e Grok-3 Mini da xAI',
        placeholder: 'xai-...',
        models: ['grok-3', 'grok-3-mini'],
        defaultModel: 'grok-3',
        color: '#1d9bf0',
    },
];

const ProviderIcon = ({ id, size = 28 }) => {
    const style = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size };
    if (id === 'openai') return <span style={style}><Brain size={size} color="#10a37f" /></span>;
    if (id === 'anthropic') return <span style={style}><Stars size={size} color="#d97757" /></span>;
    if (id === 'google') return <span style={style}><BrandGoogle size={size} color="#4285f4" /></span>;
    if (id === 'deepseek') return <span style={style}><Robot size={size} color="#5b6af0" /></span>;
    if (id === 'grok') return <span style={style}><Bolt size={size} color="#1d9bf0" /></span>;
    return <span style={style}><Brain size={size} color="#6c757d" /></span>;
};

const ProviderCard = ({ provider, config, primaryProvider, onSave, onRemove, onSetPrimary, saving }) => {
    const [key, setKey] = useState('');
    const [model, setModel] = useState(provider.defaultModel);
    const [showKey, setShowKey] = useState(false);
    const [dirty, setDirty] = useState(false);
    const isCurrent = config?.configured;
    const isPrimary = primaryProvider === provider.id;

    useEffect(() => {
        if (config?.model) setModel(config.model);
    }, [config?.model]);

    const handleSave = () => {
        if (!key.trim()) return;
        onSave(provider.id, key.trim(), model);
        setKey('');
        setDirty(false);
    };

    return (
        <Card className="mb-3" style={{ border: isPrimary ? `2px solid ${provider.color}` : '1px solid #dee2e6' }}>
            <Card.Body>
                <div className="d-flex align-items-center gap-3 mb-3">
                    <ProviderIcon id={provider.id} size={32} />
                    <div className="flex-grow-1">
                        <div className="fw-semibold d-flex align-items-center gap-2">
                            {provider.label}
                            {isPrimary && (
                                <Badge bg="success" className="fw-normal" style={{ fontSize: '0.7rem' }}>
                                    Principal
                                </Badge>
                            )}
                            {isCurrent && !isPrimary && (
                                <Badge bg="secondary" className="fw-normal" style={{ fontSize: '0.7rem' }}>
                                    Configurado
                                </Badge>
                            )}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.82rem' }}>{provider.description}</div>
                    </div>
                    {isCurrent && !isPrimary && (
                        <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => onSetPrimary(provider.id)}
                            disabled={saving}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            Definir como principal
                        </Button>
                    )}
                </div>

                {isCurrent && config?.addedAt && (
                    <div className="mb-3 p-2 rounded d-flex align-items-center gap-2" style={{ background: '#f8f9fa', fontSize: '0.82rem' }}>
                        <Key size={14} style={{ color: '#6c757d' }} />
                        <span className="text-muted">Chave configurada em {new Date(config.addedAt).toLocaleDateString('pt-BR')}</span>
                        {config.model && (
                            <Badge bg="light" text="dark" className="ms-auto border">{config.model}</Badge>
                        )}
                    </div>
                )}

                <div className="mb-2">
                    <Form.Label className="fw-medium mb-1" style={{ fontSize: '0.85rem' }}>
                        {isCurrent ? 'Substituir chave' : 'Chave de API'}
                    </Form.Label>
                    <InputGroup>
                        <Form.Control
                            type={showKey ? 'text' : 'password'}
                            placeholder={provider.placeholder}
                            value={key}
                            onChange={(e) => { setKey(e.target.value); setDirty(true); }}
                            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                        />
                        <Button
                            variant="outline-secondary"
                            onClick={() => setShowKey(v => !v)}
                            tabIndex={-1}
                        >
                            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                        </Button>
                    </InputGroup>
                </div>

                <div className="mb-3">
                    <Form.Label className="fw-medium mb-1" style={{ fontSize: '0.85rem' }}>Modelo padrão</Form.Label>
                    <Form.Select
                        size="sm"
                        value={model}
                        onChange={(e) => { setModel(e.target.value); setDirty(true); }}
                        style={{ fontSize: '0.85rem' }}
                    >
                        {provider.models.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </Form.Select>
                </div>

                <div className="d-flex gap-2">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSave}
                        disabled={!key.trim() || saving}
                    >
                        {saving ? <Spinner size="sm" animation="border" className="me-1" /> : <Check size={14} className="me-1" />}
                        {isCurrent ? 'Atualizar chave' : 'Salvar chave'}
                    </Button>
                    {isCurrent && (
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => onRemove(provider.id)}
                            disabled={saving}
                        >
                            <Trash size={14} className="me-1" />
                            Remover
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
            showAlert('success', `Chave ${PROVIDERS.find(p => p.id === provider)?.label} salva com sucesso.`);
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

    return (
        <div className="container-fluid py-4" style={{ maxWidth: 700 }}>
            <div className="mb-4">
                <h4 className="fw-bold mb-1">Chaves de IA</h4>
                <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                    Configure suas próprias chaves de API para OpenAI, Anthropic, Google Gemini, DeepSeek e Grok.
                    Cada tenant usa suas chaves de forma isolada — você controla seus custos e limites diretamente.
                </p>
            </div>

            {alert && (
                <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="mb-4">
                    {alert.msg}
                </Alert>
            )}

            {!anyConfigured && (
                <Alert variant="info" className="mb-4" style={{ fontSize: '0.875rem' }}>
                    <strong>Sem chave configurada?</strong> Os seus agentes usarão a chave compartilhada da plataforma.
                    Configurar sua própria chave garante rate limits independentes e controle total dos custos.
                </Alert>
            )}

            {PROVIDERS.map(provider => (
                <ProviderCard
                    key={provider.id}
                    provider={provider}
                    config={config?.[provider.id]}
                    primaryProvider={config?.primaryProvider}
                    onSave={handleSave}
                    onRemove={handleRemove}
                    onSetPrimary={handleSetPrimary}
                    saving={saving}
                />
            ))}
        </div>
    );
};

export default AiConfigBody;
