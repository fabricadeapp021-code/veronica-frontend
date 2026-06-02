'use client';
import { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { apiRequest } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useColorMode } from '@/hooks/useColorMode';

const DispatchSettingsBody = () => {
    const { user: currentUser } = useAuth();
    const { isDark } = useColorMode();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);

    // Voz — Retell AI
    const [retellNumbers, setRetellNumbers] = useState(['']);
    // WhatsApp — WABA
    const [whatsAppNumbers, setWhatsAppNumbers] = useState(['']);

    const userId = currentUser?.id || currentUser?._id;

    useEffect(() => {
        if (!userId) return;
        const load = async () => {
            try {
                const res = await apiRequest(`/admin/users/${userId}`, { method: 'GET' });
                const u = res?.user || res?.data || res;
                setRetellNumbers(u?.retellFromNumbers?.length ? u.retellFromNumbers : ['']);
                setWhatsAppNumbers(u?.whatsAppNumbers?.length ? u.whatsAppNumbers : ['']);
            } catch {
                setAlert({ type: 'danger', msg: 'Erro ao carregar configurações.' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [userId]);

    const handleSave = async () => {
        setSaving(true);
        setAlert(null);
        try {
            await apiRequest(`/admin/users/${userId}`, {
                method: 'PATCH',
                body: {
                    retellFromNumbers: retellNumbers.filter(Boolean),
                    whatsAppNumbers: whatsAppNumbers.filter(Boolean),
                },
            });
            setAlert({ type: 'success', msg: 'Configurações salvas com sucesso!' });
        } catch (err) {
            setAlert({ type: 'danger', msg: err?.message || 'Erro ao salvar.' });
        } finally {
            setSaving(false);
        }
    };

    const updateNumber = (list, setList, index, value) => {
        const updated = [...list];
        updated[index] = value;
        setList(updated);
    };

    const addNumber = (list, setList) => setList([...list, '']);
    const removeNumber = (list, setList, index) => {
        if (list.length === 1) return setList(['']);
        setList(list.filter((_, i) => i !== index));
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="container-fluid py-4" style={{ maxWidth: 860 }}>
            <div className="mb-4">
                <h4 className="fw-bold mb-1">Configurações de Disparo</h4>
                <p className="text-muted mb-0">
                    Configure os números vinculados à sua conta para campanhas de WhatsApp e Voz.
                </p>
            </div>

            {alert && (
                <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="mb-4">
                    {alert.msg}
                </Alert>
            )}

            <div className="row g-4">
                {/* Card WhatsApp */}
                <div className="col-md-6">
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Header className={`border-bottom d-flex align-items-center gap-2 py-3${isDark ? '' : ' bg-white'}`}>
                            <span style={{ fontSize: 22 }}>📱</span>
                            <div>
                                <div className="fw-semibold">WhatsApp (WABA)</div>
                                <small className="text-muted">Número Meta Business</small>
                            </div>
                            {whatsAppNumbers.filter(Boolean).length > 0 && (
                                <Badge bg="success" className="ms-auto">Configurado</Badge>
                            )}
                        </Card.Header>
                        <Card.Body className="p-3">
                            <p className="text-muted small mb-3">
                                Número aprovado no Meta Business Suite para envio de templates WhatsApp.
                                Formato: <code>+5521...</code>
                            </p>
                            {whatsAppNumbers.map((num, i) => (
                                <div key={i} className="d-flex gap-2 mb-2">
                                    <Form.Control
                                        type="text"
                                        placeholder="+5521999999999"
                                        value={num}
                                        onChange={e => updateNumber(whatsAppNumbers, setWhatsAppNumbers, i, e.target.value)}
                                        size="sm"
                                    />
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => removeNumber(whatsAppNumbers, setWhatsAppNumbers, i)}
                                        style={{ minWidth: 32 }}
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => addNumber(whatsAppNumbers, setWhatsAppNumbers)}
                                className="mt-1"
                            >
                                + Adicionar número
                            </Button>
                        </Card.Body>
                    </Card>
                </div>

                {/* Card Voz */}
                <div className="col-md-6">
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Header className={`border-bottom d-flex align-items-center gap-2 py-3${isDark ? '' : ' bg-white'}`}>
                            <span style={{ fontSize: 22 }}>🎙️</span>
                            <div>
                                <div className="fw-semibold">Voz (Retell AI)</div>
                                <small className="text-muted">Número de chamada de voz</small>
                            </div>
                            {retellNumbers.filter(Boolean).length > 0 && (
                                <Badge bg="success" className="ms-auto">Configurado</Badge>
                            )}
                        </Card.Header>
                        <Card.Body className="p-3">
                            <p className="text-muted small mb-3">
                                Número registrado na plataforma Retell AI para disparo de ligações automáticas.
                                Formato: <code>+5521...</code>
                            </p>
                            {retellNumbers.map((num, i) => (
                                <div key={i} className="d-flex gap-2 mb-2">
                                    <Form.Control
                                        type="text"
                                        placeholder="+5521999999999"
                                        value={num}
                                        onChange={e => updateNumber(retellNumbers, setRetellNumbers, i, e.target.value)}
                                        size="sm"
                                    />
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => removeNumber(retellNumbers, setRetellNumbers, i)}
                                        style={{ minWidth: 32 }}
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => addNumber(retellNumbers, setRetellNumbers)}
                                className="mt-1"
                            >
                                + Adicionar número
                            </Button>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            <div className="mt-4 d-flex justify-content-end">
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ minWidth: 180 }}
                >
                    {saving ? <><Spinner size="sm" className="me-2" />Salvando...</> : 'Salvar configurações'}
                </Button>
            </div>
        </div>
    );
};

export default DispatchSettingsBody;
