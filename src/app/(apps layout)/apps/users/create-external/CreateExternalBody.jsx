'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Col, Container, Form, Nav, Row, Tab, Alert, Badge, Card } from 'react-bootstrap';
import { ArrowLeft, Save, User, Briefcase, Shield, Check, X, Clock, AlertTriangle, Eye, EyeOff } from 'react-feather';
import { useAuth } from '@/lib/auth/AuthProvider';
import { apiRequest } from '@/lib/api/client';
import { showCustomAlert } from '@/components/CustomAlert';

const CreateExternalBody = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  // States do formulário
  const [formData, setFormData] = useState({
    // Tab 1 - Dados Básicos
    nomeCompleto: '',
    email: '',
    senha: '',
    telefone: '',
    
    // Tab 2 - Informações Contextuais (EXTERNAL específico)
    empresa: '',
    cnpj: '',
    projeto: '',
    justificativa: '',
    expiresAt: '', // ⚠️ OBRIGATÓRIO para external
    
    // Tab 3 - Permissões (pré-configurado restrito)
    permissions: {
      admin: { read: false, write: false, delete: false },
      financial: { read: false, write: false, delete: false },
      marketing: { read: false, write: false, delete: false },
      citizen: { read: true, write: false, delete: false }, // ← Padrão: apenas citizen read
      studio: { read: false, write: false, delete: false }
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');
  
  const isOwner = currentUser?.role === 'owner';
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!error) return;
    showCustomAlert({
      variant: 'danger',
      title: 'Erro',
      text: error,
    }).finally(() => setError(''));
  }, [error]);
  
  // Módulos do sistema
  const modules = [
    { id: 'admin', name: '🔐 ADMIN', description: 'Usuários, Monitor, Documentos', defaultForExternal: false },
    { id: 'financial', name: '💰 FINANCEIRO', description: 'Receitas, Despesas, TSE', defaultForExternal: false },
    { id: 'marketing', name: '📢 MARKETING', description: 'Campanhas, Leads, Oportunidades', defaultForExternal: false },
    { id: 'citizen', name: '👥 CITIZEN', description: 'Chat, Sentimento, Crise', defaultForExternal: true },
    { id: 'studio', name: '🎨 STUDIO', description: 'Avatares, Imagens, Vídeos', defaultForExternal: false }
  ];
  
  // Perfis de permissões sugeridos para EXTERNAL
  const permissionProfiles = {
    minimo: {
      name: 'Acesso Mínimo',
      description: 'Apenas visualização de dados públicos (recomendado)',
      permissions: {
        admin: { read: false, write: false, delete: false },
        financial: { read: false, write: false, delete: false },
        marketing: { read: false, write: false, delete: false },
        citizen: { read: true, write: false, delete: false },
        studio: { read: false, write: false, delete: false }
      }
    },
    consultor: {
      name: 'Consultor',
      description: 'Acesso a marketing e citizen (somente leitura)',
      permissions: {
        admin: { read: false, write: false, delete: false },
        financial: { read: false, write: false, delete: false },
        marketing: { read: true, write: false, delete: false },
        citizen: { read: true, write: false, delete: false },
        studio: { read: true, write: false, delete: false }
      }
    },
    parceiro: {
      name: 'Parceiro Estratégico',
      description: 'Acesso ampliado (marketing, citizen, studio)',
      permissions: {
        admin: { read: false, write: false, delete: false },
        financial: { read: false, write: false, delete: false },
        marketing: { read: true, write: false, delete: false },
        citizen: { read: true, write: true, delete: false },
        studio: { read: true, write: false, delete: false }
      }
    }
  };

  const formatPhone = (value = '') => {
    const digits = String(value).replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCNPJ = (value = '') => {
    const digits = String(value).replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };
  
  const handleInputChange = (field, value) => {
    if (field === 'telefone') value = formatPhone(value);
    if (field === 'cnpj') value = formatCNPJ(value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handlePermissionChange = (moduleId, permType) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          ...prev.permissions[moduleId],
          [permType]: !prev.permissions[moduleId][permType]
        }
      }
    }));
  };
  
  const applyPermissionProfile = (profileKey) => {
    const profile = permissionProfiles[profileKey];
    if (profile) {
      setFormData(prev => ({
        ...prev,
        permissions: profile.permissions
      }));
    }
  };

  const isEmpty = (value) => !String(value ?? '').trim();

  const validateTab1 = async () => {
    const missingFields = [];
    if (isEmpty(formData.nomeCompleto)) missingFields.push('Nome Completo');
    if (isEmpty(formData.email)) missingFields.push('E-mail');
    if (isEmpty(formData.senha)) missingFields.push('Senha');
    if (isEmpty(formData.expiresAt)) missingFields.push('Data de Expiração');

    if (missingFields.length > 0) {
      await showCustomAlert({
        variant: 'warning',
        title: 'Campos obrigatórios',
        text: `Preencha os campos obrigatórios: ${missingFields.join(', ')}`,
      });
      return false;
    }

    const expirationDate = new Date(formData.expiresAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expirationDate <= today) {
      await showCustomAlert({
        variant: 'warning',
        title: 'Data inválida',
        text: 'A data de expiração deve ser no futuro.',
      });
      return false;
    }

    if (formData.senha.length < 6) {
      await showCustomAlert({
        variant: 'warning',
        title: 'Senha inválida',
        text: 'A senha deve ter no mínimo 6 caracteres.',
      });
      return false;
    }

    return true;
  };

  const handleTabSelect = async (nextTab) => {
    if (!nextTab || nextTab === activeTab) return;

    if (nextTab === 'tab1') {
      setActiveTab('tab1');
      return;
    }

    const tab1Valid = await validateTab1();
    if (!tab1Valid) return;

    setActiveTab(nextTab);
  };
  
  const validateForm = () => {
    // Validações específicas de EXTERNAL
    if (!formData.nomeCompleto || !formData.email || !formData.senha) {
      setError('Preencha os campos obrigatórios (Nome, E-mail, Senha)');
      return false;
    }
    
    if (!formData.expiresAt) {
      setError('Data de expiração é obrigatória para usuários externos');
      return false;
    }
    
    const expirationDate = new Date(formData.expiresAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (expirationDate <= today) {
      setError('Data de expiração deve ser no futuro');
      return false;
    }
    
    // Validar senha (mínimo 6 caracteres)
    if (formData.senha.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return false;
    }
    
    return true;
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validar formulário
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    
    try {
      // Preparar dados para enviar ao backend
      const payload = {
        email: formData.email,
        password: formData.senha,
        name: formData.nomeCompleto,
        role: 'external', // ← Fixo como external
        phone: formData.telefone.replace(/\D/g, '') || undefined,
        expiresAt: new Date(formData.expiresAt).toISOString(), // ← Obrigatório
        emailVerified: false,
        permissions: formData.permissions,
        // Campos contextuais (opcionais, mas úteis para tracking)
        // Nota: Estes campos precisariam ser adicionados ao CreateUserDto no backend
        // Por enquanto, vamos enviá-los e o backend irá ignorar se não estiver preparado
      };

      console.log('📤 Criando usuário externo:', payload);

      const response = await apiRequest('/admin/users', {
        method: 'POST',
        body: payload
      });

      if (!response || response.error) {
        throw new Error(response?.message || 'Erro ao criar usuário externo');
      }

      await showCustomAlert({
        variant: 'success',
        title: 'Sucesso',
        text: `Usuário externo criado com sucesso! Acesso válido até ${new Date(formData.expiresAt).toLocaleDateString('pt-BR')}.`,
      });
      router.push('/apps/users/list');
    } catch (err) {
      console.error('❌ Erro ao criar externo:', err);
      setError(err?.message || 'Erro ao criar usuário externo');
    } finally {
      setLoading(false);
    }
  };
  
  const PermissionIcon = ({ hasPermission }) => {
    if (hasPermission) {
      return <Check size={18} className="text-success" />;
    }
    return <X size={18} className="text-muted" style={{ opacity: 0.3 }} />;
  };

  // Calcular dias até expiração
  const getDaysUntilExpiration = () => {
    if (!formData.expiresAt) return null;
    const expDate = new Date(formData.expiresAt);
    const today = new Date();
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiration = getDaysUntilExpiration();

  return (
    <Container>
      {/* Header */}
      <div className="hk-pg-header pt-7 pb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="pg-title">🔗 Criar Usuário Externo</h1>
            <p>Cadastre um consultor, parceiro ou prestador de serviço com acesso temporário ao sistema.</p>
          </div>
          <Button variant="outline-secondary" onClick={() => router.push('/apps/users/list')}>
            <ArrowLeft size={16} className="me-2" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Alert Informativo */}
      <Alert variant="warning" className="mb-4">
        <AlertTriangle size={18} className="me-2" />
        <strong>⚠️ Acesso Temporário:</strong> Usuários externos têm permissões muito restritas e 
        acesso temporário ao sistema. Configure a data de expiração com cuidado.
      </Alert>

      {/* Body */}
      <div className="hk-pg-body">
        <Tab.Container activeKey={activeTab} onSelect={handleTabSelect}>
          <Row className="edit-profile-wrap">
            {/* Tabs Sidebar */}
            <Col xs={4} sm={3} lg={2}>
              <div className="nav-profile mt-4">
                <div className="nav-header">
                  <span>Cadastro</span>
                </div>
                <Nav as="ul" variant="tabs" className="nav-light nav-vertical">
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tab1">
                      <span className="nav-icon me-2">👤</span>
                      <span className="nav-link-text">Básico</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tab2">
                      <span className="nav-icon me-2">🏢</span>
                      <span className="nav-link-text">Contexto</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tab3">
                      <span className="nav-icon me-2">🔐</span>
                      <span className="nav-link-text">Permissões</span>
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>
            </Col>

            {/* Content */}
            <Col lg={10} sm={9} xs={8}>
              <Tab.Content>
                {/* Tab 1: Dados Básicos */}
                <Tab.Pane eventKey="tab1">
                  <Form>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Dados Pessoais</span>
                    </div>
                    
                    <Row className="gx-3">
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nome Completo <span className="text-danger">*</span></Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="João Silva Consultor"
                            value={formData.nomeCompleto}
                            onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>E-mail <span className="text-danger">*</span></Form.Label>
                          <Form.Control 
                            type="email"
                            placeholder="joao.silva@consultoria.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                          />
                          <Form.Text className="text-muted">
                            Preferencialmente e-mail corporativo da empresa/organização.
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="gx-3">
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Senha <span className="text-danger">*</span></Form.Label>
                          <div className="position-relative">
                            <Form.Control 
                              type={showPassword ? "text" : "password"}
                              placeholder="Mínimo 6 caracteres"
                              value={formData.senha}
                              onChange={(e) => {
                                const { value } = e.target;
                                if (!value) setShowPassword(false);
                                handleInputChange('senha', value);
                              }}
                              className="pe-5"
                              required
                            />
                            {!!formData.senha && (
                              <Button
                                type="button"
                                variant="link"
                                className="position-absolute top-50 end-0 translate-middle-y text-muted p-0 me-3"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </Button>
                            )}
                          </div>
                        </Form.Group>
                      </Col>
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Telefone/WhatsApp</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="(11) 99999-9999"
                            value={formData.telefone}
                            onChange={(e) => handleInputChange('telefone', e.target.value)}
                            inputMode="numeric"
                            maxLength={15}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="title title-xs title-wth-divider text-danger text-uppercase my-4">
                      <span>⏰ Acesso Temporário</span>
                    </div>

                    <Alert variant="info" className="mb-3">
                      <Clock size={18} className="me-2" />
                      <strong>Importante:</strong> O acesso será revogado automaticamente na data selecionada.
                    </Alert>

                    <Row className="gx-3">
                      <Col sm={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Data de Expiração <span className="text-danger">*</span></Form.Label>
                          <Form.Control 
                            type="date"
                            value={formData.expiresAt}
                            onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                            min={new Date().toISOString().split('T')[0]} // Não permite datas passadas
                            required
                          />
                          {daysUntilExpiration !== null && daysUntilExpiration > 0 && (
                            <Form.Text className="text-success">
                              ✓ Acesso válido por {daysUntilExpiration} dias
                            </Form.Text>
                          )}
                          {daysUntilExpiration !== null && daysUntilExpiration <= 0 && (
                            <Form.Text className="text-danger">
                              ⚠️ Data deve ser no futuro
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button 
                      variant="primary" 
                      className="mt-5" 
                      onClick={() => handleTabSelect('tab2')}
                    >
                      Continuar para Contexto
                    </Button>
                  </Form>
                </Tab.Pane>

                {/* Tab 2: Informações Contextuais */}
                <Tab.Pane eventKey="tab2">
                  <Form>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Informações Contextuais (Opcional)</span>
                    </div>

                    <Alert variant="info" className="mb-4">
                      <strong>💡 Para que serve:</strong> Essas informações ajudam a identificar o motivo do acesso 
                      e facilitam auditorias futuras.
                    </Alert>

                    <Row className="gx-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Empresa/Organização</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="Ex: Consultoria XYZ Ltda"
                            value={formData.empresa}
                            onChange={(e) => handleInputChange('empresa', e.target.value)}
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>CNPJ</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="00.000.000/0000-00"
                            value={formData.cnpj}
                            onChange={(e) => handleInputChange('cnpj', e.target.value)}
                            inputMode="numeric"
                            maxLength={18}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="gx-3">
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Projeto/Contrato</Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="Ex: Campanha Digital 2026"
                            value={formData.projeto}
                            onChange={(e) => handleInputChange('projeto', e.target.value)}
                          />
                          <Form.Text className="text-muted">
                            Especifique o projeto ou contrato relacionado a este acesso.
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="gx-3">
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Justificativa de Acesso</Form.Label>
                          <Form.Control 
                            as="textarea"
                            rows={3}
                            placeholder="Ex: Consultor de marketing digital contratado para análise de redes sociais e criação de campanhas"
                            value={formData.justificativa}
                            onChange={(e) => handleInputChange('justificativa', e.target.value)}
                          />
                          <Form.Text className="text-muted">
                            Descreva brevemente o motivo e escopo do acesso.
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2 mt-5">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setActiveTab('tab1')}
                      >
                        Voltar
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => handleTabSelect('tab3')}
                      >
                        Continuar para Permissões
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>

                {/* Tab 3: Permissões */}
                <Tab.Pane eventKey="tab3">
                  <Form>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Permissões de Acesso</span>
                    </div>

                    <Alert variant="warning" className="mb-4">
                      <AlertTriangle size={18} className="me-2" />
                      <strong>⚠️ Acesso Restrito:</strong> Usuários externos têm permissões muito limitadas por segurança.
                      Por padrão, apenas visualização de dados públicos é permitida.
                    </Alert>

                    {/* Perfis Sugeridos */}
                    <div className="mb-4">
                      <Form.Label>Perfis Sugeridos:</Form.Label>
                      <Row className="gx-3">
                        {Object.entries(permissionProfiles).map(([key, profile]) => (
                          <Col md={4} key={key}>
                            <Card 
                              className="cursor-pointer hover-shadow"
                              onClick={() => applyPermissionProfile(key)}
                              style={{ cursor: 'pointer', minHeight: '120px' }}
                            >
                              <Card.Body>
                                <div className="d-flex align-items-start justify-content-between mb-2">
                                  <h6 className="mb-0">{profile.name}</h6>
                                </div>
                                <small className="text-muted">{profile.description}</small>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>

                    {/* Matriz de Permissões */}
                    <div className="title title-xs title-wth-divider text-muted text-uppercase my-4">
                      <span>Personalizar Permissões</span>
                    </div>

                    {modules.map((module) => (
                      <Card key={module.id} className="mb-3">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="mb-1">{module.name}</h6>
                              <small className="text-muted">{module.description}</small>
                            </div>
                            <div className="d-flex gap-3">
                              <PermissionIcon hasPermission={formData.permissions[module.id].read} />
                              <PermissionIcon hasPermission={formData.permissions[module.id].write} />
                              <PermissionIcon hasPermission={formData.permissions[module.id].delete} />
                            </div>
                          </div>
                          <div className="d-flex gap-4">
                            <Form.Check 
                              type="checkbox"
                              id={`${module.id}-read`}
                              label="Visualizar"
                              checked={formData.permissions[module.id].read}
                              onChange={() => handlePermissionChange(module.id, 'read')}
                            />
                            <Form.Check 
                              type="checkbox"
                              id={`${module.id}-write`}
                              label="Editar"
                              checked={formData.permissions[module.id].write}
                              onChange={() => handlePermissionChange(module.id, 'write')}
                              disabled // ← Geralmente bloqueado para external
                            />
                            <Form.Check 
                              type="checkbox"
                              id={`${module.id}-delete`}
                              label="Excluir"
                              checked={formData.permissions[module.id].delete}
                              onChange={() => handlePermissionChange(module.id, 'delete')}
                              disabled // ← Sempre bloqueado para external
                            />
                          </div>
                        </Card.Body>
                      </Card>
                    ))}

                    <Alert variant="info" className="mt-4">
                      <strong>ℹ️ Nota:</strong> Permissões de escrita e exclusão estão desabilitadas por padrão para usuários externos por motivos de segurança.
                    </Alert>

                    <div className="d-flex gap-2 mt-5">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setActiveTab('tab2')}
                      >
                        Voltar
                      </Button>
                      <Button 
                        variant="success"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        <Save size={16} className="me-2" />
                        {loading ? 'Criando...' : 'Criar Usuário Externo'}
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </div>

      {/* Bottom Actions */}
      <div className="hk-pg-footer py-4">
        <div className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={() => router.push('/apps/users/list')}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleSave} disabled={loading}>
            <Save size={16} className="me-2" />
            {loading ? 'Criando...' : 'Criar Usuário Externo'}
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default CreateExternalBody;
