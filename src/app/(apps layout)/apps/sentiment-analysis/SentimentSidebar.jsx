'use client'
import Link from 'next/link';
import { Button, Nav } from 'react-bootstrap';
import * as Icons from 'react-feather';
import SimpleBar from 'simplebar-react';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { ChartBar, AlertTriangle, ChartPie } from 'tabler-icons-react';

const SentimentSidebar = () => {
    const pathname = usePathname();
    const citizenMenu = [
        {
            label: 'An\u00E1lise de Sentimento',
            path: '/apps/sentiment-analysis',
            activePrefix: '/apps/sentiment-analysis',
            icon: ChartBar,
        },
        {
            label: 'Monitoramento de Crise',
            path: '/apps/crisis-monitoring',
            activePrefix: '/apps/crisis-monitoring',
            icon: AlertTriangle,
        },
        {
            label: 'Inten\u00E7\u00E3o de Voto',
            path: '/apps/vote-survey',
            activePrefix: '/apps/vote-survey',
            icon: ChartPie,
        },
        {
            label: 'Monitoramento Social',
            path: '/apps/social-monitoring',
            activePrefix: '/apps/social-monitoring',
            icon: Icons.MessageCircle,
        },
    ];

    return (
        <div className="fmapp-sidebar">
            <SimpleBar className="nicescroll-bar">
                <div className="menu-content-wrap">
                    {/* <div className="fmapp-sidebar-header">
                        <div className="media">
                            <div className="media-head">
                                <div className="avatar avatar-icon avatar-primary avatar-rounded">
                                    <span className="initial-wrap">
                                        <Icons.BarChart size={24} />
                                    </span>
                                </div>
                            </div>
                            <div className="media-body">
                                <div className="text-dark fw-medium">An\u00E1lise de Sentimento</div>
                                <div className="fs-7 text-muted">Em tempo real</div>
                            </div>
                        </div>
                    </div> */}

                    <div className="menu-group ">
                        <ul className="nav nav-light navbar-nav flex-column">
                            {citizenMenu.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname?.startsWith(item.activePrefix);
                                return (
                                    <li key={item.path} className={classNames('nav-item', { active: isActive })}>
                                        <Link href={item.path} className="nav-link">
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon">
                                                    <Icon size={18} />
                                                </span>
                                            </span>
                                            <span className="nav-link-text">{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="menu-group">
                        <ul className="nav nav-light navbar-nav flex-column">
                            <li className="nav-item active">
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Icons.Activity size={18} />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Dashboard</span>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Icons.Smile size={18} />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Positivos</span>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Icons.Meh size={18} />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Neutros</span>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Icons.Frown size={18} />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">Negativos</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="px-3">
                        <h6 className="text-uppercase text-muted fs-7 fw-medium mb-3">
                            Categorias
                        </h6>
                        <Nav className="nav nav-sm nav-light">
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap"><Icons.Heart size={14} /></span>
                                    <span className="nav-link-text">{'Sa\u00FAde'}</span>
                                </a>
                            </Nav.Item>
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap"><Icons.BookOpen size={14} /></span>
                                    <span className="nav-link-text">{'Educa\u00E7\u00E3o'}</span>
                                </a>
                            </Nav.Item>
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap"><Icons.Shield size={14} /></span>
                                    <span className="nav-link-text">{'Seguran\u00E7a'}</span>
                                </a>
                            </Nav.Item>
                            <Nav.Item>
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap"><Icons.Tool size={14} /></span>
                                    <span className="nav-link-text">Infraestrutura</span>
                                </a>
                            </Nav.Item>
                        </Nav>
                    </div>

                    {/*
                    <div className="px-3">
                        <h6 className="text-uppercase text-muted fs-7 fw-medium mb-3">
                            Informa\u00E7\u00F5es
                        </h6>
                        <div className="card card-border border-primary mb-3">
                            <div className="card-body py-3">
                                <div className="media">
                                    <div className="media-head me-3">
                                        <div className="avatar avatar-icon avatar-sm avatar-primary avatar-rounded">
                                            <span className="initial-wrap">
                                                <Icons.Info size={16} />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="media-body">
                                        <div className="fs-7 fw-medium mb-1">Monitoramento Inteligente</div>
                                        <div className="fs-8 text-muted">
                                            IA analisa mensagens em tempo real detectando sentimentos e emo\u00E7\u00F5es.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    */}
                </div>
            </SimpleBar>

            {/* <div className="fmapp-storage">
                <p className="p-sm fw-medium mb-2">Estat\u00EDsticas do Sistema</p>
                <div className="d-flex justify-content-between mb-2">
                    <small className="text-muted">Usu\u00E1rios Ativos:</small>
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
                                <HkTooltip id="tooltip-sent-settings" placement="top" title="Configuracoes" >
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
                                <HkTooltip id="tooltip-sent-refresh" placement="top" title="Atualizar" >
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
                                <HkTooltip id="tooltip-sent-help" placement="top" title="Ajuda" >
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

export default SentimentSidebar;

