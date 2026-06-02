import Link from 'next/link';
import { Col, Container, Row } from 'react-bootstrap';
import { ExternalLink } from 'react-feather';

const PageFooter = () => {
    return (
        <div className="hk-footer">
            <Container as="footer" className="footer">
                <Row>
                    <Col xl={8}>
                        <p className="footer-text">
                            <span className="copy-text">GovernaAI © {new Date().getFullYear()} All rights reserved.</span> <Link target="_blank" href="https://governaai.com/privacy-policy">Politica de privacidade</Link><span className="footer-link-sep">|</span><Link target="_blank" href="https://governaai.com/privacy-policy">Termos de uso</Link><span className="footer-link-sep">|</span><Link href="#">Status do sistema</Link></p>
                    </Col>
                    <Col xl={4}>
                        <Link href="#" className="footer-extr-link link-default">
                            <span className="feather-icon">
                                <ExternalLink />
                            </span>
                            <u>Saiba mais sobre o GovernAI</u>
                        </Link>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default PageFooter
