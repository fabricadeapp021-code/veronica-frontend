'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import CommonFooter1 from '../../CommonFooter1';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { setTenantId } from '@/lib/auth/session';
import ProvisionalBrand from '@/components/ProvisionalBrand';

const SignupClassic = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [subdomainTouched, setSubdomainTouched] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({ name: '', companyName: '', email: '', password: '' });
    const [touched, setTouched] = useState({ name: false, companyName: false, email: false, password: false });

    const router = useRouter();
    const { registerCompany } = useAuth();

    const slugify = (value) =>
        String(value || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
            .slice(0, 50);

    useEffect(() => {
        if (!subdomainTouched) setSubdomain(slugify(companyName));
    }, [companyName, subdomainTouched]);

    useEffect(() => {
        const body = document.body;
        const prevBg = body.style.backgroundColor;
        const prevColor = body.style.color;

        body.style.backgroundColor = '#f8fafc';
        body.style.color = '#212529';

        return () => {
            body.style.backgroundColor = prevBg;
            body.style.color = prevColor;
        };
    }, []);

    const validateField = (fieldName, value) => {
        if (fieldName === 'name') {
            return !value?.trim() ? 'Nome é obrigatório' : '';
        }
        if (fieldName === 'companyName') {
            return !value?.trim() ? 'Nome da empresa é obrigatório' : '';
        }
        if (fieldName === 'email') {
            if (!value?.trim()) return 'E-mail é obrigatório';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Por favor, insira um e-mail válido';
            return '';
        }
        if (fieldName === 'password') {
            if (!value?.trim()) return 'Senha é obrigatória';
            if (value.length < 6) return 'A senha deve ter no mínimo 6 caracteres';
            return '';
        }
        return '';
    };

    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        const val = { name, companyName, email, password }[fieldName];
        setFieldErrors(prev => ({ ...prev, [fieldName]: validateField(fieldName, val) }));
    };

    const handleChange = (fieldName, value) => {
        if (fieldName === 'name') setName(value);
        else if (fieldName === 'companyName') setCompanyName(value);
        else if (fieldName === 'email') setEmail(value);
        else if (fieldName === 'password') setPassword(value);

        if (touched[fieldName]) {
            setFieldErrors(prev => ({ ...prev, [fieldName]: validateField(fieldName, value) }));
        }
        if (error) setError('');
    };

    const validateForm = () => {
        const errors = {
            name: validateField('name', name),
            companyName: validateField('companyName', companyName),
            email: validateField('email', email),
            password: validateField('password', password),
        };
        setFieldErrors(errors);
        setTouched({ name: true, companyName: true, email: true, password: true });
        return !errors.name && !errors.companyName && !errors.email && !errors.password;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validateForm()) return;
        setLoading(true);
        try {
            const result = await registerCompany({
                name,
                email,
                password,
                companyName,
                subdomain: subdomain || undefined,
            });
            if (result?.tenant?.id) setTenantId(result.tenant.id);
            else if (result?.user?.tenantId) setTenantId(result.user.tenantId);
            router.push('/apps/users/list');
        } catch (err) {
            const msg = err?.body?.message || err?.message || 'Falha ao criar conta';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hk-pg-wrapper pt-0 pb-xl-0 pb-5" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            <div className="hk-pg-body pt-0 pb-xl-0" style={{ backgroundColor: '#f8fafc' }}>
                <Container style={{ backgroundColor: '#f8fafc' }}>
                    <style>{`
                        .signup-classic-light .card,
                        .signup-classic-light .card-body,
                        .signup-classic-light .form-control,
                        .signup-classic-light .input-group-text,
                        .signup-classic-light .input-affix-wrapper {
                            background-color: #ffffff !important;
                            color: #212529 !important;
                            border-color: #dee2e6 !important;
                        }
                        .signup-classic-light .form-label,
                        .signup-classic-light label,
                        .signup-classic-light h1,
                        .signup-classic-light h2,
                        .signup-classic-light h3,
                        .signup-classic-light h4,
                        .signup-classic-light h5,
                        .signup-classic-light h6,
                        .signup-classic-light p,
                        .signup-classic-light span:not(.badge):not(.btn) {
                            color: #212529 !important;
                        }
                        .signup-classic-light .text-muted {
                            color: #6c757d !important;
                        }
                        .signup-classic-light .hk-footer,
                        .signup-classic-light .footer {
                            background-color: #f8fafc !important;
                        }
                        .signup-classic-light .footer-text,
                        .signup-classic-light .footer-text a,
                        .signup-classic-light .copy-text {
                            color: #6c757d !important;
                        }
                    `}</style>
                    <Row>
                        <Col sm={10} className="position-relative mx-auto signup-classic-light">
                            <div className="auth-content py-8" style={{ color: '#212529' }}>
                                <Form className="w-100" onSubmit={handleSubmit} style={{ color: '#212529' }}>
                                    <Row>
                                        <Col xxl={5} xl={7} lg={8} sm={10} className="mx-auto">
                                            <div className="text-center mb-7" style={{ transform: 'translateX(15px)' }}>
                                                <ProvisionalBrand centered />
                                            </div>
                                            <Card className="card-border" style={{ backgroundColor: '#ffffff', color: '#212529' }}>
                                                <Card.Body>
                                                    <h4 className="text-center mb-0">Criar conta no OpenClaw SaaS</h4>
                                                    <p className="p-xs mt-2 mb-4 text-center">
                                                        Já tem conta? <Link href="/auth/login"><u>Entrar</u></Link>
                                                    </p>
                                                    {error && (
                                                        <Alert variant="danger" className="py-2">
                                                            {error}
                                                        </Alert>
                                                    )}
                                                    <Row className="gx-3">
                                                        <Col lg={12} as={Form.Group} className="mb-3">
                                                            <Form.Label>Seu nome <span className="text-danger">*</span></Form.Label>
                                                            <Form.Control
                                                                placeholder="Digite seu nome completo"
                                                                type="text"
                                                                value={name}
                                                                onChange={(e) => handleChange('name', e.target.value)}
                                                                onBlur={() => handleBlur('name')}
                                                                isInvalid={touched.name && !!fieldErrors.name}
                                                            />
                                                            {touched.name && fieldErrors.name && (
                                                                <Form.Control.Feedback type="invalid" className="d-block">
                                                                    {fieldErrors.name}
                                                                </Form.Control.Feedback>
                                                            )}
                                                        </Col>
                                                        <Col lg={12} as={Form.Group} className="mb-3">
                                                            <Form.Label>Empresa <span className="text-danger">*</span></Form.Label>
                                                            <Form.Control
                                                                placeholder="Ex: Empresa ABC Ltda"
                                                                type="text"
                                                                value={companyName}
                                                                onChange={(e) => handleChange('companyName', e.target.value)}
                                                                onBlur={() => handleBlur('companyName')}
                                                                isInvalid={touched.companyName && !!fieldErrors.companyName}
                                                            />
                                                            {touched.companyName && fieldErrors.companyName && (
                                                                <Form.Control.Feedback type="invalid" className="d-block">
                                                                    {fieldErrors.companyName}
                                                                </Form.Control.Feedback>
                                                            )}
                                                        </Col>
                                                        <Col lg={12} as={Form.Group} className="mb-3">
                                                            <Form.Label>Subdomínio <span className="text-muted fs-8">(opcional)</span></Form.Label>
                                                            <Form.Control
                                                                placeholder="ex: empresa-abc"
                                                                type="text"
                                                                value={subdomain}
                                                                onChange={(e) => {
                                                                    setSubdomainTouched(true);
                                                                    setSubdomain(e.target.value);
                                                                }}
                                                            />
                                                            <Form.Text className="text-muted">
                                                                Gerado automaticamente a partir do nome da empresa.
                                                            </Form.Text>
                                                        </Col>
                                                        <Col lg={12} as={Form.Group} className="mb-3">
                                                            <Form.Label>E-mail <span className="text-danger">*</span></Form.Label>
                                                            <Form.Control
                                                                placeholder="Digite seu e-mail"
                                                                type="email"
                                                                value={email}
                                                                onChange={(e) => handleChange('email', e.target.value)}
                                                                onBlur={() => handleBlur('email')}
                                                                isInvalid={touched.email && !!fieldErrors.email}
                                                            />
                                                            {touched.email && fieldErrors.email && (
                                                                <Form.Control.Feedback type="invalid" className="d-block">
                                                                    {fieldErrors.email}
                                                                </Form.Control.Feedback>
                                                            )}
                                                        </Col>
                                                        <Col lg={12} as={Form.Group} className="mb-3">
                                                            <Form.Label>Senha <span className="text-danger">*</span></Form.Label>
                                                            <InputGroup className="password-check">
                                                                <span className="input-affix-wrapper affix-wth-text">
                                                                    <Form.Control
                                                                        placeholder="Mínimo 6 caracteres"
                                                                        type={showPassword ? 'text' : 'password'}
                                                                        value={password}
                                                                        onChange={(e) => handleChange('password', e.target.value)}
                                                                        onBlur={() => handleBlur('password')}
                                                                        isInvalid={touched.password && !!fieldErrors.password}
                                                                    />
                                                                    <a
                                                                        href="#"
                                                                        className="input-suffix text-primary text-uppercase fs-8 fw-medium"
                                                                        onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                                                                    >
                                                                        {showPassword ? <span>Ocultar</span> : <span>Mostrar</span>}
                                                                    </a>
                                                                </span>
                                                            </InputGroup>
                                                            {touched.password && fieldErrors.password && (
                                                                <Form.Control.Feedback type="invalid" className="d-block">
                                                                    {fieldErrors.password}
                                                                </Form.Control.Feedback>
                                                            )}
                                                        </Col>
                                                    </Row>
                                                    <Form.Check id="terms_check" className="form-check-sm mb-3">
                                                        <Form.Check.Input type="checkbox" defaultChecked />
                                                        <Form.Check.Label className="text-muted fs-7">
                                                            Ao criar uma conta, você concorda com nossos <a href="#">Termos de uso</a> e <a href="#">Política de privacidade</a>.
                                                        </Form.Check.Label>
                                                    </Form.Check>
                                                    <Button
                                                        variant="primary"
                                                        type="submit"
                                                        className="btn-rounded btn-uppercase btn-block"
                                                        disabled={loading}
                                                    >
                                                        {loading ? 'Criando conta…' : 'Criar minha conta'}
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
            <CommonFooter1 />
        </div>
    );
};

export default SignupClassic;
