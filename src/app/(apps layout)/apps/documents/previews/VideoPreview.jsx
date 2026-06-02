'use client'
import { useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import * as Icons from 'react-feather';

const VideoPreview = ({ url, fileName }) => {
    const [error, setError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleError = () => {
        setError(true);
        console.error('Erro ao carregar vídeo:', url);
    };

    const toggleFullscreen = () => {
        const videoElement = document.getElementById('video-preview');
        if (!isFullscreen) {
            if (videoElement.requestFullscreen) {
                videoElement.requestFullscreen();
            } else if (videoElement.webkitRequestFullscreen) {
                videoElement.webkitRequestFullscreen();
            } else if (videoElement.msRequestFullscreen) {
                videoElement.msRequestFullscreen();
            }
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            setIsFullscreen(false);
        }
    };

    if (error) {
        return (
            <Alert variant="warning" className="mb-3">
                <Icons.AlertCircle size={18} className="me-2" />
                Não foi possível carregar o preview do vídeo. 
                <a href={url} target="_blank" rel="noopener noreferrer" className="ms-2">
                    Abrir em nova aba
                </a>
            </Alert>
        );
    }

    return (
        <div className="video-preview-container mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <small className="text-muted">
                    <Icons.Video size={16} className="me-1" />
                    Preview do Vídeo
                </small>
                <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={toggleFullscreen}
                >
                    <Icons.Maximize size={16} className="me-1" />
                    Fullscreen
                </Button>
            </div>
            
            <div className="video-wrapper" style={{ 
                position: 'relative', 
                paddingBottom: '56.25%', // 16:9 aspect ratio
                height: 0,
                overflow: 'hidden',
                borderRadius: '8px',
                backgroundColor: '#000'
            }}>
                <video
                    id="video-preview"
                    controls
                    controlsList="nodownload"
                    onError={handleError}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px'
                    }}
                >
                    <source src={url} type="video/mp4" />
                    <source src={url} type="video/webm" />
                    <source src={url} type="video/ogg" />
                    Seu navegador não suporta a reprodução de vídeo.
                </video>
            </div>
            
            <div className="mt-2">
                <small className="text-muted">
                    {fileName}
                </small>
            </div>
        </div>
    );
};

export default VideoPreview;

