'use client';
import { useState, useEffect, useCallback } from 'react';
import { mdfesService } from '@/lib/api/services/mdfes';

const UF_OPTIONS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

const STATUS_LABELS = {
  pendente:    { label: 'Pendente',    color: 'bg-yellow-100 text-yellow-800' },
  processando: { label: 'Processando', color: 'bg-blue-100 text-blue-800'    },
  autorizado:  { label: 'Autorizado',  color: 'bg-green-100 text-green-800'  },
  encerrado:   { label: 'Encerrado',   color: 'bg-gray-100 text-gray-800'    },
  cancelado:   { label: 'Cancelado',   color: 'bg-red-100 text-red-800'      },
  denegado:    { label: 'Denegado',    color: 'bg-orange-100 text-orange-800'},
  erro:        { label: 'Erro SEFAZ',  color: 'bg-rose-100 text-rose-800'    },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>
      {s.label}
    </span>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateModal({ onClose, onDone }) {
  const [form, setForm] = useState({
    freteId: '', romaneioId: '',
    ufCarregamento: '', municipioCarregamento: '',
    ufDescarregamento: '',
    veiculoPlaca: '', veiculoRntrc: '',
    motoristaCpf: '', motoristaNome: '',
    pesoBrutoTotal: '', valorCarga: '',
    cteKeys: '', observacoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.freteId.trim()) { setError('ID do frete é obrigatório'); return; }
    setLoading(true); setError('');
    try {
      await mdfesService.create({
        freteId:              form.freteId.trim(),
        romaneioId:           form.romaneioId.trim() || undefined,
        ufCarregamento:       form.ufCarregamento.trim().toUpperCase() || undefined,
        municipioCarregamento: form.municipioCarregamento.trim() || undefined,
        ufDescarregamento:    form.ufDescarregamento.trim()
          ? form.ufDescarregamento.split(',').map(s => s.trim().toUpperCase())
          : undefined,
        veiculoPlaca:  form.veiculoPlaca.trim().toUpperCase() || undefined,
        veiculoRntrc:  form.veiculoRntrc.trim() || undefined,
        motoristaCpf:  form.motoristaCpf.replace(/\D/g, '') || undefined,
        motoristaNome: form.motoristaNome.trim() || undefined,
        pesoBrutoTotal: form.pesoBrutoTotal ? Number(form.pesoBrutoTotal) : undefined,
        valorCarga:     form.valorCarga     ? Number(form.valorCarga)     : undefined,
        cteKeys: form.cteKeys.trim()
          ? form.cteKeys.split('\n').map(s => s.trim()).filter(Boolean)
          : [],
        observacoes: form.observacoes.trim() || undefined,
      });
      onDone();
    } catch (err) {
      setError(err?.message ?? err?.response?.data?.message ?? 'Erro ao criar MDF-e');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Novo MDF-e</h2>
          {error && <p className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ID do Frete *</label>
              <input className="w-full border rounded px-3 py-1.5 text-sm font-mono" required
                placeholder="Cole o _id do frete"
                value={form.freteId} onChange={e => set('freteId', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">UF Carregamento</label>
                <input maxLength={2} className="w-full border rounded px-3 py-1.5 text-sm uppercase"
                  placeholder="SP"
                  value={form.ufCarregamento} onChange={e => set('ufCarregamento', e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Município Carregamento</label>
                <input className="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="São Paulo"
                  value={form.municipioCarregamento} onChange={e => set('municipioCarregamento', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">UF(s) Descarregamento (separar por vírgula)</label>
              <input className="w-full border rounded px-3 py-1.5 text-sm uppercase"
                placeholder="RJ, MG"
                value={form.ufDescarregamento} onChange={e => set('ufDescarregamento', e.target.value.toUpperCase())} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Placa do Veículo</label>
                <input maxLength={8} className="w-full border rounded px-3 py-1.5 text-sm uppercase"
                  placeholder="ABC1D23"
                  value={form.veiculoPlaca} onChange={e => set('veiculoPlaca', e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">RNTRC</label>
                <input className="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="12345678"
                  value={form.veiculoRntrc} onChange={e => set('veiculoRntrc', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">CPF Motorista</label>
                <input className="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="000.000.000-00"
                  value={form.motoristaCpf} onChange={e => set('motoristaCpf', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Nome Motorista</label>
                <input className="w-full border rounded px-3 py-1.5 text-sm"
                  value={form.motoristaNome} onChange={e => set('motoristaNome', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Peso Bruto Total (kg)</label>
                <input type="number" step="0.01" min="0" className="w-full border rounded px-3 py-1.5 text-sm"
                  value={form.pesoBrutoTotal} onChange={e => set('pesoBrutoTotal', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Valor da Carga (R$)</label>
                <input type="number" step="0.01" min="0" className="w-full border rounded px-3 py-1.5 text-sm"
                  value={form.valorCarga} onChange={e => set('valorCarga', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Chaves CT-e (uma por linha)</label>
              <textarea rows={3} className="w-full border rounded px-3 py-1.5 text-xs font-mono"
                placeholder="44 dígitos por linha"
                value={form.cteKeys} onChange={e => set('cteKeys', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Observações</label>
              <textarea rows={2} className="w-full border rounded px-3 py-1.5 text-sm"
                value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Criando…' : 'Criar MDF-e'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Authorize Modal ──────────────────────────────────────────────────────────
function AuthorizeModal({ mdfe, onClose, onDone }) {
  const [chave, setChave]         = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    const digits = chave.replace(/\D/g, '');
    if (digits.length !== 44) { setError('A chave de acesso deve ter exatamente 44 dígitos'); return; }
    if (!protocolo.trim())    { setError('Número do protocolo é obrigatório'); return; }
    setLoading(true); setError('');
    try {
      await mdfesService.authorize(mdfe._id, { chaveAcesso: digits, protocolo: protocolo.trim() });
      onDone();
    } catch (err) {
      setError(err?.message ?? err?.response?.data?.message ?? 'Erro ao autorizar MDF-e');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-1">Autorizar MDF-e</h2>
          <p className="text-sm text-gray-500 mb-4">{mdfe.mdfNumber} — Frete {mdfe.freteNumber}</p>
          {error && <p className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Chave de acesso (44 dígitos) *</label>
              <input className="w-full border rounded px-3 py-1.5 text-sm font-mono" required
                placeholder="00000000000000000000000000000000000000000000"
                value={chave} onChange={e => setChave(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{chave.replace(/\D/g, '').length}/44 dígitos</p>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nº do protocolo SEFAZ *</label>
              <input className="w-full border rounded px-3 py-1.5 text-sm" required
                value={protocolo} onChange={e => setProtocolo(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                {loading ? 'Autorizando…' : 'Autorizar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Emitir Modal ─────────────────────────────────────────────────────────────
function EmitirModal({ mdfe, onClose, onDone }) {
  const now = new Date().toISOString().slice(0, 16);
  const [form, setForm] = useState({
    uf_carregamento: mdfe?.ufCarregamento ?? '',
    municipio_carregamento: mdfe?.municipioCarregamento ?? '',
    cod_municipio_carregamento: '',
    data_emissao: now,
    tipo_emitente: '1',
    tipo_transportador: '1',
    cnpj_emitente: '',
    inscricao_estadual_emitente: '',
    nome_emitente: '',
    logradouro_emitente: '',
    numero_emitente: '',
    bairro_emitente: '',
    municipio_emitente: '',
    uf_emitente: 'SP',
    cep_emitente: '',
    codigo_municipio_emitente: '',
    placa_veiculo: mdfe?.veiculoPlaca ?? '',
    rntrc_veiculo: mdfe?.veiculoRntrc ?? '',
    tara_veiculo: '',
    tipo_rodado: '01',
    tipo_carroceria: '00',
    cpf_condutor: mdfe?.motoristaCpf ?? '',
    nome_condutor: mdfe?.motoristaNome ?? '',
    uf_descarregamento: mdfe?.ufDescarregamento?.[0] ?? '',
    municipio_descarregamento: '',
    cod_municipio_descarregamento: '',
    chaves_cte: (mdfe?.cteKeys ?? []).join('\n'),
    peso_bruto_total: mdfe?.pesoBrutoTotal ?? '',
    quantidade_cte: mdfe?.totalCtes ?? mdfe?.cteKeys?.length ?? '',
    valor_total_carga: mdfe?.valorCarga ?? '',
    unidade_medida_peso: '01',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const Input = ({ label, k, type = 'text', required = false, maxLen, placeholder, className = '' }) => (
    <div className={className}>
      <label className="block text-xs text-gray-500 mb-0.5">{label}{required && ' *'}</label>
      <input type={type} required={required} maxLength={maxLen}
        placeholder={placeholder}
        className="w-full border rounded px-2 py-1 text-xs"
        value={form[k] ?? ''} onChange={e => set(k, e.target.value)} />
    </div>
  );
  const Select = ({ label, k, options }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
      <select className="w-full border rounded px-2 py-1 text-xs"
        value={form[k] ?? ''} onChange={e => set(k, e.target.value)}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const chaves = form.chaves_cte.split('\n').map(s => s.trim()).filter(Boolean);
      const payload = {
        uf_carregamento:          form.uf_carregamento.trim().toUpperCase(),
        municipio_carregamento:   form.municipio_carregamento.trim(),
        data_emissao:             form.data_emissao,
        tipo_emitente:            form.tipo_emitente,
        tipo_transportador:       form.tipo_transportador,
        cnpj_emitente:            form.cnpj_emitente.replace(/\D/g, ''),
        inscricao_estadual_emitente: form.inscricao_estadual_emitente.trim() || undefined,
        nome_emitente:            form.nome_emitente.trim(),
        logradouro_emitente:      form.logradouro_emitente.trim(),
        numero_emitente:          form.numero_emitente.trim(),
        bairro_emitente:          form.bairro_emitente.trim(),
        municipio_emitente:       form.municipio_emitente.trim(),
        uf_emitente:              form.uf_emitente.trim().toUpperCase(),
        cep_emitente:             form.cep_emitente.replace(/\D/g, ''),
        codigo_municipio_emitente: form.codigo_municipio_emitente.trim(),
        condutores: [{
          cpf_condutor:  form.cpf_condutor.replace(/\D/g, ''),
          nome_condutor: form.nome_condutor.trim(),
        }],
        placa_veiculo:   form.placa_veiculo.trim().toUpperCase(),
        rntrc_veiculo:   form.rntrc_veiculo.trim(),
        tara_veiculo:    form.tara_veiculo ? Number(form.tara_veiculo) : undefined,
        tipo_rodado:     form.tipo_rodado,
        tipo_carroceria: form.tipo_carroceria,
        municipios_carregamento: [{
          codigo_municipio: form.cod_municipio_carregamento.trim(),
          municipio:        form.municipio_carregamento.trim(),
        }],
        municipios_descarregamento: [{
          uf_descarregamento:              form.uf_descarregamento.trim().toUpperCase(),
          municipio_descarregamento:       form.municipio_descarregamento.trim(),
          codigo_municipio_descarregamento: form.cod_municipio_descarregamento.trim(),
          documentos: chaves.map(c => ({ chave_cte: c })),
        }],
        peso_bruto_total:  Number(form.peso_bruto_total),
        unidade_medida_peso: form.unidade_medida_peso,
        quantidade_cte:    Number(form.quantidade_cte),
        valor_total_carga: form.valor_total_carga ? Number(form.valor_total_carga) : undefined,
      };
      await mdfesService.emitir(mdfe._id, payload);
      onDone();
    } catch (err) {
      setError(err?.message ?? err?.response?.data?.message ?? 'Erro ao emitir MDF-e no SEFAZ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Emitir MDF-e no SEFAZ</h2>
              <p className="text-xs text-gray-500">{mdfe.mdfNumber} — via Focus NFe</p>
            </div>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">Homologação</span>
          </div>
          {error && <p className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Dados Básicos */}
            <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded">
              <Input label="UF Carregamento" k="uf_carregamento" required maxLen={2} placeholder="SP" />
              <Input label="Município Carregamento" k="municipio_carregamento" required placeholder="São Paulo" className="col-span-2" />
              <Input label="Cód. IBGE Carregamento" k="cod_municipio_carregamento" required placeholder="3550308" />
              <Input label="Data Emissão" k="data_emissao" type="datetime-local" required />
              <Select label="Tipo Emitente" k="tipo_emitente" options={[
                { v: '1', l: '1 - Transportadora própria' },
                { v: '2', l: '2 - Terceiro' },
              ]} />
              <Select label="Tipo Transportador" k="tipo_transportador" options={[
                { v: '1', l: '1 - ETC' }, { v: '2', l: '2 - TAC' }, { v: '3', l: '3 - CTC' },
              ]} />
            </div>

            {/* Emitente */}
            <fieldset className="border rounded p-3">
              <legend className="text-xs font-medium text-gray-600 px-1">Emitente (Transportadora)</legend>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Input label="CNPJ" k="cnpj_emitente" required maxLen={18} placeholder="00.000.000/0001-00" />
                <Input label="IE" k="inscricao_estadual_emitente" maxLen={14} />
                <Input label="Razão Social" k="nome_emitente" required />
                <Input label="Logradouro" k="logradouro_emitente" required />
                <Input label="Número" k="numero_emitente" required maxLen={6} />
                <Input label="Bairro" k="bairro_emitente" required />
                <Input label="Município" k="municipio_emitente" required />
                <Input label="Cód. IBGE" k="codigo_municipio_emitente" required placeholder="3550308" maxLen={7} />
                <Select label="UF" k="uf_emitente" options={UF_OPTIONS.map(u => ({ v: u, l: u }))} />
                <Input label="CEP" k="cep_emitente" required maxLen={9} placeholder="00000-000" />
              </div>
            </fieldset>

            {/* Veículo */}
            <fieldset className="border rounded p-3">
              <legend className="text-xs font-medium text-gray-600 px-1">Veículo Tração</legend>
              <div className="grid grid-cols-4 gap-3 mt-2">
                <Input label="Placa" k="placa_veiculo" required maxLen={8} placeholder="ABC1D23" />
                <Input label="RNTRC" k="rntrc_veiculo" required />
                <Input label="Tara (kg)" k="tara_veiculo" type="number" />
                <Select label="Tipo Rodado" k="tipo_rodado" options={[
                  { v: '01', l: '01 - Truck' }, { v: '02', l: '02 - Toco' },
                  { v: '03', l: '03 - Cavalo Mecânico' }, { v: '04', l: '04 - VAN' },
                  { v: '05', l: '05 - Utilitário' }, { v: '06', l: '06 - Outros' },
                ]} />
                <Select label="Tipo Carroceria" k="tipo_carroceria" options={[
                  { v: '00', l: '00 - Não aplicável' }, { v: '01', l: '01 - Aberta' },
                  { v: '02', l: '02 - Fechada/Baú' }, { v: '03', l: '03 - Graneleira' },
                  { v: '04', l: '04 - Porta-Container' }, { v: '05', l: '05 - Sider' },
                ]} />
              </div>
            </fieldset>

            {/* Condutor */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded">
              <Input label="CPF Condutor" k="cpf_condutor" required placeholder="000.000.000-00" />
              <Input label="Nome Condutor" k="nome_condutor" required className="col-span-2" />
            </div>

            {/* Descarregamento */}
            <fieldset className="border rounded p-3">
              <legend className="text-xs font-medium text-gray-600 px-1">Descarregamento</legend>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Input label="UF Descarregamento" k="uf_descarregamento" required maxLen={2} placeholder="RJ" />
                <Input label="Município Descarregamento" k="municipio_descarregamento" required />
                <Input label="Cód. IBGE Descarregamento" k="cod_municipio_descarregamento" required placeholder="3304557" maxLen={7} />
              </div>
            </fieldset>

            {/* Documentos */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">Chaves CT-e (uma por linha, 44 dígitos cada) *</label>
              <textarea rows={4} required
                className="w-full border rounded px-3 py-1.5 text-xs font-mono"
                placeholder={"35260100000000000000550010000000011000000014\n35260100000000000000550010000000021000000025"}
                value={form.chaves_cte} onChange={e => set('chaves_cte', e.target.value)} />
            </div>

            {/* Totalizadores */}
            <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded">
              <Input label="Peso Bruto Total (kg)" k="peso_bruto_total" type="number" required />
              <Input label="Quantidade CT-e" k="quantidade_cte" type="number" required />
              <Input label="Valor Total Carga (R$)" k="valor_total_carga" type="number" />
              <Select label="Unid. Medida Peso" k="unidade_medida_peso" options={[
                { v: '01', l: '01 - KG' }, { v: '02', l: '02 - TON' },
              ]} />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Enviando ao SEFAZ…' : 'Enviar ao SEFAZ (Focus NFe)'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Encerrar Modal ───────────────────────────────────────────────────────────
function EncerrarModal({ mdfe, onClose, onDone }) {
  const [uf, setUf]                         = useState(mdfe?.ufDescarregamento?.[0] ?? '');
  const [codigoMunicipio, setCodigoMunicipio] = useState('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!uf.trim() || !codigoMunicipio.trim()) {
      setError('UF e código de município são obrigatórios');
      return;
    }
    setLoading(true); setError('');
    try {
      await mdfesService.encerrar(mdfe._id, { uf: uf.trim().toUpperCase(), codigoMunicipio: codigoMunicipio.trim() });
      onDone();
    } catch (err) {
      setError(err?.message ?? err?.response?.data?.message ?? 'Erro ao encerrar MDF-e');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-1">Encerrar MDF-e</h2>
          <p className="text-sm text-gray-500 mb-4">{mdfe.mdfNumber}</p>
          <p className="text-xs text-blue-700 bg-blue-50 rounded p-2 mb-4">
            Obrigatório após conclusão da viagem. Informe a UF e município de encerramento.
          </p>
          {error && <p className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">UF Encerramento *</label>
                <input maxLength={2} className="w-full border rounded px-3 py-1.5 text-sm uppercase" required
                  placeholder="RJ" value={uf} onChange={e => setUf(e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Código IBGE do Município *</label>
                <input className="w-full border rounded px-3 py-1.5 text-sm" required
                  placeholder="3304557"
                  value={codigoMunicipio} onChange={e => setCodigoMunicipio(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50">
                {loading ? 'Encerrando…' : 'Encerrar MDF-e'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
function CancelModal({ mdfe, onClose, onDone }) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (motivo.trim().length < 15) { setError('Motivo deve ter pelo menos 15 caracteres'); return; }
    setLoading(true); setError('');
    try {
      await mdfesService.cancelar(mdfe._id, { motivoCancelamento: motivo.trim() });
      onDone();
    } catch (err) {
      setError(err?.message ?? err?.response?.data?.message ?? 'Erro ao cancelar MDF-e');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-1">Cancelar MDF-e</h2>
          <p className="text-sm text-gray-500 mb-4">{mdfe.mdfNumber}</p>
          {error && <p className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Motivo do cancelamento * (mín. 15 caracteres)</label>
              <textarea rows={3} className="w-full border rounded px-3 py-1.5 text-sm" required
                placeholder="Descreva o motivo do cancelamento"
                value={motivo} onChange={e => setMotivo(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">{motivo.trim().length}/15 mínimo</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Fechar</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Cancelando…' : 'Cancelar MDF-e'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Sincronizar Button ───────────────────────────────────────────────────────
function SincronizarButton({ mdfeId, onDone }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try { await mdfesService.sincronizar(mdfeId); onDone(); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };
  return (
    <button onClick={handle} disabled={loading}
      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50">
      {loading ? '…' : '↻ Sincronizar'}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MdfeBody() {
  const [mdfes, setMdfes]     = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal]     = useState(null); // { type, mdfe? }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const [listRes, statsRes] = await Promise.all([
        mdfesService.list(params),
        mdfesService.stats(),
      ]);
      setMdfes(listRes.data?.items ?? []);
      setStats(statsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDone = () => { setModal(null); load(); };
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MDF-e</h1>
          <p className="text-sm text-gray-500 mt-1">Manifesto Eletrônico de Documentos Fiscais</p>
        </div>
        <button onClick={() => setModal({ type: 'create' })}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + Novo MDF-e
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { key: 'total',      label: 'Total',        value: stats.total,                        color: 'text-gray-900'   },
            { key: 'pendente',   label: 'Pendentes',    value: stats.pendente   ?? 0,              color: 'text-yellow-700' },
            { key: 'autorizado', label: 'Autorizados',  value: stats.autorizado ?? 0,              color: 'text-green-700'  },
            { key: 'encerrado',  label: 'Encerrados',   value: stats.encerrado  ?? 0,              color: 'text-gray-700'   },
            { key: 'cancelado',  label: 'Cancelados',   value: stats.byStatus?.cancelado ?? 0,     color: 'text-red-700'    },
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
        {['', 'pendente', 'processando', 'autorizado', 'encerrado', 'erro', 'cancelado', 'denegado'].map(s => (
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
        ) : mdfes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhum MDF-e encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Número', 'Status', 'Frete', 'UF Orig → Dest', 'Veículo', 'Motorista', 'Emissão', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mdfes.map(m => (
                  <tr key={m._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{m.mdfNumber}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                      {m.focusNfeErro && (
                        <p className="text-xs text-red-600 mt-1" title={m.focusNfeErro}>
                          {m.focusNfeErro.slice(0, 40)}…
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{m.freteNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {m.ufCarregamento ?? '?'} → {(m.ufDescarregamento ?? []).join(', ') || '?'}
                    </td>
                    <td className="px-4 py-3 text-xs">{m.veiculoPlaca ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>{m.motoristaNome ?? '—'}</div>
                      {m.motoristaCpf && <div className="text-gray-400">{m.motoristaCpf}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs">{fmtDate(m.dataEmissao ?? m.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(m.status === 'pendente' || m.status === 'erro') && (
                          <>
                            <button onClick={() => setModal({ type: 'emitir', mdfe: m })}
                              className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200">
                              Emitir SEFAZ
                            </button>
                            <button onClick={() => setModal({ type: 'authorize', mdfe: m })}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
                              Manual
                            </button>
                          </>
                        )}
                        {m.status === 'processando' && (
                          <SincronizarButton mdfeId={m._id} onDone={load} />
                        )}
                        {m.status === 'autorizado' && (
                          <>
                            <button onClick={() => setModal({ type: 'encerrar', mdfe: m })}
                              className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                              Encerrar
                            </button>
                            <button onClick={() => setModal({ type: 'cancel', mdfe: m })}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'create'    && <CreateModal    onClose={() => setModal(null)} onDone={handleDone} />}
      {modal?.type === 'authorize' && <AuthorizeModal mdfe={modal.mdfe} onClose={() => setModal(null)} onDone={handleDone} />}
      {modal?.type === 'emitir'    && <EmitirModal    mdfe={modal.mdfe} onClose={() => setModal(null)} onDone={handleDone} />}
      {modal?.type === 'encerrar'  && <EncerrarModal  mdfe={modal.mdfe} onClose={() => setModal(null)} onDone={handleDone} />}
      {modal?.type === 'cancel'    && <CancelModal    mdfe={modal.mdfe} onClose={() => setModal(null)} onDone={handleDone} />}
    </div>
  );
}
