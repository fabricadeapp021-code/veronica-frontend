import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import SimpleBar from 'simplebar-react';
import { Button, Card, Col, Dropdown, Form, Row, Table } from 'react-bootstrap';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Edit,
    Plus,
    RefreshCw,
    Search,
    Tag,
    Trash,
    UserPlus,
    MessageCircle,
    Heart,
    Star,
    UserX,
    Award,
    Slash,
} from 'react-feather';
import { listLeads, deleteLead } from '@/lib/api/services/leads';
import { useAuth } from '@/lib/auth/AuthProvider';
import { showCustomAlert } from '@/components/CustomAlert';

const STATUS_OPTIONS = [
    { key: '', label: 'Todos os Status' },
    { key: 'novo', label: 'Novo' },
    { key: 'abordado', label: 'Abordado' },
    { key: 'engajado', label: 'Engajado' },
    { key: 'prioritario', label: 'Prioritário' },
    { key: 'fora_perfil', label: 'Fora do Perfil' },
    { key: 'convertido', label: 'Convertido' },
    { key: 'encerrado', label: 'Encerrado' },
];

const STATUS_META = {
    novo: { label: 'Novo', className: 'lead-badge--novo', icon: UserPlus },
    abordado: { label: 'Abordado', className: 'lead-badge--abordado', icon: MessageCircle },
    engajado: { label: 'Engajado', className: 'lead-badge--engajado', icon: Heart },
    prioritario: { label: 'Prioritário', className: 'lead-badge--prioritario', icon: Star },
    fora_perfil: { label: 'Fora do Perfil', className: 'lead-badge--fora', icon: UserX },
    convertido: { label: 'Convertido', className: 'lead-badge--convertido', icon: Award },
    encerrado: { label: 'Encerrado', className: 'lead-badge--encerrado', icon: Slash },
};

const TAG_SEED = ['Pesquisa', 'Mobilização', 'Prioridade Alta', 'Zona Norte', 'Zona Sul'];

const mapRawStatus = (rawStatus) => {
    const normalized = String(rawStatus || '').trim().toLowerCase();

    const map = {
        new: 'novo',
        contacted: 'abordado',
        qualified: 'engajado',
        converted: 'convertido',
        rejected: 'fora_perfil',
        closed: 'encerrado',
        novo: 'novo',
        abordado: 'abordado',
        engajado: 'engajado',
        prioritario: 'prioritario',
        'fora do perfil': 'fora_perfil',
        fora_perfil: 'fora_perfil',
        convertido: 'convertido',
        encerrado: 'encerrado',
    };

    return map[normalized] || 'novo';
};

const getStatusMeta = (statusKey) => STATUS_META[statusKey] || STATUS_META.novo;

const LeadListBody = () => {
    const router = useRouter();
    const { user, status } = useAuth();
    const isExternal = user?.role === 'external';

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const [showTagsMenu, setShowTagsMenu] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [availableTags, setAvailableTags] = useState(TAG_SEED);
    const [activeTags, setActiveTags] = useState([]);

    const loadLeads = async (showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            let response = await listLeads({ maxSize: 1000 });
            if (!response?.success) {
                response = await listLeads();
            }

            if (response?.success && Array.isArray(response.data)) {
                const formattedData = response.data.map((lead) => {
                    const createdAtDate = lead?.createdAt ? new Date(lead.createdAt) : null;
                    const createdAt = createdAtDate
                        ? createdAtDate.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })
                        : '-';

                    const leadTags = Array.isArray(lead?.tags)
                        ? lead.tags.map((t) => String(t).trim()).filter(Boolean)
                        : [];

                    return {
                        id: lead.id,
                        name: lead.name || '-',
                        email: lead.emailAddress || '-',
                        phone: lead.phoneNumber || '-',
                        source: lead.source || '-',
                        statusRaw: lead.status || 'New',
                        statusBusiness: mapRawStatus(lead.status),
                        createdAt,
                        createdAtDate,
                        tags: leadTags,
                    };
                });

                setLeads(formattedData);
            } else {
                setLeads([]);
            }
        } catch (error) {
            console.error('Erro ao carregar leads:', error);
            setLeads([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        loadLeads(true);
    };

    const handleDelete = async (leadId, leadNameFromRow = '') => {
        const leadName =
            String(leadNameFromRow || '').trim() ||
            leads.find((l) => l.id === leadId)?.name ||
            `ID ${leadId}`;

        const confirmation = await showCustomAlert({
            variant: 'warning',
            title: 'Confirmar exclusão',
            text: `Tem certeza que quer excluir o lead "${leadName}"?\n\nEsta ação não pode ser desfeita.`,
            confirmButtonText: 'Deletar',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
        });

        if (!confirmation.isConfirmed) return;

        try {
            setDeletingId(leadId);
            const response = await deleteLead(leadId);
            if (!response || response.success !== false) {
                await loadLeads();
                await showCustomAlert({
                    variant: 'success',
                    title: 'Sucesso',
                    text: 'Lead deletado com sucesso!',
                });
            } else {
                await showCustomAlert({
                    variant: 'danger',
                    title: 'Erro',
                    text: response?.message || 'Erro ao deletar lead',
                });
            }
        } catch (error) {
            console.error('Erro ao deletar lead:', error);
            await showCustomAlert({
                variant: 'danger',
                title: 'Erro',
                text: error?.message || 'Erro ao deletar lead. Tente novamente.',
            });
        } finally {
            setDeletingId(null);
        }
    };

    const toggleTag = (tag) => {
        setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    };

    const handleAddTag = () => {
        const cleanTag = String(tagInput || '').trim();
        if (!cleanTag) return;

        if (!availableTags.includes(cleanTag)) {
            setAvailableTags((prev) => [...prev, cleanTag]);
        }

        if (!activeTags.includes(cleanTag)) {
            setActiveTags((prev) => [...prev, cleanTag]);
        }

        setTagInput('');
    };

    useEffect(() => {
        if (status === 'authenticated') {
            loadLeads();
        } else if (status === 'guest') {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.reloadLeads = loadLeads;
        }
    }, []);

    const uniqueSources = useMemo(() => {
        const sources = new Set();
        leads.forEach((lead) => {
            if (lead.source && lead.source !== '-') sources.add(lead.source);
        });
        return Array.from(sources).sort();
    }, [leads]);

    const filteredLeads = useMemo(() => {
        return leads.filter((lead) => {
            const search = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !search ||
                String(lead?.name || '').toLowerCase().includes(search) ||
                String(lead?.email || '').toLowerCase().includes(search) ||
                String(lead?.phone || '').toLowerCase().includes(search);

            const matchesStatus = !statusFilter || lead.statusBusiness === statusFilter;
            const matchesSource = !sourceFilter || lead.source === sourceFilter;

            const createdAtDate = lead?.createdAtDate instanceof Date ? lead.createdAtDate : null;
            const fromDate = dateFromFilter ? new Date(`${dateFromFilter}T00:00:00`) : null;
            const toDate = dateToFilter ? new Date(`${dateToFilter}T23:59:59`) : null;
            const matchesDateFrom = !fromDate || (createdAtDate && createdAtDate >= fromDate);
            const matchesDateTo = !toDate || (createdAtDate && createdAtDate <= toDate);

            const tags = Array.isArray(lead.tags) ? lead.tags : [];
            const matchesTags = activeTags.length === 0 || activeTags.every((tag) => tags.includes(tag));

            return matchesSearch && matchesStatus && matchesSource && matchesDateFrom && matchesDateTo && matchesTags;
        });
    }, [leads, searchTerm, statusFilter, sourceFilter, dateFromFilter, dateToFilter, activeTags]);

    return (
        <>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .lead-soft-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    border-radius: 999px;
                    font-size: 11px;
                    line-height: 1;
                    padding: 6px 11px;
                    border-width: 1px;
                    border-style: solid;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .lead-badge--novo { background: #dbeafe; border-color: #bfdbfe; color: #0369a1 !important; }
                .lead-badge--abordado { background: #fef3c7; border-color: #fde68a; color: #b45309 !important; }
                .lead-badge--engajado { background: #d1fae5; border-color: #a7f3d0; color: #047857 !important; }
                .lead-badge--prioritario { background: #ede9fe; border-color: #ddd6fe; color: #6d28d9 !important; }
                .lead-badge--fora { background: #f3f4f6; border-color: #e5e7eb; color: #4b5563 !important; }
                .lead-badge--convertido { background: #e0f2fe; border-color: #bae6fd; color: #0c4a6e !important; }
                .lead-badge--encerrado { background: #f1f5f9; border-color: #e2e8f0; color: #475569 !important; }
                .lead-filter-btn {
                    background: #ffffff !important;
                    border: 1px solid #d8dce5 !important;
                    color: #0f172a !important;
                }
                .lead-filter-btn:hover,
                .lead-filter-btn:focus,
                .lead-filter-btn:active,
                .lead-filter-btn.show {
                    background: #ffffff !important;
                    border-color: #cfd5e2 !important;
                    color: #0f172a !important;
                    box-shadow: none !important;
                }
                .lead-action-btn {
                    background: transparent !important;
                    border: 1px solid transparent !important;
                    color: #475569 !important;
                    box-shadow: none !important;
                }
                .lead-action-btn:hover,
                .lead-action-btn:focus,
                .lead-action-btn:active {
                    background: #f3f4f6 !important;
                    border-color: #e5e7eb !important;
                    color: #0f172a !important;
                }
            `}</style>
            <div className="contact-body">
                <SimpleBar className="nicescroll-bar">
                    <div className="contact-list-view">
                        <Card className="border-0 shadow-sm">
                            <Card.Body>
                                <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
                                    <div className="d-flex flex-wrap align-items-end gap-2">
                                        <div style={{ width: 160 }}>
                                            <Form.Label className="mb-1">Status</Form.Label>
                                            <Dropdown>
                                                <Dropdown.Toggle variant="outline-secondary" size="sm" className="w-100 d-flex justify-content-between align-items-center lead-filter-btn no-caret">
                                                    <span>{STATUS_OPTIONS.find((s) => s.key === statusFilter)?.label || 'Todos os Status'}</span>
                                                    <ChevronDown size={14} />
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu className="w-100">
                                                    {STATUS_OPTIONS.map((option) => (
                                                        <Dropdown.Item key={option.key || 'all'} active={statusFilter === option.key} onClick={() => setStatusFilter(option.key)}>
                                                            {option.label}
                                                        </Dropdown.Item>
                                                    ))}
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>

                                        <div style={{ width: 160 }}>
                                            <Form.Label className="mb-1">Origem</Form.Label>
                                            <Form.Select size="sm" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                                                <option value="">Todas as Origens</option>
                                                {uniqueSources.map((source) => (
                                                    <option key={source} value={source}>{source}</option>
                                                ))}
                                            </Form.Select>
                                        </div>

                                        <div style={{ width: 150 }}>
                                            <Form.Label className="mb-1">Data De</Form.Label>
                                            <Form.Control size="sm" type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} />
                                        </div>

                                        <div style={{ width: 150 }}>
                                            <Form.Label className="mb-1">Data Até</Form.Label>
                                            <Form.Control size="sm" type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} />
                                        </div>

                                        <div style={{ width: 110 }}>
                                            <Button size="sm" variant="outline-secondary" onClick={handleRefresh} disabled={refreshing || loading} className="w-100 lead-filter-btn">
                                                <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite', display: 'inline-block' } : {}} />
                                                <span className="ms-1">Atualizar</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="d-flex flex-wrap align-items-end gap-2">
                                        <div style={{ width: 110 }}>
                                            <Dropdown show={showTagsMenu} onToggle={(isOpen) => setShowTagsMenu(isOpen)} autoClose="outside">
                                                <Dropdown.Toggle size="sm" variant="outline-secondary" className="w-100 lead-filter-btn">
                                                    <Tag size={14} className="me-1" />
                                                    Tags
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu style={{ minWidth: 280 }} className="p-2">
                                                    <div className="d-flex gap-2 mb-2">
                                                        <Form.Control
                                                            size="sm"
                                                            placeholder="Criar nova tag..."
                                                            value={tagInput}
                                                            onChange={(e) => setTagInput(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleAddTag();
                                                                }
                                                            }}
                                                        />
                                                        <Button size="sm" onClick={handleAddTag}>
                                                            <Plus size={14} />
                                                        </Button>
                                                    </div>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {availableTags.map((tag) => (
                                                            <Button key={tag} size="sm" variant={activeTags.includes(tag) ? 'primary' : 'light'} className="rounded-pill" onClick={() => toggleTag(tag)}>
                                                                <Tag size={12} className="me-1" />
                                                                {tag}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>

                                        <div style={{ width: 250 }}>
                                            <div className="position-relative">
                                                <Search size={14} className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
                                                <Form.Control
                                                    size="sm"
                                                    type="search"
                                                    className="ps-4"
                                                    placeholder="Buscar por nome, email..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <Table hover className="align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 36 }}><Form.Check /></th>
                                                <th>NOME</th>
                                                <th>EMAIL</th>
                                                <th>TELEFONE</th>
                                                <th>STATUS</th>
                                                <th>DATA DE CRIAÇÃO</th>
                                                <th style={{ minWidth: 90 }} />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading && (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-5">Carregando leads...</td>
                                                </tr>
                                            )}
                                            {!loading && filteredLeads.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-5">Nenhum lead encontrado</td>
                                                </tr>
                                            )}
                                            {!loading && filteredLeads.map((lead) => {
                                                const statusMeta = getStatusMeta(lead.statusBusiness);
                                                const StatusIcon = statusMeta.icon;
                                                return (
                                                    <tr key={lead.id}>
                                                        <td><Form.Check /></td>
                                                        <td className="fw-semibold">{lead.name}</td>
                                                        <td>{lead.email}</td>
                                                        <td>{lead.phone}</td>
                                                        <td>
                                                            <span className={`lead-soft-badge ${statusMeta.className}`}>
                                                                <StatusIcon size={12} className="me-1" />
                                                                {statusMeta.label}
                                                            </span>
                                                        </td>
                                                        <td>{lead.createdAt}</td>
                                                        <td style={{ whiteSpace: 'nowrap' }}>
                                                            {isExternal ? (
                                                                <span className="text-muted small">Somente leitura</span>
                                                            ) : (
                                                                <div className="d-flex align-items-center gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline-secondary"
                                                                        className="lead-action-btn"
                                                                        onClick={() => router.push(`/apps/leads/${lead.id}`)}
                                                                    >
                                                                        <Edit size={14} />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline-secondary"
                                                                        className="lead-action-btn"
                                                                        onClick={() => handleDelete(lead.id, lead.name)}
                                                                        disabled={deletingId === lead.id}
                                                                    >
                                                                        <Trash size={14} />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </div>

                                <div className="d-flex justify-content-between align-items-center mt-3 text-muted small">
                                    <span>{filteredLeads.length} de {leads.length}</span>
                                    <div className="d-flex align-items-center gap-2">
                                        <Button size="sm" variant="flush-dark" className="btn-icon p-0 text-muted" disabled>
                                            <ChevronLeft size={16} />
                                        </Button>
                                        <Button size="sm" variant="success" className="rounded-pill px-3">1</Button>
                                        <Button size="sm" variant="flush-dark" className="btn-icon p-0 text-muted" disabled>
                                            <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </SimpleBar>
            </div>
        </>
    );
};

export default LeadListBody;
