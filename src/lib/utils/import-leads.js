/**
 * Utilitários para importação de leads via CSV/Excel
 */

/**
 * Lê um arquivo CSV e retorna os dados
 * @param {File} file - Arquivo CSV
 * @returns {Promise<Array>} Array de objetos com os dados
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('Arquivo CSV vazio'));
          return;
        }

        // Primeira linha são os cabeçalhos
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Mapear nomes de colunas comuns
        const columnMap = {
          'nome': 'name',
          'name': 'name',
          'email': 'emailAddress',
          'e-mail': 'emailAddress',
          'emailaddress': 'emailAddress',
          'telefone': 'phoneNumber',
          'phone': 'phoneNumber',
          'phonenumber': 'phoneNumber',
          'celular': 'phoneNumber',
          'whatsapp': 'phoneNumber',
          'status': 'status',
          'origem': 'source',
          'source': 'source',
          'industria': 'industry',
          'industry': 'industry',
          'website': 'website',
          'descricao': 'description',
          'description': 'description',
        };

        // Processar linhas
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          
          if (values.length === 0) continue;
          
          const row = {};
          headers.forEach((header, index) => {
            const normalizedHeader = header.toLowerCase().trim();
            const mappedKey = columnMap[normalizedHeader] || normalizedHeader;
            const value = values[index]?.trim() || '';
            
            if (value) {
              row[mappedKey] = value;
            }
          });
          
          // Validar que tem pelo menos nome ou email/telefone
          if (row.name || (row.emailAddress || row.phoneNumber)) {
            data.push(row);
          }
        }

        resolve(data);
      } catch (error) {
        reject(new Error(`Erro ao processar CSV: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Lê um arquivo Excel (XLSX) e retorna os dados
 * @param {File} file - Arquivo Excel
 * @returns {Promise<Array>} Array de objetos com os dados
 */
export async function parseExcel(file) {
  try {
    const XLSX = await import('xlsx');
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Pegar primeira planilha
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Converter para JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            reject(new Error('Arquivo Excel vazio'));
            return;
          }

          // Mapear nomes de colunas
          const columnMap = {
            'nome': 'name',
            'name': 'name',
            'email': 'emailAddress',
            'e-mail': 'emailAddress',
            'emailaddress': 'emailAddress',
            'telefone': 'phoneNumber',
            'phone': 'phoneNumber',
            'phonenumber': 'phoneNumber',
            'celular': 'phoneNumber',
            'whatsapp': 'phoneNumber',
            'status': 'status',
            'origem': 'source',
            'source': 'source',
            'industria': 'industry',
            'industry': 'industry',
            'website': 'website',
            'descricao': 'description',
            'description': 'description',
          };

          const mappedData = jsonData.map(row => {
            const mappedRow = {};
            
            Object.keys(row).forEach(key => {
              const normalizedKey = key.toLowerCase().trim();
              const mappedKey = columnMap[normalizedKey] || normalizedKey;
              const value = row[key];
              
              if (value !== null && value !== undefined && value !== '') {
                mappedRow[mappedKey] = String(value).trim();
              }
            });
            
            return mappedRow;
          }).filter(row => row.name || row.emailAddress || row.phoneNumber);

          resolve(mappedData);
        } catch (error) {
          reject(new Error(`Erro ao processar Excel: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    throw new Error('Biblioteca xlsx não disponível. Instale com: npm install xlsx');
  }
}

/**
 * Parse uma linha CSV considerando aspas e vírgulas dentro de campos
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Aspas duplas escapadas
        current += '"';
        i++; // Pular próximo caractere
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Fim do campo
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Adicionar último campo
  result.push(current);
  
  return result;
}

/**
 * Valida os dados importados
 * @param {Array} data - Array de objetos com dados dos leads
 * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
 */
export function validateImportedLeads(data) {
  const errors = [];
  const warnings = [];
  
  if (!data || data.length === 0) {
    errors.push('Nenhum lead encontrado no arquivo');
    return { valid: false, errors, warnings };
  }

  data.forEach((lead, index) => {
    const lineNumber = index + 2; // +2 porque linha 1 é cabeçalho
    
    // Validar que tem pelo menos nome ou email/telefone
    if (!lead.name && !lead.emailAddress && !lead.phoneNumber) {
      errors.push(`Linha ${lineNumber}: Lead deve ter pelo menos nome, email ou telefone`);
    }

    // Validar email se fornecido
    if (lead.emailAddress && !isValidEmail(lead.emailAddress)) {
      warnings.push(`Linha ${lineNumber}: Email inválido: ${lead.emailAddress}`);
    }

    // Validar telefone se fornecido
    if (lead.phoneNumber && !isValidPhone(lead.phoneNumber)) {
      warnings.push(`Linha ${lineNumber}: Telefone inválido: ${lead.phoneNumber}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valida formato de email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de telefone (básico)
 */
function isValidPhone(phone) {
  // Remove caracteres não numéricos exceto +
  const cleaned = phone.replace(/[^\d+]/g, '');
  // Deve ter pelo menos 10 dígitos
  return cleaned.length >= 10;
}

/**
 * Formato esperado do CSV/Excel
 */
export const EXPECTED_COLUMNS = [
  { key: 'name', label: 'Nome', required: false },
  { key: 'emailAddress', label: 'Email', required: false },
  { key: 'phoneNumber', label: 'Telefone', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'source', label: 'Origem', required: false },
  { key: 'industry', label: 'Indústria', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'description', label: 'Descrição', required: false },
];

