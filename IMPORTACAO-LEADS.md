# 📥 Importação de Leads via CSV/Excel

## ✅ Funcionalidade Implementada

Agora é possível importar leads para uma campanha via arquivo CSV ou Excel, além da opção de selecionar leads existentes da lista.

## 🎯 Como Usar

### 1. Acessar a Funcionalidade

1. Vá para a página de edição de uma campanha
2. Clique no botão **"Adicionar Leads"** na seção "Leads da Campanha"
3. No modal, escolha a aba **"Importar CSV/Excel"**

### 2. Preparar o Arquivo

#### Formato CSV
```csv
Nome,Email,Telefone,Status,Origem
João Silva,joao@exemplo.com,+5511999999999,New,Website
Maria Santos,maria@exemplo.com,+5511888888888,New,Facebook
```

#### Formato Excel (.xlsx, .xls)
Mesma estrutura, com colunas na primeira linha.

### 3. Colunas Aceitas

| Coluna | Campo no Sistema | Obrigatório | Descrição |
|--------|------------------|-------------|-----------|
| Nome / name | name | Não* | Nome completo do lead |
| Email / email | emailAddress | Não* | Email do lead |
| Telefone / phone | phoneNumber | Não* | Telefone do lead |
| Status / status | status | Não | Status do lead (New, Contacted, etc.) |
| Descrição / description | description | Não | Descrição adicional |

**⚠️ Campos Removidos Automaticamente:**
- **Origem / source**: Removido automaticamente (pode causar erro de validação no EspoCRM)
- **Indústria / industry**: Removido automaticamente (pode causar erro de validação no EspoCRM)
- **Website / website**: Removido automaticamente (pode causar erro de validação no EspoCRM)

Esses campos podem ser adicionados manualmente após a importação se necessário.

\* **Pelo menos um dos campos** (Nome, Email ou Telefone) deve estar preenchido.

### 4. Processo de Importação

1. **Selecione o arquivo** (CSV ou Excel)
2. O sistema **valida automaticamente** os dados
3. **Visualize** os leads encontrados (primeiros 10)
4. **Corrija erros** se houver (mostrados em vermelho)
5. Clique em **"Importar"** para criar os leads e adicioná-los à campanha

## ⚠️ Validações

### Erros (impedem importação)
- Arquivo vazio
- Nenhum lead válido encontrado
- Lead sem nome, email e telefone

### Avisos (não impedem importação)
- Email em formato inválido
- Telefone em formato inválido

### Campos Automaticamente Removidos
Para evitar erros de validação no EspoCRM, os seguintes campos são automaticamente removidos durante a importação:
- `source` (Origem)
- `industry` (Indústria)
- `website` (Website)

Esses campos podem ser adicionados manualmente após a importação se necessário.

## 📋 Exemplo de Arquivo CSV

```csv
Nome,Email,Telefone,Status,Descrição
João Silva,joao@exemplo.com,+5511999999999,New,Cliente interessado em produto X
Maria Santos,maria@exemplo.com,+5511888888888,Contacted,Lead qualificado
Pedro Costa,,+5511777777777,New,Contato via WhatsApp
```

**Nota:** Campos como "Origem", "Indústria" e "Website" são automaticamente removidos durante a importação para evitar erros de validação.

## 🔧 Dependências

### Obrigatórias
- Nenhuma adicional (CSV funciona nativamente)

### Opcionais (para Excel)
Para importar arquivos Excel (.xlsx, .xls), instale:
```bash
npm install xlsx
```

Se não estiver instalado, apenas CSV será suportado.

## 🎨 Interface

O modal possui duas abas:
1. **Selecionar da Lista** - Escolher leads já cadastrados
2. **Importar CSV/Excel** - Importar novos leads via arquivo

## 📝 Notas Importantes

- **Leads duplicados**: Se um lead com mesmo email/telefone já existir, será ignorado (erro 409)
- **Criação automática**: Os leads importados são criados automaticamente no sistema
- **Adição à campanha**: Após criar, os leads são automaticamente adicionados à campanha
- **Preview limitado**: Apenas os primeiros 10 leads são mostrados no preview, mas todos serão importados

## 🐛 Troubleshooting

### "Erro ao processar arquivo"
- Verifique se o arquivo está no formato correto (CSV ou Excel)
- Verifique se o arquivo não está corrompido
- Para Excel, verifique se a biblioteca `xlsx` está instalada

### "Nenhum lead válido encontrado"
- Verifique se pelo menos uma coluna (Nome, Email ou Telefone) está preenchida
- Verifique se o arquivo não está vazio
- Verifique se os cabeçalhos das colunas estão corretos

### "Biblioteca xlsx não disponível"
- Instale a biblioteca: `npm install xlsx`
- Ou use formato CSV que não requer bibliotecas adicionais

---

**Última atualização:** 2026-01-05  
**Status:** Implementado ✅

