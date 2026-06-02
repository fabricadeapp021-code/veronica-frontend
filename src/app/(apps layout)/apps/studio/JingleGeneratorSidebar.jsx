'use client';
import React from 'react';
import { Card, Nav } from 'react-bootstrap';
import * as Icons from 'react-feather';
import SimpleBar from 'simplebar-react';
import StudioSidebarTopNav from './StudioSidebarTopNav';

const JingleGeneratorSidebar = () => {
    return (
        <nav className="contactapp-sidebar">
            <SimpleBar className="nicescroll-bar">
                <div className="menu-content-wrap">
                    <StudioSidebarTopNav />
                    <div className="separator separator-light" />
                    <div className="menu-group">
                        <ul className="nav nav-light navbar-nav flex-column">
                            <li className="nav-item">
                                <Nav.Link href="#" className="active">
                                    <span className="nav-icon-wrap">
                                        <Icons.Zap size={16} />
                                    </span>
                                    <span className="nav-link-text">Novo Jingle</span>
                                </Nav.Link>
                            </li>
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        <Icons.Music size={16} />
                                    </span>
                                    <span className="nav-link-text">Meus Jingles</span>
                                </Nav.Link>
                            </li>
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        <Icons.Star size={16} />
                                    </span>
                                    <span className="nav-link-text">Favoritos</span>
                                </Nav.Link>
                            </li>
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        <Icons.Clock size={16} />
                                    </span>
                                    <span className="nav-link-text">Histórico</span>
                                </Nav.Link>
                            </li>
                        </ul>
                    </div>
                    <div className="separator separator-light" />
                    <div className="menu-group">
                        <p className="navbar-text text-uppercase text-muted mb-2">Estilos Musicais</p>
                        <ul className="nav nav-light navbar-nav flex-column">
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        🎸
                                    </span>
                                    <span className="nav-link-text">Pop Brasileiro</span>
                                </Nav.Link>
                            </li>
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        🎺
                                    </span>
                                    <span className="nav-link-text">Sertanejo</span>
                                </Nav.Link>
                            </li>
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        🥁
                                    </span>
                                    <span className="nav-link-text">Forró</span>
                                </Nav.Link>
                            </li>
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        🎤
                                    </span>
                                    <span className="nav-link-text">Rap/Hip-Hop</span>
                                </Nav.Link>
                            </li>
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        🎹
                                    </span>
                                    <span className="nav-link-text">Axé/Carnaval</span>
                                </Nav.Link>
                            </li>
                        </ul>
                    </div>
                    <div className="separator separator-light" />
                    <Card className="card-border m-3">
                        <Card.Body>
                            <div className="media">
                                <div className="media-head me-3">
                                    <div className="avatar avatar-icon avatar-sm avatar-info avatar-rounded">
                                        <span className="initial-wrap">
                                            <Icons.Info size={16} />
                                        </span>
                                    </div>
                                </div>
                                <div className="media-body">
                                    <p className="card-text">
                                        <small>Desenvolvido por Governa AI. Descreva seu jingle em português para melhores resultados.</small>
                                    </p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </SimpleBar>
        </nav>
    );
};

export default JingleGeneratorSidebar;
