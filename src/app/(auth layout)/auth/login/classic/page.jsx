'use client'
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import { Eye, EyeOff } from 'react-feather';
import CommonFooter1 from '../../CommonFooter1';
import ProvisionalBrand from '@/components/ProvisionalBrand';

const LoginClassic = () => {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter()
    const handleSubmit = (e) => {
        e.preventDefault();
        router.push("/apps/users/list");
    }

    return (
        <div className="hk-pg-wrapper pt-0 pb-xl-0 pb-5">
            <div className="hk-pg-body pt-0 pb-xl-0">
                <Container>
                    <Row>
                        <Col sm={10} className="position-relative mx-auto">
                            <div className="auth-content py-8">
                                <Form className="w-100" onSubmit={e => handleSubmit(e)}>
                                    <Row>
                                        <Col lg={5} md={7} sm={10} className="mx-auto">
                                            <div className="text-center mb-7">
                                                <ProvisionalBrand centered />
                                            </div>
                                            <Card className="card-lg card-border">
                                                <Card.Body>
                                                    <h4 className="mb-4 text-center">Entrar no OpenClaw SaaS</h4>
                                                    <Row className="gx-3">
                                                        <Col as={Form.Group} lg={12} className="mb-3">
                                                            <div className="form-label-group">
                                                                <Form.Label>E-mail</Form.Label>
                                                            </div>
                                                            <Form.Control placeholder="Digite seu e-mail" type="text" value={userName} onChange={e => setUserName(e.target.value)} />
                                                        </Col>
                                                        <Col as={Form.Group} lg={12} className="mb-3">
                                                            <div className="form-label-group">
                                                                <Form.Label>Senha</Form.Label>
                                                                <a href="#" className="fs-7 fw-medium">Esqueceu a senha?</a>
                                                            </div>
                                                            <InputGroup className="password-check">
                                                                <span className="input-affix-wrapper">
                                                                    <Form.Control placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? "text" : "password"} />
                                                                    <a href="#" className="input-suffix text-muted" onClick={() => setShowPassword(!showPassword)} >
                                                                        <span className="feather-icon">
                                                                            {
                                                                                showPassword
                                                                                    ?
                                                                                    <EyeOff className="form-icon" />
                                                                                    :
                                                                                    <Eye className="form-icon" />
                                                                            }

                                                                        </span>
                                                                    </a>
                                                                </span>
                                                            </InputGroup>
                                                        </Col>
                                                    </Row>
                                                    <div className="d-flex justify-content-center">
                                                        <Form.Check id="logged_in" className="form-check-sm mb-3" >
                                                            <Form.Check.Input type="checkbox" defaultChecked />
                                                            <Form.Check.Label className="text-muted fs-7">Manter conectado</Form.Check.Label>
                                                        </Form.Check>
                                                    </div>
                                                    <Button variant="primary" type="submit" className="btn-uppercase btn-block">Login</Button>
                                                    <p className="p-xs mt-2 text-center">Novo no OpenClaw? <Link href="/auth/signup"><u>Criar conta</u></Link></p>
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
            {/* Page Footer */}
            <CommonFooter1 />
        </div>

    )
}

export default LoginClassic
