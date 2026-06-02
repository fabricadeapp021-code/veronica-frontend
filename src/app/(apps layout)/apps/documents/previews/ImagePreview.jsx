'use client'
import { useState } from 'react';
import { Alert, Button, Modal } from 'react-bootstrap';
import * as Icons from 'react-feather';

const ImagePreview = ({ url, fileName }) => {
    const [error, setError] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);
    const [zoom, setZoom] = useState(1);

    const handleError = () => {
        setError(true);
        console.error('Erro ao carregar imagem:', url);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleResetZoom = () => {
        setZoom(1);
    };

    if (error) {
        return (
            <Alert variant="warning" className="mb-3">
                <Icons.AlertCircle size={18} className="me-2" />
                Não foi possível carregar o preview da imagem. 
                <a href={url} target="_blank" rel="noopener noreferrer" className="ms-2">
                    Abrir em nova aba
                </a>
            </Alert>
        );
    }

    return (
        <>
            <div className="image-preview-container mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">
                        <Icons.Image size={16} className="me-1" />
                        Preview da Imagem
                    </small>
                    <div className="btn-group btn-group-sm">
                        <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                        >
                            <Icons.ZoomOut size={16} />
                        </Button>
                        <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={handleResetZoom}
                            disabled={zoom === 1}
                        >
                            {Math.round(zoom * 100)}%
                        </Button>
                        <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                        >
                            <Icons.ZoomIn size={16} />
                        </Button>
                        <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => setShowLightbox(true)}
                        >
                            <Icons.Maximize size={16} />
                        </Button>
                    </div>
                </div>
                
                <div 
                    className="image-wrapper" 
                    style={{ 
                        maxHeight: '500px',
                        overflow: 'auto',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '10px',
                        cursor: 'pointer'
                    }}
                    onClick={() => setShowLightbox(true)}
                >
                    <img
                        src={url}
                        alt={fileName}
                        onError={handleError}
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            transform: `scale(${zoom})`,
                            transition: 'transform 0.2s ease',
                            borderRadius: '4px'
                        }}
                    />
                </div>
                
                <div className="mt-2">
                    <small className="text-muted">
                        {fileName}
                    </small>
                </div>
            </div>

            {/* Lightbox Modal */}
            <Modal 
                show={showLightbox} 
                onHide={() => setShowLightbox(false)}
                size="xl"
                centered
                className="image-lightbox"
            >
                <Modal.Header closeButton className="border-0">
                    <Modal.Title>{fileName}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0" style={{ backgroundColor: '#000' }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        minHeight: '70vh'
                    }}>
                        <img
                            src={url}
                            alt={fileName}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '80vh',
                                objectFit: 'contain'
                            }}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowLightbox(false)}
                    >
                        Fechar
                    </Button>
                    <Button 
                        variant="primary" 
                        href={url} 
                        target="_blank"
                    >
                        <Icons.ExternalLink size={16} className="me-2" />
                        Abrir em Nova Aba
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default ImagePreview;

