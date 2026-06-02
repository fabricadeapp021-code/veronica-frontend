'use client'
import Link from 'next/link';
import { Button, Nav } from 'react-bootstrap';
import * as Icons from 'react-feather';
import SimpleBar from 'simplebar-react';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { ChartBar, AlertTriangle, ChartPie } from 'tabler-icons-react';

const SocialMonitoringSidebar = () => {
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
                                        <span className="feather-icon"><Icons.Activity size={18} /></span>
                                    </span>
                                    <span className="nav-link-text">Dashboard</span>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon"><Icons.Users size={18} /></span>
                                    </span>
                                    <span className="nav-link-text">Perfis</span>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon"><Icons.Bell size={18} /></span>
                                    </span>
                                    <span className="nav-link-text">Alertas</span>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#">
                                    <span className="nav-icon-wrap">
                                        <span className="feather-icon"><Icons.Rss size={18} /></span>
                                    </span>
                                    <span className="nav-link-text">Feed</span>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </SimpleBar>

            <div className="fmapp-fixednav">
                <div className="hk-toolbar">
                    <Nav className="nav-light">
                        <Nav.Item className="nav-link">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                <HkTooltip id="tooltip-social-settings" placement="top" title={'Configura\u00E7\u00F5es'}>
                                    <span className="icon">
                                        <span className="feather-icon"><Icons.Settings /></span>
                                    </span>
                                </HkTooltip>
                            </Button>
                        </Nav.Item>
                        <Nav.Item className="nav-link">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                <HkTooltip id="tooltip-social-refresh" placement="top" title="Atualizar">
                                    <span className="icon">
                                        <span className="feather-icon"><Icons.RefreshCw /></span>
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

export default SocialMonitoringSidebar;
