import { Col, Container, Row } from 'react-bootstrap';

const CommonFooter1 = () => {
    return (
        <div className="hk-footer border-0">
            <Container as="footer" className="footer">
                <Row>
                    <Col xl={8} className="text-center">
                        <p className="footer-text pb-0">
                            <span className="copy-text">OpenClaw SaaS© {new Date().getFullYear()} Todos os direitos reservados.</span>
                            <a href="#" onClick={(e) => e.preventDefault()}>Política de Privacidade</a>
                            <span className="footer-link-sep">|</span>
                            <a href="#" onClick={(e) => e.preventDefault()}>Termos</a>
                            <span className="footer-link-sep">|</span>
                            <a href="#" onClick={(e) => e.preventDefault()}>Status do Sistema</a>
                        </p>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default CommonFooter1
