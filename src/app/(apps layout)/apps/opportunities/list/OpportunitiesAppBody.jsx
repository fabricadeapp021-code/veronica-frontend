import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SimpleBar from 'simplebar-react';
import { Button, Card, Col, Dropdown, Form, Row, Badge } from 'react-bootstrap';
import { Edit, MoreVertical, Trash, Trash2, RefreshCw, Download, FileText, DollarSign, TrendingUp, Target, Award } from 'react-feather';
import HkDataTable from '@/components/@hk-data-table';
import { listOpportunities, deleteOpportunity, updateOpportunityStage } from '@/lib/api/services/opportunities';
import { useAuth } from '@/lib/auth/AuthProvider';
import CreateOpportunityModal from './CreateOpportunityModal';

const OpportunitiesAppBody = ({ stageFilter, showCreateModal, onHideCreateModal, refreshTrigger }) => {
    const router = useRouter();
    const { status } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState([]);
    const [deletingId, setDeletingId] = useState(null);

    // Mapeamento de estágios
    const stageMap = {
        'Prospecting': { label: 'Prospecção', bg: 'info', icon: <Target size={14} /> },
        'Qualification': { label: 'Qualificação', bg: 'primary', icon: <TrendingUp size={14} /> },
        'Proposal': { label: 'Proposta', bg: 'warning', icon: <FileText size={14} /> },
        'Negotiation': { label: 'Negociação', bg: 'secondary', icon: <DollarSign size={14} /> },
        'Won': { label: 'Ganha', bg: 'success', icon: <Award size={14} /> },
        'Lost': { label: 'Perdida', bg: 'danger', icon: <Trash size={14} /> },
    };

    // Formatter para estágio
    const stageFormatter = (cell) => {
        const stage = stageMap[cell] || { label: cell, bg: 'secondary' };
        return (
            <Badge bg={stage.bg} className="d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                {stage.icon}
                <span>{stage.label}</span>
            </Badge>
        );
    };

    // Formatter para valor monetário
    const amountFormatter = (cell, row) => {
        if (!cell && cell !== 0) return <span className="text-muted">-</span>;
        const currency = row?.amountCurrency || 'BRL';
        const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency,
        }).format(cell);
        return <span className="fw-bold text-success">{formatted}</span>;
    };

    // Formatter para probabilidade
    const probabilityFormatter = (cell) => {
        if (!cell && cell !== 0) return <span className="text-muted">-</span>;
        return (
            <div className="d-flex align-items-center">
                <span className="me-2">{cell}%</span>
                <div className="progress flex-grow-1" style={{ height: '8px', width: '60px' }}>
                    <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{ width: `${cell}%` }}
                        aria-valuenow={cell} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                    />
                </div>
            </div>
        );
    };

    // Formatter para ações
    const actionFormatter = (cell, row) => {
        if (!cell || !Array.isArray(cell) || cell.length === 0) return null;
        return (
            cell.map((data, indx) => {
                const opportunityId = data.id;
                const isDeleting = deletingId === opportunityId;
                
                return (
                    <div className="d-flex align-items-center" key={indx}>
                        <div className="d-flex">
                            <Button 
                                variant="flush-dark" 
                                className="btn-icon btn-rounded flush-soft-hover" 
                                data-bs-toggle="tooltip" 
                                data-placement="top" 
                                data-bs-original-title="Editar"
                                onClick={() => handleEdit(opportunityId)}
                                disabled={isDeleting}
                            >
                                <span className="icon">
                                    <span className="feather-icon">
                                        <Edit />
                                    </span>
                                </span>
                            </Button>
                            
                            <Button 
                                variant="flush-dark" 
                                className="btn-icon btn-rounded flush-soft-hover del-button" 
                                data-bs-toggle="tooltip" 
                                data-placement="top" 
                                data-bs-original-title="Deletar"
                                onClick={() => handleDelete(opportunityId)}
                                disabled={isDeleting}
                            >
                                <span className="icon">
                                    <span className="feather-icon">
                                        <Trash />
                                    </span>
                                </span>
                            </Button>
                        </div>
                        <Dropdown>
                            <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover no-caret" aria-expanded="false" data-bs-toggle="dropdown" disabled={isDeleting}>
                                <span className="icon">
                                    <span className="feather-icon">
                                        <MoreVertical />
                                    </span>
                                </span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end">
                                <Dropdown.Item onClick={() => handleEdit(opportunityId)}>
                                    <span className="feather-icon dropdown-icon">
                                        <Edit />
                                    </span>
                                    <span>Editar Oportunidade</span>
                                </Dropdown.Item>
                                
                                <Dropdown.Divider />
                                
                                <Dropdown.Item onClick={() => handleStageChange(opportunityId, 'Prospecting')}>
                                    <span className="feather-icon dropdown-icon">
                                        <Target />
                                    </span>
                                    <span>Mover para Prospecção</span>
                                </Dropdown.Item>
                                
                                <Dropdown.Item onClick={() => handleStageChange(opportunityId, 'Qualification')}>
                                    <span className="feather-icon dropdown-icon">
                                        <TrendingUp />
                                    </span>
                                    <span>Mover para Qualificação</span>
                                </Dropdown.Item>
                                
                                <Dropdown.Item onClick={() => handleStageChange(opportunityId, 'Proposal')}>
                                    <span className="feather-icon dropdown-icon">
                                        <FileText />
                                    </span>
                                    <span>Mover para Proposta</span>
                                </Dropdown.Item>
                                
                                <Dropdown.Item onClick={() => handleStageChange(opportunityId, 'Negotiation')}>
                                    <span className="feather-icon dropdown-icon">
                                        <DollarSign />
                                    </span>
                                    <span>Mover para Negociação</span>
                                </Dropdown.Item>
                                
                                <Dropdown.Item onClick={() => handleStageChange(opportunityId, 'Won')} className="text-success">
                                    <span className="feather-icon dropdown-icon">
                                        <Award />
                                    </span>
                                    <span>Marcar como Ganha</span>
                                </Dropdown.Item>
                                
                                <Dropdown.Item onClick={() => handleStageChange(opportunityId, 'Lost')} className="text-danger">
                                    <span className="feather-icon dropdown-icon">
                                        <Trash />
                                    </span>
                                    <span>Marcar como Perdida</span>
                                </Dropdown.Item>
                                
                                <Dropdown.Divider />
                                
                                <Dropdown.Item onClick={() => handleDelete(opportunityId)} disabled={isDeleting}>
                                    <span className="feather-icon dropdown-icon">
                                        <Trash2 />
                                    </span>
                                    <span>Deletar</span>
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                );
            })
        )
    };

    // Definir colunas
    const defaultColumns = [
        {
            accessor: "name",
            title: "Nome",
            sort: true,
        },
        {
            accessor: "stage",
            title: "Estágio",
            sort: true,
            cellFormatter: stageFormatter,
        },
        {
            accessor: "amount",
            title: "Valor",
            sort: true,
            cellFormatter: amountFormatter,
        },
        {
            accessor: "probability",
            title: "Probabilidade",
            sort: true,
            cellFormatter: probabilityFormatter,
        },
        {
            accessor: "accountName",
            title: "Conta",
            sort: true,
        },
        {
            accessor: "expectedCloseDate",
            title: "Data Prevista",
            sort: true,
        },
        {
            accessor: "actions",
            title: "",
            cellFormatter: actionFormatter,
        },
    ];

    const loadOpportunities = async () => {
        try {
            setLoading(true);
            
            const params = {};
            if (stageFilter) {
                params.where = JSON.stringify([{ type: 'equals', attribute: 'stage', value: stageFilter }]);
            }
            
            const response = await listOpportunities(params);
            if (response && response.success && response.data) {
                const formattedData = response.data.map(opp => {
                    // Formatar data prevista
                    let expectedCloseDateFormatted = '-';
                    if (opp.expectedCloseDate) {
                        const date = new Date(opp.expectedCloseDate);
                        expectedCloseDateFormatted = date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        });
                    }
                    
                    return {
                        id: opp.id,
                        name: opp.name || '-',
                        stage: opp.stage || 'Prospecting',
                        amount: opp.amount || 0,
                        amountCurrency: opp.amountCurrency || 'BRL',
                        probability: opp.probability || 0,
                        accountName: opp.accountName || '-',
                        contactName: opp.contactName || '-',
                        expectedCloseDate: expectedCloseDateFormatted,
                        expectedCloseDateRaw: opp.expectedCloseDate,
                        actions: [{ id: opp.id }]
                    };
                });
                setOpportunities(formattedData);
            } else {
                setOpportunities([]);
            }
        } catch (error) {
            console.error('Erro ao carregar oportunidades:', error);
            setOpportunities([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (opportunityId) => {
        router.push(`/apps/opportunities/${opportunityId}`);
    };

    const handleDelete = async (opportunityId) => {
        const opportunityName = opportunities.find(o => o.id === opportunityId)?.name || 'esta oportunidade';
        
        if (!window.confirm(`Tem certeza que deseja deletar "${opportunityName}"?\n\nEsta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            setDeletingId(opportunityId);
            const response = await deleteOpportunity(opportunityId);
            
            if (response && response.success) {
                await loadOpportunities();
                alert('Oportunidade deletada com sucesso!');
            } else {
                alert(response?.message || 'Erro ao deletar oportunidade');
            }
        } catch (error) {
            console.error('Erro ao deletar oportunidade:', error);
            alert(error?.message || 'Erro ao deletar oportunidade. Tente novamente.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleStageChange = async (opportunityId, newStage) => {
        const opportunityName = opportunities.find(o => o.id === opportunityId)?.name || 'esta oportunidade';
        const stageName = stageMap[newStage]?.label || newStage;
        
        if (!window.confirm(`Deseja mover "${opportunityName}" para o estágio "${stageName}"?`)) {
            return;
        }

        try {
            // Definir probabilidade padrão baseada no estágio
            const probabilityMap = {
                'Prospecting': 10,
                'Qualification': 25,
                'Proposal': 50,
                'Negotiation': 75,
                'Won': 100,
                'Lost': 0,
            };
            
            const response = await updateOpportunityStage(opportunityId, newStage, probabilityMap[newStage]);
            
            if (response && response.success) {
                await loadOpportunities();
                alert(`Oportunidade movida para "${stageName}" com sucesso!`);
            } else {
                alert(response?.message || 'Erro ao atualizar estágio');
            }
        } catch (error) {
            console.error('Erro ao atualizar estágio:', error);
            alert(error?.message || 'Erro ao atualizar estágio. Tente novamente.');
        }
    };

    const handleOpportunityCreated = () => {
        onHideCreateModal();
        loadOpportunities();
    };

    useEffect(() => {
        setColumns(defaultColumns);
        if (status === 'authenticated') {
            loadOpportunities();
        } else if (status === 'guest') {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, stageFilter, refreshTrigger]);

    // Calcular estatísticas
    const stats = useMemo(() => {
        const total = opportunities.length;
        const prospecting = opportunities.filter(o => o.stage === 'Prospecting').length;
        const qualification = opportunities.filter(o => o.stage === 'Qualification').length;
        const proposal = opportunities.filter(o => o.stage === 'Proposal').length;
        const negotiation = opportunities.filter(o => o.stage === 'Negotiation').length;
        const won = opportunities.filter(o => o.stage === 'Won').length;
        const lost = opportunities.filter(o => o.stage === 'Lost').length;
        const totalValue = opportunities.reduce((sum, o) => sum + (o.amount || 0), 0);
        const avgProbability = total > 0 ? Math.round(opportunities.reduce((sum, o) => sum + (o.probability || 0), 0) / total) : 0;
        
        return {
            total,
            prospecting,
            qualification,
            proposal,
            negotiation,
            won,
            lost,
            totalValue,
            avgProbability,
        };
    }, [opportunities]);

    // Filtrar oportunidades por busca
    const filteredOpportunities = useMemo(() => {
        if (!searchTerm) return opportunities;
        const search = searchTerm.toLowerCase();
        return opportunities.filter(opp => 
            opp.name?.toLowerCase().includes(search) ||
            opp.accountName?.toLowerCase().includes(search) ||
            opp.contactName?.toLowerCase().includes(search)
        );
    }, [opportunities, searchTerm]);

    return (
        <>
            <div className="contact-body">
                <SimpleBar className="nicescroll-bar">
                    <div className="contact-list-view">
                        {/* Cards de Estatísticas */}
                        <Row className="mb-4">
                            <Col md={3} sm={6} className="mb-3">
                                <Card className="card-border card-border-primary">
                                    <Card.Body>
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1">
                                                <span className="text-muted fs-7 d-block">Total de Oportunidades</span>
                                                <span className="fs-3 fw-bold">{stats.total}</span>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <div className="avatar avatar-sm avatar-primary">
                                                    <span className="initial-wrap">
                                                        <DollarSign size={20} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} sm={6} className="mb-3">
                                <Card className="card-border card-border-success">
                                    <Card.Body>
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1">
                                                <span className="text-muted fs-7 d-block">Valor Total</span>
                                                <span className="fs-3 fw-bold text-success">
                                                    {new Intl.NumberFormat('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    }).format(stats.totalValue)}
                                                </span>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <div className="avatar avatar-sm avatar-success">
                                                    <span className="initial-wrap">
                                                        <TrendingUp size={20} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} sm={6} className="mb-3">
                                <Card className="card-border card-border-success">
                                    <Card.Body>
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1">
                                                <span className="text-muted fs-7 d-block">Ganhas</span>
                                                <span className="fs-3 fw-bold text-success">{stats.won}</span>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <div className="avatar avatar-sm avatar-success">
                                                    <span className="initial-wrap">
                                                        <Award size={20} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3} sm={6} className="mb-3">
                                <Card className="card-border card-border-warning">
                                    <Card.Body>
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1">
                                                <span className="text-muted fs-7 d-block">Prob. Média</span>
                                                <span className="fs-3 fw-bold">{stats.avgProbability}%</span>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <div className="avatar avatar-sm avatar-warning">
                                                    <span className="initial-wrap">
                                                        <Target size={20} />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        {/* Busca */}
                        <Row className="mb-3">
                            <Col xs={12}>
                                <div className="contact-toolbar-right">
                                    <div className="dataTables_filter">
                                        <Form.Label>
                                            <Form.Control
                                                size="sm"
                                                type="search"
                                                placeholder="Buscar por nome, conta ou contato..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                        </Form.Label>
                                    </div>
                                </div>
                            </Col>
                        </Row>

                        {loading ? (
                            <div className="text-center py-5">
                                <p>Carregando oportunidades...</p>
                            </div>
                        ) : columns.length > 0 ? (
                            <HkDataTable
                                column={columns}
                                rowData={filteredOpportunities}
                                rowsPerPage={10}
                                rowSelection={true}
                                searchQuery={searchTerm}
                                classes="nowrap w-100 mb-5"
                                responsive
                            />
                        ) : (
                            <div className="text-center py-5">
                                <p>Nenhuma oportunidade encontrada</p>
                            </div>
                        )}
                    </div>
                </SimpleBar>
            </div>

            {/* Modal de Criação */}
            <CreateOpportunityModal 
                show={showCreateModal}
                onHide={onHideCreateModal}
                onSuccess={handleOpportunityCreated}
            />
        </>
    )
}

export default OpportunitiesAppBody

