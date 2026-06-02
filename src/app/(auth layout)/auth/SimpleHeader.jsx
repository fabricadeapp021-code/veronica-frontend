import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { HelpCircle } from 'react-feather';
import ProvisionalBrand from '@/components/ProvisionalBrand';

const SimpleHeader = () => {
    const pathname = usePathname();
    const loginPath = pathname.match("/auth/login/simple");
    const signupPath = pathname.match("/auth/signup/simple");

    return (
        <Navbar expand="xl" className="hk-navbar navbar-light fixed-top">
            <Container>
                {/* Start Nav */}
                <div className="nav-start-wrap">
                    <Navbar.Brand as="div">
                        <ProvisionalBrand />
                    </Navbar.Brand>
                </div>

                {/* End Nav */}
                <div className="nav-end-wrap">
                    <Nav as="ul" className="flex-row">
                        {loginPath && <Nav.Item as="li" className="nav-link py-0">
                            <Button size='sm' variant="outline-light" >
                                <span>
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <HelpCircle />
                                        </span>
                                    </span>
                                    <span>Get Help</span>
                                </span>
                            </Button>
                        </Nav.Item>}
                        {signupPath && <>
                            <Nav.Item as="li" className="nav-link py-0">
                                <Button variant="primary" as="a" href="#">Help</Button>
                            </Nav.Item>
                            <Nav.Item as="li" className="nav-link py-0">
                                <Button variant="outline-light" as={Link} href="/auth/login">Sign In</Button>
                            </Nav.Item>
                        </>}
                    </Nav>
                </div>
                {/* /End Nav */}
            </Container>
        </Navbar>
    )
}

export default SimpleHeader
