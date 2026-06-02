'use client';
import React from 'react';
import { Button, Nav } from 'react-bootstrap';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import SimpleBar from 'simplebar-react';
import * as Icons from 'react-feather';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';

const FinancialSidebar = () => {
    const pathname = usePathname();
    const normalizedPathname = pathname
        ? pathname.split('?')[0].split('#')[0].replace(/\/+$/, '')
        : '';

    const menuItems = [
        {
            path: '/apps/financial/overview',
            icon: <Icons.PieChart size={18} />,
            label: 'Visão Geral',
            badge: null
        },
        {
            path: '/apps/financial/expenses',
            icon: <Icons.TrendingDown size={18} />,
            label: 'Despesas',
            badge: null
        },
        {
            path: '/apps/financial/revenues',
            icon: <Icons.TrendingUp size={18} />,
            label: 'Receitas',
            badge: null
        },
        {
            path: '/apps/financial/invoices',
            icon: <Icons.FileText size={18} />,
            label: 'Notas Fiscais',
            badge: null
        },
        {
            path: '/apps/financial/tse-reports',
            icon: <Icons.BarChart2 size={18} />,
            label: 'Relatórios',
            badge: null
        }
    ];

    return (
        <div className="fmapp-sidebar">
            <SimpleBar className="nicescroll-bar">
                <div className="menu-content-wrap">
                    {/* <div className="fmapp-sidebar-header">
                        <div className="media">
                            <div className="media-head">
                                <div className="avatar avatar-icon avatar-warning avatar-rounded">
                                    <span className="initial-wrap">
                                        <Icons.DollarSign size={24} />
                                    </span>
                                </div>
                            </div>
                            <div className="media-body">
                                <div className="text-dark fw-medium">Financeiro</div>
                                <div className="fs-7 text-muted">Gestão e compliance TSE</div>
                            </div>
                        </div>
                    </div> */}

                    <div className="menu-group">
                        <ul className="nav nav-light navbar-nav flex-column">
                            {menuItems.map((item, index) => {
                                const normalizedItemPath = item.path.replace(/\/+$/, '');
                                const isRootFinancial = normalizedPathname === '/apps/financial';
                                const isActive =
                                    (isRootFinancial && item.path === '/apps/financial/overview') ||
                                    normalizedPathname === normalizedItemPath ||
                                    normalizedPathname.startsWith(`${normalizedItemPath}/`);
                                return (
                                    <li key={index} className={`nav-item ${isActive ? 'active' : ''}`}>
                                        <Link href={item.path} className="nav-link">
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon">
                                                    {item.icon}
                                                </span>
                                            </span>
                                            <span className="nav-link-text">{item.label}</span>
                                            {item.badge && (
                                                <span className={`badge badge-sm badge-soft-${item.badge.variant} ms-auto`}>
                                                    {item.badge.text}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="menu-group">
                        <p className="menu-title text-muted mb-2">Ações Rápidas</p>
                        <ul className="nav nav-light navbar-nav flex-column">
                            <li className="nav-item">
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Icons.Download size={18} />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Exportar Dados</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </SimpleBar>

            {/* <div className="fmapp-storage">
                <p className="p-sm fw-medium mb-2">Estatísticas do Sistema</p>
                <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted">Usuários Ativos:</small>
                    <small className="fw-medium">45</small>
                </div>
                <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted">Admins:</small>
                    <small className="fw-medium">8</small>
                </div>
                <div className="d-flex justify-content-between">
                    <small className="text-muted">Employees:</small>
                    <small className="fw-medium">37</small>
                </div>
            </div> */}

            <div className="fmapp-fixednav">
                <div className="hk-toolbar">
                    <Nav className="nav-light">
                        <Nav.Item className="nav-link">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                <HkTooltip id="tooltip-fin-settings" placement="top" title="Configurações" >
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <Icons.Settings />
                                        </span>
                                    </span>
                                </HkTooltip>
                            </Button>
                        </Nav.Item>
                        <Nav.Item className="nav-link">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                <HkTooltip id="tooltip-fin-refresh" placement="top" title="Atualizar" >
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <Icons.RefreshCw />
                                        </span>
                                    </span>
                                </HkTooltip>
                            </Button>
                        </Nav.Item>
                        <Nav.Item className="nav-link">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                <HkTooltip id="tooltip-fin-help" placement="top" title="Ajuda" >
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <Icons.HelpCircle />
                                        </span>
                                    </span>
                                </HkTooltip>
                            </Button>
                        </Nav.Item>
                    </Nav>
                </div>
            </div>
        </div>
    );
};

export default FinancialSidebar;
