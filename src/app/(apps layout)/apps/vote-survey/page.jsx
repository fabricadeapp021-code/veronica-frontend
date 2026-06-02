'use client'
import { useState } from 'react';
import { Card, Row, Col, Badge, ProgressBar, Button, Form, Dropdown } from 'react-bootstrap';
import * as Icons from 'react-feather';
import classNames from 'classnames';
import SimpleBar from 'simplebar-react';
import VoteSurveyHeader from './VoteSurveyHeader';
import VoteSurveySidebar from './VoteSurveySidebar';

const channelOptions = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'link', label: 'Formul\u00E1rio (Link)' },
    { value: 'both', label: 'Ambos' },
];

const fieldTypeOptions = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'N\u00FAmero' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Telefone' },
    { value: 'select', label: 'Sele\u00E7\u00E3o' },
    { value: 'multi_select', label: 'M\u00FAltipla Escolha' },
];

const getChannelLabel = (channelValue) => (
    channelOptions.find((option) => option.value === channelValue)?.label || 'Ambos'
);

const initialCreateSurveyState = {
    title: '',
    channel: 'both',
    fields: [{ id: 1, label: '', type: 'text' }],
};

const dashboardMock = {
    title: 'Intenção de Voto',
    subtitle: 'Pesquisas eleitorais e resultados em tempo real',
    kpis: [
        { id: 'total', icon: Icons.Users, label: 'Total de Respostas', value: '1.450', color: 'success' },
        { id: 'active', icon: Icons.Clipboard, label: 'Pesquisas Ativas', value: '2', color: 'primary' },
        { id: 'candidates', icon: Icons.BarChart2, label: 'Candidatos', value: '4', color: 'warning' },
        { id: 'leader', icon: Icons.TrendingUp, label: 'Líder Atual', value: 'João Silva (32%)', color: 'success' },
    ],
    channels: [
        { id: 'whatsapp', icon: Icons.MessageCircle, label: 'WhatsApp', value: '1.450', detail: '59% das respostas', color: 'success' },
        { id: 'link', icon: Icons.Link, label: 'Formulário (Link)', value: '1.000', detail: '41% das respostas', color: 'primary' },
    ],
    surveys: [
        {
            id: 'survey-1',
            status: 'Ativa',
            title: 'Pesquisa Eleitoral - Janeiro 2026',
            detail: '1.000 respostas - WhatsApp + Link',
            fields: [
                { label: 'Nome completo', type: 'text', required: true },
                { label: 'Bairro', type: 'text', required: true },
                { label: 'Idade', type: 'number', required: true },
                { label: 'Em quem você votaria?', type: 'radio', required: true },
                { label: 'Qual o principal problema da cidade?', type: 'select', required: false },
            ],
            optionSummaries: [
                'Em quem você votaria?: João Silva (15) - Maria Santos (45) - Pedro Costa (13) - Ana Oliveira (12) - Branco/Nulo',
                'Qual o principal problema da cidade?: Saúde - Segurança - Educação - Transporte - Emprego',
            ],
            actions: { openForm: true, viewResponses: true },
        },
        {
            id: 'survey-2',
            status: 'Ativa',
            title: 'Pesquisa Rápida - WhatsApp',
            detail: '450 respostas - WhatsApp',
            fields: [
                { label: 'Em quem você votaria hoje?', type: 'radio', required: true },
            ],
            optionSummaries: [
                'Em quem você votaria hoje?: João Silva (15) - Maria Santos (45) - Pedro Costa (13) - Ana Oliveira (12)',
            ],
            actions: { openForm: true, viewResponses: true },
        },
        {
            id: 'survey-3',
            status: 'Rascunho',
            title: 'Pesquisa Demográfica',
            detail: '0 respostas - Link',
            fields: [
                { label: 'Nome', type: 'text', required: true },
                { label: 'E-mail', type: 'email', required: false },
                { label: 'Telefone', type: 'phone', required: false },
            ],
            optionSummaries: [],
            actions: { openForm: false, viewResponses: true },
        },
    ],
    interviewCount: '1.020 Entrevistados',
    candidates: [
        { id: 'cand-1', number: '15', name: 'João Silva', party: 'PMDB', percentage: 32.0, variation: 2.5, color: '#00A991' },
        { id: 'cand-2', number: '45', name: 'Maria Santos', party: 'PSDB', percentage: 28.0, variation: -1.2, color: '#2E7DDB' },
        { id: 'cand-3', number: '13', name: 'Pedro Costa', party: 'PT', percentage: 22.0, variation: 0.8, color: '#E53935' },
        { id: 'cand-4', number: '12', name: 'Ana Oliveira', party: 'PDT', percentage: 12.0, variation: -0.5, color: '#F57C00' },
    ],
    undecided: [
        { id: 'blank', label: 'Brancos/Nulos', percentage: 6.0, variation: -1.6 },
        { id: 'unknown', label: 'Não souberam / Não opinaram', percentage: 2.0, variation: null },
    ],
    ageRanges: [
        { id: '18-24', label: '18-24', percentage: 15 },
        { id: '25-34', label: '25-34', percentage: 28 },
        { id: '35-44', label: '35-44', percentage: 22 },
        { id: '45-54', label: '45-54', percentage: 18 },
        { id: '55-64', label: '55-64', percentage: 12 },
        { id: '65+', label: '65+', percentage: 5 },
    ],
    regions: [
        { id: 'center', label: 'Centro', percentage: 30 },
        { id: 'north', label: 'Zona Norte', percentage: 25 },
        { id: 'south', label: 'Zona Sul', percentage: 20 },
        { id: 'east', label: 'Zona Leste', percentage: 15 },
        { id: 'west', label: 'Zona Oeste', percentage: 10 },
    ],
    recentResponses: [
        { id: 1, name: 'Carlos M.', region: 'Centro', vote: 'João Silva (15)', channel: 'WhatsApp', ago: 'há 5 min' },
        { id: 2, name: 'Fernanda L.', region: 'Zona Norte', vote: 'Maria Santos (45)', channel: 'Link', ago: 'há 12 min' },
        { id: 3, name: 'Roberto A.', region: 'Zona Sul', vote: 'Pedro Costa (13)', channel: 'WhatsApp', ago: 'há 18 min' },
        { id: 4, name: 'Juliana P.', region: 'Centro', vote: 'João Silva (15)', channel: 'Link', ago: 'há 25 min' },
        { id: 5, name: 'Marcos S.', region: 'Zona Leste', vote: 'Ana Oliveira (12)', channel: 'WhatsApp', ago: 'há 32 min' },
        { id: 6, name: 'Luciana R.', region: 'Zona Oeste', vote: 'Maria Santos (45)', channel: 'WhatsApp', ago: 'há 40 min' },
    ],
};

const VoteSurveyDashboard = () => {
    const [showSidebar, setShowSidebar] = useState(true);
    const [surveys, setSurveys] = useState(dashboardMock.surveys);
    const [expandedSurveys, setExpandedSurveys] = useState({
        'survey-1': false,
        'survey-2': false,
        'survey-3': false,
    });
    const [showCreateSurvey, setShowCreateSurvey] = useState(false);
    const [createSurvey, setCreateSurvey] = useState(initialCreateSurveyState);
    const [nextFieldId, setNextFieldId] = useState(2);

    const toggleSurvey = (surveyId) => {
        setExpandedSurveys((prev) => ({
            ...prev,
            [surveyId]: !prev[surveyId],
        }));
    };

    const updateSurveyField = (fieldId, patch) => {
        setCreateSurvey((prev) => ({
            ...prev,
            fields: prev.fields.map((field) => (
                field.id === fieldId ? { ...field, ...patch } : field
            )),
        }));
    };

    const addSurveyField = () => {
        setCreateSurvey((prev) => ({
            ...prev,
            fields: [
                ...prev.fields,
                { id: nextFieldId, label: '', type: 'text' },
            ],
        }));
        setNextFieldId((prev) => prev + 1);
    };

    const removeSurveyField = (fieldId) => {
        setCreateSurvey((prev) => {
            if (prev.fields.length <= 1) return prev;
            return {
                ...prev,
                fields: prev.fields.filter((field) => field.id !== fieldId),
            };
        });
    };

    const handleCancelCreateSurvey = () => {
        setShowCreateSurvey(false);
        setCreateSurvey(initialCreateSurveyState);
        setNextFieldId(2);
    };

    const canCreateSurvey = (
        createSurvey.title.trim().length > 0
        && createSurvey.fields.length > 0
        && createSurvey.fields.every((field) => field.label.trim().length > 0)
    );

    const handleCreateSurvey = () => {
        if (!canCreateSurvey) return;

        const newSurveyId = `survey-${Date.now()}`;
        const selectedChannelLabel = getChannelLabel(createSurvey.channel);
        const newSurvey = {
            id: newSurveyId,
            status: 'Rascunho',
            title: createSurvey.title.trim(),
            detail: `0 respostas - ${selectedChannelLabel}`,
            fields: createSurvey.fields.map((field) => ({
                label: field.label.trim(),
                type: field.type,
                required: false,
            })),
            optionSummaries: [],
            actions: { openForm: false, viewResponses: true },
        };

        setSurveys((prev) => [newSurvey, ...prev]);
        setExpandedSurveys((prev) => ({ ...prev, [newSurveyId]: false }));
        handleCancelCreateSurvey();
    };

    return (
        <div className="hk-pg-body py-0 vote-survey-page">
            <div className={classNames('fmapp-wrap', { 'fmapp-sidebar-toggle': !showSidebar })}>
                <VoteSurveySidebar />
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        <VoteSurveyHeader showSidebar={showSidebar} toggleSidebar={() => setShowSidebar(!showSidebar)} />
                        <div className="fm-body">
                            <SimpleBar className="nicescroll-bar">
                                <div className="container-fluid px-4 py-4">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                                        <div>
                                            <h4 className="mb-0">{dashboardMock.title}</h4>
                                            <p className="mb-0 text-muted">{dashboardMock.subtitle}</p>
                                        </div>
                                        <Button variant="outline-secondary" size="sm">
                                            <Icons.RefreshCw size={15} className="me-2" />
                                            Atualizar
                                        </Button>
                                    </div>

                                    <Row className="g-3 mb-3">
                                        {dashboardMock.kpis.map((kpi) => (
                                            <Col lg={3} md={6} key={kpi.id}>
                                                <Card className="h-100">
                                                    <Card.Body className="d-flex align-items-center">
                                                        <div className={`avatar avatar-icon avatar-soft-${kpi.color} avatar-sm avatar-rounded me-3`}>
                                                            <span className="initial-wrap">
                                                                <kpi.icon size={16} />
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted fs-8">{kpi.label}</div>
                                                            <div className="fw-bold fs-5">{kpi.value}</div>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>

                                    <Row className="g-3 mb-4">
                                        {dashboardMock.channels.map((channel) => (
                                            <Col lg={6} key={channel.id}>
                                                <Card className="h-100">
                                                    <Card.Body className="d-flex align-items-center">
                                                        <div className={`avatar avatar-icon avatar-soft-${channel.color} avatar-sm avatar-rounded me-3`}>
                                                            <span className="initial-wrap">
                                                                <channel.icon size={16} />
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted fs-8">{channel.label}</div>
                                                            <div className="fw-bold fs-4 lh-1">{channel.value}</div>
                                                            <div className="text-muted fs-8">{channel.detail}</div>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>

                                    <Card className="mb-4">
                                        <Card.Body>
                                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                                                <h5 className="mb-0">
                                                    <Icons.Clipboard size={18} className="me-2 text-success" />
                                                    Pesquisas
                                                </h5>
                                                <Button variant="primary" size="sm" onClick={() => setShowCreateSurvey(true)}>
                                                    <Icons.Plus size={16} className="me-1" />
                                                    Nova Pesquisa
                                                </Button>
                                            </div>

                                            {showCreateSurvey && (
                                                <div className="vote-survey-creator mb-3">
                                                    <h6 className="fw-bold mb-3">Criar Nova Pesquisa</h6>
                                                    <Row className="g-3">
                                                        <Col md={6}>
                                                            <Form.Label>{'T\u00EDtulo da Pesquisa'}</Form.Label>
                                                            <Form.Control
                                                                type="text"
                                                                placeholder="Ex: Pesquisa Eleitoral - Fevereiro"
                                                                value={createSurvey.title}
                                                                onChange={(event) => setCreateSurvey((prev) => ({ ...prev, title: event.target.value }))}
                                                            />
                                                        </Col>
                                                        <Col md={6}>
                                                            <Form.Label>{'Canal de Distribui\u00E7\u00E3o'}</Form.Label>
                                                            <Dropdown>
                                                                <Dropdown.Toggle variant="light" className="w-100 text-start vote-survey-creator-toggle">
                                                                    {getChannelLabel(createSurvey.channel)}
                                                                </Dropdown.Toggle>
                                                                <Dropdown.Menu className="w-100 vote-survey-creator-menu">
                                                                    {channelOptions.map((option) => (
                                                                        <Dropdown.Item
                                                                            key={option.value}
                                                                            className="d-flex align-items-center justify-content-between"
                                                                            onClick={() => setCreateSurvey((prev) => ({ ...prev, channel: option.value }))}
                                                                        >
                                                                            <span>{option.label}</span>
                                                                            {createSurvey.channel === option.value && <Icons.Check size={14} />}
                                                                        </Dropdown.Item>
                                                                    ))}
                                                                </Dropdown.Menu>
                                                            </Dropdown>
                                                        </Col>
                                                    </Row>

                                                    <div className="separator separator-light mt-3 mb-3" />
                                                    <Form.Label className="mb-2">Campos da Pesquisa</Form.Label>

                                                    <div className="d-flex flex-column gap-2">
                                                        {createSurvey.fields.map((field, index) => (
                                                            <div key={field.id} className="vote-survey-field-row">
                                                                <button type="button" className="vote-survey-field-handle" aria-label={`Campo ${index + 1}`}>
                                                                    <Icons.MoreVertical size={14} />
                                                                </button>
                                                                <span className="vote-survey-field-index">{index + 1}.</span>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="Nome do campo"
                                                                    value={field.label}
                                                                    onChange={(event) => updateSurveyField(field.id, { label: event.target.value })}
                                                                />
                                                                <Dropdown>
                                                                    <Dropdown.Toggle variant="light" className="vote-survey-field-type-toggle">
                                                                        {fieldTypeOptions.find((option) => option.value === field.type)?.label || 'Texto'}
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu align="end" className="vote-survey-creator-menu">
                                                                        {fieldTypeOptions.map((option) => (
                                                                            <Dropdown.Item
                                                                                key={option.value}
                                                                                className="d-flex align-items-center justify-content-between"
                                                                                onClick={() => updateSurveyField(field.id, { type: option.value })}
                                                                            >
                                                                                <span>{option.label}</span>
                                                                                {field.type === option.value && <Icons.Check size={14} />}
                                                                            </Dropdown.Item>
                                                                        ))}
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className="vote-survey-remove-field"
                                                                    onClick={() => removeSurveyField(field.id)}
                                                                    disabled={createSurvey.fields.length <= 1}
                                                                >
                                                                    <Icons.Trash2 size={15} />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <Button variant="link" className="vote-survey-add-field px-0 mt-2" onClick={addSurveyField}>
                                                        <Icons.Plus size={16} className="me-1" />
                                                        Adicionar campo
                                                    </Button>

                                                    <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
                                                        <Button variant="outline-secondary" onClick={handleCancelCreateSurvey}>
                                                            Cancelar
                                                        </Button>
                                                        <Button variant="primary" onClick={handleCreateSurvey} disabled={!canCreateSurvey}>
                                                            <Icons.FileText size={14} className="me-1" />
                                                            Criar Pesquisa
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {surveys.map((survey) => (
                                                <Card
                                                    key={survey.id}
                                                    className="mb-2 shadow-none border vote-survey-item"
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => toggleSurvey(survey.id)}
                                                    onKeyDown={(event) => {
                                                        if (event.key === 'Enter' || event.key === ' ') {
                                                            event.preventDefault();
                                                            toggleSurvey(survey.id);
                                                        }
                                                    }}
                                                >
                                                    <Card.Body className="py-3">
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div>
                                                                <Badge bg={survey.status === 'Ativa' ? 'success' : 'secondary'} className="mb-2">
                                                                    {survey.status}
                                                                </Badge>
                                                                <div className="fw-medium">{survey.title}</div>
                                                                <div className="text-muted fs-8">{survey.detail}</div>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-1">
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className="vote-survey-icon-btn vote-survey-copy-btn"
                                                                    onClick={(event) => event.stopPropagation()}
                                                                >
                                                                    <Icons.Copy size={16} className="text-muted" />
                                                                </Button>
                                                                <Button
                                                                    variant="link"
                                                                    size="sm"
                                                                    className="vote-survey-icon-btn vote-survey-chevron-btn"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        toggleSurvey(survey.id);
                                                                    }}
                                                                >
                                                                    {expandedSurveys[survey.id] ? (
                                                                        <Icons.ChevronUp size={18} className="text-muted" />
                                                                    ) : (
                                                                        <Icons.ChevronDown size={18} className="text-muted" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {expandedSurveys[survey.id] && (
                                                            <div className="mt-3 border-top pt-3">
                                                                <div className="text-muted mb-2 fs-8">Campos ({survey.fields.length}):</div>
                                                                {survey.fields.map((field, index) => (
                                                                    <div key={`${survey.id}-${field.label}`} className="d-flex align-items-center justify-content-between py-1">
                                                                        <div className="d-flex align-items-center">
                                                                            <span className="text-muted me-2 fs-8">{index + 1}.</span>
                                                                            <span className="fw-medium">{field.label}</span>
                                                                        </div>
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <Badge bg="light" text="dark">{field.type}</Badge>
                                                                            {field.required && (
                                                                                <Badge bg="light" text="dark">Obrigatório</Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                {survey.optionSummaries.length > 0 && (
                                                                    <div className="mt-3">
                                                                        {survey.optionSummaries.map((summary) => (
                                                                            <div key={`${survey.id}-${summary}`} className="text-muted fs-8 mb-1">
                                                                                {summary}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <div className="d-flex align-items-center gap-2 mt-3">
                                                                    {survey.actions.openForm && (
                                                                        <Button variant="outline-secondary" size="sm" onClick={(event) => event.stopPropagation()}>
                                                                            <Icons.ExternalLink size={14} className="me-1" />
                                                                            Abrir Formulário
                                                                        </Button>
                                                                    )}
                                                                    {survey.actions.viewResponses && (
                                                                        <Button variant="outline-secondary" size="sm" onClick={(event) => event.stopPropagation()}>
                                                                            <Icons.Eye size={14} className="me-1" />
                                                                            Ver Respostas
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            ))}
                                        </Card.Body>
                                    </Card>

                                    <Card className="mb-4">
                                        <Card.Body>
                                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                                                <div>
                                                    <h4 className="mb-1">Intenção de Voto - 1º Turno</h4>
                                                    <Badge bg="success">
                                                        <Icons.Users size={14} className="me-1" />
                                                        {dashboardMock.interviewCount}
                                                    </Badge>
                                                </div>
                                                <Button variant="outline-secondary" size="sm">
                                                    <Icons.RefreshCw size={15} className="me-1" />
                                                    Atualizar
                                                </Button>
                                            </div>

                                            {dashboardMock.candidates.map((candidate) => (
                                                <div key={candidate.id} className="mb-4">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <div className="d-flex align-items-center">
                                                            <div className="avatar avatar-sm avatar-rounded me-2" style={{ backgroundColor: candidate.color }}>
                                                                <span className="initial-wrap text-white fw-bold">{candidate.number}</span>
                                                            </div>
                                                            <div>
                                                                <div className="fw-medium">{candidate.name}</div>
                                                                <small className="text-muted">{candidate.party}</small>
                                                            </div>
                                                        </div>
                                                        <div className="text-end">
                                                            <span className="fs-4 fw-bold" style={{ color: candidate.color }}>
                                                                {candidate.percentage.toFixed(1)}%
                                                            </span>
                                                            <small className={`ms-2 fw-medium ${candidate.variation >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                {candidate.variation >= 0 ? '+' : ''}{candidate.variation}
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <ProgressBar now={candidate.percentage} style={{ height: '10px' }}>
                                                        <ProgressBar now={candidate.percentage} key={1} style={{ backgroundColor: candidate.color }} />
                                                    </ProgressBar>
                                                </div>
                                            ))}

                                            {dashboardMock.undecided.map((item) => (
                                                <div key={item.id} className="mb-3">
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <div className="fw-medium">{item.label}</div>
                                                        <div className="text-end">
                                                            <span className="fs-5 fw-bold text-secondary">{item.percentage.toFixed(1)}%</span>
                                                            {item.variation !== null && (
                                                                <small className={`ms-2 fw-medium ${item.variation >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                    {item.variation >= 0 ? '+' : ''}{item.variation}
                                                                </small>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ProgressBar now={item.percentage} style={{ height: '8px' }} variant="secondary" />
                                                </div>
                                            ))}
                                        </Card.Body>
                                    </Card>

                                    <Row className="g-3 mb-4">
                                        <Col lg={6}>
                                            <Card className="h-100">
                                                <Card.Body>
                                                    <h5 className="mb-3">
                                                        <Icons.PieChart size={17} className="me-2 text-success" />
                                                        Por Faixa Etária
                                                    </h5>
                                                    {dashboardMock.ageRanges.map((range) => (
                                                        <div key={range.id} className="mb-3">
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <span className="text-muted fs-8">{range.label}</span>
                                                                <span className="fw-medium fs-8">{range.percentage}%</span>
                                                            </div>
                                                            <ProgressBar now={range.percentage} style={{ height: '8px' }} variant="success" />
                                                        </div>
                                                    ))}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col lg={6}>
                                            <Card className="h-100">
                                                <Card.Body>
                                                    <h5 className="mb-3">
                                                        <Icons.BarChart2 size={17} className="me-2 text-success" />
                                                        Por Região
                                                    </h5>
                                                    {dashboardMock.regions.map((region) => (
                                                        <div key={region.id} className="mb-3">
                                                            <div className="d-flex justify-content-between mb-1">
                                                                <span className="text-muted fs-8">{region.label}</span>
                                                                <span className="fw-medium fs-8">{region.percentage}%</span>
                                                            </div>
                                                            <ProgressBar now={region.percentage} style={{ height: '8px' }} variant="success" />
                                                        </div>
                                                    ))}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Card>
                                        <Card.Body>
                                            <h5 className="mb-3">
                                                <Icons.Send size={17} className="me-2 text-success" />
                                                Respostas Recentes
                                            </h5>
                                            {dashboardMock.recentResponses.map((response) => (
                                                <Card key={response.id} className="mb-2 shadow-none border">
                                                    <Card.Body className="py-2">
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div className="d-flex align-items-center">
                                                                <div className="avatar avatar-icon avatar-soft-success avatar-xs avatar-rounded me-2">
                                                                    <span className="initial-wrap">
                                                                        <Icons.User size={12} />
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <div className="fw-medium fs-8">{response.name}</div>
                                                                    <div className="text-muted fs-8">{response.region} - Voto: {response.vote}</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-end">
                                                                <Badge bg="light" text="dark" className="me-2">{response.channel}</Badge>
                                                                <small className="text-muted">{response.ago}</small>
                                                            </div>
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            ))}
                                        </Card.Body>
                                    </Card>
                                </div>
                            </SimpleBar>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                .vote-survey-page .vote-survey-item {
                    transition: background-color 0.18s ease, border-color 0.18s ease;
                    cursor: pointer;
                }

                .vote-survey-page .vote-survey-item:hover {
                    background-color: rgba(0, 0, 0, 0.015);
                    border-color: rgba(0, 0, 0, 0.12);
                }

                .vote-survey-page .vote-survey-icon-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 30px;
                    height: 30px;
                    padding: 0;
                    border: 0 !important;
                    border-radius: 10px;
                    text-decoration: none !important;
                    transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
                    box-shadow: none !important;
                }

                .vote-survey-page .vote-survey-icon-btn svg {
                    transition: color 0.18s ease;
                }

                .vote-survey-page .vote-survey-copy-btn {
                    background-color: transparent;
                }

                .vote-survey-page .vote-survey-copy-btn:hover,
                .vote-survey-page .vote-survey-copy-btn:focus,
                .vote-survey-page .vote-survey-copy-btn:active,
                .vote-survey-page .vote-survey-copy-btn:focus-visible {
                    background-color: #eef8f6 !important;
                    box-shadow: none !important;
                    outline: none !important;
                }

                .vote-survey-page .vote-survey-chevron-btn {
                    background-color: transparent;
                    border-radius: 8px;
                }

                .vote-survey-page .vote-survey-chevron-btn:hover,
                .vote-survey-page .vote-survey-chevron-btn:focus,
                .vote-survey-page .vote-survey-chevron-btn:active,
                .vote-survey-page .vote-survey-chevron-btn:focus-visible {
                    background-color: transparent !important;
                    box-shadow: none !important;
                    outline: none !important;
                }

                .vote-survey-page .vote-survey-icon-btn:hover svg,
                .vote-survey-page .vote-survey-icon-btn:focus svg,
                .vote-survey-page .vote-survey-icon-btn:active svg {
                    color: #00a991 !important;
                }

                .vote-survey-page .vote-survey-chevron-btn:hover svg,
                .vote-survey-page .vote-survey-chevron-btn:focus svg,
                .vote-survey-page .vote-survey-chevron-btn:active svg {
                    color: inherit !important;
                }

                .vote-survey-page .vote-survey-icon-btn.btn.show,
                .vote-survey-page .vote-survey-icon-btn.btn:focus:not(:focus-visible),
                .vote-survey-page .vote-survey-icon-btn.btn-check:checked + .btn {
                    box-shadow: none !important;
                }

                .vote-survey-page .vote-survey-creator {
                    padding: 18px;
                    border: 1px solid rgba(0, 169, 145, 0.35);
                    border-radius: 12px;
                    background: #f4fbf9;
                }

                .vote-survey-page .vote-survey-creator .form-label {
                    font-size: 13px;
                    margin-bottom: 6px;
                }

                .vote-survey-page .vote-survey-creator-toggle {
                    border-color: #d6dde5;
                }

                .vote-survey-page .vote-survey-creator-toggle,
                .vote-survey-page .vote-survey-field-type-toggle {
                    display: inline-flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                }

                .vote-survey-page .vote-survey-creator-toggle::after,
                .vote-survey-page .vote-survey-field-type-toggle::after {
                    margin-left: 10px;
                }

                .vote-survey-page .vote-survey-creator-menu {
                    border-radius: 10px;
                }

                .vote-survey-page .vote-survey-field-row {
                    display: grid;
                    grid-template-columns: auto auto 1fr 140px auto;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    border: 1px solid #e3e8ef;
                    border-radius: 10px;
                    background: #fff;
                }

                .vote-survey-page .vote-survey-field-handle {
                    border: 0;
                    background: transparent;
                    color: #8b98a8;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                }

                .vote-survey-page .vote-survey-field-index {
                    color: #5b6572;
                    font-size: 13px;
                    min-width: 20px;
                }

                .vote-survey-page .vote-survey-field-type-toggle {
                    min-width: 140px;
                }

                .vote-survey-page .vote-survey-remove-field {
                    color: #8b98a8;
                    padding: 4px 6px;
                }

                .vote-survey-page .vote-survey-remove-field:hover {
                    color: #dc3545;
                }

                .vote-survey-page .vote-survey-add-field {
                    color: #00a991;
                    text-decoration: none;
                }

                .vote-survey-page .vote-survey-add-field:hover {
                    color: #008f7a;
                }

                @media (max-width: 767px) {
                    .vote-survey-page .vote-survey-field-row {
                        grid-template-columns: auto auto 1fr auto;
                    }

                    .vote-survey-page .vote-survey-field-type-toggle {
                        grid-column: 3 / -1;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default VoteSurveyDashboard;
