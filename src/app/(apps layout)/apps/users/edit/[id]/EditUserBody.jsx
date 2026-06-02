'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Col, Container, Form, Nav, Row, Tab, Alert, Spinner } from 'react-bootstrap';
import { apiRequest } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import classNames from 'classnames';
import { showCustomAlert } from '@/components/CustomAlert';

const EditUserBody = ({ userId }) => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Permissions state
  const [permissions, setPermissions] = useState({
    admin: { read: false, write: false, delete: false },
    financial: { read: false, write: false, delete: false },
    marketing: { read: false, write: false, delete: false },
    citizen: { read: false, write: false, delete: false },
    studio: { read: false, write: false, delete: false },
  });
  
  // Validation states
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin';
  const isSelf = currentUser?.id === userId;

  // Buscar dados do usuário
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      try {
        // Primeiro, tentar buscar como admin/político
        try {
          const adminResponse = await apiRequest(`/admin/users/${userId}`, { method: 'GET' });
          if (adminResponse?.success && adminResponse?.data) {
            // É um político! Redirecionar para página de edição de político
            console.log('Político detectado, redirecionando para página de edição completa...');
            router.push(`/apps/users/edit-admin/${userId}`);
            return;
          }
        } catch (adminErr) {
          // Não é admin, continuar como usuário normal
          console.log('Não é político, continuando como usuário normal');
        }
        
        // Buscar como usuário normal
        const response = await apiRequest(`/admin/users/${userId}`, { method: 'GET' });
        if (response?.user) {
          const user = response.user;
          setUserData(user);
          setName(user.name || '');
          setEmail(user.email || '');
          setRole(user.role || 'employee');
          
          // Carregar permissões se existirem
          if (user.permissions) {
            setPermissions(user.permissions);
          }
        } else {
          throw new Error('Usuário não encontrado');
        }
      } catch (err) {
        setError(err?.body?.message || err?.message || 'Erro ao carregar usuário');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId, router]);

  useEffect(() => {
    if (!error) return;
    showCustomAlert({
      variant: 'danger',
      title: 'Erro',
      text: error,
    }).finally(() => setError(''));
  }, [error]);

  useEffect(() => {
    if (!success) return;
    showCustomAlert({
      variant: 'success',
      title: 'Sucesso',
      text: success,
    }).finally(() => setSuccess(''));
  }, [success]);

  // Validações
  const validateField = (fieldName, value) => {
    let error = '';
    
    if (fieldName === 'name') {
      if (!value || value.trim() === '') {
        error = 'Nome é obrigatório';
      }
    } else if (fieldName === 'email') {
      if (!value || value.trim() === '') {
        error = 'E-mail é obrigatório';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          error = 'Por favor, insira um e-mail válido';
        }
      }
    } else if (fieldName === 'password') {
      if (value && value.length < 6) {
        error = 'A senha deve ter no mínimo 6 caracteres';
      }
    } else if (fieldName === 'confirmPassword') {
      if (password && value !== password) {
        error = 'As senhas não coincidem';
      }
    }
    
    return error;
  };

  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    let value;
    if (fieldName === 'name') value = name;
    else if (fieldName === 'email') value = email;
    else if (fieldName === 'password') value = password;
    else if (fieldName === 'confirmPassword') value = confirmPassword;
    
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const handleChange = (fieldName, value) => {
    if (fieldName === 'name') {
      setName(value);
    } else if (fieldName === 'email') {
      setEmail(value);
    } else if (fieldName === 'password') {
      setPassword(value);
    } else if (fieldName === 'confirmPassword') {
      setConfirmPassword(value);
    } else if (fieldName === 'role') {
      setRole(value);
    }
    
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    }
    
    if (error || success) {
      setError('');
      setSuccess('');
    }
  };

  const validateForm = () => {
    const errors = {
      name: validateField('name', name),
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
    };
    
    setFieldErrors(errors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    
    return !errors.name && !errors.email && !errors.password && !errors.confirmPassword;
  };

  // Salvar alterações
  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    // Validar permissões
    if (!isOwner && !isAdmin && !isSelf) {
      setError('Você não tem permissão para editar este usuário');
      return;
    }

    if (isAdmin && !['employee', 'external'].includes(userData?.role) && !isSelf) {
      setError('ADMIN só pode editar usuários com role EMPLOYEE ou EXTERNAL');
      return;
    }
    
    setSaving(true);
    try {
      const updateData = {
        name,
        email,
      };
      
      // Adicionar senha apenas se foi preenchida
      if (password) {
        updateData.password = password;
      }
      
      const response = await apiRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: updateData,
      });
      
      if (response?.user || response?.message) {
        setSuccess('Informações pessoais atualizadas com sucesso!');
        setPassword('');
        setConfirmPassword('');
        setFieldErrors({});
        setTouched({});
        
        // Atualiza os dados locais
        if (response?.user) {
          setUserData(response.user);
          setName(response.user.name || '');
          setEmail(response.user.email || '');
          setRole(response.user.role || 'employee');
        }
      }
    } catch (err) {
      const msg = err?.body?.message || err?.message || 'Erro ao atualizar usuário';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Mudar role
  const handleChangeRole = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validar permissões
    if (!isOwner) {
      setError('Apenas OWNER pode mudar a role de usuários');
      return;
    }

    if (userData?.role === 'owner' && !isSelf) {
      setError('Você não pode mudar a role de outro OWNER');
      return;
    }

    setSaving(true);
    try {
      const response = await apiRequest(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: { role },
      });
      
      if (response?.user || response?.message) {
        setSuccess('Role atualizada com sucesso!');
        
        // Atualiza os dados locais
        if (response?.user) {
          setUserData(response.user);
          setRole(response.user.role || 'employee');
        }
      }
    } catch (err) {
      const msg = err?.body?.message || err?.message || 'Erro ao atualizar role';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Atualizar permissões do usuário
  const handleUpdatePermissions = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validar permissões
    if (!isOwner && !isAdmin) {
      setError('Apenas OWNER e ADMIN podem alterar permissões');
      return;
    }

    // Não pode alterar permissões de OWNER ou ADMIN
    if (userData?.role === 'owner' || userData?.role === 'admin') {
      setError('OWNER e Políticos (ADMIN) sempre têm permissão total');
      return;
    }

    setSaving(true);
    try {
      const response = await apiRequest(`/admin/users/${userId}/permissions`, {
        method: 'PUT',
        body: permissions,
      });
      
      if (response?.success) {
        setSuccess('Permissões atualizadas com sucesso!');
        
        // Atualizar permissões locais
        if (response?.data?.permissions) {
          setPermissions(response.data.permissions);
        }
      }
    } catch (err) {
      const msg = err?.body?.message || err?.message || 'Erro ao atualizar permissões';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Atualizar permissão de um módulo
  const handlePermissionChange = (module, permission, value) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: value,
      },
    }));
    
    // Limpar mensagens de erro/sucesso
    if (error || success) {
      setError('');
      setSuccess('');
    }
  };

  // Deletar usuário
  const handleDeleteAccount = async () => {
    const targetName = userData?.name || `ID ${userId}`;
    const confirmation = await showCustomAlert({
      variant: 'warning',
      title: 'Confirmar exclusão',
      text: `Tem certeza que quer excluir o usuário "${targetName}"?\n\nEsta ação não pode ser desfeita.`,
      confirmButtonText: 'Excluir',
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });
    if (!confirmation.isConfirmed) {
      return;
    }

    // Validar permissões
    if (!isOwner && !isAdmin) {
      setError('Você não tem permissão para deletar este usuário');
      return;
    }

    if (isAdmin && !['employee', 'external'].includes(userData?.role)) {
      setError('ADMIN só pode deletar usuários com role EMPLOYEE ou EXTERNAL');
      return;
    }

    if (isSelf) {
      setError('Você não pode deletar sua própria conta');
      return;
    }

    setSaving(true);
    try {
      await apiRequest(`/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      // Redirecionar para lista de usuários
      router.push('/apps/users/list');
    } catch (err) {
      const msg = err?.body?.message || err?.message || 'Erro ao deletar usuário';
      setError(msg);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="hk-pg-body py-0">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Carregando dados do usuário...</p>
          </div>
        </div>
      </Container>
    );
  }

  if (!userData) {
    return (
      <Container>
        <div className="hk-pg-body py-0">
          <div className="text-center py-5">
            <h5 className="mb-2">Usuário não encontrado</h5>
            <p className="text-muted mb-4">Não foi possível carregar os dados deste usuário.</p>
            <Button variant="outline-secondary" onClick={() => router.push('/apps/users/list')}>
              Voltar para Lista
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="hk-pg-header pt-7 pb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="pg-title">Editar Usuário</h1>
            <p>Gerencie as informações e permissões do usuário.</p>
          </div>
          <Button variant="outline-secondary" onClick={() => router.push('/apps/users/list')}>
            Voltar
          </Button>
        </div>
      </div>

      {/* Page Body */}
      <div className="hk-pg-body">
        <Tab.Container defaultActiveKey="tabBlock1">
          <Row className="edit-profile-wrap">
            <Col xs={4} sm={3} lg={2}>
              <div className="nav-profile mt-4">
                <div className="nav-header">
                  <span>Configurações</span>
                </div>
                <Nav as="ul" variant="tabs" className="nav-light nav-vertical">
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tabBlock1">
                      <span className="nav-link-text">Informações Pessoais</span>
                    </Nav.Link>
                  </Nav.Item>
                  {isOwner && (
                    <Nav.Item as="li">
                      <Nav.Link eventKey="tabBlock2">
                        <span className="nav-link-text">Role & Permissões</span>
                      </Nav.Link>
                    </Nav.Item>
                  )}
                  {(isOwner || isAdmin) && userData?.role !== 'owner' && userData?.role !== 'admin' && (
                    <Nav.Item as="li">
                      <Nav.Link eventKey="tabBlock2b">
                        <span className="nav-link-text">Permissões Detalhadas</span>
                      </Nav.Link>
                    </Nav.Item>
                  )}
                  {(isOwner || isAdmin) && !isSelf && (
                    <Nav.Item as="li">
                      <Nav.Link eventKey="tabBlock3">
                        <span className="nav-link-text">Configurações da Conta</span>
                      </Nav.Link>
                    </Nav.Item>
                  )}
                </Nav>
              </div>
            </Col>
            <Col lg={10} sm={9} xs={8}>
              <Tab.Content>
                {/* Tab 1: Informações Pessoais */}
                <Tab.Pane eventKey="tabBlock1">
                  <Form onSubmit={handleSavePersonalInfo}>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Informações Pessoais</span>
                    </div>
                    <Row className="gx-3">
                      <Col sm={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nome Completo <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Digite o nome completo"
                            value={name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            required
                            isInvalid={touched.name && !!fieldErrors.name}
                          />
                          {touched.name && fieldErrors.name && (
                            <Form.Control.Feedback type="invalid" className="d-block">
                              {fieldErrors.name}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="gx-3">
                      <Col sm={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>E-mail <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="Digite o e-mail"
                            value={email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            onBlur={() => handleBlur('email')}
                            required
                            isInvalid={touched.email && !!fieldErrors.email}
                          />
                          {touched.email && fieldErrors.email && (
                            <Form.Control.Feedback type="invalid" className="d-block">
                              {fieldErrors.email}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Alterar Senha</span>
                    </div>
                    <Row className="gx-3">
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nova Senha</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Deixe em branco para não alterar"
                            value={password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            onBlur={() => handleBlur('password')}
                            isInvalid={touched.password && !!fieldErrors.password}
                          />
                          {touched.password && fieldErrors.password && (
                            <Form.Control.Feedback type="invalid" className="d-block">
                              {fieldErrors.password}
                            </Form.Control.Feedback>
                          )}
                          <Form.Text muted>
                            Mínimo 6 caracteres
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Confirmar Nova Senha</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Confirme a nova senha"
                            value={confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            onBlur={() => handleBlur('confirmPassword')}
                            isInvalid={touched.confirmPassword && !!fieldErrors.confirmPassword}
                          />
                          {touched.confirmPassword && fieldErrors.confirmPassword && (
                            <Form.Control.Feedback type="invalid" className="d-block">
                              {fieldErrors.confirmPassword}
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button variant="primary" type="submit" className="mt-5" disabled={saving}>
                      {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Alterações'
                      )}
                    </Button>
                  </Form>
                </Tab.Pane>

                {/* Tab 2: Role & Permissões (Apenas OWNER) */}
                {isOwner && (
                  <Tab.Pane eventKey="tabBlock2">
                    <div className="title-lg fs-4"><span>Role & Permissões</span></div>
                    <p className="mb-4">Gerencie a role e permissões deste usuário no sistema.</p>
                    <Form onSubmit={handleChangeRole}>
                      <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                        <span>Role do Usuário</span>
                      </div>
                      <Row className="gx-3">
                        <Col sm={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Role Atual</Form.Label>
                            <div className="mb-2">
                              {role === 'owner' && (
                                <span className="badge bg-danger">OWNER</span>
                              )}
                              {role === 'admin' && (
                                <span className="badge bg-warning">ADMIN</span>
                              )}
                              {role === 'employee' && (
                                <span className="badge bg-info">EMPLOYEE</span>
                              )}
                              {role === 'external' && (
                                <span className="badge bg-secondary">EXTERNAL</span>
                              )}
                            </div>
                          </Form.Group>
                        </Col>
                        <Col sm={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Mudar Role Para</Form.Label>
                            <Form.Control
                              as="select"
                              value={role}
                              onChange={(e) => handleChange('role', e.target.value)}
                              disabled={userData?.role === 'owner' && !isSelf}
                            >
                              <option value="employee">Employee</option>
                              <option value="admin">Admin</option>
                              <option value="owner">Owner</option>
                              <option value="external">External</option>
                            </Form.Control>
                            {userData?.role === 'owner' && !isSelf && (
                              <Form.Text muted className="d-block">
                                Você não pode mudar a role de outro OWNER
                              </Form.Text>
                            )}
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                        <span>Hierarquia de Permissões</span>
                      </div>
                      <Row className="gx-3">
                        <Col sm={12}>
                          <ul className="list-unstyled">
                            <li className="mb-2">
                              <strong className="text-danger">OWNER:</strong> Acesso total ao sistema, pode criar/editar/deletar tudo
                            </li>
                            <li className="mb-2">
                              <strong className="text-warning">ADMIN:</strong> Pode criar e gerenciar EMPLOYEES e EXTERNALS, mas não pode criar outros ADMINS ou OWNERS
                            </li>
                            <li className="mb-2">
                              <strong className="text-info">EMPLOYEE:</strong> Acesso básico, não pode gerenciar usuários
                            </li>
                            <li className="mb-2">
                              <strong className="text-secondary">EXTERNAL:</strong> Usuário temporário com permissões limitadas
                            </li>
                          </ul>
                        </Col>
                      </Row>

                      <Button 
                        variant="primary" 
                        type="submit" 
                        className="mt-5" 
                        disabled={saving || (userData?.role === 'owner' && !isSelf)}
                      >
                        {saving ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Salvando...
                          </>
                        ) : (
                          'Atualizar Role'
                        )}
                      </Button>
                    </Form>
                  </Tab.Pane>
                )}

                {/* Tab 2b: Permissões Detalhadas (Employee e External) */}
                {(isOwner || isAdmin) && userData?.role !== 'owner' && userData?.role !== 'admin' && (
                  <Tab.Pane eventKey="tabBlock2b">
                    <div className="title-lg fs-4"><span>Permissões Detalhadas por Módulo</span></div>
                    <p className="mb-4">Configure permissões específicas para cada módulo do sistema.</p>
                    
                    {(userData?.role === 'owner' || userData?.role === 'admin') && (
                      <Alert variant="info" className="mb-4">
                        <strong>ℹ️ Informação:</strong> {userData?.role === 'owner' ? 'OWNER' : 'Políticos (ADMIN)'} sempre têm permissão total e não podem ter permissões alteradas.
                      </Alert>
                    )}
                    
                    <Form onSubmit={handleUpdatePermissions}>
                      {/* Módulo: Admin */}
                      <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                        <span>🏛️ Administração</span>
                      </div>
                      <Row className="gx-3 mb-3">
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="admin-read"
                            label="Visualizar"
                            checked={permissions.admin.read}
                            onChange={(e) => handlePermissionChange('admin', 'read', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="admin-write"
                            label="Editar"
                            checked={permissions.admin.write}
                            onChange={(e) => handlePermissionChange('admin', 'write', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="admin-delete"
                            label="Deletar"
                            checked={permissions.admin.delete}
                            onChange={(e) => handlePermissionChange('admin', 'delete', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                      </Row>

                      {/* Módulo: Financeiro */}
                      <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                        <span>💰 Financeiro</span>
                      </div>
                      <Row className="gx-3 mb-3">
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="financial-read"
                            label="Visualizar"
                            checked={permissions.financial.read}
                            onChange={(e) => handlePermissionChange('financial', 'read', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="financial-write"
                            label="Editar"
                            checked={permissions.financial.write}
                            onChange={(e) => handlePermissionChange('financial', 'write', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="financial-delete"
                            label="Deletar"
                            checked={permissions.financial.delete}
                            onChange={(e) => handlePermissionChange('financial', 'delete', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                      </Row>

                      {/* Módulo: Marketing */}
                      <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                        <span>📢 Marketing</span>
                      </div>
                      <Row className="gx-3 mb-3">
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="marketing-read"
                            label="Visualizar"
                            checked={permissions.marketing.read}
                            onChange={(e) => handlePermissionChange('marketing', 'read', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="marketing-write"
                            label="Editar"
                            checked={permissions.marketing.write}
                            onChange={(e) => handlePermissionChange('marketing', 'write', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="marketing-delete"
                            label="Deletar"
                            checked={permissions.marketing.delete}
                            onChange={(e) => handlePermissionChange('marketing', 'delete', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                      </Row>

                      {/* Módulo: Cidadão */}
                      <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                        <span>👥 Cidadãos</span>
                      </div>
                      <Row className="gx-3 mb-3">
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="citizen-read"
                            label="Visualizar"
                            checked={permissions.citizen.read}
                            onChange={(e) => handlePermissionChange('citizen', 'read', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="citizen-write"
                            label="Editar"
                            checked={permissions.citizen.write}
                            onChange={(e) => handlePermissionChange('citizen', 'write', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="citizen-delete"
                            label="Deletar"
                            checked={permissions.citizen.delete}
                            onChange={(e) => handlePermissionChange('citizen', 'delete', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                      </Row>

                      {/* Módulo: Estúdio */}
                      <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                        <span>🎬 Estúdio de Conteúdo</span>
                      </div>
                      <Row className="gx-3 mb-3">
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="studio-read"
                            label="Visualizar"
                            checked={permissions.studio.read}
                            onChange={(e) => handlePermissionChange('studio', 'read', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="studio-write"
                            label="Editar"
                            checked={permissions.studio.write}
                            onChange={(e) => handlePermissionChange('studio', 'write', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                        <Col sm={4}>
                          <Form.Check
                            type="switch"
                            id="studio-delete"
                            label="Deletar"
                            checked={permissions.studio.delete}
                            onChange={(e) => handlePermissionChange('studio', 'delete', e.target.checked)}
                            disabled={userData?.role === 'owner' || userData?.role === 'admin'}
                          />
                        </Col>
                      </Row>

                      <div className="title title-xs title-wth-divider text-muted text-uppercase my-4">
                        <span>Legenda</span>
                      </div>
                      <Row className="gx-3">
                        <Col sm={12}>
                          <ul className="list-unstyled small text-muted">
                            <li className="mb-1"><strong>Visualizar:</strong> Permite ver informações do módulo</li>
                            <li className="mb-1"><strong>Editar:</strong> Permite criar e modificar dados</li>
                            <li className="mb-1"><strong>Deletar:</strong> Permite excluir dados permanentemente</li>
                          </ul>
                        </Col>
                      </Row>

                      <Button 
                        variant="primary" 
                        type="submit" 
                        className="mt-5" 
                        disabled={saving || userData?.role === 'owner' || userData?.role === 'admin'}
                      >
                        {saving ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar Permissões'
                        )}
                      </Button>
                    </Form>
                  </Tab.Pane>
                )}

                {/* Tab 3: Configurações da Conta */}
                {(isOwner || isAdmin) && !isSelf && (
                  <Tab.Pane eventKey="tabBlock3">
                    <div className="title-lg fs-4"><span>Configurações da Conta</span></div>
                    <p className="mb-4">Ações sensíveis relacionadas à conta do usuário.</p>
                    <Form>
                      <div className="title title-xs title-wth-divider text-danger text-uppercase my-4">
                        <span>Zona de Perigo</span>
                      </div>
                      <Row className="gx-3">
                        <Col sm={6}>
                          <Form.Group className="mb-3">
                            <div className="h5 d-block mb-2">Deletar Conta</div>
                            <Form.Text muted className="d-block mb-3">
                              Deletar permanentemente esta conta e todos os dados relacionados. Esta ação não pode ser desfeita.
                            </Form.Text>
                          </Form.Group>
                        </Col>
                        <Col sm={6} className="text-end">
                          <Form.Group className="mb-3">
                            <Button 
                              variant="danger" 
                              onClick={handleDeleteAccount} 
                              disabled={saving}
                            >
                              {saving ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-2" />
                                  Deletando...
                                </>
                              ) : (
                                'Deletar Conta'
                              )}
                            </Button>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Form>
                  </Tab.Pane>
                )}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </div>
      {/* /Page Body */}
    </Container>
  );
};

export default EditUserBody;

