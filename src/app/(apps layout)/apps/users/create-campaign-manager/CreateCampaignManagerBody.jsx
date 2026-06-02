'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Col, Container, Form, Nav, Row, Tab, Alert } from 'react-bootstrap';
import { ArrowLeft, Save, Eye, EyeOff } from 'react-feather';
import { apiRequest } from '@/lib/api/client';
import { listAdmins, listUsers } from '@/lib/api/services/users';
import { showCustomAlert } from '@/components/CustomAlert';

const FULL_ACCESS_PERMISSIONS = {
  admin: { read: true, write: true, delete: true },
  financial: { read: true, write: true, delete: true },
  marketing: { read: true, write: true, delete: true },
  citizen: { read: true, write: true, delete: true },
  studio: { read: true, write: true, delete: true },
};

const DEPARTAMENTOS = [
  { value: 'comunicacao', label: 'Comunicacao & Marketing' },
  { value: 'financeiro', label: 'Financeiro & Administrativo' },
  { value: 'analise', label: 'Analise & Inteligencia' },
  { value: 'mobilizacao', label: 'Mobilizacao & Engajamento' },
  { value: 'juridico', label: 'Juridico & Compliance' },
  { value: 'parlamentar', label: 'Parlamentar & Institucional' },
  { value: 'atendimento', label: 'Atendimento & Relacionamento' },
  { value: 'estrategia', label: 'Estrategia & Planejamento' },
  { value: 'tecnologia', label: 'Tecnologia' },
];

const CARGOS_POR_DEPARTAMENTO = {
  comunicacao: [
    'Social Media Manager',
    'Designer Grafico',
    'Produtor de Conteudo',
    'Fotografo',
    'Videomaker',
    'Assessor de Imprensa',
    'Assessor de Comunicacao',
  ],
  financeiro: ['Contador', 'Tesoureiro', 'Comprador/Procurement', 'Assistente Administrativo', 'Analista Financeiro'],
  analise: ['Analista de Dados', 'Pesquisador', 'Analista de Pesquisas', 'Analista de Redes Sociais', 'Business Intelligence'],
  mobilizacao: ['Coordenador de Eventos', 'Mobilizador de Base', 'Coordenador de Bairro/Regional', 'Coordenador de Voluntarios', 'Agente Comunitario'],
  juridico: ['Assessor Juridico', 'Compliance Eleitoral', 'Analista de Contratos'],
  parlamentar: ['Assessor Parlamentar', 'Relacoes Institucionais', 'Chefe de Gabinete'],
  atendimento: ['Atendente/Recepcionista', 'Atendente de Call Center', 'Ouvidoria', 'CRM Manager'],
  estrategia: ['Gerente de Campanha', 'Estrategista de Campanha', 'Coordenador de Propostas', 'Analista de Concorrencia'],
  tecnologia: ['Desenvolvedor', 'Suporte de TI', 'Operador de Painel', 'DevOps'],
};

const CreateCampaignManagerBody = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    email: '',
    senha: '',
    telefone: '',
    cpf: '',
    dataNascimento: '',
    dataAdmissao: '',
    status: 'ativo',
    departamento: 'estrategia',
    cargo: 'Gerente de Campanha',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');

  useEffect(() => {
    if (!error) return;
    showCustomAlert({
      variant: 'danger',
      title: 'Erro',
      text: error,
    }).finally(() => setError(''));
  }, [error]);

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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isEmpty = (value) => !String(value ?? '').trim();
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

  const checkEmailAlreadyInUse = async (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return false;

    const [usersResponse, adminsResponse] = await Promise.all([
      listUsers(),
      listAdmins(),
    ]);

    const users = Array.isArray(usersResponse?.users)
      ? usersResponse.users
      : Array.isArray(usersResponse?.data?.users)
        ? usersResponse.data.users
      : Array.isArray(usersResponse)
        ? usersResponse
        : [];

    const admins = Array.isArray(adminsResponse?.data)
      ? adminsResponse.data
      : Array.isArray(adminsResponse)
        ? adminsResponse
        : [];

    const emailMatches = (record) =>
      String(record?.email || '').trim().toLowerCase() === normalizedEmail;

    return users.some(emailMatches) || admins.some(emailMatches);
  };

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
    if (isEmpty(formData.status)) missingFields.push('Status');

    if (missingFields.length > 0) {
      await showRequiredAlert(missingFields);
      return false;
    }

    if (!isValidEmail(formData.email)) {
      await showCustomAlert({
        variant: 'warning',
        title: 'E-mail inválido',
        text: 'Informe um endereço de e-mail válido para continuar.',
      });
      return false;
    }

    if (String(formData.senha || '').length < 8) {
      await showCustomAlert({
        variant: 'warning',
        title: 'Senha inválida',
        text: 'A senha deve ter no mínimo 8 caracteres.',
      });
      return false;
    }

    try {
      const emailAlreadyInUse = await checkEmailAlreadyInUse(formData.email);
      if (emailAlreadyInUse) {
        await showCustomAlert({
          variant: 'warning',
          title: 'E-mail já cadastrado',
          text: `O e-mail "${String(formData.email).trim()}" já está em uso por outro usuário.`,
        });
        return false;
      }
    } catch (err) {
      await showCustomAlert({
        variant: 'danger',
        title: 'Erro ao validar e-mail',
        text: err?.message || 'Não foi possível validar o e-mail informado.',
      });
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

  const handleTabSelect = async (nextTab) => {
    if (!nextTab || nextTab === activeTab) return;

    if (nextTab === 'tab1') {
      setActiveTab('tab1');
      return;
    }

    const tab1Valid = await validateTab1();
    if (!tab1Valid) return;

    if (nextTab === 'tab2') {
      setActiveTab('tab2');
      return;
    }

    const tab2Valid = await validateTab2();
    if (!tab2Valid) return;

    setActiveTab(nextTab);
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
      const payload = {
        email: formData.email,
        password: formData.senha,
        name: formData.nomeCompleto,
        role: 'campaign_manager',
        department: formData.departamento,
        phone: formData.telefone.replace(/\D/g, '') || undefined,
        emailVerified: false,
        permissions: FULL_ACCESS_PERMISSIONS,
      };

      const response = await apiRequest('/admin/users', {
        method: 'POST',
        body: payload,
      });

      if (!response || response.error) {
        throw new Error(response?.message || 'Erro ao criar gerente de campanha');
      }

      await showCustomAlert({
        variant: 'success',
        title: 'Sucesso',
        text: 'Gerente de campanha criado com sucesso! Acesso total aplicado.',
      });

      router.push('/apps/users/list');
    } catch (err) {
      setError(err?.message || 'Erro ao criar gerente de campanha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="hk-pg-header pt-7 pb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="pg-title">Criar Gerente de Campanha</h1>
            <p>Cadastre um gerente com acesso total ao sistema.</p>
          </div>
          <Button variant="outline-secondary" onClick={() => router.push('/apps/users/list')}>
            <ArrowLeft size={16} className="me-2" />
            Voltar
          </Button>
        </div>
      </div>

      <div className="hk-pg-body">
        <Tab.Container activeKey={activeTab} onSelect={handleTabSelect}>
          <Row className="edit-profile-wrap">
            <Col xs={4} sm={3} lg={2}>
              <div className="nav-profile mt-4">
                <div className="nav-header">
                  <span>Cadastro</span>
                </div>
                <Nav as="ul" variant="tabs" className="nav-light nav-vertical">
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tab1">
                      <span className="nav-icon me-2">1</span>
                      <span className="nav-link-text">Basico</span>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item as="li">
                    <Nav.Link eventKey="tab2">
                      <span className="nav-icon me-2">2</span>
                      <span className="nav-link-text">Cargo</span>
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>
            </Col>

            <Col lg={10} sm={9} xs={8}>
              <Tab.Content>
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
                            placeholder="Nome completo"
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
                            placeholder="email@dominio.com"
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
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Minimo 8 caracteres"
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
                          <Form.Label>CPF</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={(e) => handleInputChange('cpf', e.target.value)}
                            inputMode="numeric"
                            maxLength={14}
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
                          <Form.Label>Data de Admissao</Form.Label>
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
                            <option value="ferias">Ferias</option>
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

                <Tab.Pane eventKey="tab2">
                  <Form>
                    <div className="title title-xs title-wth-divider text-primary text-uppercase my-4">
                      <span>Departamento e Funcao</span>
                    </div>

                    <Alert variant="success" className="mb-4">
                      <strong>Acesso total:</strong> este perfil sera criado com permissao completa em todos os modulos.
                    </Alert>

                    <Row className="gx-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Departamento <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.departamento}
                            onChange={(e) => {
                              const nextDepartment = e.target.value;
                              handleInputChange('departamento', nextDepartment);
                              if (!CARGOS_POR_DEPARTAMENTO[nextDepartment]?.includes(formData.cargo)) {
                                handleInputChange('cargo', '');
                              }
                            }}
                            required
                          >
                            <option value="">Selecione...</option>
                            {DEPARTAMENTOS.map((dept) => (
                              <option key={dept.value} value={dept.value}>
                                {dept.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Cargo/Funcao <span className="text-danger">*</span></Form.Label>
                          <Form.Select
                            value={formData.cargo}
                            onChange={(e) => handleInputChange('cargo', e.target.value)}
                            required
                            disabled={!formData.departamento}
                          >
                            <option value="">
                              {formData.departamento ? 'Selecione...' : 'Selecione um departamento primeiro'}
                            </option>
                            {formData.departamento && CARGOS_POR_DEPARTAMENTO[formData.departamento]?.map((cargo) => (
                              <option key={cargo} value={cargo}>
                                {cargo}
                              </option>
                            ))}
                          </Form.Select>
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
                      <Button variant="success" onClick={handleSave} disabled={loading}>
                        <Save size={16} className="me-2" />
                        {loading ? 'Salvando...' : 'Criar Gerente de Campanha'}
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </div>

      <div className="hk-pg-footer py-4">
        <div className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={() => router.push('/apps/users/list')}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            <Save size={16} className="me-2" />
            {loading ? 'Salvando...' : 'Salvar Gerente de Campanha'}
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default CreateCampaignManagerBody;
