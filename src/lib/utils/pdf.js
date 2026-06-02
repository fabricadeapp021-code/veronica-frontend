/**
 * Utilitários para geração de PDF
 */

/**
 * Gera PDF de relatório de campanha
 * @param {Object} campaign - Dados da campanha
 * @param {Object} stats - Estatísticas da campanha
 * @param {Array} leads - Lista de leads (opcional)
 * @param {String} filename - Nome do arquivo (sem extensão)
 */
export async function generateCampaignReportPDF(campaign, stats, leads = [], filename = 'relatorio_campanha') {
  try {
    // Tentar usar jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Função para adicionar nova página se necessário
    const checkNewPage = (requiredSpace = 20) => {
      if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Campanha', margin, yPosition);
    yPosition += 10;

    // Data do relatório
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition);
    yPosition += 15;

    // Informações da Campanha
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Informações da Campanha', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${campaign.name || '-'}`, margin, yPosition);
    yPosition += 6;
    
    if (campaign.description) {
      const descriptionLines = doc.splitTextToSize(`Descrição: ${campaign.description}`, contentWidth);
      doc.text(descriptionLines, margin, yPosition);
      yPosition += descriptionLines.length * 6;
    }

    doc.text(`Status: ${formatStatus(campaign.status)}`, margin, yPosition);
    yPosition += 6;
    
    if (campaign.instanceName) {
      doc.text(`Instância WhatsApp: ${campaign.instanceName}`, margin, yPosition);
      yPosition += 6;
    }

    if (campaign.createdAt) {
      doc.text(`Data de Criação: ${formatDate(campaign.createdAt)}`, margin, yPosition);
      yPosition += 6;
    }

    if (campaign.startedAt) {
      doc.text(`Data de Início: ${formatDate(campaign.startedAt)}`, margin, yPosition);
      yPosition += 6;
    }

    yPosition += 5;

    // Estatísticas
    checkNewPage(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Estatísticas', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (stats) {
      doc.text(`Total de Leads: ${stats.totalLeads || 0}`, margin, yPosition);
      yPosition += 6;
      
      doc.text(`Mensagens Enviadas: ${stats.sentCount || 0}`, margin, yPosition);
      yPosition += 6;
      
      doc.text(`Mensagens Entregues: ${stats.deliveredCount || 0}`, margin, yPosition);
      yPosition += 6;
      
      doc.text(`Mensagens Lidas: ${stats.readCount || 0}`, margin, yPosition);
      yPosition += 6;
      
      doc.text(`Respostas: ${stats.responseCount || 0}`, margin, yPosition);
      yPosition += 6;
      
      doc.text(`Erros: ${stats.errorCount || 0}`, margin, yPosition);
      yPosition += 6;

      doc.text(`Bloqueados (limite diário): ${stats.skippedCount || 0}`, margin, yPosition);
      yPosition += 6;
      
      yPosition += 3;
      
      // Taxas
      doc.setFont('helvetica', 'bold');
      doc.text('Taxas:', margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      
      if (stats.deliveryRate !== undefined) {
        doc.text(`Taxa de Entrega: ${stats.deliveryRate.toFixed(2)}%`, margin, yPosition);
        yPosition += 6;
      }
      
      if (stats.readRate !== undefined) {
        doc.text(`Taxa de Leitura: ${stats.readRate.toFixed(2)}%`, margin, yPosition);
        yPosition += 6;
      }
      
      if (stats.responseRate !== undefined) {
        doc.text(`Taxa de Resposta: ${stats.responseRate.toFixed(2)}%`, margin, yPosition);
        yPosition += 6;
      }
      
      if (stats.errorRate !== undefined) {
        doc.text(`Taxa de Erro: ${stats.errorRate.toFixed(2)}%`, margin, yPosition);
        yPosition += 6;
      }

      if (stats.skipRate !== undefined && stats.skipRate > 0) {
        doc.text(`Taxa de Bloqueio (throttle): ${stats.skipRate.toFixed(2)}%`, margin, yPosition);
        yPosition += 6;
      }
    }

    yPosition += 5;

    // Lista de Leads (se fornecida e não vazia)
    if (leads && leads.length > 0) {
      checkNewPage(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Leads da Campanha', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Cabeçalho da tabela
      const tableHeaders = ['Nome', 'Email', 'Telefone', 'Status'];
      const colWidths = [60, 60, 50, 30];
      let xPos = margin;

      doc.setFont('helvetica', 'bold');
      tableHeaders.forEach((header, index) => {
        doc.text(header, xPos, yPosition);
        xPos += colWidths[index];
      });
      yPosition += 6;

      // Linhas da tabela
      doc.setFont('helvetica', 'normal');
      leads.forEach((lead, index) => {
        checkNewPage(10);
        
        xPos = margin;
        const rowData = [
          lead.name || '-',
          lead.emailAddress || '-',
          lead.phoneNumber || '-',
          lead.status || '-'
        ];

        rowData.forEach((cell, colIndex) => {
          const cellText = doc.splitTextToSize(String(cell), colWidths[colIndex] - 2);
          doc.text(cellText, xPos, yPosition);
          xPos += colWidths[colIndex];
        });

        yPosition += 6;

        // Linha separadora a cada 10 leads
        if ((index + 1) % 10 === 0 && index < leads.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 3;
        }
      });
    }

    // Rodapé
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - margin - 30,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    // Salvar PDF
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Verifique se a biblioteca jsPDF está instalada.');
    throw error;
  }
}

/**
 * Formata data para exibição
 */
function formatDate(date) {
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
function formatStatus(status) {
  const statusMap = {
    'draft': 'Rascunho',
    'active': 'Ativa',
    'paused': 'Pausada',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
  };
  return statusMap[status] || status;
}

