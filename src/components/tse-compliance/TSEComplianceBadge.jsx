'use client';
import React, { useState } from 'react';
import { Badge, OverlayTrigger, Popover, ProgressBar, ListGroup } from 'react-bootstrap';
import { CheckCircle, AlertTriangle, XCircle, Info, Shield } from 'react-feather';

/**
 * Calcula conformidade TSE de uma DESPESA (client-side, espelha o util do backend)
 * Res. 23.607/2019 + 23.731/2024
 */
export function checkExpenseCompliance(expense) {
  const issues = [];
  const warnings = [];
  let score = 100;

  if (!expense?.supplier?.trim()) { issues.push('Fornecedor não informado'); score -= 20; }
  if (!expense?.supplierCnpj?.trim()) { issues.push('CNPJ/CPF do fornecedor ausente (art. 59 Res. 23.607)'); score -= 15; }
  if (!expense?.invoice?.number?.trim()) { issues.push('Nota Fiscal ou documento comprobatório ausente'); score -= 20; }
  if (expense?.invoice?.issueDate && expense?.date) {
    const nf = new Date(expense.invoice.issueDate);
    const exp = new Date(expense.date);
    if (nf > exp) warnings.push('NF emitida após a data da despesa — verifique (art. 33)');
  }
  if (expense?.categoryCode === '03') {
    if (!expense?.personnelDetails?.length) {
      issues.push('Pessoal: informe nome, CPF, função, local, horas e justificativa de preço (art. 35 §12)');
      score -= 25;
    }
  }
  if (!expense?.amount || expense.amount <= 0) { issues.push('Valor inválido'); score -= 15; }
  if (!expense?.date) { issues.push('Data obrigatória'); score -= 5; }

  return { compliant: issues.length === 0, score: Math.max(0, score), issues, warnings };
}

/**
 * Calcula conformidade TSE de uma RECEITA (client-side)
 */
export function checkRevenueCompliance(revenue) {
  const issues = [];
  const warnings = [];
  let score = 100;

  if (revenue?.type === 'donation') {
    if (!revenue?.donor?.name?.trim()) { issues.push('Nome do doador obrigatório'); score -= 20; }
    if (!revenue?.donor?.cpfCnpj?.trim()) { issues.push('CPF do doador obrigatório (art. 23 Lei 9.504/97)'); score -= 25; }
  }
  if (revenue?.type === 'donation_pj') {
    if (!revenue?.donor?.cpfCnpj?.trim()) { issues.push('CNPJ da pessoa jurídica obrigatório'); score -= 25; }
  }
  if (['fefc', 'fundo_partidario'].includes(revenue?.type || '')) {
    if (!revenue?.receiptNumber?.trim()) warnings.push('Recibo de transferência do FEFC/Fundo recomendado');
  }
  if (!revenue?.amount || revenue.amount <= 0) { issues.push('Valor inválido'); score -= 15; }
  if (!revenue?.date) { issues.push('Data obrigatória'); score -= 5; }
  if (!revenue?.paymentMethod) { issues.push('Forma de pagamento obrigatória'); score -= 10; }

  return { compliant: issues.length === 0, score: Math.max(0, score), issues, warnings };
}

/** Mapa de rótulos para tipos de receita */
export const REVENUE_TYPE_LABELS = {
  donation: 'Doação — Pessoa Física',
  donation_pj: 'Doação — Pessoa Jurídica',
  fefc: 'FEFC',
  fundo_partidario: 'Fundo Partidário',
  recursos_proprios: 'Recursos Próprios',
  transfer: 'Transferência',
  estimable: 'Doação Estimável',
  event: 'Evento',
  funding: 'Financiamento Coletivo',
  other: 'Outros',
};

/** Mapa de rótulos para categorias de despesa TSE */
export const EXPENSE_CATEGORY_LABELS = {
  '01': 'Propaganda',
  '02': 'Transporte',
  '03': 'Pessoal',
  '04': 'Comitê',
  '05': 'Serviços',
  '06': 'Produção',
  '07': 'Eventos',
  '08': 'Outras',
};

/**
 * Badge compacto de conformidade TSE — exibido inline em listas/tabelas
 */
export function TSEComplianceBadge({ result, size = 'sm' }) {
  if (!result) return null;
  const { compliant, score, issues, warnings } = result;

  const icon = compliant
    ? <CheckCircle size={12} className="me-1" />
    : score >= 60
    ? <AlertTriangle size={12} className="me-1" />
    : <XCircle size={12} className="me-1" />;

  const variant = compliant ? 'success' : score >= 60 ? 'warning' : 'danger';
  const label = compliant ? 'TSE ✓' : `TSE ${score}%`;

  const popover = (
    <Popover id="tse-compliance-pop" style={{ maxWidth: 340 }}>
      <Popover.Header className="d-flex align-items-center gap-2">
        <Shield size={14} />
        Conformidade TSE — Res. 23.607/2019
      </Popover.Header>
      <Popover.Body className="p-0">
        <div className="px-3 pt-3 pb-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="text-muted">Pontuação de conformidade</small>
            <small className={`fw-semibold text-${variant}`}>{score}/100</small>
          </div>
          <ProgressBar now={score} variant={variant} style={{ height: 6 }} className="mb-3" />
        </div>

        {issues.length > 0 && (
          <ListGroup variant="flush" className="border-top">
            <ListGroup.Item className="px-3 py-2 bg-danger-subtle">
              <small className="fw-semibold text-danger d-block mb-1">
                <XCircle size={12} className="me-1" />
                Problemas a corrigir
              </small>
              {issues.map((issue, i) => (
                <div key={i} className="d-flex gap-2 mb-1">
                  <small className="text-danger">•</small>
                  <small className="text-danger">{issue}</small>
                </div>
              ))}
            </ListGroup.Item>
          </ListGroup>
        )}

        {warnings.length > 0 && (
          <ListGroup variant="flush" className="border-top">
            <ListGroup.Item className="px-3 py-2 bg-warning-subtle">
              <small className="fw-semibold text-warning d-block mb-1">
                <AlertTriangle size={12} className="me-1" />
                Atenção
              </small>
              {warnings.map((w, i) => (
                <div key={i} className="d-flex gap-2 mb-1">
                  <small className="text-warning-emphasis">•</small>
                  <small className="text-warning-emphasis">{w}</small>
                </div>
              ))}
            </ListGroup.Item>
          </ListGroup>
        )}

        {compliant && (
          <div className="px-3 py-2 border-top bg-success-subtle">
            <small className="text-success">
              <CheckCircle size={12} className="me-1" />
              Registro em conformidade com a Res. TSE nº 23.607/2019 e 23.731/2024
            </small>
          </div>
        )}
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger={['hover', 'focus']} placement="left" overlay={popover}>
      <Badge
        bg={variant}
        className="d-inline-flex align-items-center"
        style={{ cursor: 'help', fontSize: size === 'sm' ? '0.65rem' : '0.75rem' }}
      >
        {icon}
        {label}
      </Badge>
    </OverlayTrigger>
  );
}

/**
 * Painel expandido de conformidade TSE — para usar em modais ou formulários
 */
export function TSECompliancePanel({ result, title = 'Conformidade TSE' }) {
  const [open, setOpen] = useState(false);
  if (!result) return null;
  const { compliant, score, issues, warnings } = result;

  const variant = compliant ? 'success' : score >= 60 ? 'warning' : 'danger';
  const bg = compliant ? 'success' : score >= 60 ? 'warning' : 'danger';

  return (
    <div className={`border border-${bg} rounded-2 overflow-hidden mb-3`}>
      <div
        className={`d-flex align-items-center justify-content-between px-3 py-2 bg-${bg}-subtle cursor-pointer`}
        onClick={() => setOpen(!open)}
        style={{ cursor: 'pointer' }}
      >
        <div className="d-flex align-items-center gap-2">
          <Shield size={16} className={`text-${variant}`} />
          <span className={`fw-semibold text-${variant} small`}>{title}</span>
          {compliant
            ? <Badge bg="success" className="ms-2">Conforme ✓</Badge>
            : <Badge bg={bg} className="ms-2">{issues.length} problema{issues.length !== 1 ? 's' : ''}</Badge>
          }
        </div>
        <div className="d-flex align-items-center gap-3">
          <div style={{ width: 80 }}>
            <ProgressBar now={score} variant={variant} style={{ height: 6 }} />
          </div>
          <small className={`text-${variant} fw-semibold`}>{score}%</small>
          <Info size={14} className="text-muted" />
        </div>
      </div>

      {open && (
        <div className="px-3 py-2 border-top bg-white">
          <small className="text-muted d-block mb-2">
            Res. TSE nº 23.607/2019 + 23.731/2024 — Lei nº 9.504/97
          </small>

          {issues.length > 0 && (
            <div className="mb-2">
              <small className="fw-semibold text-danger d-block mb-1">
                <XCircle size={12} className="me-1" />Problemas obrigatórios:
              </small>
              {issues.map((issue, i) => (
                <div key={i} className="d-flex align-items-start gap-2 mb-1 ms-2">
                  <XCircle size={10} className="text-danger mt-1 flex-shrink-0" />
                  <small className="text-danger">{issue}</small>
                </div>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="mb-2">
              <small className="fw-semibold text-warning d-block mb-1">
                <AlertTriangle size={12} className="me-1" />Atenções:
              </small>
              {warnings.map((w, i) => (
                <div key={i} className="d-flex align-items-start gap-2 mb-1 ms-2">
                  <AlertTriangle size={10} className="text-warning mt-1 flex-shrink-0" />
                  <small className="text-warning-emphasis">{w}</small>
                </div>
              ))}
            </div>
          )}

          {compliant && (
            <div className="d-flex align-items-center gap-2">
              <CheckCircle size={14} className="text-success" />
              <small className="text-success">Registro em total conformidade com as normas eleitorais do TSE.</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TSEComplianceBadge;
