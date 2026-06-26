'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, Button, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import CommonFooter1 from '../CommonFooter1';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { setTenantId } from '@/lib/auth/session';
import ProvisionalBrand from '@/components/ProvisionalBrand';

//Images
import signupBg from '@/assets/img/signup-bg.jpg';

const Signup = (props) => {
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [subdomainTouched, setSubdomainTouched] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({
        name: '',
        companyName: '',
        email: '',
        password: ''
    });
    const [touched, setTouched] = useState({
        name: false,
        companyName: false,
        email: false,
        password: false
    });

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
        if (!subdomainTouched) {
            setSubdomain(slugify(companyName));
        }
    }, [companyName, subdomainTouched]);

    const validateField = (fieldName, value) => {
        let error = '';
        
        if (fieldName === 'name') {
            if (!value || value.trim() === '') {
                error = 'Nome é obrigatório';
            }
        } else if (fieldName === 'companyName') {
            if (!value || value.trim() === '') {
                error = 'Nome da empresa é obrigatório';
            }
        } else if (fieldName === 'email') {
            if (!value || value.trim() === '') {
                error = 'E-mail é obrigatório';
            } else {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    error = 'Por favor, insira um e-mail válido';
                }
            }
        } else if (fieldName === 'password') {
            if (!value || value.trim() === '') {
                error = 'Senha é obrigatória';
            } else if (value.length < 6) {
                error = 'A senha deve ter no mínimo 6 caracteres';
            }
        }
        
        return error;
    };

    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        let value;
        if (fieldName === 'name') value = name;
        else if (fieldName === 'companyName') value = companyName;
        else if (fieldName === 'email') value = email;
        else if (fieldName === 'password') value = password;
        
        const error = validateField(fieldName, value);
        setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    };

    const handleChange = (fieldName, value) => {
        if (fieldName === 'name') {
            setName(value);
        } else if (fieldName === 'companyName') {
            setCompanyName(value);
        } else if (fieldName === 'email') {
            setEmail(value);
        } else if (fieldName === 'password') {
            setPassword(value);
        }
        
        // Limpa erro do campo quando o usuário começa a digitar
        if (touched[fieldName]) {
            const error = validateField(fieldName, value);
            setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
        }
        
        // Limpa erro geral quando o usuário começa a digitar
        if (error) {
            setError('');
        }
    };

    const validateForm = () => {
        const errors = {
            name: validateField('name', name),
            companyName: validateField('companyName', companyName),
            email: validateField('email', email),
            password: validateField('password', password)
        };
        
        setFieldErrors(errors);
        setTouched({ name: true, companyName: true, email: true, password: true });
        
        return !errors.name && !errors.companyName && !errors.email && !errors.password;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Valida todos os campos antes de submeter
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        try {
            const result = await registerCompany({
                name,
                email,
                password,
                companyName,
                subdomain: subdomain || undefined,
            });
            
            // Salva tenantId no localStorage para login automático
            if (result?.tenant?.id) {
                setTenantId(result.tenant.id);
            } else if (result?.user?.tenantId) {
                setTenantId(result.user.tenantId);
            }
            
            router.push('/apps/users/list');
        } catch (err) {
            const msg = err?.body?.message || err?.message || 'Falha ao criar conta';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hk-pg-wrapper py-0">
            <div className="hk-pg-body py-0">
                <Container fluid>
                    <Row className="auth-split">
                        <Col xl={5} lg={6} md={5} className="d-md-block d-none bg-primary-dark-3 bg-opacity-85 position-relative">
                            <Image className="bg-img" src={signupBg} alt="bg-img" />
                            <div className="auth-content py-8">
                                <Row>
                                    <Col xxl={8} className="mx-auto">
                                        <div className="text-center">
                                            <h3 className="text-white mb-2">Controle de agentes e automações para sua empresa.</h3>
                                            <p className="text-white">Comece agora — <u>sem custo inicial</u>.</p>
                                        </div>
                                        <ul className="list-icon text-white mt-4">
                                            <li className="mb-1">
                                                <p><i className="ri-check-fill" /><span>Gateway OpenClaw conectado ao painel de operação e monitoramento</span></p>
                                            </li>
                                            <li className="mb-1">
                                                <p><i className="ri-check-fill" /><span>Gerencie tenants, usuários, autenticação, logs e alertas em um único lugar</span></p>
                                            </li>
                                            <li className="mb-1">
                                                <p><i className="ri-check-fill" /><span>Multi-empresa — cada cliente tem seus próprios dados isolados com segurança</span></p>
                                            </li>
                                        </ul>
                                    </Col>
                                </Row>
                            </div>
                            <p className="p-xs text-white credit-text opacity-55">Painel SaaS de agentes — OpenClaw</p>
                        </Col>
                        <Col xl={7} lg={6} md={7} sm={10} className="position-relative mx-auto" style={{ backgroundColor: '#fff' }}>
                            <div className="auth-content flex-column pt-8 pb-md-8 pb-13" style={{ backgroundColor: '#fff', color: '#212529' }}>
                                <div className="text-center mb-7">
                                    <ProvisionalBrand centered />
                                </div>
                                <style>{`
                                    .signup-form-light .form-control,
                                    .signup-form-light .input-group-text,
                                    .signup-form-light .affix-wth-text {
                                        background-color: #fff !important;
                                        color: #212529 !important;
                                        border-color: #dee2e6 !important;
                                    }
                                    .signup-form-light .form-label,
                                    .signup-form-light label,
                                    .signup-form-light .text-muted,
                                    .signup-form-light p,
                                    .signup-form-light h4,
                                    .signup-form-light small { color: inherit !important; }
                                    .signup-form-light a:not(.btn) { color: #0d6efd !important; }
                                `}</style>
                                <Form className="w-100 signup-form-light" onSubmit={handleSubmit}>
                                    <Row>
                                        <Col xxl={5} xl={7} lg={10} className="mx-auto">
                                            <h4 className="text-center mb-4">Criar conta no OpenClaw SaaS</h4>
                                            {error && (
                                                <Alert variant="danger" className="py-2">
                                                    {error}
                                                </Alert>
                                            )}
                                            {/*
                                              Login social (Google/Facebook) - não implementado.
                                              Cadastro via OpenClaw API.
                                            */}
                                            <Row className="gx-3">
                                                <Col lg={12} as={Form.Group} className="mb-3">
                                                    <Form.Label>Nome <span className="text-danger">*</span></Form.Label>
                                                    <Form.Control
                                                        placeholder="Digite seu nome"
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => handleChange('name', e.target.value)}
                                                        onBlur={() => handleBlur('name')}
                                                        required
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
                                                        placeholder="Nome da empresa"
                                                        type="text"
                                                        value={companyName}
                                                        onChange={(e) => handleChange('companyName', e.target.value)}
                                                        onBlur={() => handleBlur('companyName')}
                                                        required
                                                        isInvalid={touched.companyName && !!fieldErrors.companyName}
                                                    />
                                                    {touched.companyName && fieldErrors.companyName && (
                                                        <Form.Control.Feedback type="invalid" className="d-block">
                                                            {fieldErrors.companyName}
                                                        </Form.Control.Feedback>
                                                    )}
                                                </Col>
                                                <Col lg={12} as={Form.Group} className="mb-3">
                                                    <Form.Label>Subdomínio (opcional)</Form.Label>
                                                    <Form.Control
                                                        placeholder="ex: minha-empresa"
                                                        type="text"
                                                        value={subdomain}
                                                        onChange={(e) => {
                                                            setSubdomainTouched(true);
                                                            setSubdomain(e.target.value);
                                                        }}
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Você pode deixar em branco — usamos isso para identificação do tenant.
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
                                                        required
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
                                                                type={showPassword ? "text" : "password"}
                                                                value={password}
                                                                onChange={(e) => handleChange('password', e.target.value)}
                                                                onBlur={() => handleBlur('password')}
                                                                required
                                                                isInvalid={touched.password && !!fieldErrors.password}
                                                            />
                                                            <a href="#" className="input-suffix text-primary text-uppercase fs-8 fw-medium" onClick={() => setShowPassword(!showPassword)} >
                                                                {showPassword
                                                                    ?
                                                                    <span>Ocultar</span>
                                                                    :
                                                                    <span>Mostrar</span>
                                                                }
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
                                            <Form.Check id="logged_in" className="form-check-sm mb-3" >
                                                <Form.Check.Input type="checkbox" defaultChecked />
                                                <Form.Check.Label className="text-muted fs-7">
                                                    Ao criar uma conta, você concorda com nossos <a href="#">Termos de uso</a> e <a href="#">Política de privacidade</a>.
                                                </Form.Check.Label>
                                            </Form.Check>
                                            <Button variant='primary' type="submit" className="btn-rounded btn-uppercase btn-block d-flex align-items-center justify-content-center gap-2" disabled={loading} style={{ minHeight: '42px' }}>
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                                        <span>Criando…</span>
                                                    </>
                                                ) : 'Criar conta'}
                                            </Button>
                                            <p className="p-xs mt-2 text-center">Já tem conta? <Link href="/auth/login"><u>Entrar</u></Link></p>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>
                            {/* Page Footer */}
                            <CommonFooter1 />
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>

    )
}

export default Signup
