'use client'
import Link from 'next/link';
import { Button, Nav } from 'react-bootstrap';
import * as Icons from 'react-feather';
import SimpleBar from 'simplebar-react';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { ChartBar, AlertTriangle, ChartPie } from 'tabler-icons-react';

const VoteSurveySidebar = () => {
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
                    <div className="menu-group">
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
                                            <Icons.BarChart size={18} />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">{'1\u00BA Turno'}</span>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Icons.TrendingUp size={18} />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">{'2\u00BA Turno'}</span>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon">
                                            <Icons.Users size={18} />
                                        </span>
                                    </span>
                                    <span className="nav-link-text">{'Demogr\u00E1fico'}</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="separator separator-light mt-3 mb-3" />

                    <div className="px-3">
                        <h6 className="text-uppercase text-muted fs-7 fw-medium mb-3">Candidatos</h6>
                        <Nav className="nav nav-sm nav-light">
                            <Nav.Item><a className="nav-link" href="#"><span className="nav-icon-wrap">15</span><span className="nav-link-text">{'Jo\u00E3o Silva'}</span></a></Nav.Item>
                            <Nav.Item><a className="nav-link" href="#"><span className="nav-icon-wrap">45</span><span className="nav-link-text">Maria Santos</span></a></Nav.Item>
                            <Nav.Item><a className="nav-link" href="#"><span className="nav-icon-wrap">13</span><span className="nav-link-text">Pedro Costa</span></a></Nav.Item>
                            <Nav.Item><a className="nav-link" href="#"><span className="nav-icon-wrap">12</span><span className="nav-link-text">Ana Oliveira</span></a></Nav.Item>
                        </Nav>
                    </div>
                </div>
            </SimpleBar>

            <div className="fmapp-fixednav">
                <div className="hk-toolbar">
                    <Nav className="nav-light">
                        <Nav.Item className="nav-link">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                <HkTooltip id="tooltip-vote-settings" placement="top" title={'Configura\u00E7\u00F5es'} >
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
                                <HkTooltip id="tooltip-vote-refresh" placement="top" title="Atualizar" >
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
                                <HkTooltip id="tooltip-vote-help" placement="top" title="Ajuda" >
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

export default VoteSurveySidebar;

