'use client'
import { useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import * as Icons from 'react-feather';

const PDFPreview = ({ url, fileName }) => {
    const [error, setError] = useState(false);

    const handleError = () => {
        setError(true);
        console.error('Erro ao carregar PDF:', url);
    };

    const openInNewTab = () => {
        window.open(url, '_blank');
    };

    if (error) {
        return (
            <Alert variant="warning" className="mb-3">
                <Icons.AlertCircle size={18} className="me-2" />
                Não foi possível carregar o preview do PDF. 
                <Button 
                    variant="link" 
                    size="sm" 
                    onClick={openInNewTab}
                    className="p-0 ms-2"
                >
                    Abrir em nova aba
                </Button>
            </Alert>
        );
    }

    return (
        <div className="pdf-preview-container mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted">
                    <Icons.FileText size={16} className="me-1" />
                    Preview do PDF
                </small>
                <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={openInNewTab}
                >
                    <Icons.ExternalLink size={16} className="me-1" />
                    Abrir em Nova Aba
                </Button>
            </div>
            
            <div className="pdf-wrapper" style={{ 
                position: 'relative',
                height: '600px',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#f8f9fa'
            }}>
                <iframe
                    src={url}
                    title={fileName}
                    onError={handleError}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none'
                    }}
                />
            </div>
            
            <div className="mt-2">
                <small className="text-muted">
                    {fileName}
                </small>
            </div>
            
            <Alert variant="info" className="mt-2 mb-0" dismissible>
                <small>
                    <Icons.Info size={14} className="me-1" />
                    Se o PDF não carregar, use o botão "Abrir em Nova Aba" ou faça download.
                </small>
            </Alert>
        </div>
    );
};

export default PDFPreview;

