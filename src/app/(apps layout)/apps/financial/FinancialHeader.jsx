'use client';
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { ChevronDown, Download, FileText, Upload, Menu } from 'react-feather';

const FinancialHeader = ({ showSidebar, toggleSidebar }) => {
    return (
        <header className="fm-header">
            <div className="d-flex align-items-center">
                <a className="fmapp-sidebar-toggle" onClick={toggleSidebar} style={{ cursor: 'pointer' }}>
                    <span className="feather-icon"><Menu /></span>
                </a>
                <h5 className="mb-0 ms-3">💰 Gestão Financeira</h5>
            </div>
            <div className="d-flex align-items-center fm-header-right">
                <Dropdown className="d-inline-block">
                    <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover no-caret">
                        <span className="icon">
                            <FileText size={18} />
                        </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item>
                            <Download size={16} className="me-2" />
                            Exportar Relatório
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <Upload size={16} className="me-2" />
                            Importar Dados
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item>
                            <FileText size={16} className="me-2" />
                            Gerar Prestação TSE
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </header>
    );
};

export default FinancialHeader;
