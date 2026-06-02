'use client';
import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { FileText, Plus, RefreshCw, Search } from 'react-feather';
import { nfesService } from '@/lib/api/services/nfes';

const fmtCurrency = (v) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-';
const fmtDate = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';

function StatusBadge({ status }) {
  const color = { autorizada: 'success', externa: 'secondary', erro: 'danger', processando: 'primary', rascunho: 'warning' }[status] || 'secondary';
  return <Badge bg={color}>{status || '-'}</Badge>;
}

function CreateModal({ show, onHide, onDone }) {
  const [form, setForm] = useState({ nfeNumber: '', chaveAcesso: '', emitenteNome: '', destinatarioNome: '', valorTotal: '', pesoKg: '', produtoPredominante: '', ncm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const chave = form.chaveAcesso.replace(/\D/g, '');
    if (chave && chave.length !== 44) { setError('Chave NF-e deve ter 44 dígitos.'); return; }
    setSaving(true); setError('');
    try {
      await nfesService.create({
        nfeNumber: form.nfeNumber || undefined,
        chaveAcesso: chave || undefined,
        status: chave ? 'externa' : 'rascunho',
        emitente: form.emitenteNome ? { nome: form.emitenteNome } : undefined,
        destinatario: form.destinatarioNome ? { nome: form.destinatarioNome } : undefined,
        valorTotal: form.valorTotal ? Number(form.valorTotal) : undefined,
        pesoKg: form.pesoKg ? Number(form.pesoKg) : undefined,
        produtoPredominante: form.produtoPredominante || undefined,
        ncm: form.ncm || undefined,
      });
      onDone(); onHide();
    } catch (err) { setError(err?.message || 'Erro ao criar NF-e.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton><Modal.Title>Registrar NF-e</Modal.Title></Modal.Header>
      <Form onSubmit={submit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="row g-2">
            <div className="col-md-4"><Form.Label>Número</Form.Label><Form.Control size="sm" value={form.nfeNumber} onChange={e => set('nfeNumber', e.target.value)} placeholder="opcional" /></div>
            <div className="col-md-8"><Form.Label>Chave de acesso</Form.Label><Form.Control size="sm" value={form.chaveAcesso} onChange={e => set('chaveAcesso', e.target.value.replace(/\D/g, ''))} maxLength={44} placeholder="44 dígitos" /></div>
            <div className="col-md-6"><Form.Label>Emitente</Form.Label><Form.Control size="sm" value={form.emitenteNome} onChange={e => set('emitenteNome', e.target.value)} /></div>
            <div className="col-md-6"><Form.Label>Destinatário</Form.Label><Form.Control size="sm" value={form.destinatarioNome} onChange={e => set('destinatarioNome', e.target.value)} /></div>
            <div className="col-md-3"><Form.Label>Valor</Form.Label><Form.Control size="sm" type="number" value={form.valorTotal} onChange={e => set('valorTotal', e.target.value)} /></div>
            <div className="col-md-3"><Form.Label>Peso kg</Form.Label><Form.Control size="sm" type="number" value={form.pesoKg} onChange={e => set('pesoKg', e.target.value)} /></div>
            <div className="col-md-4"><Form.Label>Produto</Form.Label><Form.Control size="sm" value={form.produtoPredominante} onChange={e => set('produtoPredominante', e.target.value)} /></div>
            <div className="col-md-2"><Form.Label>NCM</Form.Label><Form.Control size="sm" value={form.ncm} onChange={e => set('ncm', e.target.value)} /></div>
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

export default function NfesBody() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await nfesService.list({ q, limit: 50 });
      setItems(res?.data?.items || res?.items || []);
    } catch (err) { setError(err?.message || 'Erro ao carregar NF-e.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div><h4 className="mb-0">NF-e</h4><div className="text-muted small">Notas de mercadoria disponíveis para CT-e</div></div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} className="me-1" /> Registrar NF-e</Button>
      </div>
      <Card>
        <Card.Body>
          <div className="d-flex gap-2 mb-3">
            <div className="input-group input-group-sm" style={{ maxWidth: 360 }}><span className="input-group-text"><Search size={14} /></span><Form.Control value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar número, chave ou parte" /></div>
            <Button size="sm" variant="outline-secondary" onClick={load}><RefreshCw size={14} /></Button>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? <div className="py-5 text-center"><Spinner /></div> : (
            <Table responsive hover size="sm" className="align-middle">
              <thead><tr><th>Número</th><th>Status</th><th>Chave</th><th>Emitente</th><th>Destinatário</th><th>Valor</th><th>Emissão</th></tr></thead>
              <tbody>
                {items.map(n => <tr key={n._id}><td className="fw-semibold"><FileText size={13} className="me-1" />{n.nfeNumber}</td><td><StatusBadge status={n.status} /></td><td className="font-monospace small">{n.chaveAcesso || '-'}</td><td>{n.emitente?.nome || '-'}</td><td>{n.destinatario?.nome || '-'}</td><td>{fmtCurrency(n.valorTotal)}</td><td>{fmtDate(n.dataEmissao || n.createdAt)}</td></tr>)}
                {!items.length && <tr><td colSpan={7} className="text-center text-muted py-4">Nenhuma NF-e encontrada.</td></tr>}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      <CreateModal show={showCreate} onHide={() => setShowCreate(false)} onDone={load} />
    </div>
  );
}
