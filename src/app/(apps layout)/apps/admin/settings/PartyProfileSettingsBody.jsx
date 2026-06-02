'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { getTheme, updateTheme } from '@/lib/api/services/theme';
import { clearCachedTheme } from '@/lib/auth/session';
import ImageUpload from '@/components/ImageUpload';

export default function PartyProfileSettingsBody() {
    const { user } = useAuth();
    const { theme, refetch } = useTheme();
    const isOwner = user?.role === 'owner';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [form, setForm] = useState({
        primaryColor: '',
        secondaryColor: '',
        logoUrl: '',
        dashboardLogoUrl: '',
        description: '',
        loginTitle: '',
        loginRightTitle: '',
        loginRightDescription: '',
    });

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getTheme();
                setForm({
                    primaryColor: data.primaryColor ?? '',
                    secondaryColor: data.secondaryColor ?? '',
                    logoUrl: data.logoUrl ?? '',
                    dashboardLogoUrl: data.dashboardLogoUrl ?? '',
                    description: data.description ?? '',
                    loginTitle: data.loginTitle ?? '',
                    loginRightTitle: data.loginRightTitle ?? '',
                    loginRightDescription: data.loginRightDescription ?? '',
                });
            } catch (err) {
                console.warn('Erro ao carregar tema:', err);
                setAlert({ type: 'warning', msg: 'Tema não carregado. Você pode configurar abaixo. (Verifique se está logado e se sua conta tem tenant vinculado.)' });
                setForm({
                    primaryColor: '',
                    secondaryColor: '',
                    logoUrl: '',
                    dashboardLogoUrl: '',
                    description: '',
                });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value ?? '' }));
    };

    const handleSave = async () => {
        if (!isOwner) return;
        setSaving(true);
        setAlert(null);
        try {
        const payload = {
                primaryColor: form.primaryColor.trim() || undefined,
                secondaryColor: form.secondaryColor.trim() || undefined,
                logoUrl: form.logoUrl.trim() || undefined,
                dashboardLogoUrl: form.dashboardLogoUrl.trim() || undefined,
                description: form.description.trim() || undefined,
                loginTitle: form.loginTitle.trim() || undefined,
                loginRightTitle: form.loginRightTitle.trim() || undefined,
                loginRightDescription: form.loginRightDescription.trim() || undefined,
            };
            await updateTheme(payload);
            // Invalida o cache para o próximo carregamento buscar da API
            clearCachedTheme();
            // Passa os dados do form direto para o refetch — sem flash de fallback
            await refetch({
                primaryColor: form.primaryColor.trim() || '',
                secondaryColor: form.secondaryColor.trim() || '',
                logoUrl: form.logoUrl.trim() || '',
                dashboardLogoUrl: form.dashboardLogoUrl.trim() || '',
                description: form.description.trim() || '',
                loginTitle: form.loginTitle.trim() || '',
                loginRightTitle: form.loginRightTitle.trim() || '',
                loginRightDescription: form.loginRightDescription.trim() || '',
            });
            setAlert({ type: 'success', msg: 'Aparência atualizada! As cores e logos serão aplicadas na aplicação.' });
        } catch (err) {
            console.error('Erro ao salvar tema:', err);
            const msg = err?.status === 0
                ? 'Erro de conexão com a API. Verifique se o servidor está rodando em localhost:3001.'
                : err?.status === 401
                ? 'Sessão expirada. Faça login novamente.'
                : err?.status === 403
                ? 'Apenas o owner pode alterar o tema.'
                : err?.message || 'Erro ao salvar.';
            setAlert({ type: 'danger', msg });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container-fluid py-4 d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="py-2" style={{ maxWidth: 720 }}>
            <p className="text-muted small mb-3">
                Cores, logo e textos usados na tela de login e no dashboard. Apenas o proprietário pode alterar.
            </p>

            {!isOwner && (
                <Alert variant="info">
                    Apenas o <strong>proprietário</strong> da conta pode editar estas configurações.
                </Alert>
            )}

            {alert && (
                <Alert variant={alert.type} dismissible onClose={() => setAlert(null)} className="mb-4">
                    {alert.msg}
                </Alert>
            )}

            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                    <h6 className="fw-bold mb-3 text-muted text-uppercase" style={{ fontSize: 11, letterSpacing: 1 }}>🎨 Cores</h6>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Cor primária</Form.Label>
                        <div className="d-flex align-items-center gap-2">
                            <Form.Control
                                type="color"
                                value={form.primaryColor || '#009b36'}
                                onChange={(e) => handleChange('primaryColor', e.target.value)}
                                style={{ width: 56, height: 38, padding: 4 }}
                                disabled={!isOwner}
                            />
                            <Form.Control
                                type="text"
                                placeholder="#009b36"
                                value={form.primaryColor}
                                onChange={(e) => handleChange('primaryColor', e.target.value)}
                                disabled={!isOwner}
                            />
                        </div>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">Cor secundária</Form.Label>
                        <div className="d-flex align-items-center gap-2">
                            <Form.Control
                                type="color"
                                value={form.secondaryColor || '#0d6efd'}
                                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                                style={{ width: 56, height: 38, padding: 4 }}
                                disabled={!isOwner}
                            />
                            <Form.Control
                                type="text"
                                placeholder="#0d6efd"
                                value={form.secondaryColor}
                                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                                disabled={!isOwner}
                            />
                        </div>
                    </Form.Group>

                    <hr className="my-3" />
                    <h6 className="fw-bold mb-3 text-muted text-uppercase" style={{ fontSize: 11, letterSpacing: 1 }}>🖼️ Logos</h6>

                    <ImageUpload
                        label="Logo da tela de login"
                        value={form.logoUrl}
                        onChange={(url) => handleChange('logoUrl', url)}
                        folder="party-logos"
                        hint="Exibida na tela de login. Se vazio, será usada a logo padrão TMS."
                        disabled={!isOwner}
                        previewSize={72}
                    />

                    <div className="mt-3">
                        <ImageUpload
                            label="Logo do dashboard / sidebar"
                            value={form.dashboardLogoUrl}
                            onChange={(url) => handleChange('dashboardLogoUrl', url)}
                            folder="party-logos"
                            hint="Exibida no cabeçalho da sidebar. Se vazio, será usada a logo padrão."
                            disabled={!isOwner}
                            previewSize={72}
                        />
                    </div>

                    <hr className="my-3" />
                    <h6 className="fw-bold mb-3 text-muted text-uppercase" style={{ fontSize: 11, letterSpacing: 1 }}>📝 Textos da tela de login</h6>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Título principal</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ex: Entrar na sua conta"
                            value={form.loginTitle}
                            onChange={(e) => handleChange('loginTitle', e.target.value)}
                            disabled={!isOwner}
                        />
                        <Form.Text className="text-muted">Aparece como heading acima do formulário de login.</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Subtítulo / texto de boas-vindas</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Ex: Bem-vindo ao sistema de gestão de frotas..."
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            disabled={!isOwner}
                        />
                        <Form.Text className="text-muted">Aparece abaixo do título principal.</Form.Text>
                    </Form.Group>

                    <hr className="my-3" />
                    <h6 className="fw-bold mb-3 text-muted text-uppercase" style={{ fontSize: 11, letterSpacing: 1 }}>📢 Painel direito da tela de login</h6>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Título do painel direito</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ex: Gestão de frotas inteligente"
                            value={form.loginRightTitle}
                            onChange={(e) => handleChange('loginRightTitle', e.target.value)}
                            disabled={!isOwner}
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">Descrição do painel direito</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Ex: Rastreie sua frota em tempo real com IA..."
                            value={form.loginRightDescription}
                            onChange={(e) => handleChange('loginRightDescription', e.target.value)}
                            disabled={!isOwner}
                        />
                    </Form.Group>

                    {isOwner && (
                        <Button variant="primary" onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar aparência'
                            )}
                        </Button>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}
