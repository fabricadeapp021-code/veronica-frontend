import Link from 'next/link';
import { Button, Nav } from 'react-bootstrap';
import { Archive, Book, Download, Inbox, Settings, Target, TrendingUp, FileText, Award, Trash } from 'react-feather';
import SimpleBar from 'simplebar-react';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { Speakerphone, CurrencyDollar } from 'tabler-icons-react';

const OpportunityAppSidebar = ({ onFilterChange, onShowCreateModal }) => {
    const pathname = usePathname();
    const primaryMenu = [
        {
            label: 'Campanhas',
            path: '/apps/campaigns/list',
            activePrefix: '/apps/campaigns',
            icon: Speakerphone,
        },
        {
            label: 'Leads',
            path: '/apps/leads/list',
            activePrefix: '/apps/leads',
            icon: Target,
        },
        {
            label: 'Oportunidades',
            path: '/apps/opportunities/list',
            activePrefix: '/apps/opportunities',
            icon: CurrencyDollar,
        },
    ];
    return (
        <>
            <Nav className="contactapp-sidebar">
                <SimpleBar className="nicescroll-bar">
                    <div className="menu-content-wrap">
                        {/*
                        <Button 
                            variant="primary" 
                            className="btn-rounded btn-block mb-4" 
                            onClick={onShowCreateModal}
                        >
                            Nova Oportunidade
                        </Button>
                        */}
                        <div className="menu-group">
                            <Nav className="nav-light navbar-nav flex-column">
                                {primaryMenu.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname?.startsWith(item.activePrefix);
                                    return (
                                        <Nav.Item key={item.path}>
                                            <Nav.Link
                                                as={Link}
                                                href={item.path}
                                                className={classNames({ active: isActive })}
                                            >
                                                <span className="nav-icon-wrap">
                                                    <span className="feather-icon">
                                                        <Icon size={18} />
                                                    </span>
                                                </span>
                                                <span className="nav-link-text">{item.label}</span>
                                            </Nav.Link>
                                        </Nav.Item>
                                    );
                                })}
                            </Nav>
                        </div>
                        <div className="separator separator-light" />
                        <div className="menu-group">
                            <Nav className="nav-light navbar-nav flex-column">
                                <Nav.Item>
                                    <Nav.Link 
                                        active 
                                        as="button"
                                        onClick={() => onFilterChange('')}
                                    >
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <Inbox />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Todas Oportunidades</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link 
                                        as="button"
                                        onClick={() => onFilterChange('Prospecting')}
                                    >
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <Target />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Prospecção</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link 
                                        as="button"
                                        onClick={() => onFilterChange('Qualification')}
                                    >
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <TrendingUp />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Qualificação</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link 
                                        as="button"
                                        onClick={() => onFilterChange('Proposal')}
                                    >
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <FileText />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Proposta</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link 
                                        as="button"
                                        onClick={() => onFilterChange('Negotiation')}
                                    >
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <TrendingUp />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Negociação</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link 
                                        as="button"
                                        onClick={() => onFilterChange('Won')}
                                    >
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <Award />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Ganhas</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link 
                                        as="button"
                                        onClick={() => onFilterChange('Lost')}
                                    >
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <Trash />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Perdidas</span>
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </div>
                        {/*
                        <div className="menu-group">
                            <Nav className="nav-light navbar-nav flex-column">
                                <Nav.Item>
                                    <Nav.Link as={Link} href="#">
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <Download />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Exportar</span>
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </div>
                        */}
                    </div>
                </SimpleBar>
                <div className="contactapp-fixednav">
                    <div className="hk-toolbar">
                        <Nav className="nav-light">
                            <Nav.Item className="nav-link">
                                <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                    <HkTooltip id="tooltip2" placement="top" title="Settings" >
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <Settings />
                                            </span>
                                        </span>
                                    </HkTooltip>
                                </Button>
                            </Nav.Item>
                            <Nav.Item className="nav-link">
                                <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                    <HkTooltip id="tooltip3" placement="top" title="Archive" >
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <Archive />
                                            </span>
                                        </span>
                                    </HkTooltip>
                                </Button>
                            </Nav.Item>
                            <Nav.Item className="nav-link">
                                <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                    <HkTooltip id="tooltip2" placement="top" title="Help" >
                                        <span className="icon">
                                            <span className="feather-icon">
                                                <Book />
                                            </span>
                                        </span>
                                    </HkTooltip>
                                </Button>
                            </Nav.Item>
                        </Nav>
                    </div>
                </div>
            </Nav>
        </>
    )
}

export default OpportunityAppSidebar

