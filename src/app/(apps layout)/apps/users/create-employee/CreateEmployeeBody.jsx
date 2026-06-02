'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Col, Container, Form, Nav, Row, Tab, Alert, Badge, Card } from 'react-bootstrap';
import { ArrowLeft, Save, User, Briefcase, Shield, Check, X, Eye, EyeOff } from 'react-feather';
import { useAuth } from '@/lib/auth/AuthProvider';
import { apiRequest } from '@/lib/api/client';
import { showCustomAlert } from '@/components/CustomAlert';

const CreateEmployeeBody = () => {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  // States do formulário
  const [formData, setFormData] = useState({
    // Tab 1 - Dados Básicos
    nomeCompleto: '',
    email: '',
    senha: '',
    telefone: '',
    cpf: '',
    dataNascimento: '',
    dataAdmissao: '',
    status: 'ativo',
    
    // Tab 2 - Departamento & Cargo
    departamento: '',
    cargo: '',
    coordenador: '', // ID do coordenador/gestor
    nivelAcesso: 'operacional', // operacional, coordenador, gestor
    
    // Tab 3 - Permissões
    permissions: {
      admin:      { read: false, write: false, delete: false },
      fleet:      { read: false, write: false, delete: false },
      monitoring: { read: false, write: false, delete: false },
      financial:  { read: false, write: false, delete: false },
      marketing:  { read: false, write: false, delete: false },
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
  
  // Departamentos — contexto TMS/Frota
  const departamentos = [
    { value: 'operacoes',  label: '🚛 Operações de Frota',   icon: '🚛' },
    { value: 'logistica',  label: '📦 Logística & Rotas',    icon: '📦' },
    { value: 'manutencao', label: '🔧 Manutenção',           icon: '🔧' },
    { value: 'financeiro', label: '💰 Financeiro',            icon: '💰' },
    { value: 'rh',         label: '👥 Recursos Humanos',     icon: '👥' },
    { value: 'tecnologia', label: '💻 Tecnologia',           icon: '💻' }
  ];
  
  // Cargos por departamento — contexto TMS/Frota
  const cargosPorDepartamento = {
    operacoes: [
      'Operador de Frota',
      'Despachante',
      'Controlador de Tráfego',
      'Analista de Rastreamento',
      'Coordenador de Viagens'
    ],
    logistica: [
      'Coordenador de Logística',
      'Analista de Rotas',
      'Planejador de Frota',
      'Analista de Transporte',
      'Supervisor de Entregas'
    ],
    manutencao: [
      'Mecânico',
      'Técnico de Rastreamento',
      'Eletricista Automotivo',
      'Coordenador de Manutenção',
      'Técnico de Telemetria'
    ],
    financeiro: [
      'Contador',
      'Tesoureiro',
      'Analista Financeiro',
      'Assistente Administrativo',
      'Comprador/Procurement'
    ],
    rh: [
      'Analista de RH',
      'Gestor de Motoristas',
      'Recrutador',
      'Coordenador de Treinamento'
    ],
    tecnologia: [
      'Desenvolvedor',
      'Suporte de TI',
      'Operador de Painel',
      'DevOps',
      'Analista de Dados'
    ]
  };
  
  // Módulos do sistema TMS
  const modules = [
    { id: 'admin',      name: '🔐 ADMIN',       description: 'Usuários, Empresa, Monitor, Suporte' },
    { id: 'fleet',      name: '🚛 FROTA',        description: 'Veículos, Motoristas, Dispositivos GPS, Manutenção' },
    { id: 'monitoring', name: '📡 MONITORAMENTO', description: 'Torre de Controle, Geofences, Alertas, Relatórios' },
    { id: 'financial',  name: '💰 FINANCEIRO',   description: 'Despesas, Receitas, Notas Fiscais' },
    { id: 'marketing',  name: '📢 MARKETING',    description: 'Campanhas, Leads, Oportunidades' },
  ];
  
  // Perfis de permissões pré-definidos — contexto TMS
  const permissionProfiles = {
    operacional: {
      name: 'Operacional',
      description: 'Acesso básico: visualiza frota e monitoramento',
      permissions: {
        admin:      { read: false, write: false, delete: false },
        fleet:      { read: true,  write: false, delete: false },
        monitoring: { read: true,  write: false, delete: false },
        financial:  { read: false, write: false, delete: false },
        marketing:  { read: false, write: false, delete: false },
      }
    },
    coordenador: {
      name: 'Coordenador',
      description: 'Gerencia frota, viagens e alertas do departamento',
      permissions: {
        admin:      { read: false, write: false, delete: false },
        fleet:      { read: true,  write: true,  delete: false },
        monitoring: { read: true,  write: true,  delete: false },
        financial:  { read: true,  write: false, delete: false },
        marketing:  { read: false, write: false, delete: false },
      }
    },
    gestor: {
      name: 'Gestor',
      description: 'Acesso gerencial completo, exceto administração de usuários',
      permissions: {
        admin:      { read: true,  write: false, delete: false },
        fleet:      { read: true,  write: true,  delete: true  },
        monitoring: { read: true,  write: true,  delete: true  },
        financial:  { read: true,  write: true,  delete: false },
        marketing:  { read: true,  write: true,  delete: false },
      }
    }
  };

  const formatCPF = (value = '') => {
    const digits = String(value).replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value = '') => {
    const digits = String(value).replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };
  
  const handleInputChange = (field, value) => {
    if (field === 'cpf') value = formatCPF(value);
    if (field === 'telefone') value = formatPhone(value);
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
        nivelAcesso: profileKey,
        permissions: profile.permissions
      }));
    }
  };

  const isEmpty = (value) => !String(value ?? '').trim();

  const showRequiredAlert = async (fields) => {
    await showCustomAlert({
      variant: 'warning',
      title: 'Campos obrigatórios',
      text: `Preencha os campos obrigatórios: ${fields.join(', ')}`,
    });
  };

  const validateTab1 = async () => {
    const missingFields = [];
    if (isEmpty(formData.nomeCompleto)) missingFields.push('Nome Completo');
    if (isEmpty(formData.email)) missingFields.push('E-mail');
    if (isEmpty(formData.senha)) missingFields.push('Senha');
    if (isEmpty(formData.cpf)) missingFields.push('CPF');
    if (isEmpty(formData.status)) missingFields.push('Status');

    if (missingFields.length > 0) {
      await showRequiredAlert(missingFields);
      return false;
    }

    return true;
  };

  const validateTab2 = async () => {
    const missingFields = [];
    if (isEmpty(formData.departamento)) missingFields.push('Departamento');
    if (isEmpty(formData.cargo)) missingFields.push('Cargo/Função');

    if (missingFields.length > 0) {
      await showRequiredAlert(missingFields);
      return false;
    }

    return true;
  };

  const canNavigateTo = async (nextTab) => {
    if (nextTab === 'tab1') return true;
    if (nextTab === 'tab2') return validateTab1();
    if (nextTab === 'tab3') {
      const tab1Valid = await validateTab1();
      if (!tab1Valid) return false;
      return validateTab2();
    }
    return true;
  };

  const handleTabSelect = async (nextTab) => {
    if (!nextTab || nextTab === activeTab) return;
    const canGo = await canNavigateTo(nextTab);
    if (canGo) setActiveTab(nextTab);
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    const tab1Valid = await validateTab1();
    if (!tab1Valid) return;
    const tab2Valid = await validateTab2();
    if (!tab2Valid) return;

    setLoading(true);
    
    try {
      // Preparar dados para enviar ao backend
      const payload = {
        email: formData.email,
        password: formData.senha,
        name: formData.nomeCompleto,
        role: 'employee',
        department: formData.departamento,
        phone: formData.telefone.replace(/\D/g, '') || undefined,
        emailVerified: false,
        permissions: formData.permissions
      };

      const response = await apiRequest('/admin/users', {
        method: 'POST',
        body: payload
      });

      if (!response || response.error) {
        throw new Error(response?.message || 'Erro ao criar funcionário');
      }

      await showCustomAlert({
        variant: 'success',
        title: 'Sucesso',
        text: 'Funcionário criado com sucesso!',
      });
      router.push('/apps/users/list');
    } catch (err) {
      setError(err?.message || 'Erro ao criar funcionário');
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

  const cargoOptions = formData.departamento
    ? Array.from(new Set([...(cargosPorDepartamento[formData.departamento] || []), 'Outros']))
    : [];

  return (
    <Container>
      {/* Header */}
      <div className="hk-pg-header pt-7 pb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="pg-title">Criar Funcionário (Employee)</h1>
            <p>Cadastre um novo membro da equipe com permissões específicas.</p>
          </div>
          <Button variant="outline-secondary" onClick={() => router.push('/apps/users/list')}>
            <ArrowLeft size={16} className="me-2" />
            Voltar
          </Button>
        </div>
      </div>

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
                      <span className="nav-icon me-2">💼</span>
                      <span className="nav-link-text">Cargo</span>
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
                            placeholder="João Pedro da Silva"
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
                            placeholder="joao.silva@partido.com.br"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                          />
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
                              placeholder="Mínimo 8 caracteres"
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

                    <Row className="gx-3">
                      <Col sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>CPF <span className="text-danger">*</span></Form.Label>
                          <Form.Control 
                            type="text"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={(e) => handleInputChange('cpf', e.target.value)}
                            inputMode="numeric"
                            maxLength={14}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Data de Nascimento</Form.Label>
                          <Form.Control 
                            type="date"
                            value={formData.dataNascimento}
                            onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Data de Admissão</Form.Label>
                          <Form.Control 
                            type="date"
                            value={formData.dataAdmissao}
                            onChange={(e) => handleInputChange('dataAdmissao', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="gx-3">
                      <Col sm={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Status <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            required
                          >
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                            <option value="afastado">Afastado</option>
                            <option value="ferias">Férias</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button 
                      variant="primary" 
                      className="mt-5" 
                      onClick={() => handleTabSelect('tab2')}
                    >
                      Continuar para Cargo
                    </Button>
                  </Form>
                </Tab.Pane>

                {/* Tab 2: Departamento & Cargo */}
                <Tab.Pane eventKey="tab2">
                  <Form>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Departamento e Função</span>
                    </div>

                    <Alert variant="info" className="mb-4">
                      <strong>💡 Dica:</strong> O departamento define a área de atuação e o cargo específico dentro dela.
                    </Alert>

                    <Row className="gx-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Departamento <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.departamento}
                            onChange={(e) => {
                              handleInputChange('departamento', e.target.value);
                              handleInputChange('cargo', ''); // Reseta cargo ao mudar departamento
                            }}
                            required
                          >
                            <option value="">Selecione...</option>
                            {departamentos.map((dept) => (
                              <option key={dept.value} value={dept.value}>
                                {dept.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Cargo/Função <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.cargo}
                            onChange={(e) => handleInputChange('cargo', e.target.value)}
                            required
                            disabled={!formData.departamento}
                          >
                            <option value="">
                              {formData.departamento ? 'Selecione...' : 'Selecione um departamento primeiro'}
                            </option>
                            {cargoOptions.map((cargo) => (
                              <option key={cargo} value={cargo}>
                                {cargo}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Nível de Acesso</span>
                    </div>

                    <Row className="gx-3 mb-4">
                      {Object.entries(permissionProfiles).map(([key, profile]) => (
                        <Col md={4} key={key}>
                          <Card 
                            className={`cursor-pointer ${formData.nivelAcesso === key ? 'border-primary' : ''}`}
                            onClick={() => applyPermissionProfile(key)}
                            style={{ cursor: 'pointer' }}
                          >
                            <Card.Body>
                              <div className="d-flex align-items-center justify-content-between mb-2">
                                <h6 className="mb-0">{profile.name}</h6>
                                {formData.nivelAcesso === key && (
                                  <Check size={20} className="text-primary" />
                                )}
                              </div>
                              <small className="text-muted">{profile.description}</small>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    <Alert variant="warning">
                      <strong>⚠️ Atenção:</strong> O nível de acesso define as permissões padrão. 
                      Você pode personalizar na próxima etapa.
                    </Alert>

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

                    <Alert variant="info" className="mb-4">
                      <strong>🔐 Controle de Acesso:</strong> Defina exatamente o que este funcionário pode fazer em cada módulo do sistema.
                      <div className="mt-2 small">
                        <Check size={14} className="text-success me-1" />
                        <strong>Visualizar:</strong> Pode ver dados |
                        <Check size={14} className="text-primary mx-1" />
                        <strong>Editar:</strong> Pode modificar |
                        <Check size={14} className="text-danger mx-1" />
                        <strong>Excluir:</strong> Pode deletar
                      </div>
                    </Alert>

                    {/* Quick Profiles */}
                    <div className="mb-4">
                      <Form.Label>Perfis Rápidos:</Form.Label>
                      <div className="d-flex gap-2">
                        {Object.entries(permissionProfiles).map(([key, profile]) => (
                          <Button
                            key={key}
                            variant={formData.nivelAcesso === key ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => applyPermissionProfile(key)}
                          >
                            {profile.name}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Matriz de Permissões */}
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
                            />
                            <Form.Check 
                              type="checkbox"
                              id={`${module.id}-delete`}
                              label="Excluir"
                              checked={formData.permissions[module.id].delete}
                              onChange={() => handlePermissionChange(module.id, 'delete')}
                            />
                          </div>
                        </Card.Body>
                      </Card>
                    ))}

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
                        {loading ? 'Salvando...' : 'Criar Funcionário'}
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
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            <Save size={16} className="me-2" />
            {loading ? 'Salvando...' : 'Salvar Funcionário'}
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default CreateEmployeeBody;
