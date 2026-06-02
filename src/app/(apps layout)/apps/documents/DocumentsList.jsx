'use client'
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Spinner, Alert, Button, Badge, Dropdown, Row, Col, Card } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import HkDataTable from '@/components/@hk-data-table';
import * as Icons from 'react-feather';
import documentsAPI from '@/lib/api/services/documents';
import { useColorMode } from '@/hooks/useColorMode';
import { CATEGORY_GROUPS, CATEGORY_IDS, DOCUMENT_CATEGORIES } from './constants';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const getFileIcon = (mimeType) => {
    if (!mimeType) return <Icons.File className="text-secondary" />;
    if (mimeType.startsWith('video/'))   return <Icons.Video className="text-danger" />;
    if (mimeType.startsWith('audio/'))   return <Icons.Music className="text-primary" />;
    if (mimeType.startsWith('image/'))   return <Icons.Image className="text-primary" />;
    if (mimeType === 'application/pdf')  return <Icons.FileText className="text-danger" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <Icons.FileText className="text-primary" />;
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Icons.FileText className="text-warning" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Icons.Archive className="text-info" />;
    return <Icons.File className="text-secondary" />;
};

const translateStatus = (status) => {
    const map = { active: 'Ativo', archived: 'Arquivado', deleted: 'Deletado' };
    return map[status] || status;
};

// ─── Definição das Pastas ────────────────────────────────────────────────────

const CATEGORY_ICON_MAP = {
    telemetria_eventos: Icons.Activity,
    rotas_viagens: Icons.Map,
    ocorrencias_operacionais: Icons.AlertTriangle,
    veiculos_frota: Icons.Truck,
    manutencao: Icons.Tool,
    combustivel_abastecimento: Icons.Droplet,
    motoristas: Icons.User,
    jornada_tacografo: Icons.Clock,
    multas_sinistros: Icons.AlertOctagon,
    documentacao_veicular: Icons.FileText,
    apolices_seguros: Icons.Shield,
    relatorios_kpis: Icons.BarChart2,
};

const FOLDERS = DOCUMENT_CATEGORIES.map((category) => ({
    ...category,
    icon: CATEGORY_ICON_MAP[category.id] || Icons.Folder,
    color: '#eef3f8',
}));

// ─── Componente FolderCard ───────────────────────────────────────────────────

const FolderCard = ({ folder, count, onClick, isDark }) => {
    const FolderIcon = folder.icon;
    const hasFiles = count > 0;

    const cardBorder = isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.12)';
    const iconBg = isDark ? 'rgba(59,130,246,0.16)' : folder.color;
    const iconColor = isDark ? '#93c5fd' : '#2563eb';
    const countColor = hasFiles ? iconColor : (isDark ? '#5a6480' : '#aaa');

    return (
        <Col xs={6} sm={4} md={3} xl={2} className="mb-3">
            <Card
                className="h-100 text-center"
                style={{
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s ease, transform 0.1s ease, border-color 0.15s ease',
                    borderRadius: 12,
                    border: `1.5px solid ${cardBorder}`,
                }}
                onClick={onClick}
                onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = isDark
                        ? '0 10px 28px rgba(59,130,246,0.18)'
                        : '0 10px 24px rgba(59,130,246,0.14)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '';
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.borderColor = cardBorder;
                }}
            >
                <Card.Body className="d-flex flex-column align-items-center justify-content-center py-3 px-2">
                    <div
                        className="d-flex align-items-center justify-content-center mb-2"
                        style={{ width: 48, height: 48, borderRadius: 12, background: iconBg }}
                    >
                        <FolderIcon size={22} strokeWidth={1.5} style={{ color: iconColor }} />
                    </div>
                    <div className="fw-semibold small text-truncate w-100">{folder.label}</div>
                    <div style={{ fontSize: 11, color: countColor, fontWeight: hasFiles ? 600 : 400 }}>
                        {count !== undefined ? `${count} arquivo${count !== 1 ? 's' : ''}` : '—'}
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );
};

// ─── DocumentsList ───────────────────────────────────────────────────────────

const DocumentsList = forwardRef(({ toggleInfo, onDocumentSelect, activeFilter = 'all', onFolderChange }, ref) => {
    const { isDark } = useColorMode();
    const accent = isDark ? '#93c5fd' : '#2563eb';
    const accentBg = isDark ? 'rgba(59,130,246,0.14)' : '#eff6ff';
    const accentBorder = isDark ? 'rgba(59,130,246,0.28)' : 'rgba(59,130,246,0.22)';
    const whiteBg = isDark ? '#1e2130' : '#fff';
    const badgeBorder = isDark ? 'rgba(59,130,246,0.34)' : 'rgba(59,130,246,0.28)';
    const groupBorder = isDark ? '#2a2f3d' : '#e8edf3';
    const yellowBorder = isDark ? '#4a3a10' : '#ece7d0';
    const yellowText = isDark ? '#fbbf24' : '#8f7a21';
    const [allDocuments, setAllDocuments]     = useState([]);
    const [folderDocuments, setFolderDocuments] = useState([]);
    const [openFolder, setOpenFolder]         = useState(null); // { id, label }
    const [loadingAll, setLoadingAll]         = useState(true);
    const [loadingFolder, setLoadingFolder]   = useState(false);
    const [error, setError]                   = useState(null);

    // Carregar todos os documentos (para contar por pasta)
    const loadAllDocuments = async () => {
        try {
            setLoadingAll(true);
            setError(null);

            // Backend tem @Max(100) no limit — buscar em múltiplas páginas se necessário
            let allDocs = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await documentsAPI.list({
                    limit: 100,
                    page,
                    sortBy: 'uploadedAt',
                    sortOrder: 'desc',
                });
                const docs = response.documents || [];
                allDocs = [...allDocs, ...docs];
                hasMore = response.hasMore === true && docs.length === 100;
                page++;
                // Segurança: no máximo 10 páginas (1000 docs)
                if (page > 10) break;
            }

            setAllDocuments(allDocs);
        } catch (err) {
            console.error('Erro ao carregar documentos:', err);
            setError('Erro ao carregar documentos.');
        } finally {
            setLoadingAll(false);
        }
    };

    // Carregar documentos de uma pasta específica
    const loadFolderDocuments = async (categoryId) => {
        try {
            setLoadingFolder(true);
            setError(null);

            if (categoryId === '__uncategorized__') {
                // Inclui sem categoria e categorias legadas que não existem mais no catálogo atual
                setFolderDocuments(allDocuments.filter(d => !d.category || !CATEGORY_IDS.includes(d.category)));
                return;
            }

            let folderDocs = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await documentsAPI.list({
                    category: categoryId,
                    limit: 100,
                    page,
                    sortBy: 'uploadedAt',
                    sortOrder: 'desc',
                });

                const docs = response.documents || [];
                folderDocs = [...folderDocs, ...docs];
                hasMore = response.hasMore === true && docs.length === 100;
                page++;
                if (page > 10) break;
            }

            setFolderDocuments(folderDocs);
        } catch {
            setError('Erro ao carregar documentos da pasta.');
        } finally {
            setLoadingFolder(false);
        }
    };

    useImperativeHandle(ref, () => ({
        reload: () => {
            loadAllDocuments();
            if (openFolder) loadFolderDocuments(openFolder.id);
        },
        search: (query) => {
            // Se vazio, recarrega lista original
            if (!query || !query.trim()) {
                loadAllDocuments();
                return;
            }
            // Busca no backend + client-side como fallback
            setOpenFolder(null);
            setLoadingAll(true);
            documentsAPI.list({ search: query.trim(), limit: 100, sortBy: 'uploadedAt', sortOrder: 'desc' })
                .then(r => {
                    const backendResults = r.documents || [];
                    // Fallback client-side: se backend não retornou nada, filtra localmente por nome/tags
                    if (backendResults.length === 0) {
                        const q = query.trim().toLowerCase();
                        setAllDocuments(prev => prev.length > 0
                            ? prev.filter(d =>
                                (d.originalName || '').toLowerCase().includes(q) ||
                                (d.description || '').toLowerCase().includes(q) ||
                                (d.tags || []).some(t => t.toLowerCase().includes(q))
                            )
                            : backendResults
                        );
                    } else {
                        setAllDocuments(backendResults);
                    }
                })
                .catch(() => {})
                .finally(() => setLoadingAll(false));
        },
    }));

    // Ao montar
    useEffect(() => { loadAllDocuments(); }, []);

    // Quando o sidebar muda o filtro: fechar pasta se mudar para all/recent/favorites/shared
    useEffect(() => {
        if (!CATEGORY_IDS.includes(activeFilter)) {
            setOpenFolder(null);
        } else {
            // Sidebar clicou numa categoria: abre essa pasta
            const folder = FOLDERS.find(f => f.id === activeFilter);
            if (folder) openFolderById(folder);
        }
    }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const openFolderById = (folder) => {
        setOpenFolder(folder);
        loadFolderDocuments(folder.id);
        if (onFolderChange) onFolderChange(folder.id);
    };

    const closeFolder = () => {
        setOpenFolder(null);
        if (onFolderChange) onFolderChange(null);
    };

    // Documentos filtrados client-side (para visões especiais)
    const getSpecialDocuments = () => {
        if (activeFilter === 'recent')    return allDocuments.slice(0, 10);
        if (activeFilter === 'favorites') return allDocuments.filter(d => d.isFavorite);
        if (activeFilter === 'shared')    return allDocuments.filter(d => d.sharedWith?.length > 0);
        return allDocuments;
    };

    // Contagem por pasta
    const countByCategory = (categoryId) =>
        allDocuments.filter(d => d.category === categoryId).length;

    // Processar documentos para exibição
    const processDoc = (doc) => ({
        ...doc,
        uploadedByString: typeof doc.uploadedBy === 'object'
            ? (doc.uploadedBy?.name || doc.uploadedBy?.email || 'Desconhecido')
            : (doc.uploadedBy || 'Desconhecido'),
    });

    // ── Colunas da tabela ──────────────────────────────────────────────────

    const handleDownload = async (id) => {
        try { await documentsAPI.download(id); } catch { setError('Erro ao baixar.'); }
    };

    const handleToggleFavorite = async (id, current) => {
        try {
            await documentsAPI.toggleFavorite(id, !current);
            loadAllDocuments();
            if (openFolder) loadFolderDocuments(openFolder.id);
        } catch (err) {
            console.error('Erro ao favoritar:', err);
            setError(err?.message || 'Erro ao favoritar.');
        }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Excluir "${title}"?\n\nEsta ação não pode ser desfeita.`)) return;
        try {
            await documentsAPI.delete(id);
            loadAllDocuments();
            if (openFolder) loadFolderDocuments(openFolder.id);
        } catch { setError('Erro ao excluir.'); }
    };

    const columns = [
        {
            accessor: 'title',
            title: 'Nome',
            cellFormatter: (cell, row) => (
                <div
                    className="d-flex align-items-center"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onDocumentSelect && onDocumentSelect(row)}
                >
                    <span className="me-2">{getFileIcon(row.mimeType)}</span>
                    <span className="fw-medium text-truncate" style={{ maxWidth: 260 }}>{cell}</span>
                    {row.isFavorite && <Icons.Star size={13} className="text-warning ms-1" fill="currentColor" />}
                </div>
            ),
        },
        {
            accessor: 'category',
            title: 'Categoria',
            cellFormatter: (cell) => {
                const folder = FOLDERS.find(f => f.id === cell);
                return folder
                    ? <Badge bg="light" text="dark" className="border">{folder.label}</Badge>
                    : <span className="text-muted small">{cell || '—'}</span>;
            },
        },
        {
            accessor: 'fileSize',
            title: 'Tamanho',
            cellFormatter: (cell) => <span className="text-muted small">{formatFileSize(cell)}</span>,
        },
        {
            accessor: 'uploadedByString',
            title: 'Enviado por',
            cellFormatter: (cell) => <span className="text-muted small">{cell}</span>,
        },
        {
            accessor: 'uploadedAt',
            title: 'Data',
            cellFormatter: (cell) => <span className="text-muted small">{formatDate(cell)}</span>,
        },
        {
            accessor: 'status',
            title: 'Status',
            cellFormatter: (cell) => <Badge bg={cell === 'active' ? 'light-success' : 'light-secondary'}>{translateStatus(cell)}</Badge>,
        },
        {
            accessor: '_id',
            title: '',
            cellFormatter: (cell, row) => (
                <Dropdown align="end">
                    <Dropdown.Toggle as="span" style={{ cursor: 'pointer' }}>
                        <Icons.MoreHorizontal size={16} className="text-muted" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => { onDocumentSelect && onDocumentSelect(row); toggleInfo && toggleInfo(); }}>
                            <Icons.Eye size={14} className="me-2" /> Visualizar
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleToggleFavorite(cell, row.isFavorite)}>
                            <Icons.Star size={14} className="me-2" />
                            {row.isFavorite ? 'Remover favorito' : 'Adicionar favorito'}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => handleDownload(cell)}>
                            <Icons.Download size={14} className="me-2" /> Baixar
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item className="text-danger" onClick={() => handleDelete(cell, row.title)}>
                            <Icons.Trash2 size={14} className="me-2" /> Excluir
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            ),
        },
    ];

    // ── Render ─────────────────────────────────────────────────────────────

    // ── Vista: interior de uma pasta ───────────────────────────────────────
    if (openFolder) {
        const docs = folderDocuments.map(processDoc);
        const FolderIcon = openFolder.icon || Icons.Folder;

        return (
            <div className="fm-body">
                <SimpleBar className="nicescroll-bar">
                    <div className="file-list-view">
                        {/* Breadcrumb */}
                        <div
                            className="d-flex align-items-center gap-2 px-4 pt-3 pb-3"
                            style={{ background: accentBg, borderBottom: `2px solid ${accentBorder}` }}
                        >
                            <button
                                className="btn btn-sm d-flex align-items-center gap-1"
                                style={{ background: whiteBg, border: `1.5px solid ${accent}`, color: accent, borderRadius: 8 }}
                                onClick={closeFolder}
                            >
                                <Icons.ChevronLeft size={14} />
                                Voltar
                            </button>
                            <Icons.Home size={14} style={{ color: accent }} />
                            <span style={{ color: accent, fontSize: 13 }}>/</span>
                            <span className="fw-semibold small" style={{ color: accent }}>{openFolder.label}</span>
                            {!loadingFolder && (
                                <span style={{ fontSize: 11, background: whiteBg, color: accent, border: `1px solid ${badgeBorder}`, borderRadius: 8, padding: '1px 8px', fontWeight: 600 }}>
                                    {docs.length} arquivo{docs.length !== 1 ? 's' : ''}
                                </span>
                            )}
                            {loadingFolder && <Spinner animation="border" size="sm" style={{ color: accent }} />}
                        </div>

                        {error && (
                            <Alert variant="danger" className="m-4">{error}</Alert>
                        )}

                        {loadingFolder && (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="text-muted mt-3">Carregando...</p>
                            </div>
                        )}

                        {!loadingFolder && docs.length > 0 && (
                            <HkDataTable
                                column={columns}
                                rowData={docs}
                                rowSelection={true}
                                markStarred={true}
                                classes="nowrap w-100 mb-5"
                                responsive
                            />
                        )}

                        {!loadingFolder && docs.length === 0 && (
                            <div className="text-center py-5">
                                <Icons.Archive size={52} className="text-muted mb-3" strokeWidth={1} />
                                <p className="fw-medium text-muted">Pasta vazia</p>
                                <p className="text-muted small">
                                    Nenhum documento na categoria "{openFolder.label}".<br />
                                    Faça upload e selecione esta categoria.
                                </p>
                            </div>
                        )}
                    </div>
                </SimpleBar>
            </div>
        );
    }

    // ── Vista: visões especiais (recentes, favoritos, compartilhados) ──────
    if (['recent', 'favorites', 'shared'].includes(activeFilter)) {
        const LABELS = { recent: 'Recentes', favorites: 'Favoritos', shared: 'Compartilhados' };
        const docs = getSpecialDocuments().map(processDoc);

        return (
            <div className="fm-body">
                <SimpleBar className="nicescroll-bar">
                    <div className="file-list-view">
                        <div
                            className="d-flex align-items-center gap-2 px-4 pt-3 pb-3"
                            style={{ background: accentBg, borderBottom: `2px solid ${accentBorder}` }}
                        >
                            <h6 className="mb-0 fw-semibold" style={{ color: accent }}>{LABELS[activeFilter]}</h6>
                            {!loadingAll && (
                                <span style={{ fontSize: 11, background: whiteBg, color: accent, border: `1px solid ${badgeBorder}`, borderRadius: 8, padding: '1px 8px', fontWeight: 600 }}>
                                    {docs.length}
                                </span>
                            )}
                            {loadingAll && <Spinner animation="border" size="sm" style={{ color: accent }} />}
                        </div>

                        {loadingAll && (
                            <div className="text-center py-5">
                                <Spinner animation="border" variant="primary" />
                            </div>
                        )}

                        {!loadingAll && docs.length > 0 && (
                            <HkDataTable
                                column={columns}
                                rowData={docs}
                                rowSelection={true}
                                markStarred={true}
                                classes="nowrap w-100 mb-5"
                                responsive
                            />
                        )}

                        {!loadingAll && docs.length === 0 && (
                            <div className="text-center py-5">
                                <Icons.Inbox size={48} className="text-muted mb-3" />
                                <p className="text-muted">Nenhum documento encontrado</p>
                            </div>
                        )}
                    </div>
                </SimpleBar>
            </div>
        );
    }

    // ── Vista padrão: grade de pastas ──────────────────────────────────────
    const GROUPS = CATEGORY_GROUPS;

    return (
        <div className="fm-body">
            <SimpleBar className="nicescroll-bar">
                <div className="file-list-view px-4 pt-4">
                    {error && <Alert variant="danger">{error}</Alert>}

                    {loadingAll && (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="text-muted mt-3">Carregando...</p>
                        </div>
                    )}

                    {!loadingAll && GROUPS.map(group => {
                        const folders = FOLDERS.filter(f => f.group === group);
                        return (
                            <div key={group} className="mb-4">
                                <div className="d-flex align-items-center gap-2 mb-3 pb-1" style={{ borderBottom: `2px solid ${groupBorder}` }}>
                                    <span className="fw-semibold small text-uppercase" style={{ color: accent, letterSpacing: '0.06em' }}>{group}</span>
                                    <span style={{ fontSize: 11, background: accentBg, color: accent, borderRadius: 8, padding: '1px 8px', fontWeight: 600 }}>
                                        {folders.reduce((sum, f) => sum + countByCategory(f.id), 0)} arquivos
                                    </span>
                                </div>
                                <Row className="g-3">
                                    {folders.map(folder => (
                                        <FolderCard
                                            key={folder.id}
                                            folder={folder}
                                            count={countByCategory(folder.id)}
                                            onClick={() => openFolderById(folder)}
                                            isDark={isDark}
                                        />
                                    ))}
                                </Row>
                            </div>
                        );
                    })}

                    {/* Todos os documentos sem categoria */}
                    {!loadingAll && (
                        <div className="mb-5">
                            <div className="d-flex align-items-center gap-2 mb-3 pb-1" style={{ borderBottom: `2px solid ${yellowBorder}` }}>
                                <span className="fw-semibold small text-uppercase" style={{ color: yellowText, letterSpacing: '0.06em' }}>Sem Categoria</span>
                            </div>
                            <Row className="g-3">
                                <FolderCard
                                    folder={{
                                        id: '__uncategorized__',
                                        label: 'Sem categoria',
                                        color: isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5',
                                        icon: Icons.Archive,
                                    }}
                                    count={allDocuments.filter(d => !d.category || !CATEGORY_IDS.includes(d.category)).length}
                                    isDark={isDark}
                                    onClick={() => openFolderById({
                                        id: '__uncategorized__',
                                        label: 'Sem categoria',
                                        color: isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5',
                                        icon: Icons.Archive,
                                    })}
                                />
                            </Row>
                        </div>
                    )}
                </div>
            </SimpleBar>
        </div>
    );
});

DocumentsList.displayName = 'DocumentsList';

export default DocumentsList;
