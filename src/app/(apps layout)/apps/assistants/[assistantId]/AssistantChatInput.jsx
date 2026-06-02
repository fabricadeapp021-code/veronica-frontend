'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { Paperclip, Send } from 'react-feather';

/**
 * Input de mensagem fixo no rodapé (tipo ChatGPT)
 */
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
const ACCEPTED_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.pdf', '.txt'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const AssistantChatInput = forwardRef(({ onSendMessage, onAttachFiles }, ref) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [previewUrls, setPreviewUrls] = useState({});
  const fileInputRef = useRef(null);

  const handleSend = async () => {
    if (sending) return;
    if (!message.trim() && selectedFiles.length === 0) return;

    const messageToSend = message.trim();
    setMessage('');
    setSending(true);

    try {
      await onSendMessage(messageToSend, selectedFiles);
      setSelectedFiles([]);
      setPreviewUrls((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        return {};
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Erro ao enviar:', err);
    } finally {
      setSending(false);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (size) => {
    if (size == null) return '';
    if (size < 1024) return `${size} B`;
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getFileTypeLabel = (file) => {
    if (file.type === 'application/pdf') return 'PDF';
    if (file.type === 'text/plain') return 'TXT';
    if (file.type === 'image/jpeg') return 'JPEG';
    if (file.type === 'image/png') return 'PNG';
    return file.type || 'Arquivo';
  };

  const validateFiles = (files) => {
    const nextFiles = [];
    const errors = [];

    files.forEach((file) => {
      const hasValidType =
        ACCEPTED_FILE_TYPES.includes(file.type) ||
        ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!hasValidType) {
        errors.push(`Tipo inválido: ${file.name}`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`Arquivo muito grande (máx. 10 MB): ${file.name}`);
        return;
      }
      nextFiles.push(file);
    });

    return { nextFiles, errors };
  };

  const getFileKey = (file) =>
    `${file.name}-${file.size}-${file.lastModified}`;

  const addFiles = (incoming) => {
    if (!incoming.length) return;
    const { nextFiles, errors } = validateFiles(incoming);
    setFileErrors(errors);
    if (!nextFiles.length) return;

    setSelectedFiles((prev) => {
      const merged = [...prev, ...nextFiles];
      if (onAttachFiles) onAttachFiles(merged);
      return merged;
    });

    setPreviewUrls((prev) => {
      const next = { ...prev };
      nextFiles.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const key = getFileKey(file);
          if (!next[key]) {
            next[key] = URL.createObjectURL(file);
          }
        }
      });
      return next;
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return next;
    });
    setPreviewUrls((prev) => {
      const next = { ...prev };
      const file = selectedFiles[index];
      if (file && file.type.startsWith('image/')) {
        const key = getFileKey(file);
        if (next[key]) {
          URL.revokeObjectURL(next[key]);
          delete next[key];
        }
      }
      return next;
    });
  };

  useImperativeHandle(ref, () => ({
    addFiles,
  }));

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        borderTop: '1px solid #e7eaf0',
        backgroundColor: '#fff',
        padding: '1rem 1.5rem',
      }}
    >
      {selectedFiles.length > 0 && (
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto 0.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.4rem 0.7rem',
                borderRadius: '12px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e7eaf0',
                fontSize: '0.75rem',
                color: '#495057',
                minWidth: '140px',
              }}
            >
              {file.type.startsWith('image/') ? (
                <img
                  src={previewUrls[getFileKey(file)]}
                  alt={file.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    objectFit: 'cover',
                    border: '1px solid #dee2e6',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#e9ecef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    color: '#6c757d',
                    border: '1px solid #dee2e6',
                  }}
                >
                  {getFileTypeLabel(file)}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600 }}>{file.name}</span>
                <span style={{ color: '#6c757d' }}>
                  {getFileTypeLabel(file)} · {formatFileSize(file.size)}
                </span>
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                style={{
                  padding: 0,
                  lineHeight: 1,
                  textDecoration: 'none',
                  color: '#6c757d',
                  marginLeft: 'auto',
                }}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}

      {fileErrors.length > 0 && (
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto 0.5rem',
            fontSize: '0.75rem',
            color: '#dc3545',
          }}
        >
          {fileErrors.map((err, index) => (
            <div key={`${err}-${index}`}>{err}</div>
          ))}
        </div>
      )}

      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-end',
        }}
      >
        <div style={{ flex: 1, position: 'relative' }}>
          <Form.Control
            as="textarea"
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={sending}
            style={{
              resize: 'none',
              borderRadius: '12px',
              padding: '0.875rem 1rem',
              border: '1px solid #e7eaf0',
              fontSize: '0.95rem',
              minHeight: '48px',
              maxHeight: '200px',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpeg,.jpg,.png,.pdf,.txt"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Button
            variant="light"
            onClick={handleAttachClick}
            disabled={sending}
            aria-label="Anexar arquivo"
            style={{
              borderRadius: '12px',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              border: '1px solid #e7eaf0',
            }}
          >
            <Paperclip size={18} />
          </Button>
        </div>

        <Button
          variant="primary"
          onClick={handleSend}
          disabled={sending || (!message.trim() && selectedFiles.length === 0)}
          style={{
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <Send size={18} />
        </Button>
      </div>

      <div
        className="text-center mt-2"
        style={{ fontSize: '0.7rem', color: '#6c757d' }}
      >
        Pressione Enter para enviar, Shift+Enter para nova linha
      </div>
    </div>
  );
});

export default AssistantChatInput;
