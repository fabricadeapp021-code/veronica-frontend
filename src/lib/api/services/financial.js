import { apiRequest } from '@/lib/api/client';

// ==================== DASHBOARD ====================

/**
 * Obtém o resumo financeiro do tenant (dashboard)
 * @returns {Promise<Object>} Resumo financeiro completo
 */
export async function getFinancialSummary() {
  return await apiRequest('/financial/overview/summary', { method: 'GET' });
}

/**
 * Obtém a visão consolidada financeira por ano
 * @param {number} year - Ano de referência (opcional)
 * @returns {Promise<Object>} Visão consolidada
 */
export async function getFinancialOverview(year = null) {
  const params = new URLSearchParams();
  if (year) params.append('year', year);
  const query = params.toString();
  const path = query ? `/financial/overview?${query}` : '/financial/overview';
  return await apiRequest(path, { method: 'GET' });
}

/**
 * Obtém os alertas financeiros
 * @returns {Promise<Object>} Lista de alertas
 */
export async function getFinancialAlerts() {
  return await apiRequest('/financial/alerts', { method: 'GET' });
}

// ==================== BUDGET ====================

/**
 * Cria um novo orçamento
 * @param {Object} data - Dados do orçamento
 * @returns {Promise<Object>} Orçamento criado
 */
export async function createBudget(data) {
  return await apiRequest('/financial/budget', {
    method: 'POST',
    body: data,
  });
}

/**
 * Obtém um orçamento por ID
 * @param {string} id - ID do orçamento
 * @returns {Promise<Object>} Orçamento encontrado
 */
export async function getBudget(id) {
  return await apiRequest(`/financial/budget/${id}`, { method: 'GET' });
}

/**
 * Obtém o resumo financeiro do tenant (usado como fallback de orçamento)
 * @returns {Promise<Object>} Resumo financeiro do tenant
 */
export async function getTenantBudget() {
  return await apiRequest('/financial/budget/tenant', { method: 'GET' });
}

/**
 * Atualiza um orçamento
 * @param {string} id - ID do orçamento
 * @param {Object} data - Dados atualizados
 * @returns {Promise<Object>} Orçamento atualizado
 */
export async function updateBudget(id, data) {
  return await apiRequest(`/financial/budget/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Fecha um orçamento
 * @param {string} id - ID do orçamento
 * @returns {Promise<Object>} Orçamento fechado
 */
export async function closeBudget(id) {
  return await apiRequest(`/financial/budget/${id}/close`, {
    method: 'POST',
  });
}

// ==================== EXPENSE ====================

/**
 * Lista as despesas com filtros
 * @param {Object} filters - Filtros de busca
 * @returns {Promise<Object>} Lista paginada de despesas
 */
export async function listExpenses(filters = {}) {
  const params = new URLSearchParams();
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== null && filters[key] !== undefined) {
      params.append(key, filters[key]);
    }
  });
  
  const query = params.toString();
  const path = query ? `/financial/expenses?${query}` : '/financial/expenses';
  
  return await apiRequest(path, { method: 'GET' });
}

/**
 * Obtém uma despesa por ID
 * @param {string} id - ID da despesa
 * @returns {Promise<Object>} Despesa encontrada
 */
export async function getExpense(id) {
  return await apiRequest(`/financial/expenses/${id}`, { method: 'GET' });
}

/**
 * Cria uma nova despesa
 * @param {Object} data - Dados da despesa
 * @returns {Promise<Object>} Despesa criada
 */
export async function createExpense(data) {
  return await apiRequest('/financial/expenses', {
    method: 'POST',
    body: data,
  });
}

/**
 * Atualiza uma despesa
 * @param {string} id - ID da despesa
 * @param {Object} data - Dados atualizados
 * @returns {Promise<Object>} Despesa atualizada
 */
export async function updateExpense(id, data) {
  return await apiRequest(`/financial/expenses/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Deleta uma despesa
 * @param {string} id - ID da despesa
 * @returns {Promise<Object>} Resposta da deleção
 */
export async function deleteExpense(id) {
  return await apiRequest(`/financial/expenses/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Aprova uma despesa
 */
export async function approveExpense(id, data = {}) {
  return await apiRequest(`/financial/expenses/${id}/approve`, {
    method: 'POST',
    body: data,
  });
}

/**
 * Rejeita uma despesa
 */
export async function rejectExpense(id, data) {
  return await apiRequest(`/financial/expenses/${id}/reject`, {
    method: 'POST',
    body: data,
  });
}

/**
 * Marca uma despesa como paga
 */
export async function payExpense(id, data = {}) {
  return await apiRequest(`/financial/expenses/${id}/pay`, {
    method: 'POST',
    body: data,
  });
}

// ==================== REVENUE ====================

/**
 * Lista as receitas com filtros
 * @param {Object} filters - Filtros de busca
 * @returns {Promise<Object>} Lista paginada de receitas
 */
export async function listRevenues(filters = {}) {
  const params = new URLSearchParams();
  
  Object.keys(filters).forEach(key => {
    if (filters[key] !== null && filters[key] !== undefined) {
      params.append(key, filters[key]);
    }
  });
  
  const query = params.toString();
  const path = query ? `/financial/revenues?${query}` : '/financial/revenues';
  
  return await apiRequest(path, { method: 'GET' });
}

/**
 * Obtém uma receita por ID
 * @param {string} id - ID da receita
 * @returns {Promise<Object>} Receita encontrada
 */
export async function getRevenue(id) {
  return await apiRequest(`/financial/revenues/${id}`, { method: 'GET' });
}

/**
 * Cria uma nova receita
 * @param {Object} data - Dados da receita
 * @returns {Promise<Object>} Receita criada
 */
export async function createRevenue(data) {
  return await apiRequest('/financial/revenues', {
    method: 'POST',
    body: data,
  });
}

/**
 * Atualiza uma receita
 * @param {string} id - ID da receita
 * @param {Object} data - Dados atualizados
 * @returns {Promise<Object>} Receita atualizada
 */
export async function updateRevenue(id, data) {
  return await apiRequest(`/financial/revenues/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Deleta uma receita
 * @param {string} id - ID da receita
 * @returns {Promise<Object>} Resposta da deleção
 */
export async function deleteRevenue(id) {
  return await apiRequest(`/financial/revenues/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Confirma uma receita
 * @param {string} id - ID da receita
 * @param {Object} data - Dados da confirmação (receiptNumber, notes)
 * @returns {Promise<Object>} Receita confirmada
 */
export async function confirmRevenue(id, data) {
  return await apiRequest(`/financial/revenues/${id}/confirm`, {
    method: 'POST',
    body: data,
  });
}

/**
 * Cancela uma receita
 * @param {string} id - ID da receita
 * @param {Object} data - Dados do cancelamento (cancellationReason)
 * @returns {Promise<Object>} Receita cancelada
 */
export async function cancelRevenue(id, data) {
  return await apiRequest(`/financial/revenues/${id}/cancel`, {
    method: 'POST',
    body: data,
  });
}

/**
 * Envia agradecimento ao doador
 * @param {string} id - ID da receita
 * @param {Object} data - Dados do agradecimento (message, sentAt)
 * @returns {Promise<Object>} Receita com thanks enviado
 */
export async function sendThanks(id, data = {}) {
  return await apiRequest(`/financial/revenues/${id}/send-thanks`, {
    method: 'POST',
    body: data,
  });
}

// ==================== STORAGE ====================

/**
 * Faz upload de um arquivo para o storage (NF, comprovante, etc)
 * @param {File} file - Arquivo a ser enviado
 * @param {string} folder - Pasta de destino (ex: 'financial-invoices')
 * @returns {Promise<{url: string, path: string}>} URL pública do arquivo
 */
export async function uploadFinancialFile(file, folder = 'financial-invoices') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  formData.append('public', 'true');

  const result = await apiRequest('/storage/upload', {
    method: 'POST',
    body: formData,
  });

  return result.file; // { url, path, size, mimeType, bucket }
}

// ==================== INVOICE NF ====================

/**
 * Upload de NF via multipart/form-data — endpoint dedicado no backend
 */
export async function uploadInvoiceNF(file, data = {}) {
  const formData = new FormData();
  formData.append('file', file);
  if (data.budgetId)      formData.append('budgetId',      data.budgetId);
  if (data.number)        formData.append('number',        data.number);
  if (data.supplier)      formData.append('supplier',      data.supplier);
  if (data.supplierCnpj)  formData.append('supplierCnpj',  data.supplierCnpj);
  if (data.amount)        formData.append('amount',        String(data.amount));
  if (data.issueDate)     formData.append('issueDate',     data.issueDate);
  if (data.categoryCode)  formData.append('categoryCode',  data.categoryCode);
  if (data.categoryName)  formData.append('categoryName',  data.categoryName);
  if (data.description)   formData.append('description',   data.description);
  if (data.notes)         formData.append('notes',         data.notes);

  return await apiRequest('/financial/invoices/upload', { method: 'POST', body: formData });
}

/**
 * Envia o arquivo para o backend que usa GPT-4o Vision para extrair
 * os campos da NF automaticamente (sem salvar o registro).
 */
export async function extractPreviewInvoiceNF(file) {
  const formData = new FormData();
  formData.append('file', file);
  return await apiRequest('/financial/invoices/extract-preview', {
    method: 'POST',
    body: formData,
  });
}

export async function uploadAndExtractInvoiceNF(file, data = {}) {
  return uploadInvoiceNF(file, data);
}

export async function listInvoicesNF(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v != null) params.append(k, v); });
  const q = params.toString();
  return await apiRequest(q ? `/financial/invoices?${q}` : '/financial/invoices', { method: 'GET' });
}

/**
 * Stats de NFs via endpoint dedicado
 */
export async function getInvoiceNFStats() {
  try {
    return await apiRequest('/financial/invoices/stats', { method: 'GET' });
  } catch {
    return { total: 0, pending: 0, validated: 0, rejected: 0, linked: 0 };
  }
}

export async function getInvoiceNF(id) {
  return await apiRequest(`/financial/invoices/${id}`, { method: 'GET' });
}

export async function updateInvoiceNF(id, data) {
  return await apiRequest(`/financial/invoices/${id}`, { method: 'PUT', body: data });
}

/**
 * Valida uma NF
 */
export async function validateInvoiceNF(id, data = {}) {
  return await apiRequest(`/financial/invoices/${id}/validate`, { method: 'POST', body: data });
}

/**
 * Rejeita uma NF
 */
export async function rejectInvoiceNF(id, data) {
  return await apiRequest(`/financial/invoices/${id}/reject`, { method: 'POST', body: data });
}

/**
 * Vincula NF a uma despesa
 */
export async function linkExpenseToInvoiceNF(id, expenseId) {
  return await apiRequest(`/financial/invoices/${id}/link-expense`, { method: 'POST', body: { expenseId } });
}

export async function deleteInvoiceNF(id) {
  return await apiRequest(`/financial/invoices/${id}`, { method: 'DELETE' });
}

// ==================== EXPORTS ====================

export default {
  // Dashboard
  getFinancialSummary,
  getFinancialAlerts,
  
  // Budget
  createBudget,
  getBudget,
  getTenantBudget,
  updateBudget,
  closeBudget,
  
  // Storage
  uploadFinancialFile,

  // Expense
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
  payExpense,
  
  // Revenue
  listRevenues,
  getRevenue,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  confirmRevenue,
  cancelRevenue,
  sendThanks,

  // Invoice NF
  uploadInvoiceNF,
  listInvoicesNF,
  getInvoiceNFStats,
  getInvoiceNF,
  updateInvoiceNF,
  validateInvoiceNF,
  rejectInvoiceNF,
  linkExpenseToInvoiceNF,
  deleteInvoiceNF,
};
