'use client'
import { useState } from 'react';
import { Button, Card, Nav, Tab, Alert } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import * as Icons from 'react-feather';
import HkBadge from '@/components/@hk-badge/@hk-badge';
import documentsAPI from '@/lib/api/services/documents';
import VideoPreview from './previews/VideoPreview';
import AudioPreview from './previews/AudioPreview';
import PDFPreview from './previews/PDFPreview';
import ImagePreview from './previews/ImagePreview';
import { showCustomAlert } from '@/components/CustomAlert';
import { CATEGORY_LABEL_MAP } from './constants';

const DocumentInfo = ({ document, onHide, onDocumentDeleted }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    // Se não houver documento selecionado, não renderizar
    if (!document) {
        return null;
    }

    // Helpers
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getFileIcon = (mimeType) => {
        if (!mimeType) return <Icons.File />;
        
        if (mimeType.startsWith('video/')) return <Icons.Video />;
        if (mimeType.startsWith('audio/')) return <Icons.Music />;
        if (mimeType.startsWith('image/')) return <Icons.Image />;
        if (mimeType === 'application/pdf') return <Icons.FileText />;
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <Icons.FileText />;
        
        return <Icons.File />;
    };

    const translateCategory = (category) => {
        return CATEGORY_LABEL_MAP[category] || category;
    };

    // Ações
    const handleDownload = async () => {
        try {
            await documentsAPI.download(document._id);
        } catch (err) {
            console.error('Erro ao baixar documento:', err);
            setError('Erro ao baixar documento.');
        }
    };

    const handleDelete = async () => {
        const confirmation = await showCustomAlert({
            variant: 'warning',
            title: 'Confirmar exclusão',
            text: `Tem certeza que deseja excluir o documento "${document.title}"? Esta ação não pode ser desfeita.`,
            showCancelButton: true,
            confirmButtonText: 'Excluir',
            cancelButtonText: 'Cancelar',
        });

        if (!confirmation?.isConfirmed) {
            return;
        }

        try {
            setIsDeleting(true);
            setError(null);
            
            await documentsAPI.delete(document._id);
            
            await showCustomAlert({
                variant: 'success',
                title: 'Sucesso',
                text: 'Documento excluído com sucesso!',
            });
            
            // Notificar pai para recarregar lista
            if (onDocumentDeleted) {
                onDocumentDeleted();
            }
            
            // Fechar painel
            if (onHide) {
                onHide();
            }
        } catch (err) {
            console.error('Erro ao excluir documento:', err);
            setError('Erro ao excluir documento. Tente novamente.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleFavorite = async () => {
        try {
            await documentsAPI.toggleFavorite(document._id, !document.isFavorite);
            
            // Notificar pai para recarregar lista
            if (onDocumentDeleted) {
                onDocumentDeleted();
            }
        } catch (err) {
            console.error('Erro ao favoritar documento:', err);
            setError('Erro ao favoritar documento.');
        }
    };

    const uploadedByName = document.uploadedBy && typeof document.uploadedBy === 'object'
        ? (document.uploadedBy.name || document.uploadedBy.email)
        : 'Desconhecido';

    // Renderizar preview baseado no tipo de arquivo
    const renderPreview = () => {
        if (!document.fileUrl) {
            return (
                <Alert variant="warning" className="mb-3">
                    <Icons.AlertCircle size={18} className="me-2" />
                    URL do arquivo não disponível. Faça o download para visualizar.
                </Alert>
            );
        }

        const mimeType = document.mimeType || '';

        // Vídeos
        if (mimeType.startsWith('video/')) {
            return <VideoPreview url={document.fileUrl} fileName={document.fileName} />;
        }

        // Áudios
        if (mimeType.startsWith('audio/')) {
            return <AudioPreview url={document.fileUrl} fileName={document.fileName} />;
        }

        // PDFs
        if (mimeType === 'application/pdf') {
            return <PDFPreview url={document.fileUrl} fileName={document.fileName} />;
        }

        // Imagens
        if (mimeType.startsWith('image/')) {
            return <ImagePreview url={document.fileUrl} fileName={document.fileName} />;
        }

        // Outros tipos (sem preview)
        return (
            <Alert variant="info" className="mb-3">
                <Icons.Info size={18} className="me-2" />
                Preview não disponível para este tipo de arquivo. Use o botão "Baixar" abaixo.
            </Alert>
        );
    };

    const handleClose = () => {
        if (onHide) onHide();
    };

    return (
        <div className="file-info">
            <SimpleBar className="nicescroll-bar">
                {/* Botão de Fechar */}
                <Button bsPrefix="btn-close" className="info-close" onClick={handleClose}>
                    <span aria-hidden="true">×</span>
                </Button>

                {/* Error Alert */}
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)} className="m-3">
                        {error}
                    </Alert>
                )}

                {/* Nome do Documento */}
                <div className="file-name">{document.title || document.fileName}</div>
                <span>
                    {document.mimeType === 'application/pdf' ? 'Documento PDF' :
                     document.mimeType?.startsWith('video/') ? 'Vídeo' :
                     document.mimeType?.startsWith('audio/') ? 'Áudio' :
                     document.mimeType?.startsWith('image/') ? 'Imagem' :
                     'Documento'}
                </span>

                {/* Ícone do Arquivo */}
                {/* <div className="d-flex justify-content-center my-4">
                    <div className="avatar avatar-xxl avatar-icon avatar-soft-blue">
                        <span className="initial-wrap" style={{ fontSize: '48px' }}>
                            {getFileIcon(document.mimeType)}
                        </span>
                    </div>
                </div> */}

                {/* Preview Section */}
                <div className="px-3 mb-4">
                    {renderPreview()}
                </div>

                {/* Tabs */}
                <Tab.Container defaultActiveKey="tabInfo">
                    <Nav as="ul" justify variant="tabs" className="nav-light nav-segmented-tabs active-theme mt-5">
                        <Nav.Item>
                            <Nav.Link eventKey="tabInfo">
                                <span className="nav-link-text">Detalhes</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="tabActivity">
                                <span className="nav-link-text">Atividade</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="tabVersions">
                                <span className="nav-link-text">Versões</span>
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Tab.Content className="mt-5">
                        {/* Tab: Detalhes */}
                        <Tab.Pane eventKey="tabInfo">
                            <div className="collapse-simple">
                                {/* Especificações */}
                                <Card>
                                    <Card.Header>
                                        <a href="#fl_info" role="button" data-bs-toggle="collapse" aria-expanded="true">
                                            Especificações
                                        </a>
                                    </Card.Header>
                                    <div id="fl_info" className="collapse show">
                                        <Card.Body>
                                            <ul className="fm-info">
                                                <li>
                                                    <span>Data de Modificação</span>
                                                    <span>{formatDate(document.modifiedAt)}</span>
                                                </li>
                                                <li>
                                                    <span>Tamanho</span>
                                                    <span>{formatFileSize(document.fileSize)}</span>
                                                </li>
                                                <li>
                                                    <span>Criado por</span>
                                                    <span>{uploadedByName}</span>
                                                </li>
                                                <li>
                                                    <span>Data de Criação</span>
                                                    <span>{formatDate(document.uploadedAt)}</span>
                                                </li>
                                                <li>
                                                    <span>Categoria</span>
                                                    <span>{translateCategory(document.category)}</span>
                                                </li>
                                                <li>
                                                    <span>Versão Atual</span>
                                                    <span>{document.version || 1}.0</span>
                                                </li>
                                                <li>
                                                    <span>Status</span>
                                                    <span>
                                                        <HkBadge 
                                                            bg={document.status === 'active' ? 'success' : 'secondary'} 
                                                            soft 
                                                            className="my-1"
                                                        >
                                                            {document.status === 'active' ? 'Ativo' : 'Inativo'}
                                                        </HkBadge>
                                                    </span>
                                                </li>
                                            </ul>
                                        </Card.Body>
                                    </div>
                                </Card>

                                {/* Tags */}
                                {document.tags && document.tags.length > 0 && (
                                    <Card className="mt-3">
                                        <Card.Header>
                                            <a href="#fl_tags" role="button" data-bs-toggle="collapse" aria-expanded="true">
                                                Tags
                                            </a>
                                        </Card.Header>
                                        <div id="fl_tags" className="collapse show">
                                            <Card.Body>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {document.tags.map((tag, index) => (
                                                        <HkBadge key={index} bg="primary" soft>
                                                            {tag}
                                                        </HkBadge>
                                                    ))}
                                                </div>
                                            </Card.Body>
                                        </div>
                                    </Card>
                                )}

                                {/* Descrição */}
                                {document.description && (
                                    <Card className="mt-3">
                                        <Card.Header>
                                            <a href="#fl_desc" role="button" data-bs-toggle="collapse" aria-expanded="true">
                                                Descrição
                                            </a>
                                        </Card.Header>
                                        <div id="fl_desc" className="collapse show">
                                            <Card.Body>
                                                <p className="text-muted">{document.description}</p>
                                            </Card.Body>
                                        </div>
                                    </Card>
                                )}

                                {/* Compartilhado com */}
                                <Card className="mt-3">
                                    <Card.Header>
                                        <a href="#fl_share" role="button" data-bs-toggle="collapse" aria-expanded="false">
                                            Compartilhado com
                                        </a>
                                    </Card.Header>
                                    <div id="fl_share" className="collapse">
                                        <Card.Body>
                                            {document.sharedWith && document.sharedWith.length > 0 ? (
                                                <p className="text-muted">
                                                    Compartilhado com {document.sharedWith.length} pessoa(s)
                                                </p>
                                            ) : (
                                                <p className="text-muted">Não compartilhado</p>
                                            )}
                                        </Card.Body>
                                    </div>
                                </Card>

                                {/* Configurações/Ações */}
                                <Card className="mt-3">
                                    <Card.Header>
                                        <a href="#fl_sett" role="button" data-bs-toggle="collapse" aria-expanded="true">
                                            Configurações
                                        </a>
                                    </Card.Header>
                                    <div id="fl_sett" className="collapse show">
                                        <Card.Body>
                                            <ul className="file-sett">
                                                <li>
                                                    <button
                                                        type="button"
                                                        className="btn btn-link p-0 text-start"
                                                        onClick={handleDownload}
                                                    >
                                                        <Icons.Download size={16} className="me-2" />
                                                        <span>Baixar Documento</span>
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        type="button"
                                                        className="btn btn-link p-0 text-start"
                                                        onClick={handleToggleFavorite}
                                                    >
                                                        <Icons.Star size={16} className="me-2" />
                                                        <span>
                                                            {document.isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                                                        </span>
                                                    </button>
                                                </li>
                                                <li>
                                                    <button
                                                        type="button"
                                                        className="btn btn-link p-0 text-start"
                                                        onClick={handleDelete}
                                                        style={{ opacity: isDeleting ? 0.5 : 1 }}
                                                    >
                                                        <Icons.Trash2 size={16} className="me-2" />
                                                        <span className="text-danger">
                                                            {isDeleting ? 'Excluindo...' : 'Excluir Documento'}
                                                        </span>
                                                    </button>
                                                </li>
                                            </ul>
                                        </Card.Body>
                                    </div>
                                </Card>
                            </div>
                        </Tab.Pane>

                        {/* Tab: Atividade */}
                        <Tab.Pane eventKey="tabActivity">
                            <Card>
                                <Card.Body>
                                    <p className="text-muted">
                                        Histórico de atividades em breve...
                                    </p>
                                </Card.Body>
                            </Card>
                        </Tab.Pane>

                        {/* Tab: Versões */}
                        <Tab.Pane eventKey="tabVersions">
                            <Card>
                                <Card.Body>
                                    <div className="fm-info">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div>
                                                <strong>Versão {document.version || 1}.0</strong>
                                                <div className="text-muted small">
                                                    {formatDate(document.uploadedAt)}
                                                </div>
                                            </div>
                                            <HkBadge bg="primary">Atual</HkBadge>
                                        </div>
                                        {document.versions && document.versions.length > 1 ? (
                                            <p className="text-muted">
                                                {document.versions.length} versão(ões) disponível(is)
                                            </p>
                                        ) : (
                                            <p className="text-muted">
                                                Esta é a primeira versão do documento
                                            </p>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </SimpleBar>
        </div>
    );
};

export default DocumentInfo;
