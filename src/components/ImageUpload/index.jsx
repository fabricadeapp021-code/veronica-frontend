'use client';

import { useRef, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { Upload, X, Image as ImageIcon, Link } from 'react-feather';
import { apiRequest } from '@/lib/api/client';
import { useColorMode } from '@/hooks/useColorMode';

/**
 * Componente de upload de imagem com drag-and-drop, preview e fallback por URL.
 *
 * Props:
 *   value       {string}   URL atual da imagem
 *   onChange    {fn}       chamado com a nova URL após upload ou digitação
 *   label       {string}   label acima do componente
 *   hint        {string}   texto de ajuda abaixo
 *   folder      {string}   pasta no storage (ex: "party-logos")
 *   disabled    {boolean}  desativa interações
 *   previewSize {number}   tamanho do preview em px (padrão 80)
 */
export default function ImageUpload({
  value = '',
  onChange,
  label,
  hint,
  folder = 'party-logos',
  disabled = false,
  previewSize = 80,
}) {
  const { isDark } = useColorMode();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState(value);

  const bg = isDark ? '#1e2130' : '#f8f9fa';
  const border = dragging
    ? '#0d6efd'
    : isDark ? '#2a2f3d' : '#dee2e6';
  const textColor = isDark ? '#c9d1e0' : '#495057';
  const mutedColor = isDark ? '#5a6480' : '#6c757d';

  async function uploadFile(file) {
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setError('Formato não suportado. Use JPEG, PNG, WebP, GIF ou SVG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Tamanho máximo: 5 MB.');
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', folder);
      form.append('public', 'true');

      const res = await apiRequest('/storage/upload', { method: 'POST', body: form });
      // Formato padrão: { success: true, file: { url, path, size, ... } }
      if (!res?.success || !res?.file?.url) throw new Error('Resposta inválida do servidor');
      onChange?.(res.file.url);
      setUrlDraft(res.file.url);
      setShowUrlInput(false);
    } catch (err) {
      setError(err?.message || 'Erro ao fazer upload. Tente novamente.');
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files) {
    if (disabled || uploading) return;
    const file = files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleUrlConfirm() {
    const trimmed = urlDraft.trim();
    onChange?.(trimmed);
    setShowUrlInput(false);
  }

  function handleClear() {
    onChange?.('');
    setUrlDraft('');
    setError(null);
    setShowUrlInput(false);
  }

  return (
    <div className="mb-1">
      {label && (
        <label className="form-label fw-semibold" style={{ color: textColor }}>
          {label}
        </label>
      )}

      <div className="d-flex align-items-start gap-3 flex-wrap">
        {/* Preview */}
        <div
          style={{
            width: previewSize,
            height: previewSize,
            borderRadius: 10,
            border: `1.5px solid ${border}`,
            background: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {!disabled && (
                <button
                  onClick={handleClear}
                  title="Remover imagem"
                  style={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(220,53,69,0.85)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <X size={11} color="#fff" />
                </button>
              )}
            </>
          ) : (
            <ImageIcon size={28} color={mutedColor} />
          )}
        </div>

        {/* Dropzone + ações */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {/* Dropzone */}
          {!disabled && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && inputRef.current?.click()}
              style={{
                border: `2px dashed ${border}`,
                borderRadius: 8,
                background: dragging ? (isDark ? '#1a2540' : '#e8f0fe') : bg,
                padding: '10px 14px',
                cursor: disabled ? 'default' : 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
                color: mutedColor,
                fontSize: 13,
              }}
            >
              {uploading ? (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <Spinner animation="border" size="sm" />
                  <span>Enviando...</span>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <Upload size={15} />
                  <span>
                    {dragging ? 'Solte aqui' : 'Arraste ou clique para fazer upload'}
                  </span>
                </div>
              )}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
            disabled={disabled || uploading}
          />

          {/* Botão de URL manual */}
          {!disabled && (
            <div className="mt-2">
              {showUrlInput ? (
                <div className="d-flex gap-2">
                  <input
                    type="url"
                    className="form-control form-control-sm"
                    placeholder="https://..."
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlConfirm()}
                    autoFocus
                    style={{
                      background: isDark ? '#13151a' : '#fff',
                      color: textColor,
                      borderColor: border,
                    }}
                  />
                  <Button size="sm" variant="primary" onClick={handleUrlConfirm}>OK</Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => { setShowUrlInput(false); setUrlDraft(value); }}>
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowUrlInput(true); setUrlDraft(value); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: mutedColor,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Link size={12} />
                  Ou cole uma URL
                </button>
              )}
            </div>
          )}

          {/* Hint */}
          {hint && !error && (
            <div style={{ fontSize: 12, color: mutedColor, marginTop: 4 }}>{hint}</div>
          )}

          {/* Erro */}
          {error && (
            <div style={{ fontSize: 12, color: '#dc3545', marginTop: 4 }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
