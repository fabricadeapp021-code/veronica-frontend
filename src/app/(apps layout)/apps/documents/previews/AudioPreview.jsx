'use client'
import { useState } from 'react';
import { Alert } from 'react-bootstrap';
import * as Icons from 'react-feather';

const AudioPreview = ({ url, fileName }) => {
    const [error, setError] = useState(false);

    const handleError = () => {
        setError(true);
        console.error('Erro ao carregar áudio:', url);
    };

    if (error) {
        return (
            <Alert variant="warning" className="mb-3">
                <Icons.AlertCircle size={18} className="me-2" />
                Não foi possível carregar o preview do áudio. 
                <a href={url} target="_blank" rel="noopener noreferrer" className="ms-2">
                    Abrir em nova aba
                </a>
            </Alert>
        );
    }

    return (
        <div className="audio-preview-container mb-4">
            <div className="mb-2">
                <small className="text-muted">
                    <Icons.Music size={16} className="me-1" />
                    Preview do Áudio
                </small>
            </div>
            
            <div className="audio-wrapper" style={{ 
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
            }}>
                <div className="text-center mb-3">
                    <Icons.Music size={48} className="text-primary" />
                </div>
                
                <audio
                    controls
                    controlsList="nodownload"
                    onError={handleError}
                    style={{
                        width: '100%',
                        outline: 'none'
                    }}
                >
                    <source src={url} type="audio/mpeg" />
                    <source src={url} type="audio/wav" />
                    <source src={url} type="audio/ogg" />
                    <source src={url} type="audio/mp4" />
                    Seu navegador não suporta a reprodução de áudio.
                </audio>
            </div>
            
            <div className="mt-2">
                <small className="text-muted">
                    {fileName}
                </small>
            </div>
        </div>
    );
};

export default AudioPreview;

