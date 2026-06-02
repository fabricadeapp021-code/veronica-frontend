'use client'
import { useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import { ExternalLink } from 'react-feather';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/context/ThemeProvider';
import { clearTenantId } from '@/lib/auth/session';
import ProvisionalBrand from '@/components/ProvisionalBrand';

const DEFAULT_LOGIN_TITLE = 'Entrar no OpenClaw SaaS';
const DEFAULT_DESCRIPTION = 'Acesse seu painel para controlar tenants, agentes, automações, logs e monitoramento operacional.';
const DEFAULT_RIGHT_TITLE = 'Operação de agentes com governança';
const DEFAULT_RIGHT_DESC = 'Centralize autenticação, observabilidade, execuções e controles do Gateway OpenClaw em uma plataforma multi-tenant.';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({
        email: '',
        password: '',
    });
    const [touched, setTouched] = useState({
        email: false,
        password: false,
    });

    const router = useRouter();
    const { login } = useAuth();
    const { theme } = useTheme();

    const loginTitle = theme?.loginTitle?.trim() || DEFAULT_LOGIN_TITLE;
    const welcomeText = theme?.description?.trim() || DEFAULT_DESCRIPTION;
    const rightPanelTitle = theme?.loginRightTitle?.trim() || DEFAULT_RIGHT_TITLE;
    const rightPanelText = theme?.loginRightDescription?.trim() || DEFAULT_RIGHT_DESC;

    const validateField = (fieldName, value) => {
        let error = '';
        
        if (fieldName === 'email') {
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
            }
        }
        
        return error;
    };

    const handleBlur = (fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
        const value = fieldName === 'email' ? email : password;
        const error = validateField(fieldName, value);
        setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    };

    const handleChange = (fieldName, value) => {
        if (fieldName === 'email') {
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
            email: validateField('email', email),
            password: validateField('password', password),
        };
        
        setFieldErrors(errors);
        setTouched({ email: true, password: true });
        
        return !errors.email && !errors.password;
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
            // Login simplificado: email + senha.
            // Backend busca automaticamente o tenant do usuário
            await login({ email, password });
            router.push('/apps/users/list');
        } catch (err) {
            const msg = err?.body?.message || err?.message || 'Falha no login';
            
            // Se erro de tenant não encontrado, limpa e pede novamente
            if (msg.includes('Tenant') || msg.includes('tenant') || msg.includes('empresa')) {
                clearTenantId();
                setError('Empresa não encontrada. Por favor, verifique o nome.');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="hk-pg-wrapper py-0" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
            <div className="hk-pg-body py-0" style={{ backgroundColor: '#fff' }}>
                <Container fluid style={{ backgroundColor: '#fff' }}>
                    <Row className="auth-split" style={{ backgroundColor: '#fff' }}>
                        <Col xl={5} lg={6} md={7} className="position-relative mx-auto" style={{ backgroundColor: '#fff' }}>
                            <div className="auth-content flex-column pt-8 pb-md-8 pb-13" style={{ backgroundColor: '#fff', color: '#212529' }}>
                                <div className="text-center mb-7">
                                    <ProvisionalBrand centered />
                                </div>
                                <Form className="w-100" onSubmit={e => handleSubmit(e)} style={{ color: '#212529' }}>
                                    <style>{`
                                        .login-form-light .form-control,
                                        .login-form-light .input-group-text,
                                        .login-form-light .affix-wth-text {
                                            background-color: #fff !important;
                                            color: #212529 !important;
                                            border-color: #dee2e6 !important;
                                        }
                                        .login-form-light .form-label,
                                        .login-form-light label,
                                        .login-form-light .text-muted,
                                        .login-form-light p,
                                        .login-form-light h4,
                                        .login-form-light h5,
                                        .login-form-light small { color: inherit !important; }
                                        .login-form-light a:not(.btn) { color: #0d6efd !important; }
                                    `}</style>
                                    <Row>
                                        <Col xl={7} sm={10} className="mx-auto login-form-light">
                                            <div className="text-center mb-4">
                                                <h4>{loginTitle}</h4>
                                                <p>{welcomeText}</p>
                                            </div>
                                            {error && (
                                                <Alert variant="danger" className="py-2">
                                                    {error}
                                                </Alert>
                                            )}
                                            <Row className="gx-3">
                                                <Col as={Form.Group} lg={12} className="mb-3" >
                                                    <div className="form-label-group">
                                                        <Form.Label>E-mail <span className="text-danger">*</span></Form.Label>
                                                    </div>
                                                    <Form.Control 
                                                        placeholder="Digite seu e-mail" 
                                                        type="email" 
                                                        value={email} 
                                                        onChange={e => handleChange('email', e.target.value)}
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
                                                <Col as={Form.Group} lg={12} className="mb-3" >
                                                    <div className="form-label-group">
                                                        <Form.Label>Senha <span className="text-danger">*</span></Form.Label>
                                                        <Link href="#" className="fs-7 fw-medium">Esqueceu a senha?</Link>
                                                    </div>
                                                    <InputGroup className="password-check">
                                                        <span className="input-affix-wrapper affix-wth-text">
                                                            <Form.Control 
                                                                placeholder="Digite sua senha" 
                                                                value={password} 
                                                                onChange={e => handleChange('password', e.target.value)}
                                                                onBlur={() => handleBlur('password')}
                                                                type={showPassword ? "text" : "password"}
                                                                required
                                                                isInvalid={touched.password && !!fieldErrors.password}
                                                            />
                                                            <Link href="#" className="input-suffix text-primary text-uppercase fs-8 fw-medium" onClick={() => setShowPassword(!showPassword)} >
                                                                {showPassword
                                                                    ?
                                                                    <span>Ocultar</span>
                                                                    :
                                                                    <span>Mostrar</span>
                                                                }
                                                            </Link>
                                                        </span>
                                                    </InputGroup>
                                                    {touched.password && fieldErrors.password && (
                                                        <Form.Control.Feedback type="invalid" className="d-block">
                                                            {fieldErrors.password}
                                                        </Form.Control.Feedback>
                                                    )}
                                                </Col>
                                            </Row>
                                            <div className="d-flex justify-content-center">
                                                <Form.Check id="logged_in" className="form-check-sm mb-3" >
                                                    <Form.Check.Input type="checkbox" defaultChecked />
                                                    <Form.Check.Label className="text-muted fs-7">Manter conectado</Form.Check.Label>
                                                </Form.Check>
                                            </div>
                                            <Button variant="primary" type="submit" className="btn-uppercase btn-block" disabled={loading}>
                                                {loading ? 'Entrando…' : 'Login'}
                                            </Button>
                                            <p className="p-xs mt-2 text-center">Novo no OpenClaw? <Link href="/auth/signup"><u>Criar conta</u></Link></p>
                                            <Link href="#" className="d-block extr-link text-center mt-4">
                                                <span className="feather-icon">
                                                    <ExternalLink />
                                                </span>
                                                <u className="text-muted">Precisa de ajuda? Fale com o suporte</u>
                                            </Link>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>
                            {/* Page Footer */}
                            <div className="hk-footer border-0" style={{ backgroundColor: '#fff', color: '#6c757d' }}>
                                <Container fluid as="footer" className="footer">
                                    <Row>
                                        <div className="col-xl-8 text-center">
                                            <p className="footer-text pb-0"><span className="copy-text">OpenClaw SaaS © {new Date().getFullYear()} Todos os direitos reservados.</span> <a href="#" onClick={(e) => e.preventDefault()}>Política de Privacidade</a><span className="footer-link-sep">|</span><a href="#" onClick={(e) => e.preventDefault()}>Termos</a><span className="footer-link-sep">|</span><a href="#" onClick={(e) => e.preventDefault()}>Status do Sistema</a></p>
                                        </div>
                                    </Row>
                                </Container>
                            </div>
                        </Col>
                        <Col xl={7} lg={6} md={5} sm={10} className="d-md-block d-none position-relative bg-primary-light-5">
                            <div className="auth-content flex-column text-center py-8">
                                <Row>
                                    <Col xxl={7} xl={8} lg={11} className="mx-auto">
                                        <h2 className="mb-4">{rightPanelTitle}</h2>
                                        <p style={{ color: '#495057' }}>{rightPanelText}</p>
                                        <Button variant="flush-primary" className="btn-uppercase mt-3">Ver recurso</Button>
                                    </Col>
                                </Row>
                                <div className="d-flex justify-content-center mt-7">
                                    <ProvisionalBrand compact={false} />
                                </div>
                            </div>
                           
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    )
}

export default Login
