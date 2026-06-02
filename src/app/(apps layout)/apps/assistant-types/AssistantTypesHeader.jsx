'use client'
import { Button, Dropdown, Form } from 'react-bootstrap';
import * as Icons from 'react-feather';

const AssistantTypesHeader = ({ 
    onNewType, 
    onSearch,
    showSidebar = true,
    toggleSidebar 
}) => {
    return (
        <header className="fm-header">
            <div className="d-flex align-items-center">
                <a 
                    className="fmapp-sidebar-toggle" 
                    onClick={toggleSidebar}
                    style={{ cursor: 'pointer' }}
                >
                    <span className="feather-icon">
                        {showSidebar ? <Icons.Menu /> : <Icons.Menu />}
                    </span>
                </a>
                <h5 className="mb-0 ms-3">Tipos de Assistentes</h5>
            </div>

            <div className="d-flex align-items-center fm-header-right">
                {/* Busca */}
                <Form className="d-none d-md-block me-3">
                    <Form.Group className="mb-0">
                        <div className="input-group">
                            <span className="input-group-text">
                                <Icons.Search size={16} />
                            </span>
                            <Form.Control
                                type="text"
                                placeholder="Buscar tipos..."
                                onChange={(e) => onSearch && onSearch(e.target.value)}
                            />
                        </div>
                    </Form.Group>
                </Form>

                {/* Botão Novo Tipo */}
                <Button 
                    variant="primary"
                    size="sm"
                    onClick={onNewType}
                    className="d-flex align-items-center"
                >
                    <Icons.Plus size={16} className="me-2" />
                    <span className="d-none d-sm-inline">Novo Tipo</span>
                </Button>

                {/* Dropdown de Opções */}
                <Dropdown className="ms-2">
                    <Dropdown.Toggle 
                        variant="flush-dark" 
                        className="btn-icon btn-rounded flush-soft-hover no-caret"
                    >
                        <Icons.MoreVertical size={20} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item onClick={() => window.location.reload()}>
                            <Icons.RefreshCw size={16} className="me-2" />
                            Atualizar
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item>
                            <Icons.HelpCircle size={16} className="me-2" />
                            Ajuda
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </header>
    );
};

export default AssistantTypesHeader;

