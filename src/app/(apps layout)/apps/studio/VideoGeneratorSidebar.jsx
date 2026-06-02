'use client';
import React from 'react';
import { Card, Nav } from 'react-bootstrap';
import * as Icons from 'react-feather';
import SimpleBar from 'simplebar-react';
import StudioSidebarTopNav from './StudioSidebarTopNav';

const VideoGeneratorSidebar = () => {
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
                                    <span className="nav-link-text">Novo Vídeo</span>
                                </Nav.Link>
                            </li>
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        <Icons.Video size={16} />
                                    </span>
                                    <span className="nav-link-text">Meus Vídeos</span>
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
                        <p className="navbar-text text-uppercase text-muted mb-2">Avatares</p>
                        <ul className="nav nav-light navbar-nav flex-column">
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        <Icons.User size={16} />
                                    </span>
                                    <span className="nav-link-text">João Silva</span>
                                </Nav.Link>
                            </li>
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        <Icons.User size={16} />
                                    </span>
                                    <span className="nav-link-text">Maria Santos</span>
                                </Nav.Link>
                            </li>
                            <li className="nav-item">
                                <Nav.Link href="#">
                                    <span className="nav-icon-wrap">
                                        <Icons.Users size={16} />
                                    </span>
                                    <span className="nav-link-text">Gerenciar Avatares</span>
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
                                        <small>Escreva scripts naturais e objetivos. O avatar IA sincroniza automaticamente lábios e gestos.</small>
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

export default VideoGeneratorSidebar;
