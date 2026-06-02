import Link from 'next/link';
import { Button, Nav } from 'react-bootstrap';
import { Archive, Award, Book, Download, Heart, Inbox, MessageCircle, Settings, Slash, Star, Upload, UserPlus, UserX } from 'react-feather';
import SimpleBar from 'simplebar-react';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { Speakerphone, Target, CurrencyDollar } from 'tabler-icons-react';

const LeadAppSidebar = () => {
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
            label: 'Gestão Financeira',
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
                            as={Link}
                            href="/apps/leads/create"
                            variant="primary"
                            className="btn-rounded btn-block mb-4"
                        >
                            Novo Lead
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
                                    <Nav.Link active as={Link} href="/apps/leads/list">
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <Inbox />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Todos os Leads</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} href="#">
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <UserPlus />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Novos</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} href="#">
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <MessageCircle />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Abordados</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} href="#">
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <Heart />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Engajados</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} href="#">
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <Star />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Prioritários</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} href="#">
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <UserX />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Fora do Perfil</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} href="#">
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <Award />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Convertidos</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} href="#">
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <Slash />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Encerrados</span>
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
                                                <Upload />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Exportar</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link as={Link} href="#">
                                        <span className="nav-icon-wrap">
                                            <span className="feather-icon">
                                                <Download />
                                            </span>
                                        </span>
                                        <span className="nav-link-text">Importar</span>
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

export default LeadAppSidebar

