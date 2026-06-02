/**
 * Utilitários para exportação de dados
 */

/**
 * Converte array de objetos para CSV
 * @param {Array} data - Array de objetos
 * @param {Array} columns - Array com configuração das colunas { key, label }
 * @param {String} filename - Nome do arquivo (sem extensão)
 */
export function exportToCSV(data, columns, filename = 'export') {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Cabeçalho
  const headers = columns.map(col => col.label || col.key);
  const csvHeaders = headers.join(',');

  // Linhas de dados
  const csvRows = data.map(row => {
    return columns.map(col => {
      const value = col.formatter 
        ? col.formatter(row[col.key], row)
        : row[col.key] || '';
      
      // Escapar vírgulas e aspas
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });

  // Combinar tudo
  const csvContent = [csvHeaders, ...csvRows].join('\n');

  // Adicionar BOM para Excel reconhecer UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Criar link de download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpar URL
  URL.revokeObjectURL(url);
}

/**
 * Converte array de objetos para Excel (XLSX)
 * Usa a biblioteca xlsx se disponível, senão exporta como CSV
 * @param {Array} data - Array de objetos
 * @param {Array} columns - Array com configuração das colunas { key, label }
 * @param {String} filename - Nome do arquivo (sem extensão)
 */
export async function exportToExcel(data, columns, filename = 'export') {
  // Verificar se xlsx está disponível
  try {
    const XLSX = await import('xlsx');
    
    // Preparar dados
    const headers = columns.map(col => col.label || col.key);
    const rows = data.map(row => {
      const obj = {};
      columns.forEach(col => {
        const value = col.formatter 
          ? col.formatter(row[col.key], row)
          : row[col.key] || '';
        obj[col.label || col.key] = value;
      });
      return obj;
    });

    // Criar workbook
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

    // Ajustar largura das colunas
    const colWidths = columns.map(() => ({ wch: 20 }));
    worksheet['!cols'] = colWidths;

    // Baixar arquivo
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.warn('Biblioteca xlsx não disponível, exportando como CSV:', error);
    // Fallback para CSV
    exportToCSV(data, columns, filename);
  }
}

/**
 * Formata data para exibição
 */
export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formata status para exibição
 */
export function formatStatus(status) {
  const statusMap = {
    'draft': 'Rascunho',
    'active': 'Ativa',
    'paused': 'Pausada',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
  };
  return statusMap[status] || status;
}

