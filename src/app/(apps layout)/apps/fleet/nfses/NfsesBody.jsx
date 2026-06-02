'use client';
import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { FileText, Plus, RefreshCw, Search } from 'react-feather';
import { nfsesService } from '@/lib/api/services/nfses';

const fmtCurrency = (v) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-';
const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';

function StatusBadge({ status }) {
  const color = { autorizada: 'success', externa: 'secondary', erro: 'danger', processando: 'primary', rascunho: 'warning' }[status] || 'secondary';
  return <Badge bg={color}>{status || '-'}</Badge>;
}

function CreateModal({ show, onHide, onDone }) {
  const [form, setForm] = useState({ nfseNumber: '', codigoVerificacao: '', prestadorNome: '', tomadorNome: '', municipioPrestacao: '', ufPrestacao: '', valorServico: '', discriminacao: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await nfsesService.create({
        nfseNumber: form.nfseNumber || undefined,
        codigoVerificacao: form.codigoVerificacao || undefined,
        status: 'externa',
        prestador: form.prestadorNome ? { nome: form.prestadorNome } : undefined,
        tomador: form.tomadorNome ? { nome: form.tomadorNome } : undefined,
        municipioPrestacao: form.municipioPrestacao || undefined,
        ufPrestacao: form.ufPrestacao || undefined,
        valorServico: form.valorServico ? Number(form.valorServico) : undefined,
        discriminacao: form.discriminacao || undefined,
      });
      onDone(); onHide();
    } catch (err) { setError(err?.message || 'Erro ao criar NFS-e.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton><Modal.Title>Registrar NFS-e</Modal.Title></Modal.Header>
      <Form onSubmit={submit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="row g-2">
            <div className="col-md-4"><Form.Label>Número</Form.Label><Form.Control size="sm" value={form.nfseNumber} onChange={e => set('nfseNumber', e.target.value)} placeholder="opcional" /></div>
            <div className="col-md-4"><Form.Label>Código verificação</Form.Label><Form.Control size="sm" value={form.codigoVerificacao} onChange={e => set('codigoVerificacao', e.target.value)} /></div>
            <div className="col-md-3"><Form.Label>Município</Form.Label><Form.Control size="sm" value={form.municipioPrestacao} onChange={e => set('municipioPrestacao', e.target.value)} /></div>
            <div className="col-md-1"><Form.Label>UF</Form.Label><Form.Control size="sm" maxLength={2} value={form.ufPrestacao} onChange={e => set('ufPrestacao', e.target.value.toUpperCase())} /></div>
            <div className="col-md-6"><Form.Label>Prestador</Form.Label><Form.Control size="sm" value={form.prestadorNome} onChange={e => set('prestadorNome', e.target.value)} /></div>
            <div className="col-md-6"><Form.Label>Tomador</Form.Label><Form.Control size="sm" value={form.tomadorNome} onChange={e => set('tomadorNome', e.target.value)} /></div>
            <div className="col-md-3"><Form.Label>Valor</Form.Label><Form.Control size="sm" type="number" value={form.valorServico} onChange={e => set('valorServico', e.target.value)} /></div>
            <div className="col-md-9"><Form.Label>Discriminação</Form.Label><Form.Control size="sm" value={form.discriminacao} onChange={e => set('discriminacao', e.target.value)} /></div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={onHide}>Cancelar</Button>
          <Button type="submit" size="sm" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default function NfsesBody() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await nfsesService.list({ q, limit: 50 });
      setItems(res?.data?.items || res?.items || []);
    } catch (err) { setError(err?.message || 'Erro ao carregar NFS-e.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div><h4 className="mb-0">NFS-e</h4><div className="text-muted small">Notas de serviço para operações intramunicipais</div></div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} className="me-1" /> Registrar NFS-e</Button>
      </div>
      <Card>
        <Card.Body>
          <div className="d-flex gap-2 mb-3">
            <div className="input-group input-group-sm" style={{ maxWidth: 360 }}><span className="input-group-text"><Search size={14} /></span><Form.Control value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar número, código ou parte" /></div>
            <Button size="sm" variant="outline-secondary" onClick={load}><RefreshCw size={14} /></Button>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? <div className="py-5 text-center"><Spinner /></div> : (
            <Table responsive hover size="sm" className="align-middle">
              <thead><tr><th>Número</th><th>Status</th><th>Código</th><th>Prestador</th><th>Tomador</th><th>Município</th><th>Valor</th><th>Emissão</th></tr></thead>
              <tbody>
                {items.map(n => <tr key={n._id}><td className="fw-semibold"><FileText size={13} className="me-1" />{n.nfseNumber}</td><td><StatusBadge status={n.status} /></td><td className="font-monospace small">{n.codigoVerificacao || '-'}</td><td>{n.prestador?.nome || '-'}</td><td>{n.tomador?.nome || '-'}</td><td>{[n.municipioPrestacao, n.ufPrestacao].filter(Boolean).join('/') || '-'}</td><td>{fmtCurrency(n.valorServico)}</td><td>{fmtDate(n.dataEmissao || n.createdAt)}</td></tr>)}
                {!items.length && <tr><td colSpan={8} className="text-center text-muted py-4">Nenhuma NFS-e encontrada.</td></tr>}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      <CreateModal show={showCreate} onHide={() => setShowCreate(false)} onDone={load} />
    </div>
  );
}
