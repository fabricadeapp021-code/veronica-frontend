'use client';
import { useState, useEffect, useCallback } from 'react';
import { entregasService } from '@/lib/api/services/entregas';

const STATUS_LABELS = {
  pending:   { label: 'Pendente',  color: 'bg-yellow-100 text-yellow-800' },
  delivered: { label: 'Entregue',  color: 'bg-green-100 text-green-800' },
  partial:   { label: 'Parcial',   color: 'bg-blue-100 text-blue-800' },
  refused:   { label: 'Recusada',  color: 'bg-red-100 text-red-800' },
  returned:  { label: 'Devolvida', color: 'bg-gray-100 text-gray-800' },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

// ─── Confirm POD Modal ──────────────────────────────────────────────────────
function ConfirmModal({ entrega, onClose, onDone }) {
  const [form, setForm] = useState({
    recipientName: '',
    recipientDocument: '',
    recipientRole: '',
    totalQuantity: '',
    receivedQuantity: '',
    notes: '',
  });
  const [divergences, setDivergences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addDivergence = () =>
    setDivergences(d => [...d, { type: 'shortage', description: '', quantity: '' }]);

  const removeDivergence = idx =>
    setDivergences(d => d.filter((_, i) => i !== idx));

  const updateDiv = (idx, field, value) =>
    setDivergences(d => d.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.recipientName.trim()) { setError('Nome do receptor é obrigatório'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        recipient: {
          name:     form.recipientName.trim(),
          document: form.recipientDocument || undefined,
          role:     form.recipientRole     || undefined,
        },
        cargo: (form.totalQuantity || form.receivedQuantity) ? {
          totalQuantity:    form.totalQuantity    ? Number(form.totalQuantity)    : undefined,
          receivedQuantity: form.receivedQuantity ? Number(form.receivedQuantity) : undefined,
        } : undefined,
        divergences: divergences
          .filter(d => d.description.trim())
          .map(d => ({ type: d.type, description: d.description, quantity: d.quantity ? Number(d.quantity) : undefined })),
        notes: form.notes || undefined,
      };
      await entregasService.confirm(entrega._id, payload);
      onDone();
    } catch (err) {
      setError(err?.message ?? err?.response?.data?.message ?? 'Erro ao confirmar entrega');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-1">Confirmar Entrega (POD)</h2>
          <p className="text-sm text-gray-500 mb-4">{entrega.entregaNumber} — Frete {entrega.freteNumber}</p>
          {error && <p className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="border rounded p-3">
              <legend className="text-xs font-medium text-gray-600 px-1">Receptor</legend>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Nome *</label>
                  <input className="w-full border rounded px-3 py-1.5 text-sm" required
                    value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">CPF/RG</label>
                  <input className="w-full border rounded px-3 py-1.5 text-sm"
                    value={form.recipientDocument} onChange={e => setForm(f => ({ ...f, recipientDocument: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cargo/Função</label>
                  <input className="w-full border rounded px-3 py-1.5 text-sm"
                    value={form.recipientRole} onChange={e => setForm(f => ({ ...f, recipientRole: e.target.value }))} />
                </div>
              </div>
            </fieldset>

            <fieldset className="border rounded p-3">
              <legend className="text-xs font-medium text-gray-600 px-1">Carga recebida</legend>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Qtd total</label>
                  <input type="number" min="0" className="w-full border rounded px-3 py-1.5 text-sm"
                    value={form.totalQuantity} onChange={e => setForm(f => ({ ...f, totalQuantity: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Qtd recebida</label>
                  <input type="number" min="0" className="w-full border rounded px-3 py-1.5 text-sm"
                    value={form.receivedQuantity} onChange={e => setForm(f => ({ ...f, receivedQuantity: e.target.value }))} />
                </div>
              </div>
            </fieldset>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Divergências</span>
                <button type="button" onClick={addDivergence}
                  className="text-xs text-blue-600 hover:underline">+ Adicionar</button>
              </div>
              {divergences.map((d, idx) => (
                <div key={idx} className="border rounded p-2 mb-2 bg-red-50 space-y-2">
                  <div className="flex gap-2">
                    <select className="border rounded px-2 py-1 text-xs flex-1" value={d.type}
                      onChange={e => updateDiv(idx, 'type', e.target.value)}>
                      <option value="shortage">Falta</option>
                      <option value="damage">Avaria</option>
                      <option value="excess">Excesso</option>
                      <option value="wrong_item">Item errado</option>
                      <option value="other">Outro</option>
                    </select>
                    <input type="number" min="0" placeholder="Qtd" className="border rounded px-2 py-1 text-xs w-20"
                      value={d.quantity} onChange={e => updateDiv(idx, 'quantity', e.target.value)} />
                    <button type="button" onClick={() => removeDivergence(idx)}
                      className="text-red-500 text-xs px-1">✕</button>
                  </div>
                  <input placeholder="Descrição" className="w-full border rounded px-2 py-1 text-xs" value={d.description}
                    onChange={e => updateDiv(idx, 'description', e.target.value)} />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Observações</label>
              <textarea rows={2} className="w-full border rounded px-3 py-1.5 text-sm"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Salvando…' : 'Confirmar Entrega'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Refuse Modal ────────────────────────────────────────────────────────────
function RefuseModal({ entrega, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!reason.trim()) { setError('Motivo é obrigatório'); return; }
    setLoading(true); setError('');
    try {
      await entregasService.refuse(entrega._id, { refusalReason: reason.trim(), notes: notes || undefined });
      onDone();
    } catch (err) {
      setError(err?.message ?? err?.response?.data?.message ?? 'Erro ao recusar entrega');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-1">Recusar Entrega</h2>
          <p className="text-sm text-gray-500 mb-4">{entrega.entregaNumber}</p>
          {error && <p className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Motivo da recusa *</label>
              <input className="w-full border rounded px-3 py-1.5 text-sm" required
                value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Observações</label>
              <textarea rows={2} className="w-full border rounded px-3 py-1.5 text-sm"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Salvando…' : 'Recusar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Attempt Modal ───────────────────────────────────────────────────────────
function AttemptModal({ entrega, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [note, setNote]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!reason.trim()) { setError('Motivo é obrigatório'); return; }
    setLoading(true); setError('');
    try {
      await entregasService.addAttempt(entrega._id, { reason: reason.trim(), note: note || undefined });
      onDone();
    } catch (err) {
      setError(err?.message ?? err?.response?.data?.message ?? 'Erro ao registrar tentativa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-1">Registrar Tentativa Frustrada</h2>
          <p className="text-sm text-gray-500 mb-4">{entrega.entregaNumber}</p>
          {error && <p className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Motivo *</label>
              <select className="w-full border rounded px-3 py-1.5 text-sm" value={reason}
                onChange={e => setReason(e.target.value)}>
                <option value="">Selecione…</option>
                <option value="Destinatário ausente">Destinatário ausente</option>
                <option value="Endereço não localizado">Endereço não localizado</option>
                <option value="Estabelecimento fechado">Estabelecimento fechado</option>
                <option value="Recusa sem motivo">Recusa sem motivo</option>
                <option value="Problema no acesso">Problema no acesso</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Observação</label>
              <textarea rows={2} className="w-full border rounded px-3 py-1.5 text-sm"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50">
                {loading ? 'Salvando…' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Create Entrega Modal ────────────────────────────────────────────────────
function CreateModal({ onClose, onDone }) {
  const [freteId, setFreteId]   = useState('');
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!freteId.trim()) { setError('ID do frete é obrigatório'); return; }
    setLoading(true); setError('');
    try {
      await entregasService.create({ freteId: freteId.trim(), notes: notes || undefined });
      onDone();
    } catch (err) {
      setError(err?.message ?? err?.response?.data?.message ?? 'Erro ao criar entrega');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Nova Entrega</h2>
          {error && <p className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ID do Frete *</label>
              <input className="w-full border rounded px-3 py-1.5 text-sm font-mono" required
                placeholder="Cole o _id do frete aqui"
                value={freteId} onChange={e => setFreteId(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">O frete deve estar em trânsito ou despachado</p>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Observações</label>
              <textarea rows={2} className="w-full border rounded px-3 py-1.5 text-sm"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Criando…' : 'Criar Entrega'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function EntregasBody() {
  const [entregas, setEntregas] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal]       = useState(null); // { type: 'confirm'|'refuse'|'attempt'|'create', entrega }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [listRes, statsRes] = await Promise.all([
        entregasService.list(params),
        entregasService.stats(),
      ]);
      setEntregas(listRes.data?.items ?? []);
      setStats(statsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDone = () => { setModal(null); load(); };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entregas</h1>
          <p className="text-sm text-gray-500 mt-1">Comprovante de entrega (POD)</p>
        </div>
        <button onClick={() => setModal({ type: 'create' })}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Nova Entrega
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { key: 'total',     label: 'Total',     value: stats.total,                           color: 'text-gray-900' },
            { key: 'pending',   label: 'Pendentes',  value: stats.byStatus?.pending   ?? 0,       color: 'text-yellow-700' },
            { key: 'delivered', label: 'Entregues',  value: stats.byStatus?.delivered ?? 0,       color: 'text-green-700' },
            { key: 'partial',   label: 'Parciais',   value: stats.byStatus?.partial   ?? 0,       color: 'text-blue-700' },
            { key: 'refused',   label: 'Recusadas',  value: stats.byStatus?.refused   ?? 0,       color: 'text-red-700' },
          ].map(s => (
            <div key={s.key} className="bg-white border rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {['', 'pending', 'delivered', 'partial', 'refused', 'returned'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}>
            {s === '' ? 'Todos' : STATUS_LABELS[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando…</div>
        ) : entregas.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhuma entrega encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Número', 'Frete', 'Destino', 'Status', 'Receptor', 'Entregue em', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entregas.map(e => (
                  <tr key={e._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{e.entregaNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs">{e.freteNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {e.address?.city && e.address?.state
                        ? `${e.address.city}/${e.address.state}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3 text-xs">{e.recipient?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {e.deliveredAt ? new Date(e.deliveredAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {e.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => setModal({ type: 'confirm', entrega: e })}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
                            Confirmar
                          </button>
                          <button onClick={() => setModal({ type: 'attempt', entrega: e })}
                            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
                            Tentativa
                          </button>
                          <button onClick={() => setModal({ type: 'refuse', entrega: e })}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                            Recusar
                          </button>
                        </div>
                      )}
                      {e.status !== 'pending' && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'create'  && <CreateModal onClose={() => setModal(null)} onDone={handleDone} />}
      {modal?.type === 'confirm' && <ConfirmModal entrega={modal.entrega} onClose={() => setModal(null)} onDone={handleDone} />}
      {modal?.type === 'refuse'  && <RefuseModal  entrega={modal.entrega} onClose={() => setModal(null)} onDone={handleDone} />}
      {modal?.type === 'attempt' && <AttemptModal entrega={modal.entrega} onClose={() => setModal(null)} onDone={handleDone} />}
    </div>
  );
}
