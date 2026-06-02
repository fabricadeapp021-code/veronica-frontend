'use client';

import { Button, Nav } from 'react-bootstrap';
import { Zap, Clock, Folder, Star, Settings, Image, HelpCircle } from 'react-feather';
import SimpleBar from 'simplebar-react';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import StudioSidebarTopNav from './StudioSidebarTopNav';

const ImageGeneratorSidebar = () => {
    return (
        <nav className="contactapp-sidebar">
            <SimpleBar className="nicescroll-bar">
                <div className="menu-content-wrap">
                    <StudioSidebarTopNav />
                    <div className="separator separator-light" />

                    <div className="menu-group">
                        <Nav as="ul" className="nav-light navbar-nav flex-column">
                            <Nav.Item as="li">
                                <Nav.Link active>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Zap />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Gerador</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item as="li">
                                <Nav.Link>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Clock />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Histórico</span>
                                    <span className="badge badge-sm badge-soft-primary ms-auto">Em breve</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item as="li">
                                <Nav.Link>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Folder />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Galeria</span>
                                    <span className="badge badge-sm badge-soft-primary ms-auto">Em breve</span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item as="li">
                                <Nav.Link>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Star />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Favoritos</span>
                                    <span className="badge badge-sm badge-soft-primary ms-auto">Em breve</span>
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </div>

                    <div className="menu-gap" />
                    <div className="nav-header">
                        <span>Gerenciar</span>
                    </div>
                    <div className="menu-group">
                        <Nav as="ul" className="nav-light navbar-nav flex-column">
                            <Nav.Item as="li">
                                <Nav.Link>
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Settings />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Configurações</span>
                                    <span className="badge badge-sm badge-soft-primary ms-auto">Em breve</span>
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </div>
                </div>
            </SimpleBar>

            <div className="contactapp-fixednav">
                <div className="hk-toolbar">
                    <Nav as="ul" className="nav-light">
                        <Nav.Item className="nav-link">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                <HkTooltip id="tooltip-settings-image" placement="top" title="Configurações">
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <Settings />
                                        </span>
                                    </span>
                                </HkTooltip>
                            </Button>
                        </Nav.Item>
                        <Nav.Item className="nav-link">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                <HkTooltip id="tooltip-gallery-image" placement="top" title="Galeria">
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <Image />
                                        </span>
                                    </span>
                                </HkTooltip>
                            </Button>
                        </Nav.Item>
                        <Nav.Item className="nav-link">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                <HkTooltip id="tooltip-help-image" placement="top" title="Ajuda">
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <HelpCircle />
                                        </span>
                                    </span>
                                </HkTooltip>
                            </Button>
                        </Nav.Item>
                    </Nav>
                </div>
            </div>
        </nav>
    );
};

export default ImageGeneratorSidebar;
