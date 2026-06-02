export const DOCUMENT_CATEGORIES = [
  { id: 'telemetria_eventos', label: 'Eventos de Telemetria', group: 'Operação' },
  { id: 'rotas_viagens', label: 'Rotas e Viagens', group: 'Operação' },
  { id: 'ocorrencias_operacionais', label: 'Ocorrências Operacionais', group: 'Operação' },
  { id: 'veiculos_frota', label: 'Veículos da Frota', group: 'Frota' },
  { id: 'manutencao', label: 'Manutenção', group: 'Frota' },
  { id: 'combustivel_abastecimento', label: 'Combustível e Abastecimento', group: 'Frota' },
  { id: 'motoristas', label: 'Motoristas', group: 'Pessoas e Segurança' },
  { id: 'jornada_tacografo', label: 'Jornada e Tacógrafo', group: 'Pessoas e Segurança' },
  { id: 'multas_sinistros', label: 'Multas e Sinistros', group: 'Pessoas e Segurança' },
  { id: 'documentacao_veicular', label: 'Documentação Veicular', group: 'Compliance' },
  { id: 'apolices_seguros', label: 'Apólices e Seguros', group: 'Compliance' },
  { id: 'relatorios_kpis', label: 'Relatórios e KPIs', group: 'Gestão' },
];

export const CATEGORY_IDS = DOCUMENT_CATEGORIES.map((c) => c.id);

export const CATEGORY_LABEL_MAP = DOCUMENT_CATEGORIES.reduce((acc, item) => {
  acc[item.id] = item.label;
  return acc;
}, {});

export const CATEGORY_GROUPS = ['Operação', 'Frota', 'Pessoas e Segurança', 'Compliance', 'Gestão'];
