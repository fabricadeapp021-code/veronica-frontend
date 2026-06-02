# 📋 Arquivo de Teste - Importação de Leads

## 📁 Arquivo

**Nome:** `leads-teste.csv`

## 📊 Conteúdo

O arquivo contém **20 leads de exemplo** com os seguintes campos:

- **Nome**: Nome completo do lead
- **Email**: Email válido
- **Telefone**: Telefone no formato brasileiro (+55...)
- **Status**: Status do lead (New, Contacted, Qualified)
- **Descrição**: Descrição adicional (opcional)

**Nota:** Campos como "Origem" (source), "Indústria" (industry) e "Website" foram removidos do arquivo de teste porque podem causar erros de validação no EspoCRM. Esses campos podem ser adicionados manualmente após a importação se necessário.

## 🎯 Como Usar

1. Acesse a página de edição de uma campanha
2. Clique em **"Adicionar Leads"**
3. Selecione a aba **"Importar CSV/Excel"**
4. Clique em **"Selecione o arquivo"**
5. Escolha o arquivo `leads-teste.csv`
6. Revise os dados validados
7. Clique em **"Importar"**

## ✅ Validações Esperadas

- ✅ Todos os leads têm pelo menos Nome, Email ou Telefone
- ✅ Emails estão em formato válido
- ✅ Telefones estão em formato válido
- ✅ Status são valores válidos (New, Contacted, Qualified)

## 📝 Notas

- Alguns campos (Website, Descrição) estão vazios intencionalmente para testar campos opcionais
- Os telefones estão no formato brasileiro com código de país (+55)
- Os emails são fictícios mas em formato válido
- Os nomes são genéricos para teste

## 🔄 Modificações

Você pode editar o arquivo CSV para:
- Adicionar mais leads
- Testar diferentes formatos de dados
- Testar validações (emails inválidos, telefones inválidos, etc.)
- Testar campos obrigatórios vazios

## ⚠️ Importante

- O arquivo usa **codificação UTF-8**
- Use **vírgula (`,`)** como separador
- A primeira linha deve conter os cabeçalhos
- Campos com vírgulas devem estar entre aspas

---

**Criado em:** 2026-01-05  
**Total de leads:** 20

