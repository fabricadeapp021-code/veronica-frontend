'use client'
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Nav, Tab, Spinner, Alert, Button, Dropdown, Badge } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import HkDataTable from '@/components/@hk-data-table';
import * as Icons from 'react-feather';
import assistantTypesAPI, { AVAILABLE_TOOLS } from '@/lib/api/services/assistantTypes';

// Helper: Formatar data
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Helper: Traduzir tipo de webhook
const translateWebhookType = (type) => {
    const translations = {
        'unique': 'Único',
        'multiple': 'Múltiplo'
    };
    return translations[type] || type;
};

// Helper: Traduzir status
const translateStatus = (status) => {
    const translations = {
        'active': 'Ativo',
        'inactive': 'Inativo'
    };
    return translations[status] || status;
};

// Helper: Obter nome da ferramenta
const getToolName = (toolId) => {
    const tool = AVAILABLE_TOOLS.find(t => t.id === toolId);
    return tool ? `${tool.icon} ${tool.name}` : toolId;
};

const AssistantTypesList = forwardRef(({ onTypeSelect, onEditClick }, ref) => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [deletingId, setDeletingId] = useState(null);

    // Carregar tipos
    const loadTypes = async (filters = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await assistantTypesAPI.list(filters);
            
            console.log('📊 Tipos de assistentes recebidos:', response);
            
            setTypes(response.data || []);
        } catch (err) {
            console.error('Erro ao carregar tipos de assistentes:', err);
            setError('Erro ao carregar tipos de assistentes. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Expor métodos reload e search para o componente pai
    useImperativeHandle(ref, () => ({
        reload: () => {
            loadTypes();
        },
        search: (query) => {
            loadTypes({ search: query });
        }
    }));

    // Carregar ao montar
    useEffect(() => {
        loadTypes();
    }, []);

    // Filtrar tipos por tab
    const getFilteredTypes = () => {
        if (activeTab === 'active') {
            return types.filter(type => type.status === 'active');
        } else if (activeTab === 'inactive') {
            return types.filter(type => type.status === 'inactive');
        }
        return types;
    };

    const filteredTypes = getFilteredTypes();

    // Função para deletar tipo
    const handleDelete = async (typeId, typeName) => {
        const confirmDelete = window.confirm(
            `Tem certeza que deseja excluir o tipo "${typeName}"?\n\nEsta ação não pode ser desfeita.`
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setDeletingId(typeId);
            await assistantTypesAPI.delete(typeId);
            
            // Recarregar lista
            await loadTypes();
            
            // Mostrar mensagem de sucesso
            alert('Tipo de assistente excluído com sucesso!');
        } catch (err) {
            console.error('Erro ao excluir tipo:', err);
            setError(err.message || 'Erro ao excluir tipo. Tente novamente.');
        } finally {
            setDeletingId(null);
        }
    };

    // Função para duplicar tipo
    const handleDuplicate = async (typeId, typeName) => {
        const confirmDuplicate = window.confirm(
            `Deseja duplicar o tipo "${typeName}"?`
        );

        if (!confirmDuplicate) {
            return;
        }

        try {
            await assistantTypesAPI.duplicate(typeId);
            
            // Recarregar lista
            await loadTypes();
            
            // Mostrar mensagem de sucesso
            alert('Tipo de assistente duplicado com sucesso!');
        } catch (err) {
            console.error('Erro ao duplicar tipo:', err);
            setError(err.message || 'Erro ao duplicar tipo. Tente novamente.');
        }
    };

    // Função para alternar status
    const handleToggleStatus = async (typeId, currentStatus) => {
        try {
            await assistantTypesAPI.toggleStatus(typeId);
            
            // Recarregar lista
            await loadTypes();
            
            const newStatus = currentStatus === 'active' ? 'inativo' : 'ativo';
            alert(`Tipo ${newStatus} com sucesso!`);
        } catch (err) {
            console.error('Erro ao alterar status:', err);
            setError(err.message || 'Erro ao alterar status. Tente novamente.');
        }
    };

    // Colunas da tabela
    const columns = [
        {
            Header: 'Nome',
            accessor: 'name',
            cellFormatter: (value, row) => {
                return (
                    <div 
                        className="d-flex align-items-center cursor-pointer"
                        onClick={() => {
                            if (onTypeSelect) onTypeSelect(row);
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="avatar avatar-icon avatar-xs avatar-soft-primary">
                            <span className="initial-wrap">
                                <Icons.Cpu size={16} />
                            </span>
                        </div>
                        <div className="ms-2">
                            <div className="fw-medium">{String(value || '')}</div>
                            {row.description && (
                                <small className="text-muted">{String(row.description.substring(0, 50) + (row.description.length > 50 ? '...' : ''))}</small>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            Header: 'Ferramentas',
            accessor: 'tools',
            cellFormatter: (value) => {
                if (!value || value.length === 0) return '-';
                
                return (
                    <div className="d-flex flex-wrap gap-1">
                        {value.slice(0, 3).map((toolId, idx) => {
                            const tool = AVAILABLE_TOOLS.find(t => t.id === toolId);
                            return tool ? (
                                <Badge 
                                    key={idx} 
                                    bg="light" 
                                    text="dark"
                                    className="border"
                                    title={tool.name}
                                >
                                    {tool.icon}
                                </Badge>
                            ) : null;
                        })}
                        {value.length > 3 && (
                            <Badge bg="light" text="dark" className="border">
                                +{value.length - 3}
                            </Badge>
                        )}
                    </div>
                );
            }
        },
        {
            Header: 'Tipo de Webhook',
            accessor: 'webhookType',
            cellFormatter: (value) => {
                const color = value === 'multiple' ? 'info' : 'secondary';
                return (
                    <span className={`badge badge-soft-${color}`}>
                        {String(translateWebhookType(value))}
                    </span>
                );
            }
        },
        {
            Header: 'Status',
            accessor: 'status',
            cellFormatter: (value) => {
                const statusText = translateStatus(value);
                const statusColor = value === 'active' ? 'success' : 'secondary';
                return (
                    <span className={`badge badge-soft-${statusColor}`}>
                        {String(statusText)}
                    </span>
                );
            }
        },
        {
            Header: 'Última Atualização',
            accessor: 'updatedAt',
            cellFormatter: (value) => <span className="text-muted small">{String(formatDate(value) || '')}</span>
        },
        {
            Header: 'Ações',
            accessor: 'id',
            cellFormatter: (value, row) => {
                return (
                    <Dropdown className="d-inline-block">
                        <Dropdown.Toggle 
                            variant="flush-dark" 
                            className="btn-icon btn-sm btn-rounded flush-soft-hover no-caret"
                            size="sm"
                            disabled={deletingId === value}
                        >
                            <Icons.MoreVertical size={16} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu align="end">
                            <Dropdown.Item onClick={() => onEditClick && onEditClick(row)}>
                                <Icons.Edit size={16} className="me-2" />
                                Editar
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleDuplicate(value, row.name)}>
                                <Icons.Copy size={16} className="me-2" />
                                Duplicar
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => handleToggleStatus(value, row.status)}>
                                {row.status === 'active' ? (
                                    <>
                                        <Icons.XCircle size={16} className="me-2" />
                                        Desativar
                                    </>
                                ) : (
                                    <>
                                        <Icons.CheckCircle size={16} className="me-2" />
                                        Ativar
                                    </>
                                )}
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item 
                                onClick={() => handleDelete(value, row.name)} 
                                className="text-danger"
                                disabled={deletingId === value}
                            >
                                <Icons.Trash2 size={16} className="me-2" />
                                {deletingId === value ? 'Deletando...' : 'Excluir'}
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                );
            }
        }
    ];

    return (
        <div className="fm-body">
            <SimpleBar className="nicescroll-bar">
                <div className="file-list-view">
                    <Tab.Container 
                        activeKey={activeTab} 
                        onSelect={(k) => setActiveTab(k)}
                    >
                        <Nav as="ul" variant="tabs" className="nav-line nav-icon nav-light">
                            <Nav.Item as="li">
                                <Nav.Link eventKey="all">
                                    <span className="nav-link-text">
                                        Todos ({types.length})
                                    </span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item as="li">
                                <Nav.Link eventKey="active">
                                    <span className="nav-link-text">
                                        Ativos ({types.filter(t => t.status === 'active').length})
                                    </span>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item as="li">
                                <Nav.Link eventKey="inactive">
                                    <span className="nav-link-text">
                                        Inativos ({types.filter(t => t.status === 'inactive').length})
                                    </span>
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                        
                        <Tab.Content>
                            {/* Loading */}
                            {loading && (
                                <div className="text-center py-5">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="text-muted mt-3">Carregando tipos de assistentes...</p>
                                </div>
                            )}
                            
                            {/* Error */}
                            {error && !loading && (
                                <Alert variant="danger" className="m-4">
                                    {error}
                                    <button 
                                        className="btn btn-sm btn-danger ms-3"
                                        onClick={() => loadTypes()}
                                    >
                                        Tentar Novamente
                                    </button>
                                </Alert>
                            )}
                            
                            {/* Tabela de Tipos */}
                            {!loading && !error && filteredTypes.length > 0 && (
                                <Tab.Pane eventKey={activeTab}>
                                    <HkDataTable
                                        column={columns}
                                        rowData={filteredTypes}
                                        rowSelection={false}
                                        markStarred={false}
                                        classes="nowrap w-100 mb-5"
                                        responsive
                                        rowsPerPage={10}
                                    />
                                </Tab.Pane>
                            )}
                            
                            {/* Empty State */}
                            {!loading && !error && filteredTypes.length === 0 && (
                                <div className="text-center py-5">
                                    <Icons.Inbox size={48} className="text-muted mb-3" />
                                    <p className="text-muted">
                                        {activeTab === 'active' 
                                            ? 'Nenhum tipo ativo' 
                                            : activeTab === 'inactive'
                                            ? 'Nenhum tipo inativo'
                                            : 'Nenhum tipo de assistente encontrado'
                                        }
                                    </p>
                                    {activeTab === 'all' && (
                                        <p className="text-muted small">
                                            Clique no botão "Novo Tipo" para adicionar um tipo de assistente
                                        </p>
                                    )}
                                </div>
                            )}
                        </Tab.Content>
                    </Tab.Container>
                </div>
            </SimpleBar>
        </div>
    );
});

AssistantTypesList.displayName = 'AssistantTypesList';

export default AssistantTypesList;

