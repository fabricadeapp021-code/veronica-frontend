'use client'
import { Nav } from 'react-bootstrap';
import * as Icons from 'react-feather';
import SimpleBar from 'simplebar-react';

const UsersSidebar = () => {
    return (
        <div className="fmapp-sidebar">
            <SimpleBar className="nicescroll-bar">
                <div className="menu-content-wrap">
                    <div className="fmapp-sidebar-header">
                        <div className="media">
                            <div className="media-head">
                                <div className="avatar avatar-icon avatar-blue avatar-rounded">
                                    <span className="initial-wrap">
                                        <Icons.Users size={24} />
                                    </span>
                                </div>
                            </div>
                            <div className="media-body">
                                <div className="text-dark fw-medium">Usuários</div>
                                <div className="fs-7 text-muted">Gestão de acessos</div>
                            </div>
                        </div>
                    </div>

                    <div className="px-3 mt-3">
                        <button className="btn btn-primary btn-block w-100">
                            <Icons.UserPlus size={16} className="me-2" />
                            <span>Novo Usuário</span>
                        </button>
                    </div>

                    <Nav className="nav nav-light mt-3">
                        <Nav.Item>
                            <a className="nav-link active" href="#">
                                <span className="nav-icon">
                                    <Icons.Users size={18} />
                                </span>
                                <span className="nav-link-text">Todos os Usuários</span>
                            </a>
                        </Nav.Item>
                        <Nav.Item>
                            <a className="nav-link" href="#">
                                <span className="nav-icon">
                                    <Icons.CheckCircle size={18} />
                                </span>
                                <span className="nav-link-text">Ativos</span>
                            </a>
                        </Nav.Item>
                        <Nav.Item>
                            <a className="nav-link" href="#">
                                <span className="nav-icon">
                                    <Icons.XCircle size={18} />
                                </span>
                                <span className="nav-link-text">Inativos</span>
                            </a>
                        </Nav.Item>
                        <Nav.Item>
                            <a className="nav-link" href="#">
                                <span className="nav-icon">
                                    <Icons.Clock size={18} />
                                </span>
                                <span className="nav-link-text">Pendentes</span>
                            </a>
                        </Nav.Item>
                    </Nav>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="px-3">
                        <h6 className="text-uppercase text-muted fs-7 fw-medium mb-3">
                            Funções
                        </h6>
                        <Nav className="nav nav-sm nav-light">
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">👑</span>
                                    <span className="nav-link-text">Administradores</span>
                                </a>
                            </Nav.Item>
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">✏️</span>
                                    <span className="nav-link-text">Editores</span>
                                </a>
                            </Nav.Item>
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">📊</span>
                                    <span className="nav-link-text">Analistas</span>
                                </a>
                            </Nav.Item>
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">👁️</span>
                                    <span className="nav-link-text">Visualizadores</span>
                                </a>
                            </Nav.Item>
                        </Nav>
                    </div>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="px-3">
                        <h6 className="text-uppercase text-muted fs-7 fw-medium mb-3">
                            Estatísticas
                        </h6>
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fs-8">Total de Usuários</span>
                                <span className="badge badge-sm badge-soft-primary">145</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="fs-8">Ativos Hoje</span>
                                <span className="badge badge-sm badge-soft-success">87</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="fs-8">Novos (30 dias)</span>
                                <span className="badge badge-sm badge-soft-info">12</span>
                            </div>
                        </div>
                    </div>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="px-3">
                        <div className="card card-border border-blue mb-3">
                            <div className="card-body py-3">
                                <div className="media">
                                    <div className="media-head me-3">
                                        <div className="avatar avatar-icon avatar-sm avatar-blue avatar-rounded">
                                            <span className="initial-wrap">
                                                <Icons.Shield size={16} />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="media-body">
                                        <div className="fs-7 fw-medium mb-1">Controle de Acesso</div>
                                        <div className="fs-8 text-muted">
                                            Gerencie permissões e funções dos usuários da plataforma.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SimpleBar>
        </div>
    );
};

export default UsersSidebar;
