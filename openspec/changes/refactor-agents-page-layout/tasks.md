## 1. Remover KPI cards e mover stats para o header

- [x] 1.1 Em `AgentsBody.jsx`, remover o bloco `<Row className="g-3 mb-4">` dos KPI cards (linhas 1990–2006)
- [x] 1.2 No bloco de header (linha 1971–1981), adicionar abaixo do `<small>` de subtítulo uma linha de stats inline: `X agentes · Y ativos · Z pausados` com loading placeholder `…`
- [x] 1.3 Aplicar cores: valor total=`text-muted`, ativos=`text-success`, pausados=`text-warning`

## 2. Mover busca para o header e remover Card separado

- [x] 2.1 Remover o bloco `<Card className="card-border mb-4">` do search (linhas 2009–2020)
- [x] 2.2 No bloco de header, adicionar o `InputGroup` de busca entre os stats e o botão "Contratar", com `style={{ maxWidth: 280 }}`
- [x] 2.3 Garantir que o header use `flexWrap: 'wrap'` e `gap` adequado para não quebrar em telas menores

## 3. Implementar paginação client-side

- [x] 3.1 Adicionar `const PAGE_SIZE = 12` e `const [page, setPage] = useState(1)` no componente `AgentsBody`
- [x] 3.2 Adicionar `useEffect` que reseta `page` para `1` sempre que `search` mudar
- [x] 3.3 Calcular `const pagedAgents = filteredAgents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)` e substituir `filteredAgents` pelo `pagedAgents` no map dos cards
- [x] 3.4 Calcular `const totalPages = Math.ceil(filteredAgents.length / PAGE_SIZE)`
- [x] 3.5 Renderizar controles de paginação após o `<Row>` de agentes: botão "← Anterior" (disabled se `page <= 1`), texto `Página X de Y`, botão "Próxima →" (disabled se `page >= totalPages`)
- [x] 3.6 Ocultar controles quando `totalPages <= 1`

## 4. Verificação visual

- [x] 4.1 Confirmar que a página carrega com os cards dos agentes visíveis sem scroll na resolução 1440×900
- [x] 4.2 Confirmar que a busca filtra em tempo real e reseta para página 1
- [x] 4.3 Confirmar que os stats exibem os valores corretos (`total`, `ativos`, `pausados`)
- [x] 4.4 Confirmar que o layout não quebra em tela menor (1280px de largura)
