'use client';
import React, { useState } from 'react';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';
import { Card, Col, Row, Badge, Button, Table, Modal, Form } from 'react-bootstrap';
import { Shield, Users, Check, X, Plus, Edit2 } from 'react-feather';
import AdminSidebar from '../../users/AdminSidebar';

const AdminPermissionsPage = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [showSidebar, setShowSidebar] = useState(true);

    // Dados mockados
    const roles = [
        {
            id: 1,
            name: 'Administrador',
            icon: '👑',
            color: 'danger',
            users: 3,
            description: 'Acesso total ao sistema',
            permissions: {
                admin: { read: true, write: true, delete: true },
                financial: { read: true, write: true, delete: true },
                marketing: { read: true, write: true, delete: true },
                citizen: { read: true, write: true, delete: true },
                studio: { read: true, write: true, delete: true }
            }
        },
        {
            id: 2,
            name: 'Gerente de Marketing',
            icon: '📢',
            color: 'primary',
            users: 5,
            description: 'Gestão completa de Marketing e Studio',
            permissions: {
                admin: { read: false, write: false, delete: false },
                financial: { read: true, write: false, delete: false },
                marketing: { read: true, write: true, delete: true },
                citizen: { read: true, write: false, delete: false },
                studio: { read: true, write: true, delete: true }
            }
        },
        {
            id: 3,
            name: 'Analista',
            icon: '👨‍💼',
            color: 'info',
            users: 12,
            description: 'Análise de dados e atendimento',
            permissions: {
                admin: { read: false, write: false, delete: false },
                financial: { read: false, write: false, delete: false },
                marketing: { read: true, write: false, delete: false },
                citizen: { read: true, write: true, delete: false },
                studio: { read: false, write: false, delete: false }
            }
        },
        {
            id: 4,
            name: 'Designer',
            icon: '🎨',
            color: 'warning',
            users: 4,
            description: 'Criação de conteúdo visual',
            permissions: {
                admin: { read: false, write: false, delete: false },
                financial: { read: false, write: false, delete: false },
                marketing: { read: true, write: false, delete: false },
                citizen: { read: false, write: false, delete: false },
                studio: { read: true, write: true, delete: false }
            }
        },
        {
            id: 5,
            name: 'Contador',
            icon: '💼',
            color: 'success',
            users: 2,
            description: 'Gestão financeira e prestação de contas',
            permissions: {
                admin: { read: false, write: false, delete: false },
                financial: { read: true, write: true, delete: false },
                marketing: { read: true, write: false, delete: false },
                citizen: { read: false, write: false, delete: false },
                studio: { read: false, write: false, delete: false }
            }
        }
    ];

    const modules = [
        { id: 'admin', name: '🔐 ADMIN', description: 'Usuários, Monitor, Documentos' },
        { id: 'financial', name: '💰 FINANCEIRO', description: 'Receitas, Despesas, TSE' },
        { id: 'marketing', name: '📢 MARKETING', description: 'Campanhas, Leads, Oportunidades' },
        { id: 'citizen', name: '👥 CITIZEN', description: 'Chat, Sentimento, Crise' },
        { id: 'studio', name: '🎨 STUDIO', description: 'Avatares, Imagens, Vídeos' }
    ];

    const PermissionIcon = ({ hasPermission }) => {
        if (hasPermission) {
            return <Check size={18} className="text-success" />;
        }
        return <X size={18} className="text-muted" style={{ opacity: 0.3 }} />;
    };

    const handleEditRole = (role) => {
        setSelectedRole(role);
        setShowModal(true);
    };

    return (
        <>
        <div className="hk-pg-body py-0">
            <div className={classNames("fmapp-wrap", { "fmapp-sidebar-toggle": !showSidebar })}>
                <AdminSidebar />
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        <header className="contact-header">
                            <div className="d-flex align-items-center">
                                <Button 
                                    variant="flush-dark" 
                                    className="btn-icon btn-rounded flush-soft-hover flex-shrink-0 me-3"
                                    onClick={() => setShowSidebar(!showSidebar)}
                                >
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                                <line x1="3" y1="18" x2="21" y2="18"></line>
                                            </svg>
                                        </span>
                                    </span>
                                </Button>
                                <nav aria-label="breadcrumb">
                                    <ol className="breadcrumb mb-0">
                                        <li className="breadcrumb-item">
                                            <a href="/apps/fleet/dashboard">TMS-Fácil</a>
                                        </li>
                                        <li className="breadcrumb-item">
                                            <a href="#">Admin</a>
                                        </li>
                                        <li className="breadcrumb-item active">Permissões</li>
                                    </ol>
                                </nav>
                            </div>
                            <div className="contact-options-wrap">
                                <Button variant="primary" onClick={() => setShowModal(true)}>
                                    <Plus size={16} className="me-2" />
                                    Novo Perfil
                                </Button>
                            </div>
                        </header>

                        <div className="contact-body">
                            <SimpleBar className="nicescroll-bar">
                                <div className="contact-list-view">
                                    <div className="p-4">
                                        {/* Header */}
                                        <Row className="mb-4">
                                            <Col>
                                                <h3 className="mb-2">
                                                    <Shield size={24} className="me-2" />
                                                    Gestão de Permissões
                                                </h3>
                                                <p className="text-muted mb-0">
                                                    Gerencie os perfis de acesso e permissões por módulo
                                                </p>
                                            </Col>
                                        </Row>

                                        {/* Cards de Perfis */}
                                        <Row className="mb-4">
                                            {roles.map((role) => (
                                                <Col lg={4} md={6} key={role.id} className="mb-3">
                                                    <Card className="card-border h-100">
                                                        <Card.Body>
                                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                                <div className="d-flex align-items-center">
                                                                    <div className="fs-2 me-2">{role.icon}</div>
                                                                    <div>
                                                                        <h5 className="mb-0">{role.name}</h5>
                                                                        <small className="text-muted">{role.description}</small>
                                                                    </div>
                                                                </div>
                                                                <Button 
                                                                    variant="link" 
                                                                    size="sm"
                                                                    className="p-0"
                                                                    onClick={() => handleEditRole(role)}
                                                                >
                                                                    <Edit2 size={16} />
                                                                </Button>
                                                            </div>

                                                            <div className="mb-3">
                                                                <Badge bg={role.color} className="me-2">
                                                                    <Users size={12} className="me-1" />
                                                                    {role.users} usuários
                                                                </Badge>
                                                            </div>

                                                            <div className="small">
                                                                <div className="fw-medium mb-2">Permissões:</div>
                                                                {Object.entries(role.permissions).map(([moduleId, perms]) => {
                                                                    const module = modules.find(m => m.id === moduleId);
                                                                    const hasAnyPermission = perms.read || perms.write || perms.delete;
                                                                    if (!hasAnyPermission) return null;
                                                                    
                                                                    return (
                                                                        <div key={moduleId} className="d-flex justify-content-between align-items-center mb-1">
                                                                            <span className="text-muted">{module?.name}</span>
                                                                            <div className="d-flex gap-2">
                                                                                {perms.read && <Badge bg="success" className="badge-sm">Ler</Badge>}
                                                                                {perms.write && <Badge bg="primary" className="badge-sm">Editar</Badge>}
                                                                                {perms.delete && <Badge bg="danger" className="badge-sm">Excluir</Badge>}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>

                                        {/* Matriz de Permissões */}
                                        <Row>
                                            <Col>
                                                <Card className="card-border">
                                                    <Card.Header>
                                                        <h5 className="mb-0">Matriz de Permissões Detalhada</h5>
                                                    </Card.Header>
                                                    <Card.Body className="p-0">
                                                        <div className="table-responsive">
                                                            <Table className="table-hover mb-0">
                                                                <thead>
                                                                    <tr>
                                                                        <th style={{ width: '200px' }}>Perfil</th>
                                                                        {modules.map((module) => (
                                                                            <th key={module.id} className="text-center">
                                                                                <div>{module.name}</div>
                                                                                <small className="text-muted fw-normal">{module.description}</small>
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {roles.map((role) => (
                                                                        <tr key={role.id}>
                                                                            <td>
                                                                                <div className="d-flex align-items-center">
                                                                                    <span className="fs-5 me-2">{role.icon}</span>
                                                                                    <div>
                                                                                        <div className="fw-medium">{role.name}</div>
                                                                                        <small className="text-muted">
                                                                                            <Users size={12} className="me-1" />
                                                                                            {role.users} usuários
                                                                                        </small>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            {modules.map((module) => {
                                                                                const perms = role.permissions[module.id];
                                                                                return (
                                                                                    <td key={module.id} className="text-center">
                                                                                        <div className="d-flex justify-content-center gap-2">
                                                                                            <div title="Ler">
                                                                                                <PermissionIcon hasPermission={perms.read} />
                                                                                            </div>
                                                                                            <div title="Editar">
                                                                                                <PermissionIcon hasPermission={perms.write} />
                                                                                            </div>
                                                                                            <div title="Excluir">
                                                                                                <PermissionIcon hasPermission={perms.delete} />
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="small text-muted">
                                                                                            {perms.read && !perms.write && 'Visualizar'}
                                                                                            {perms.write && !perms.delete && 'Editar'}
                                                                                            {perms.delete && 'Completo'}
                                                                                            {!perms.read && !perms.write && !perms.delete && 'Sem acesso'}
                                                                                        </div>
                                                                                    </td>
                                                                                );
                                                                            })}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </Table>
                                                        </div>
                                                    </Card.Body>
                                                    <Card.Footer className="text-muted">
                                                        <small>
                                                            <Check size={14} className="text-success me-1" />
                                                            = Possui permissão |
                                                            <X size={14} className="text-muted mx-1" />
                                                            = Sem permissão
                                                        </small>
                                                    </Card.Footer>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </SimpleBar>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Modal de Criar/Editar Perfil */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedRole ? 'Editar Perfil' : 'Novo Perfil de Acesso'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={8} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Nome do Perfil *</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Ex: Coordenador de Campanha"
                                        defaultValue={selectedRole?.name}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4} className="mb-3">
                                <Form.Group>
                                    <Form.Label>Ícone</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Ex: 📋"
                                        defaultValue={selectedRole?.icon}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label>Descrição</Form.Label>
                            <Form.Control 
                                as="textarea" 
                                rows={2}
                                placeholder="Descreva as responsabilidades deste perfil"
                                defaultValue={selectedRole?.description}
                            />
                        </Form.Group>

                        <h6 className="mb-3">Permissões por Módulo</h6>

                        {modules.map((module) => (
                            <Card key={module.id} className="mb-3">
                                <Card.Body>
                                    <div className="fw-medium mb-2">{module.name}</div>
                                    <small className="text-muted d-block mb-3">{module.description}</small>
                                    <div className="d-flex gap-3">
                                        <Form.Check 
                                            type="checkbox"
                                            id={`${module.id}-read`}
                                            label="Visualizar"
                                            defaultChecked={selectedRole?.permissions[module.id]?.read}
                                        />
                                        <Form.Check 
                                            type="checkbox"
                                            id={`${module.id}-write`}
                                            label="Editar"
                                            defaultChecked={selectedRole?.permissions[module.id]?.write}
                                        />
                                        <Form.Check 
                                            type="checkbox"
                                            id={`${module.id}-delete`}
                                            label="Excluir"
                                            defaultChecked={selectedRole?.permissions[module.id]?.delete}
                                        />
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={() => setShowModal(false)}>
                        <Check size={16} className="me-2" />
                        {selectedRole ? 'Salvar Alterações' : 'Criar Perfil'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default AdminPermissionsPage;
