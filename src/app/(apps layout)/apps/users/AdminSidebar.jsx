'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button, Nav, Badge, Spinner } from 'react-bootstrap';
import * as Icons from 'react-feather';
import SimpleBar from 'simplebar-react';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import { useRouter, usePathname } from 'next/navigation';
import { listUsers } from '@/lib/api/services/users';

const ROLE_LABELS = {
    owner: 'Proprietário',
    employee: 'Funcionário',
};

const AdminSidebar = ({ onNewUserClick }) => {
    const router = useRouter();
    const pathname = usePathname();
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [exporting, setExporting] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const data = await listUsers();
            const users = Array.isArray(data) ? data : (data?.users || []);
            setStats({
                total:     users.length,
                byRole: {
                    owners:    users.filter(u => u.role === 'owner').length,
                    employees: users.filter(u => u.role === 'employee').length,
                },
            });
        } catch {
            // falha silenciosa
        } finally {
            setLoadingStats(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const handleExportCSV = async () => {
        setExporting(true);
        try {
            const data = await listUsers();
            const users = Array.isArray(data) ? data : (data?.users || data?.data || []);

            const headers = ['Nome', 'E-mail', 'Cargo', 'Status', 'Criado em'];
            const rows = users.map(u => [
                u.name || '',
                u.email || '',
                ROLE_LABELS[u.role] || u.role || '',
                u.isActive !== false ? 'Ativo' : 'Inativo',
                u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '',
            ]);

            const csvContent = [headers, ...rows]
                .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
                .join('\n');

            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `usuarios-${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Erro ao exportar usuários. Tente novamente.');
        } finally {
            setExporting(false);
        }
    };

    const menuItems = [
        {
            icon: Icons.Users,
            label: 'Usuários',
            path: '/apps/users/list',
            badge: null
        },
        {
            icon: Icons.Folder,
            label: 'Documentos',
            path: '/apps/documents/list-view',
            badge: null
        },
        {
            icon: Icons.Settings,
            label: 'Configurações',
            path: '/apps/admin/settings',
            badge: null
        },
        {
            icon: Icons.Activity,
            label: 'Monitor',
            path: '/apps/monitoring',
            badge: null
        }
    ];

    const quickActions = [
        {
            icon: Icons.Download,
            label: 'Exportar Dados',
            action: 'export'
        },
        {
            icon: Icons.Upload,
            label: 'Importar Dados',
            action: 'import'
        },
        {
            icon: Icons.Mail,
            label: 'Convidar Usuário',
            action: 'invite'
        }
    ];

    const isActive = (path) => {
        return pathname === path;
    };

    const handleNavigation = (path) => {
        if (path) {
            router.push(path);
        }
    };

    const handleQuickAction = (action) => {
        if (action === 'export') handleExportCSV();
    };

    return (
        <nav className="fmapp-sidebar">
            <SimpleBar className="nicescroll-bar">
                <div className="menu-content-wrap">
                    {/* Botão Principal */}
                    {onNewUserClick && (
                        <Button 
                            variant="primary" 
                            className="btn-rounded btn-block mb-4"
                            onClick={onNewUserClick}
                        >
                            <Icons.UserPlus className="me-2" size={18} />
                            Novo Usuário
                        </Button>
                    )}

                    {/* Menu Principal */}
                    <div className="menu-group">
                        <ul className="nav nav-light navbar-nav flex-column">
                            {menuItems.map((item, index) => {
                                const IconComponent = item.icon;
                                const active = isActive(item.path);
                                
                                return (
                                    <li 
                                        key={index} 
                                        className={`nav-item ${active ? 'active' : ''}`}
                                    >
                                        <a 
                                            className="nav-link" 
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleNavigation(item.path);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon">
                                                    <IconComponent size={18} />
                                                </span>
                                            </span>
                                            <span className="nav-link-text">{item.label}</span>
                                            {item.badge && (
                                                <Badge bg="warning" className="badge-sm ms-auto">
                                                    {item.badge}
                                                </Badge>
                                            )}
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Separador */}
                    <div className="separator separator-light my-3" />

                    {/* Ações Rápidas */}
                    <div className="menu-group">
                        <p className="menu-title text-muted mb-2">Ações Rápidas</p>
                        <ul className="nav nav-light navbar-nav flex-column">
                            {quickActions.map((action, index) => {
                                const IconComponent = action.icon;
                                const isLoadingAction = action.action === 'export' && exporting;

                                return (
                                    <li key={index} className="nav-item">
                                        <a
                                            className={`nav-link${isLoadingAction ? ' disabled' : ''}`}
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (!isLoadingAction) handleQuickAction(action.action);
                                            }}
                                            style={{ cursor: isLoadingAction ? 'default' : 'pointer', opacity: isLoadingAction ? 0.7 : 1 }}
                                        >
                                            <span className="nav-icon-wrap">
                                                <span className="feather-icon">
                                                    {isLoadingAction
                                                        ? <Spinner animation="border" size="sm" />
                                                        : <IconComponent size={16} />
                                                    }
                                                </span>
                                            </span>
                                            <span className="nav-link-text">
                                                {isLoadingAction ? 'Exportando...' : action.label}
                                            </span>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </SimpleBar>

            {/* Estatísticas (rodapé) */}
            <div className="fmapp-storage">
                <p className="p-sm fw-medium mb-2">Estatísticas do Sistema</p>
                {loadingStats ? (
                    <div className="text-center py-1">
                        <Spinner animation="border" size="sm" variant="secondary" />
                    </div>
                ) : (
                    <>
                        <div className="d-flex justify-content-between mb-2">
                            <small className="text-muted">Total de Usuários:</small>
                            <small className="fw-medium">{stats?.total ?? '—'}</small>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                            <small className="text-muted">Proprietários:</small>
                            <small className="fw-medium">{stats?.byRole?.owners ?? '—'}</small>
                        </div>
                        <div className="d-flex justify-content-between">
                            <small className="text-muted">Funcionários:</small>
                            <small className="fw-medium">{stats?.byRole?.employees ?? '—'}</small>
                        </div>
                    </>
                )}
            </div>

            {/* Sidebar Fixnav */}
            <div className="fmapp-fixednav">
                <div className="hk-toolbar">
                    <Nav className="nav-light">
                        <Nav.Item className="nav-link">
                            <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                                <HkTooltip id="tooltip-settings" placement="top" title="Configurações" >
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
                                <HkTooltip id="tooltip-refresh" placement="top" title="Atualizar" >
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
                                <HkTooltip id="tooltip-help" placement="top" title="Ajuda" >
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
        </nav>
    );
};

export default AdminSidebar;
