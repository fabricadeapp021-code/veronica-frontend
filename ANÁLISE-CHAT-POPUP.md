# Análise do Frontend - Chat Popup

## 📋 Visão Geral

O sistema de **Chat Popup** no frontend é um componente de UI para comunicação em tempo real, dividido em duas funcionalidades principais:
1. **Direct Message** (`/apps/chat-popup/direct-message`) - Chat direto entre usuários
2. **Chat Bot** (`/apps/chat-popup/chat-bot`) - Interface de chatbot

---

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
apps/chat-popup/
├── direct-message/
│   ├── page.jsx          # Página principal (ChatPopup)
│   ├── ChatPopupBody.jsx # Corpo do chat (mensagens + lista de contatos)
│   ├── Header.jsx        # Cabeçalho do popup
│   └── Footer.jsx        # Rodapé com input de mensagem
└── chat-bot/
    ├── page.jsx          # Página principal (ChatBot)
    └── ChatBotInterface.jsx # Interface completa do chatbot
```

---

## 🔄 Gerenciamento de Estado

### GlobalStateProvider

O estado é gerenciado via **Context API** usando `useReducer`:

**Arquivo:** `src/context/GolobalStateProvider.js`

```javascript
const [states, dispatch] = useReducer(rootReducer, initialStates);
```

### Estado do Chat Popup

**Arquivo:** `src/context/reducer/chatPopupReducer.js`

O reducer gerencia dois tipos de mensagens:

1. **directMsgs** - Mensagens do chat direto
2. **popupMsgs** - Mensagens do chatbot

### Actions Disponíveis

- `send_direct_msg` - Adiciona nova mensagem no chat direto
- `send_popup_msg` - Adiciona nova mensagem no chatbot

---

## 📱 Funcionalidades

### 1. Direct Message (`/apps/chat-popup/direct-message`)

#### Componente Principal: `page.jsx`

**Estado Local:**
- `showChatPopup` - Controla visibilidade do popup (default: `true`)
- `showContacts` - Controla exibição da lista de contatos

**Componentes:**
- `<ChatPopupHeader />` - Cabeçalho com perfil do contato e ações
- `<ChatPopupBody />` - Corpo com mensagens e lista de contatos
- `<ChatPopupFooter />` - Rodapé com input de mensagem

**Funcionalidades:**
- ✅ Botão flutuante para abrir/fechar chat
- ✅ Lista de contatos (organizada alfabeticamente)
- ✅ Visualização de mensagens
- ✅ Input de mensagem com Enter para enviar
- ✅ Indicador de "digitando..."
- ✅ Scroll automático para última mensagem

#### ChatPopupBody.jsx

**Estado:**
- Usa `states.chatPopupState.directMsgs` do contexto global
- `isTyping` - Indicador de digitação
- `messages` - Mensagens locais (sincronizado com contexto)

**Características:**
- Lista de contatos estática (hardcoded)
- Mensagens estáticas (hardcoded)
- Suporta mensagens de texto, arquivos e imagens
- Separação por data ("Today")
- Indicador de status (online/offline)

**Limitações:**
- ❌ **Não conectado à API** - Dados são mockados
- ❌ Lista de contatos estática (não carrega do backend)
- ❌ Mensagens não são persistidas
- ❌ Sem integração com backend real

#### Header.jsx

**Funcionalidades:**
- Toggle entre lista de contatos e chat
- Busca de contatos (UI existe, mas não funcional)
- Menu de ações (Mute, Notificações)
- Perfil do contato atual

#### Footer.jsx

**Funcionalidades:**
- Input de mensagem
- Envio via Enter (keyCode 13)
- Dropdown para anexos (Photo, Document, Location, Contact)
- Botão de emoji (UI apenas)

**Lógica de Envio:**
```javascript
const sendMessage = () => {
    if (messages.length > 0) {
        dispatch({ 
            type: "send_direct_msg", 
            directMsgs: { text: messages, time: currentTime, types: "sent" } 
        });
        // Resposta automática mockada
        setTimeout(() => {
            dispatch({ 
                type: "send_direct_msg", 
                directMsgs: { text: "What are you saying?", time: currentTime, types: "received" } 
            });
        }, 800);
    }
}
```

**Observações:**
- ⚠️ Resposta automática é hardcoded
- ⚠️ Mensagens não são enviadas para API
- ⚠️ Estado local não é sincronizado corretamente (usa `messages` state mas envia para contexto)

---

### 2. Chat Bot (`/apps/chat-popup/chat-bot`)

#### Componente Principal: `page.jsx`

Apenas wrapper que renderiza `ChatBotInterface`.

#### ChatBotInterface.jsx

**Estado Local:**
- `showChatbot` - Visibilidade do popup
- `showPopup` - Visibilidade do tooltip inicial
- `startConversation` - Controla tela inicial vs conversa
- `typing` - Indicador de digitação
- `messages` - Mensagem atual do input

**Estado Global:**
- Usa `states.chatPopupState.popupMsgs` para mensagens

**Funcionalidades:**
- ✅ Tela inicial com botões de ação rápida
- ✅ Conversa iniciada por botões ou "Start a conversation"
- ✅ Envio de mensagens
- ✅ Resposta automática mockada
- ✅ Indicador de "digitando..."
- ✅ Scroll automático
- ✅ Dropdown para anexos
- ✅ Footer com branding

**Lógica de Envio:**
```javascript
const sendMessage = () => {
    if (messages.length > 0) {
        dispatch({ 
            type: "send_popup_msg", 
            popupMsgs: { text: messages, types: "sent" } 
        });
        // Resposta automática mockada
        setTimeout(() => {
            dispatch({ 
                type: "send_popup_msg", 
                popupMsgs: { text: "What are you saying?", types: "received" } 
            });
        }, 800);
    }
}
```

**Tela Inicial:**
- Botões de ação rápida:
  - "Just browsing"
  - "I have a question regarding pricing"
  - "Need help for technical query"
  - "I have a pre purchase question"
- Todos apenas iniciam a conversa (não têm ações específicas)

**Limitações:**
- ❌ **Não conectado à API** - Respostas são mockadas
- ❌ Sem integração com agentes/LLM do backend
- ❌ Mensagens não são persistidas
- ❌ Botões de ação rápida não têm lógica específica

---

## 🎨 UI/UX

### Estilização

**Classes CSS principais:**
- `.hk-chat-popup` - Container principal do chat direto
- `.hk-chatbot-popup` - Container principal do chatbot
- `.chat-popup-body` - Corpo do chat
- `.btn-popup-open` - Botão flutuante para abrir

**Localização dos estilos:**
- `src/styles/scss/apps.scss`
- `src/styles/css/style.css`
- `src/styles/css/style-dark.css`

### Componentes Utilizados

- `react-bootstrap` - Componentes UI (Button, Dropdown, Form, etc.)
- `react-feather` - Ícones
- `simplebar-react` - Scroll customizado
- `next/image` - Otimização de imagens
- `classNames` - Gerenciamento de classes CSS

---

## 🔌 Integração com Backend

### Estado Atual

**❌ NENHUMA integração com backend existe atualmente**

- Não há serviços de API para chat
- Não há WebSocket para mensagens em tempo real
- Dados são completamente mockados
- Mensagens não são persistidas

### Backend Disponível

No backend existe:
- `apps/voxx/src/agents/agents.controller.ts` - API de agentes/chat
- Endpoints possíveis:
  - `/agents/chat` - Chat com agente
  - `/agents/chat-stream` - Chat com streaming

### O que seria necessário

1. **Criar serviços de API** (`src/lib/api/services/chat.js` ou `agents.js`)
2. **Integrar com endpoints existentes** do backend
3. **Implementar WebSocket** para mensagens em tempo real
4. **Substituir dados mockados** por chamadas reais
5. **Gerenciar estado** com dados do backend
6. **Persistir mensagens** no backend

---

## 📊 Fluxo de Dados Atual

### Direct Message

```
Usuário digita mensagem
  ↓
Footer.jsx - sendMessage()
  ↓
dispatch({ type: "send_direct_msg", ... })
  ↓
chatPopupReducer.js
  ↓
states.chatPopupState.directMsgs (atualizado)
  ↓
ChatPopupBody.jsx - useEffect observa states
  ↓
Renderiza nova mensagem
  ↓
Resposta automática mockada (hardcoded)
```

### Chat Bot

```
Usuário digita mensagem
  ↓
ChatBotInterface.jsx - sendMessage()
  ↓
dispatch({ type: "send_popup_msg", ... })
  ↓
chatPopupReducer.js
  ↓
states.chatPopupState.popupMsgs (atualizado)
  ↓
ChatBotInterface.jsx - Renderiza mensagens
  ↓
Resposta automática mockada (hardcoded)
```

---

## 🐛 Problemas Identificados

### 1. Direct Message - Footer.jsx

**Problema:** Estado local `messages` não é limpo após enviar

```javascript
const [messages, setMessages] = useState([]); // ⚠️ Array, mas usado como string
const sendMessage = () => {
    if (messages.length > 0) { // ✅ Funciona
        dispatch({ type: "send_direct_msg", directMsgs: { text: messages, ... } });
        // ❌ Não limpa o input
    }
}
const onKeyDown = (e) => {
    if (e.keyCode === 13) {
        sendMessage();
        setMessages(""); // ✅ Limpa, mas 'messages' é array, deveria ser string
    }
}
```

**Input:**
```javascript
<Form.Control 
    value={messages} // ❌ Array usado como string
    onChange={e => setMessages(e.target.value)} // ✅ Converte para string
    onKeyDown={onKeyDown}
/>
```

**Solução:** `messages` deveria ser `string` desde o início:
```javascript
const [messages, setMessages] = useState(''); // String, não array
```

### 2. Lista de Contatos Estática

**Problema:** Contatos são hardcoded no `ChatPopupBody.jsx`

**Solução:** Carregar do backend (API de contatos/leads)

### 3. Mensagens Não Persistem

**Problema:** Mensagens são apenas no estado do React (memória)

**Solução:** Integrar com backend para persistência

### 4. Sem Integração Real com API

**Problema:** Tudo é mockado

**Solução:** Criar serviços de API e integrar

---

## 🎯 O que Funciona

✅ **UI Completa:**
- Interface visual completa e funcional
- Design responsivo
- Animações e transições
- Scroll automático
- Indicadores de status

✅ **Estado Gerenciado:**
- Context API funcionando
- Reducer pattern implementado
- Estado sincronizado entre componentes

✅ **Interatividade Básica:**
- Abrir/fechar popup
- Toggle lista de contatos
- Enviar mensagens (visualmente)
- Receber respostas mockadas

---

## 🔧 O que Precisa ser Implementado

### Prioridade Alta

1. **Criar serviços de API**
   - `src/lib/api/services/agents.js` ou `chat.js`
   - Funções para enviar mensagens
   - Funções para receber mensagens
   - Funções para listar conversas

2. **Integrar Chat Bot com backend**
   - Conectar com `/agents/chat` ou `/agents/chat-stream`
   - Substituir resposta mockada por resposta real
   - Implementar streaming (opcional)

3. **Integrar Direct Message com backend**
   - Conectar com API de mensagens
   - Carregar lista de contatos do backend
   - Enviar/receber mensagens reais

4. **Corrigir bugs**
   - Footer.jsx - Estado `messages` como string
   - Sincronização de estado

### Prioridade Média

5. **WebSocket para tempo real**
   - Notificações de novas mensagens
   - Status online/offline
   - Indicador de "digitando..."

6. **Persistência de mensagens**
   - Salvar no backend
   - Carregar histórico
   - Paginação de mensagens antigas

7. **Lista de contatos dinâmica**
   - Buscar do backend (Leads/Contacts)
   - Busca funcional
   - Filtros e ordenação

### Prioridade Baixa

8. **Funcionalidades extras**
   - Upload de arquivos
   - Envio de localização
   - Compartilhar contatos
   - Emojis
   - Anexos

---

## 📝 Resumo Executivo

### Estado Atual

O frontend de Chat Popup possui:
- ✅ **UI completa e funcional**
- ✅ **Gerenciamento de estado com Context API**
- ❌ **Sem integração com backend**
- ❌ **Dados completamente mockados**
- ❌ **Mensagens não persistem**

### Arquitetura

- **Direct Message:** Chat 1-para-1 entre usuários
- **Chat Bot:** Interface de chatbot com agente

### Próximos Passos

1. Criar serviços de API para chat
2. Integrar com endpoints do backend
3. Substituir dados mockados por dados reais
4. Implementar persistência
5. Adicionar WebSocket para tempo real

---

## 🔗 Referências

- **Backend API:** `apps/voxx/src/agents/agents.controller.ts`
- **Estado Global:** `src/context/GolobalStateProvider.js`
- **Reducer:** `src/context/reducer/chatPopupReducer.js`
- **Rotas:** Definidas em `src/layout/Sidebar/VerticalNav2/MenuList.js`

