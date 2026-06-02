import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SimpleBar from 'simplebar-react';
import { getBillingBalance } from '@/lib/api/services/billing';
import { AlignLeft, Bell, Calendar, CheckSquare, Clock, CreditCard, Inbox, Moon, Plus, Search, Settings, Sun, Tag, Zap, Layers } from 'react-feather';
import { CreditCard as TablerCreditCard, MessageCircle } from 'tabler-icons-react';
import { Button, Container, Dropdown, Form, InputGroup, Nav, Navbar, Spinner } from 'react-bootstrap';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useColorMode } from '@/hooks/useColorMode';
import FleetAiPanel from '@/app/(apps layout)/apps/fleet/_components/FleetAiPanel';
import { createWizard } from '@/lib/api/services/tripWizard';

//Images
import avatar2 from '@/assets/img/avatar2.jpg';
import avatar3 from '@/assets/img/avatar3.jpg';
import avatar4 from '@/assets/img/avatar4.jpg';
import avatar10 from '@/assets/img/avatar10.jpg';
import avatar12 from '@/assets/img/avatar12.jpg';

const normalizeCreditBalance = (value) => {
    const nextValue = Number(value ?? 0);
    return Number.isFinite(nextValue) ? nextValue : 0;
};


const TopNav = () => {

    const { states, dispatch } = useGlobalStateContext();
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchValue, setSearchValue] = useState("")
    const [creditBalance, setCreditBalance] = useState(0);
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [wizardCreating, setWizardCreating] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { isDark, toggle: toggleColorMode } = useColorMode();

    // Fleet pages have their own AI panel — don't render a second one
    const isFleet = pathname?.startsWith('/apps/fleet');

    useEffect(() => {
        getBillingBalance()
            .then(res => setCreditBalance(normalizeCreditBalance(res?.data?.balance)))
            .catch(() => setCreditBalance(0));
        // Atualiza a cada 5 minutos
        const t = setInterval(() => {
            getBillingBalance()
                .then(res => setCreditBalance(normalizeCreditBalance(res?.data?.balance)))
                .catch(() => setCreditBalance(currentBalance => currentBalance));
        }, 5 * 60 * 1000);
        return () => clearInterval(t);
    }, []);

    const CloseSearchInput = () => {
        setSearchValue("");
        setShowDropdown(false);
    }

    const displayName = user?.name || user?.email || 'Usuário';
    const displayEmail = user?.email || '—';
    const displayInitials = String(displayName)
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || 'U';

    const handleNewWizard = async () => {
        if (wizardCreating) return;
        setWizardCreating(true);
        try {
            const res = await createWizard();
            const id = res?.data?._id ?? res?._id;
            if (id) router.push(`/apps/fleet/trip-wizard/${id}`);
        } catch (e) {
            console.error('Erro ao criar wizard:', e);
        } finally {
            setWizardCreating(false);
        }
    };

    const handleSignOut = async (e) => {
        e?.preventDefault?.();
        await logout();
        router.replace('/auth/login');
    };

    const pageVariants = {
        initial: {
            opacity: 0,
            y: 10
        },
        open: {
            opacity: 1,
            y: 0
        },
        close: {
            opacity: 0,
            y: 10
        }
    };



    return (
        <>
        <Navbar expand="xl" className="hk-navbar navbar-light fixed-top" >
            <Container fluid>
                {/* Start Nav */}
                <div className="nav-start-wrap">
                    <Button variant="flush-dark" onClick={() => dispatch({ type: 'sidebar_toggle', sidebarCollapse: !states.sidebarCollapse })} className="btn-icon btn-rounded flush-soft-hover navbar-toggle d-xl-none">
                        <span className="icon">
                            <span className="feather-icon"><AlignLeft /></span>
                        </span>
                    </Button>
                    {/* Search */}
                    <Dropdown as={Form} className="navbar-search" show={showDropdown} autoClose={() => setShowDropdown(!showDropdown)} >
                        <Dropdown.Toggle as="div" className="no-caret bg-transparent">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover  d-xl-none" onClick={() => setShowDropdown(!showDropdown)} >
                                <span className="icon">
                                    <span className="feather-icon"><Search /></span>
                                </span>
                            </Button>
                            <div className="d-xl-flex d-none align-items-center gap-2">
                                <HkBadge
                                    pill
                                    className="px-3 py-2 fw-bold fs-6"
                                    style={isDark
                                        ? {
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            color: '#ffffff',
                                            border: '1px solid rgba(59,130,246,0.5)',
                                            boxShadow: '0 4px 14px -4px rgba(59,130,246,0.55), inset 0 1px 0 rgba(255,255,255,0.15)'
                                          }
                                        : {
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            color: '#ffffff',
                                            border: '1px solid transparent',
                                            boxShadow: '0 4px 12px -4px rgba(59,130,246,0.45), inset 0 1px 0 rgba(255,255,255,0.25)'
                                          }
                                    }
                                >
                                    {'Vers\u00e3o BETA'}
                                </HkBadge>
                            </div>
                        </Dropdown.Toggle>
                        <Dropdown.Menu as={motion.div}
                            initial="initial"
                            animate={showDropdown ? "open" : "close"}
                            variants={pageVariants}
                            transition={{ duration: 0.3 }}
                            className={classNames("p-0")}
                        >
                            {/* Mobile Search */}
                            <Dropdown.Item className="d-xl-none bg-transparent">
                                <InputGroup className="mobile-search">
                                    <span className="input-affix-wrapper input-search">
                                        <Form.Control type="text" placeholder="Buscar..." aria-label="Buscar" value={searchValue} onChange={e => setSearchValue(e.target.value)} onFocus={() => setShowDropdown(true)} autoFocus />
                                        <span className="input-suffix" onClick={CloseSearchInput} >
                                            <span className="btn-input-clear">
                                                <i className="bi bi-x-circle-fill" />
                                            </span>
                                            <span className="spinner-border spinner-border-sm input-loader text-primary" role="status">
                                                <span className="sr-only">Loading...</span>
                                            </span>
                                        </span>
                                    </span>
                                </InputGroup>
                            </Dropdown.Item>
                            {/*/ Mobile Search */}
                            <SimpleBar className="dropdown-body p-2">
                                <Dropdown.Header>Buscas Recentes</Dropdown.Header>
                                <Dropdown.Item className="bg-transparent">
                                    <HkBadge bg="secondary" soft pill className="me-1" >Campanhas</HkBadge>
                                    <HkBadge bg="secondary" soft pill className="me-1" >TSE</HkBadge>
                                    <HkBadge bg="secondary" soft pill>Marketing</HkBadge>
                                </Dropdown.Item>
                                <Dropdown.Divider as="div" />
                                <Dropdown.Header>Ajuda</Dropdown.Header>
                                <Dropdown.Item href="#">
                                    <div className="media align-items-center">
                                        <div className="media-head me-2">
                                            <div className="avatar avatar-icon avatar-xs avatar-soft-light avatar-rounded">
                                                <span className="initial-wrap">
                                                    <span className="svg-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-corner-down-right" width={24} height={24} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                            <path d="M6 6v6a3 3 0 0 0 3 3h10l-4 -4m0 8l4 -4" />
                                                        </svg>
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="media-body">
                                            Como configurar minha campanha?
                                        </div>
                                    </div>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <div className="media align-items-center">
                                        <div className="media-head me-2">
                                            <div className="avatar avatar-icon avatar-xs avatar-soft-light avatar-rounded">
                                                <span className="initial-wrap">
                                                    <span className="svg-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-corner-down-right" width={24} height={24} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                            <path d="M6 6v6a3 3 0 0 0 3 3h10l-4 -4m0 8l4 -4" />
                                                        </svg>
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="media-body">
                                            Ver documentação completa
                                        </div>
                                    </div>
                                </Dropdown.Item>
                                <Dropdown.Divider as="div" />
                                <Dropdown.Header>Equipe</Dropdown.Header>
                                <Dropdown.Item href="#">
                                    <div className="media align-items-center">
                                        <div className="media-head me-2">
                                            <div className="avatar avatar-xs avatar-rounded">
                                                <Image src={avatar3} alt="user" className="avatar-img" />
                                            </div>
                                        </div>
                                        <div className="media-body">
                                            Ana Paula Silva
                                        </div>
                                    </div>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <div className="media align-items-center">
                                        <div className="media-head me-2">
                                            <div className="avatar avatar-xs avatar-soft-primary avatar-rounded">
                                                <span className="initial-wrap">C</span>
                                            </div>
                                        </div>
                                        <div className="media-body">
                                            Carlos Mendes
                                        </div>
                                    </div>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <div className="media align-items-center">
                                        <div className="media-head me-2">
                                            <div className="avatar avatar-xs avatar-rounded">
                                                <Image src={avatar4} alt="user" className="avatar-img" />
                                            </div>
                                        </div>
                                        <div className="media-body">
                                            Mariana Santos
                                        </div>
                                    </div>
                                </Dropdown.Item>
                            </SimpleBar>
                            <div className="dropdown-footer d-xl-flex d-none">
                                <Link href="#">
                                    <u>Buscar tudo</u>
                                </Link>
                            </div>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
                {/* /Start Nav */}
                {/* End Nav */}
                <div className="nav-end-wrap">
                    <Nav className="navbar-nav flex-row align-items-center gap-2">
                        {isFleet && (
                            <Nav.Item>
                                <Button
                                    size="sm"
                                    onClick={handleNewWizard}
                                    disabled={wizardCreating}
                                    className="d-flex align-items-center gap-1 fw-semibold"
                                    style={{
                                        background: 'linear-gradient(135deg,#0d6efd,#6610f2)',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '5px 12px',
                                        fontSize: '0.8rem',
                                        color: '#fff',
                                    }}
                                >
                                    {wizardCreating
                                        ? <Spinner animation="border" size="sm" style={{ width: 13, height: 13 }} />
                                        : <Layers size={13} />}
                                    Nova Viagem
                                </Button>
                            </Nav.Item>
                        )}
                        <Nav.Item>
                            <HkTooltip id="tooltip-color-mode" placement="bottom" title={isDark ? 'Modo claro' : 'Modo escuro'}>
                                <div
                                    onClick={toggleColorMode}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '4px 8px',
                                        borderRadius: 999,
                                        background: isDark
                                            ? 'linear-gradient(135deg, #1c2748 0%, #141d35 100%)'
                                            : '#ffffff',
                                        border: isDark
                                            ? '1px solid rgba(59,130,246,0.22)'
                                            : '1px solid rgba(15,23,42,0.08)',
                                        boxShadow: isDark
                                            ? '0 4px 14px -6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)'
                                            : '0 2px 8px -3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
                                        cursor: 'pointer',
                                        transition: 'transform .15s ease, box-shadow .2s ease, border-color .2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = isDark
                                            ? '0 6px 18px -4px rgba(59,130,246,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
                                            : '0 4px 12px -4px rgba(15,23,42,0.15), 0 2px 4px rgba(15,23,42,0.08)';
                                        e.currentTarget.style.borderColor = isDark
                                            ? 'rgba(59,130,246,0.4)'
                                            : 'rgba(15,23,42,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = isDark
                                            ? '0 4px 14px -6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)'
                                            : '0 2px 8px -3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)';
                                        e.currentTarget.style.borderColor = isDark
                                            ? 'rgba(59,130,246,0.22)'
                                            : 'rgba(15,23,42,0.08)';
                                    }}
                                >
                                    {isDark ? <Moon size={18} color="#60a5fa" /> : <Sun size={16} color="#f59e0b" />}
                                </div>
                            </HkTooltip>
                        </Nav.Item>
                        {false && (
                        <Nav.Item>
                            <Dropdown className="dropdown-notifications">
                                <Dropdown.Toggle variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover no-caret">
                                    <span className="icon">
                                        <span className="position-relative">
                                            <span className="feather-icon"><Bell /></span>
                                            <HkBadge bg="success" indicator className="position-top-end-overflow-1" />
                                        </span>
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end" className="p-0">
                                    <Dropdown.Header className="px-4 fs-6">
                                        Notifications
                                        <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                            <span className="icon">
                                                <span className="feather-icon"><Settings /></span>
                                            </span>
                                        </Button>
                                    </Dropdown.Header>
                                    <SimpleBar className="dropdown-body  p-2">
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar avatar-rounded avatar-sm">
                                                        <Image src={avatar2} alt="user" className="avatar-img" />
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">Carlos Mendes aceitou seu convite para entrar na equipe</div>
                                                        <div className="notifications-info">
                                                            <HkBadge bg="success" soft >Equipe</HkBadge>
                                                            <div className="notifications-time">Hoje, 22:14</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar  avatar-icon avatar-sm avatar-success avatar-rounded">
                                                        <span className="initial-wrap">
                                                            <span className="feather-icon"><Inbox /> </span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">Nova mensagem recebida de Ana Paula Silva</div>
                                                        <div className="notifications-info">
                                                            <div className="notifications-time">Hoje, 07:51</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar  avatar-icon avatar-sm avatar-pink avatar-rounded">
                                                        <span className="initial-wrap">
                                                            <span className="feather-icon"><Clock /></span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">Você tem reunião com o Coordenador de Campanha na sexta-feira, 31 Jan às 9:30</div>
                                                        <div className="notifications-info">
                                                            <div className="notifications-time">Ontem, 21:25</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar avatar-sm avatar-rounded">
                                                        <Image src={avatar3} alt="user" className="avatar-img" />
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">Candidatura de Mariana Santos aguarda sua aprovação</div>
                                                        <div className="notifications-info">
                                                            <div className="notifications-time">Hoje, 22:14</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar avatar-sm avatar-rounded">
                                                        <Image src={avatar10} alt="user" className="avatar-img" />
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">Roberto Costa compartilhou um documento com você</div>
                                                        <div className="notifications-info">
                                                            <HkBadge bg="violet" soft >Documentos</HkBadge>
                                                            <div className="notifications-time">20 Jan, 2026</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                        <Dropdown.Item>
                                            <div className="media">
                                                <div className="media-head">
                                                    <div className="avatar  avatar-icon avatar-sm avatar-danger avatar-rounded">
                                                        <span className="initial-wrap">
                                                            <span className="feather-icon"><Calendar /></span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="media-body">
                                                    <div>
                                                        <div className="notifications-text">Faltam 2 dias para entrega do material de campanha</div>
                                                        <div className="notifications-info">
                                                            <HkBadge bg="orange" soft >Campanha</HkBadge>
                                                            <div className="notifications-time">18 Jan, 2026</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                    </SimpleBar>
                                    <div className="dropdown-footer">
                                        <Link href="#"><u>Ver todas as notificações</u>
                                        </Link>
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav.Item>
                        )}
                        {false && (
                        <Nav.Item>
                            <HkTooltip id="tooltip-topnav-support" placement="bottom" title="Suporte">
                                <span className="d-inline-flex">
                                    <Button as={Link} variant="flush-dark" href="/apps/support" className="btn-icon btn-rounded flush-soft-hover">
                                        <span className="icon">
                                            <span className="feather-icon"><MessageCircle strokeWidth={1.75} style={{ width: 20, height: 20 }} /></span>
                                        </span>
                                    </Button>
                                </span>
                            </HkTooltip>
                        </Nav.Item>
                        )}
                        <Nav.Item className="d-flex align-items-center">
                            <HkTooltip id="tooltip-ai-assistant" placement="bottom" title="Assistente IA">
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '6px 14px 6px 12px',
                                        borderRadius: 999,
                                        background: isDark
                                            ? 'linear-gradient(135deg, #1c2748 0%, #141d35 100%)'
                                            : '#ffffff',
                                        border: isDark
                                            ? '1px solid rgba(59,130,246,0.22)'
                                            : '1px solid rgba(15,23,42,0.08)',
                                        boxShadow: isDark
                                            ? '0 4px 14px -6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)'
                                            : '0 2px 8px -3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
                                        cursor: 'pointer',
                                        transition: 'transform .15s ease, box-shadow .2s ease, border-color .2s ease',
                                    }}
                                    onClick={() => setShowAiPanel(p => !p)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = isDark
                                            ? '0 6px 18px -4px rgba(59,130,246,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
                                            : '0 4px 12px -4px rgba(15,23,42,0.15), 0 2px 4px rgba(15,23,42,0.08)';
                                        e.currentTarget.style.borderColor = isDark
                                            ? 'rgba(59,130,246,0.4)'
                                            : 'rgba(15,23,42,0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = isDark
                                            ? '0 4px 14px -6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)'
                                            : '0 2px 8px -3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)';
                                        e.currentTarget.style.borderColor = isDark
                                            ? 'rgba(59,130,246,0.22)'
                                            : 'rgba(15,23,42,0.08)';
                                    }}
                                >
                                    <MessageCircle
                                        size={17}
                                        style={{
                                            color: isDark ? '#60a5fa' : '#3b82f6',
                                            flexShrink: 0,
                                            strokeWidth: 1.75,
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontWeight: 700,
                                            color: isDark ? '#ffffff' : '#2563eb',
                                            fontSize: '0.9rem',
                                            lineHeight: 1,
                                        }}
                                    >
                                        Agente IA
                                    </span>
                                </div>
                            </HkTooltip>
                        </Nav.Item>
                        {(
                            <Nav.Item>
                                <HkTooltip id="tooltip-credits" placement="bottom" title="Saldo de créditos">
                                    <div
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '6px 14px 6px 12px',
                                            borderRadius: 999,
                                            background: isDark
                                                ? 'linear-gradient(135deg, #1c2748 0%, #141d35 100%)'
                                                : '#ffffff',
                                            border: isDark
                                                ? '1px solid rgba(59,130,246,0.22)'
                                                : '1px solid rgba(15,23,42,0.08)',
                                            boxShadow: isDark
                                                ? '0 4px 14px -6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)'
                                                : '0 2px 8px -3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
                                        }}
                                    >
                                        <Zap
                                            size={14}
                                            style={{
                                                color: '#f59e0b',
                                                fill: '#f59e0b',
                                                flexShrink: 0,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                color: isDark ? '#10b981' : '#059669',
                                                fontSize: '0.9rem',
                                                lineHeight: 1,
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            {creditBalance.toLocaleString('pt-BR')}
                                        </span>
                                        <span
                                            style={{
                                                color: isDark ? '#ffffff' : '#64748b',
                                                fontSize: '0.95rem',
                                                lineHeight: 1,
                                                marginRight: 4,
                                            }}
                                        >
                                            créditos
                                        </span>
                                        <Link
                                            href="/apps/billing"
                                            aria-label="Adicionar créditos"
                                            style={{
                                                width: 17,
                                                height: 17,
                                                borderRadius: 999,
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                color: '#ffffff',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textDecoration: 'none',
                                                boxShadow: '0 2px 6px -2px rgba(59,130,246,0.6)',
                                                border: '1px solid rgba(59,130,246,0.5)',
                                                flexShrink: 0,
                                                transition: 'transform .15s ease, box-shadow .2s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.08)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(59,130,246,0.75)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                                e.currentTarget.style.boxShadow = '0 2px 6px -2px rgba(59,130,246,0.6)';
                                            }}
                                        >
                                            <Plus size={16} strokeWidth={2.5} color="#ffffff" />
                                        </Link>
                                    </div>
                                </HkTooltip>
                            </Nav.Item>
                        )}
                        <Nav.Item>
                            <Dropdown className="ps-2">
                                <Dropdown.Toggle as={Link} href="#" className="no-caret">
                                    <div className="avatar avatar-rounded avatar-xs">
                                        <Image src={avatar12} alt="user" className="avatar-img" />
                                    </div>
                                </Dropdown.Toggle>
                                <Dropdown.Menu align="end">
                                    <div className="p-2">
                                        <div className="media">
                                            <div className="media-head me-2">
                                                <div className="avatar avatar-primary avatar-sm avatar-rounded">
                                                    <span className="initial-wrap">{displayInitials}</span>
                                                </div>
                                            </div>
                                            <div className="media-body">
                                                <Dropdown>
                                                    <Dropdown.Toggle as="a" href="#" className={`d-block fw-medium ${isDark ? 'text-light' : 'text-dark'}`}>{displayName}</Dropdown.Toggle>
                                                    <Dropdown.Menu align="end">
                                                        <div className="p-2">
                                                            <div className="media align-items-center active-user mb-3">
                                                                <div className="media-head me-2">
                                                                    <div className="avatar avatar-primary avatar-xs avatar-rounded">
                                                                        <span className="initial-wrap">{displayInitials}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="media-body">
                                                                    <Link href="#" className={`d-flex ${isDark ? 'link-light' : 'link-dark'}`}>{displayName} <i className="ri-checkbox-circle-fill fs-7 text-primary ms-1" />
                                                                    </Link>
                                                                    <Link href="#" className="d-block fs-8 link-secondary">
                                                                        <u>Gerenciar sua conta</u>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                            <div className="media align-items-center mb-3">
                                                                <div className="media-head me-2">
                                                                    <div className="avatar avatar-xs avatar-rounded">
                                                                        <Image src={avatar12} alt="user" className="avatar-img" />
                                                                    </div>
                                                                </div>
                                                                <div className="media-body">
                                                                    <Link href="#" className={`d-block ${isDark ? 'link-light' : 'link-dark'}`}>Equipe de Campanha</Link>
                                                                    <Link href="#" className="d-block fs-8 link-secondary">{displayEmail}</Link>
                                                                </div>
                                                            </div>
                                                            <Button variant="outline-light" size="sm" className="btn-block">
                                                                <span>
                                                                    <span className="icon">
                                                                        <span className="feather-icon">
                                                                            <Plus />
                                                                        </span>
                                                                    </span>
                                                                    <span>Adicionar Conta</span></span>
                                                            </Button>
                                                        </div>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                                <div className="fs-7">{displayEmail}</div>
                                                <a href="#" className="d-block fs-8 link-secondary" onClick={handleSignOut}>
                                                    <u>Sair</u>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <Dropdown.Divider as="div" />
                                    <Dropdown.Item as={Link} href="/apps/admin/settings" >Perfil do Partido</Dropdown.Item>
                                    {/*
                                    <Dropdown.Item>
                                        <span className="me-2">Ofertas</span>
                                        <span className="badge badge-sm badge-soft-pink">2</span>
                                    </Dropdown.Item>
                                    */}
                                    <Dropdown.Divider as="div" />
                                    <h6 className="dropdown-header">Gerenciar Conta</h6>
                                    <Dropdown.Item>
                                        <span className="dropdown-icon feather-icon">
                                            <CreditCard />
                                        </span>
                                        <span>Métodos de Pagamento</span>
                                    </Dropdown.Item>
                                    <Dropdown.Item>
                                        <span className="dropdown-icon feather-icon">
                                            <CheckSquare />
                                        </span>
                                        <span>Assinaturas</span>
                                    </Dropdown.Item>
                                    <Dropdown.Item>
                                        <span className="dropdown-icon feather-icon">
                                            <Settings />
                                        </span>
                                        <span>Configurações</span>
                                    </Dropdown.Item>
                                    <Dropdown.Divider as="div" />
                                    <Dropdown.Item>
                                        <span className="dropdown-icon feather-icon">
                                            <Tag />
                                        </span>
                                        <span>Abrir Chamado</span>
                                    </Dropdown.Item>
                                    <Dropdown.Divider as="div" />
                                    <Dropdown.Item>
                                        Termos e Condições
                                    </Dropdown.Item>
                                    <Dropdown.Item>
                                        Ajuda e Suporte
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav.Item>
                    </Nav>
                </div>
                {/* /End Nav */}
            </Container>
        </Navbar>

        <FleetAiPanel
            open={showAiPanel}
            onClose={() => setShowAiPanel(false)}
        />
    </>
    )
}

export default TopNav;
