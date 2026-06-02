'use client'
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, ProgressBar, Badge } from 'react-bootstrap';
import * as Icons from 'react-feather';
import documentsAPI from '@/lib/api/services/documents';
import { DOCUMENT_CATEGORIES, CATEGORY_GROUPS } from './constants';

const UploadModal = ({ show, onHide, onUploadSuccess, initialCategory }) => {
  const DEFAULT_CATEGORY = 'telemetria_eventos';

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(initialCategory || DEFAULT_CATEGORY);
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (show) {
      setCategory(initialCategory || DEFAULT_CATEGORY);
    }
  }, [show, initialCategory]);

  const [isFavorite, setIsFavorite] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [lastUploadRagId, setLastUploadRagId] = useState(null);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ];

  const MAX_FILE_SIZE = {
    video: 500 * 1024 * 1024,
    audio: 100 * 1024 * 1024,
    image: 10 * 1024 * 1024,
    document: 50 * 1024 * 1024,
    archive: 100 * 1024 * 1024,
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    return 'document';
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError(`Tipo de arquivo não permitido: ${selectedFile.type}`);
      setFile(null);
      return;
    }

    const fileType = getFileType(selectedFile.type);
    const maxSize = MAX_FILE_SIZE[fileType];
    if (selectedFile.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);
      setError(`Arquivo muito grande. Máximo: ${maxSizeMB} MB para arquivos de ${fileType}`);
      setFile(null);
      return;
    }

    setFile(selectedFile);

    if (!title) {
      const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(fileNameWithoutExt);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!file) {
      setError('Selecione um arquivo para fazer upload');
      return;
    }

    if (!title.trim()) {
      setError('O título é obrigatório');
      return;
    }

    if (!category) {
      setError('Selecione uma categoria');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const metadata = {
        title: title.trim(),
        description: description.trim(),
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        isFavorite,
      };

      const response = await documentsAPI.upload(file, metadata, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      setSuccess(true);
      setUploadProgress(100);
      setLastUploadRagId(response?.ragDocumentId || null);

      setTimeout(() => {
        resetForm();
        if (onUploadSuccess) onUploadSuccess(response);
        onHide();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Erro ao fazer upload do documento');
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setCategory(DEFAULT_CATEGORY);
    setTags('');
    setIsFavorite(false);
    setUploading(false);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    setLastUploadRagId(null);
  };

  const handleClose = () => {
    if (!uploading) {
      resetForm();
      onHide();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton={!uploading}>
        <Modal.Title>
          <Icons.UploadCloud size={24} className="me-2" />
          Upload de Documento
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <Icons.AlertCircle size={18} className="me-2" />
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success">
              <Icons.CheckCircle size={18} className="me-2" />
              Upload realizado com sucesso!
              {lastUploadRagId && (
                <div className="mt-2 small">Documento indexado no RAG. Você já pode perguntar sobre ele ao agente.</div>
              )}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Arquivo *</Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.avi,.mkv,.mp3,.wav,.m4a,.zip,.rar,.7z"
            />
            {file && (
              <div className="mt-2 p-2 border rounded bg-light">
                <small className="text-muted d-flex align-items-center">
                  <Icons.File size={16} className="me-2" />
                  <span className="me-2">{file.name}</span>
                  <Badge bg="secondary">{formatFileSize(file.size)}</Badge>
                </small>
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Título *</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              maxLength={255}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Descrição (Opcional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Categoria *</Form.Label>
            <Form.Select value={category} onChange={(e) => setCategory(e.target.value)} disabled={uploading} required>
              {CATEGORY_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {DOCUMENT_CATEGORIES.filter((c) => c.group === group).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </optgroup>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tags (Opcional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: urgente, 2025, parceria"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={uploading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Marcar como favorito"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              disabled={uploading}
            />
          </Form.Group>

          {uploading && (
            <div className="mb-3">
              <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} animated striped variant={success ? 'success' : 'primary'} />
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={uploading}>Cancelar</Button>
          <Button type="submit" disabled={uploading || !file}> 
            {uploading ? 'Enviando...' : 'Fazer Upload'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UploadModal;
