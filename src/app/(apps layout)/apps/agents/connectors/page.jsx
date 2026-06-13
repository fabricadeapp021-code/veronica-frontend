'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import classNames from 'classnames';
import AgentsSidebar from '../AgentsSidebar';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  Modal,
  Nav,
  Row,
  Spinner,
} from 'react-bootstrap';
import {
  Activity,
  ArrowLeft,
  CheckCircle,
  Globe,
  Headphones,
  HelpCircle,
  Link as LinkIcon,
  RefreshCw,
  Search,
  Zap,
} from 'react-feather';

const PROVIDER_HELP_GUIDE = {
  hubspot: {
    title: 'Como conectar o HubSpot',
    steps: [
      { label: 'Acesse sua conta HubSpot', detail: 'Vá para app.hubspot.com e faça login.' },
      { label: 'Abra as Configurações', detail: 'Clique no ícone de engrenagem ⚙️ no canto superior direito.' },
      { label: 'Acesse Aplicativos Privados', detail: 'No menu lateral, vá em Integrações → Aplicativos privados.' },
      { label: 'Crie um novo aplicativo', detail: 'Clique em "Criar aplicativo privado" e dê um nome (ex: Venorica AI).' },
      { label: 'Configure os escopos', detail: 'Na aba Escopos, adicione: crm.objects.contacts.read, crm.objects.contacts.write, crm.objects.notes.write.' },
      { label: 'Gere o token', detail: 'Clique em "Criar" → "Mostrar token" → "Copiar". O token começa com pat-na1-...' },
      { label: 'Cole o token aqui', detail: 'Clique no card do HubSpot, cole o token no campo "API Key" e clique em Conectar.' },
    ],
    note: 'Você precisa ser superadministrador da conta HubSpot para criar aplicativos privados.',
  },
  clickup: {
    title: 'Como conectar o ClickUp',
    steps: [
      { label: 'Acesse sua conta ClickUp', detail: 'Vá para app.clickup.com e faça login.' },
      { label: 'Abra as Configurações', detail: 'Clique no avatar no canto inferior esquerdo → Configurações.' },
      { label: 'Acesse Apps', detail: 'No menu lateral, clique em "Apps".' },
      { label: 'Gere o token', detail: 'Em "API Token", clique em "Generate" ou copie o token existente. Começa com pk_...' },
      { label: 'Cole o token aqui', detail: 'Clique no card do ClickUp, cole o token e selecione a lista de destino para leads.' },
    ],
    note: 'O token é pessoal. Use o token do usuário que deve ser o responsável pelas tarefas.',
  },
  slack: {
    title: 'Como conectar o Slack',
    steps: [
      { label: 'Acesse api.slack.com/apps', detail: 'Faça login e clique em "Create New App" → "From scratch".' },
      { label: 'Nomeie o app', detail: 'Dê um nome (ex: Venorica AI) e selecione o workspace desejado.' },
      { label: 'Adicione permissões', detail: 'Vá em "OAuth & Permissions" → "Bot Token Scopes". Adicione: channels:read, chat:write, im:write, groups:read.' },
      { label: 'Instale o app', detail: 'Clique em "Install to Workspace" e confirme a autorização.' },
      { label: 'Copie o Bot Token', detail: 'Em "OAuth & Permissions", copie o "Bot User OAuth Token" (começa com xoxb-).' },
      { label: 'Cole o token aqui', detail: 'Clique no card do Slack, cole o Bot Token e clique em Conectar.' },
    ],
    note: 'Adicione o bot aos canais que ele deve acessar usando /invite @NomeDoBot no canal.',
  },
  telegram: {
    title: 'Como conectar o Telegram',
    steps: [
      { label: 'Abra o Telegram', detail: 'Acesse o app no celular ou em web.telegram.org.' },
      { label: 'Fale com o BotFather', detail: 'Pesquise por @BotFather e inicie uma conversa.' },
      { label: 'Crie um bot', detail: 'Envie /newbot, escolha um nome e um username (deve terminar em "bot").' },
      { label: 'Copie o token', detail: 'O BotFather vai enviar um token no formato 123456789:ABC-...' },
      { label: 'Cole o token aqui', detail: 'Clique no card do Telegram, cole o Bot Token e clique em Conectar.' },
    ],
    note: 'Guarde o token com segurança. Qualquer pessoa com o token controla o seu bot.',
  },
  google_gmail: {
    title: 'Como conectar o Gmail',
    steps: [
      { label: 'Clique no card Gmail', detail: 'O sistema redireciona para autenticação via Google OAuth.' },
      { label: 'Selecione a conta Google', detail: 'Escolha a conta Gmail que o agente deve usar.' },
      { label: 'Autorize as permissões', detail: 'Permita leitura e envio de e-mails. O acesso é limitado ao necessário.' },
      { label: 'Pronto', detail: 'Após autorizar, você voltará automaticamente e o Gmail estará conectado.' },
    ],
    note: 'O acesso pode ser revogado a qualquer momento em myaccount.google.com/permissions.',
  },
  google_calendar: {
    title: 'Como conectar o Google Calendar',
    steps: [
      { label: 'Clique no card Google Calendar', detail: 'O sistema redireciona para autenticação via Google OAuth.' },
      { label: 'Selecione a conta Google', detail: 'Escolha a conta com a agenda que o agente deve acessar.' },
      { label: 'Autorize as permissões', detail: 'Permita leitura e criação de eventos na sua agenda.' },
      { label: 'Pronto', detail: 'Após autorizar, você voltará automaticamente e o Calendar estará conectado.' },
    ],
    note: 'O agente usará a agenda principal (primary) da conta autorizada.',
  },
  google_drive: {
    title: 'Como conectar o Google Drive',
    steps: [
      { label: 'Clique no card Google Drive', detail: 'O sistema redireciona para autenticação via Google OAuth.' },
      { label: 'Selecione a conta Google', detail: 'Escolha a conta com os arquivos que o agente deve acessar.' },
      { label: 'Autorize as permissões', detail: 'Permita leitura de arquivos no Drive.' },
      { label: 'Pronto', detail: 'Após autorizar, o Drive estará conectado e o agente pode buscar arquivos.' },
    ],
    note: 'O agente tem acesso somente leitura. Nenhum arquivo é modificado ou excluído.',
  },
  google_sheets: {
    title: 'Como conectar o Google Sheets',
    steps: [
      { label: 'Clique no card Google Sheets', detail: 'O sistema redireciona para autenticação via Google OAuth.' },
      { label: 'Selecione a conta Google', detail: 'Escolha a conta com as planilhas que o agente deve acessar.' },
      { label: 'Autorize as permissões', detail: 'Permita leitura e escrita em planilhas.' },
      { label: 'Pronto', detail: 'Após autorizar, o agente poderá consultar e registrar dados em planilhas.' },
    ],
    note: 'Configure quais planilhas o agente pode acessar nas configurações do agente.',
  },
  notion: {
    title: 'Como conectar o Notion',
    steps: [
      { label: 'Acesse notion.so/my-integrations', detail: 'Faça login na sua conta Notion.' },
      { label: 'Crie uma integração', detail: 'Clique em "New integration", dê um nome (ex: Venorica AI) e selecione o workspace.' },
      { label: 'Copie o token', detail: 'Em "Internal Integration Token", copie o token (começa com secret_...).' },
      { label: 'Compartilhe páginas', detail: 'Nas páginas do Notion que o agente deve acessar, clique em "..." → "Add connections" e selecione sua integração.' },
      { label: 'Cole o token aqui', detail: 'Clique no card do Notion, cole o token e conecte.' },
    ],
    note: 'O agente só acessa páginas que foram explicitamente compartilhadas com a integração.',
  },
  pipedrive: {
    title: 'Como conectar o Pipedrive',
    steps: [
      { label: 'Acesse sua conta Pipedrive', detail: 'Vá para app.pipedrive.com e faça login.' },
      { label: 'Abra as Configurações', detail: 'Clique no seu avatar → Configurações pessoais.' },
      { label: 'Acesse API', detail: 'No menu, clique em "API" para ver seu token pessoal.' },
      { label: 'Copie o token', detail: 'Copie o "Your personal API token".' },
      { label: 'Cole o token aqui', detail: 'Clique no card do Pipedrive, cole o token e conecte.' },
    ],
    note: 'O token é pessoal e tem as mesmas permissões do seu usuário no Pipedrive.',
  },
  whatsapp: {
    title: 'Como conectar o WhatsApp',
    steps: [
      { label: 'Configure o número', detail: 'Informe o número de telefone com DDD e código do país (ex: +5511999999999).' },
      { label: 'Conecte o dispositivo', detail: 'O sistema gera um QR Code. Escaneie com o WhatsApp no celular em Aparelhos Conectados.' },
      { label: 'Aguarde a conexão', detail: 'Após escanear, o agente estará conectado e pronto para receber mensagens.' },
    ],
    note: 'Use um número dedicado para o agente. Não use o seu número pessoal.',
  },
  email: {
    title: 'Como conectar o E-mail',
    steps: [
      { label: 'Informe o servidor SMTP', detail: 'Preencha host, porta e credenciais do seu provedor de e-mail.' },
      { label: 'Configure o remetente', detail: 'Informe o e-mail e nome que aparecerão como remetente nas mensagens enviadas.' },
      { label: 'Teste a conexão', detail: 'O sistema enviará um e-mail de teste para validar as configurações.' },
    ],
    note: 'Para Gmail use smtp.gmail.com:587. Crie uma "Senha de app" nas configurações de segurança do Google.',
  },
  documents: {
    title: 'Como configurar a Base de Conhecimento',
    steps: [
      { label: 'Acesse a base de documentos', detail: 'Vá em Funcionários IA → seu agente → aba Conhecimento.' },
      { label: 'Faça upload dos documentos', detail: 'Envie PDFs, Word, TXT com políticas, FAQs, catálogos ou procedimentos.' },
      { label: 'Aguarde o processamento', detail: 'Os documentos são indexados automaticamente (pode levar alguns minutos).' },
      { label: 'Ative o conector', detail: 'Volte aqui e conecte o conector de Documentos ao agente.' },
    ],
    note: 'Quanto mais específicos os documentos, melhores serão as respostas do agente.',
  },
  webhook_inbound: {
    title: 'Como usar o Webhook Inbound',
    steps: [
      { label: 'Clique em Conectar', detail: 'O sistema gera automaticamente uma URL única e um token secreto para este agente.' },
      { label: 'Copie a URL gerada', detail: 'A URL já contém o token embutido. Cole-a no sistema externo (CRM, formulário, n8n, Make, etc.).' },
      { label: 'Configure o sistema externo', detail: 'No sistema externo, configure um POST para a URL copiada com o payload em JSON no body.' },
      { label: 'Vincule ao agente', detail: 'Clique em "Vincular Ao Funcionário" para ativar o agente que vai responder aos eventos.' },
      { label: 'Teste o fluxo', detail: 'Envie um POST de teste. O agente vai receber o payload como mensagem e agir.' },
    ],
    note: 'Mantenha a URL em segredo — ela contém o token de autenticação. Para revogar o acesso, desconecte e reconecte para gerar uma nova URL.',
  },
};

const HelpModal = ({ provider, meta, onHide }) => {
  const guide = PROVIDER_HELP_GUIDE[provider?.key];
  if (!provider || !guide) return null;
  return (
    <Modal show onHide={onHide} centered size="md">
      <Modal.Header closeButton className="border-bottom-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-3">
          <div
            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: 40, height: 40, background: `${meta.color}1a`, border: `1px solid ${meta.color}33` }}
          >
            <ProviderIconRenderer meta={meta} size={22} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{guide.title}</div>
            <div className="text-muted" style={{ fontSize: 12, fontWeight: 400 }}>{provider.name}</div>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-3">
        <ol className="ps-3 mb-3" style={{ fontSize: 13, lineHeight: 1.8 }}>
          {guide.steps.map((step, i) => (
            <li key={i} className="mb-2">
              <span className="fw-semibold">{step.label}</span>
              {step.detail && (
                <div className="text-muted" style={{ fontSize: 12 }}>{step.detail}</div>
              )}
            </li>
          ))}
        </ol>
        {guide.note && (
          <div
            className="rounded-2 px-3 py-2 d-flex gap-2 align-items-start"
            style={{ background: 'rgba(13,110,253,0.07)', border: '1px solid rgba(13,110,253,0.18)', fontSize: 12 }}
          >
            <HelpCircle size={14} color="#0d6efd" style={{ marginTop: 2, flexShrink: 0 }} />
            <span className="text-muted">{guide.note}</span>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top-0 pt-0">
        <Button variant="primary" size="sm" onClick={onHide}>
          Entendido
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const BrandIcon = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

const Icons = {
  whatsapp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  gmail: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
    </svg>
  ),
  googleCalendar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.316 5.684H24v12.632h-5.684z" fill="#EA4335"/>
      <path d="M5.684 24h12.632v-5.684H5.684z" fill="#34A853"/>
      <path d="M0 18.316h5.684V5.684H0z" fill="#4285F4"/>
      <path d="M24 5.684H5.684V0L24 0z" fill="#FBBC04"/>
      <path d="M0 5.684h5.684V0H0z" fill="#188038"/>
      <path d="M5.684 18.316h12.632V5.684H5.684z" fill="#fff"/>
      <path d="M5.684 0v5.684H0z" fill="#1967D2"/>
      <path d="M12.36 8.4c1.178 0 2.124.492 2.7 1.332l-1.068.972c-.348-.528-.876-.816-1.572-.816-1.116 0-1.956.876-1.956 2.112s.84 2.112 1.956 2.112c.864 0 1.44-.396 1.68-1.008H12.36v-1.32h3.252c.036.216.06.444.06.684C15.672 14.1 14.256 15.3 12.36 15.3c-2.004 0-3.48-1.44-3.48-3.3s1.476-3.3 3.48-3.3z" fill="#4285F4"/>
    </svg>
  ),
  googleDrive: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.433 22.396l2.756-4.772H24l-2.756 4.772z" fill="#34A853"/>
      <path d="M0 15.094L2.756 19.866 9.978 7.353l-2.756-4.772z" fill="#4285F4"/>
      <path d="M9.978 7.353l7.222 12.513h5.522L15.5 7.353z" fill="#FBBC04"/>
      <path d="M9.978 7.353L7.222 2.581H2.756L9.978 7.353z" fill="#EA4335"/>
    </svg>
  ),
  googleSheets: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.727 0H3.272A1.09 1.09 0 002.18 1.09v21.818c0 .603.49 1.092 1.091 1.092h17.455c.602 0 1.09-.49 1.09-1.09V7.09L14.727 0z" fill="#23A566"/>
      <path d="M14.727 0l7.09 7.09h-7.09z" fill="#1C8C56"/>
      <path d="M7.636 12H16.364v1.455H7.636zm0 2.91H16.364v1.454H7.636zm0 2.908H13.09v1.455H7.636z" fill="#fff"/>
      <path d="M7.636 9.09H16.364v1.456H7.636z" fill="#fff"/>
    </svg>
  ),
  clickup: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.214 17.907l2.76-2.121c1.524 1.983 3.139 2.896 4.898 2.896 1.752 0 3.35-.903 4.85-2.862l2.783 2.092C14.462 20.443 12.006 22 8.872 22c-3.138 0-5.617-1.558-7.658-4.093z" fill="#8930FD"/>
      <path d="M8.872 2l6.256 5.725-2.12 2.314-4.136-3.785-4.115 3.779-2.13-2.307L8.872 2z" fill="#49CDF5"/>
    </svg>
  ),
  slack: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" fill="#E01E5A"/>
    </svg>
  ),
  hubspot: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.006 9.373a4.215 4.215 0 00-2.872-1.109 4.188 4.188 0 00-1.696.358V5.995a1.396 1.396 0 00.83-1.27V4.58a1.397 1.397 0 00-1.396-1.397h-.144a1.397 1.397 0 00-1.397 1.397v.145c0 .56.33 1.044.81 1.27v2.668a4.2 4.2 0 00-1.557.765L7.42 4.858a1.56 1.56 0 00.033-.302 1.564 1.564 0 10-1.563 1.563 1.55 1.55 0 00.769-.21l7.266 4.416a4.218 4.218 0 00.086 4.093l-2.115 2.115a1.565 1.565 0 00-.444-.069 1.574 1.574 0 101.574 1.574 1.565 1.565 0 00-.069-.444l2.085-2.085a4.225 4.225 0 006.964-3.136z" fill="#FF7A59"/>
    </svg>
  ),
  notion: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" fill="#000"/>
    </svg>
  ),
  pipedrive: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.1 0C6.579 0 2.1 4.494 2.1 10.035c0 5.19 3.9 9.477 8.934 10.012V24h2.171v-3.953C18.237 19.52 22.1 15.228 22.1 10.035 22.1 4.494 17.621 0 12.1 0zm.02 18.097c-4.428 0-8.02-3.602-8.02-8.044 0-4.441 3.592-8.044 8.02-8.044 4.427 0 8.02 3.603 8.02 8.044 0 4.442-3.593 8.044-8.02 8.044z" fill="#1A73E8"/>
    </svg>
  ),
  telegram: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.368l-2.965-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.963.191z" fill="#229ED9"/>
    </svg>
  ),
  webhook: ({ size = 20 }) => <Globe size={size} color="#6b7280" />,
  openclaw: ({ size = 20 }) => <Activity size={size} color="#8b5cf6" />,
  helpdesk: ({ size = 20 }) => <Headphones size={size} color="#f59e0b" />,
  documents: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};
import { resolveApiBaseUrl } from '@/lib/api/config';
import { getAccessToken } from '@/lib/auth/session';
import { apiRequest } from '@/lib/api/client';

const categoryLabels = {
  channel: 'Canal',
  crm: 'CRM',
  marketing: 'Marketing',
  productivity: 'Produtividade',
  communication: 'Comunicação',
  docs: 'Documentos',
  helpdesk: 'Helpdesk',
  data: 'Dados',
  tools: 'Ferramentas',
  knowledge: 'Conhecimento',
  runtime: 'Runtime',
  google: 'Google',
};

const CATEGORY_ORDER = [
  'channel',
  'crm',
  'marketing',
  'productivity',
  'communication',
  'docs',
  'helpdesk',
  'data',
  'tools',
  'knowledge',
];

const statusLabels = {
  connected: 'Conectado',
  pending: 'Pendente',
  error: 'Erro',
  disconnected: 'Desconectado',
};

const providerMeta = {
  whatsapp:         { BrandComponent: Icons.whatsapp,       color: '#25D366' },
  telegram:         { BrandComponent: Icons.telegram,       color: '#229ED9' },
  documents:        { BrandComponent: Icons.documents,      color: '#6366f1' },
  crm:              { BrandComponent: null,                 color: '#3b82f6' },
  helpdesk:         { BrandComponent: Icons.helpdesk,       color: '#f59e0b' },
  email:            { BrandComponent: Icons.gmail,          color: '#EA4335' },
  google_gmail:     { BrandComponent: Icons.gmail,          color: '#EA4335' },
  google_drive:     { BrandComponent: Icons.googleDrive,    color: '#4285F4' },
  google_sheets:    { BrandComponent: Icons.googleSheets,   color: '#34A853' },
  google_calendar:  { BrandComponent: Icons.googleCalendar, color: '#4285F4' },
  openclaw_gateway: { BrandComponent: Icons.openclaw,       color: '#8b5cf6' },
  clickup:          { BrandComponent: Icons.clickup,        color: '#7B68EE' },
  notion:           { BrandComponent: Icons.notion,         color: '#000000' },
  slack:            { BrandComponent: Icons.slack,          color: '#E01E5A' },
  hubspot:          { BrandComponent: Icons.hubspot,        color: '#FF7A59' },
  pipedrive:        { BrandComponent: Icons.pipedrive,      color: '#1A73E8' },
  webhook:          { BrandComponent: Icons.webhook,        color: '#6b7280' },
  webhook_inbound:  { BrandComponent: Icons.webhook,        color: '#8b5cf6' },
};

const defaultMeta = { BrandComponent: null, color: '#6b7280' };

const ProviderIconRenderer = ({ meta, size = 20 }) => {
  if (meta?.BrandComponent) {
    const BC = meta.BrandComponent;
    return <BC size={size} />;
  }
  return <Zap size={size} color={meta?.color || '#6b7280'} />;
};

const isGoogle = (key) => key.startsWith('google_');
const isSlack = (key) => key === 'slack';
const isOAuth = (key) => isGoogle(key) || isSlack(key);

const defaultFormByProvider = {
  whatsapp: {
    name: 'WhatsApp Atendimento',
    config: { phoneNumber: '', provider: 'openclaw_gateway' },
    credentials: { apiKey: '' },
  },
  telegram: {
    name: 'Telegram Bot',
    config: { provider: 'telegram', botUsername: '' },
    credentials: { botToken: '' },
  },
  documents: {
    name: 'Base de conhecimento',
    config: { source: 'managed_documents', collection: 'atendimento_247' },
    credentials: {},
  },
  crm: {
    name: 'CRM Comercial',
    config: { endpoint: '', provider: 'manual_api' },
    credentials: { apiKey: '' },
  },
  helpdesk: {
    name: 'Helpdesk',
    config: { endpoint: '', provider: 'manual_api' },
    credentials: { apiKey: '' },
  },
  email: {
    name: 'E-mail Atendimento',
    config: { provider: 'smtp' },
    credentials: { host: '', port: '587', secure: 'false', user: '', pass: '', from: '' },
  },
  openclaw_gateway: {
    name: 'OpenClaw Gateway',
    config: { healthPath: '/openclaw/gateway/health' },
    credentials: {},
  },
  clickup: {
    name: 'ClickUp',
    config: { apiUrl: 'https://api.clickup.com/api/v2', provider: 'clickup' },
    credentials: { apiKey: '' },
  },
  notion: {
    name: 'Notion',
    config: { apiUrl: 'https://api.notion.com/v1', provider: 'notion' },
    credentials: { apiKey: '' },
  },
  google_calendar: {
    name: 'Google Calendar',
    config: { provider: 'google_calendar', calendarId: 'primary' },
    credentials: { clientId: '', clientSecret: '' },
  },
  google_gmail: {
    name: 'Gmail',
    config: { provider: 'google_gmail' },
    credentials: { clientId: '', clientSecret: '' },
  },
  google_drive: {
    name: 'Google Drive',
    config: { provider: 'google_drive' },
    credentials: { clientId: '', clientSecret: '' },
  },
  google_sheets: {
    name: 'Google Sheets',
    config: { provider: 'google_sheets' },
    credentials: { clientId: '', clientSecret: '' },
  },
  slack: {
    name: 'Slack',
    config: { provider: 'slack' },
    credentials: { botToken: '' },
  },
  hubspot: {
    name: 'HubSpot',
    config: { apiUrl: 'https://api.hubapi.com', provider: 'hubspot' },
    credentials: { apiKey: '' },
  },
  pipedrive: {
    name: 'Pipedrive',
    config: { apiUrl: 'https://api.pipedrive.com/v1', provider: 'pipedrive' },
    credentials: { apiKey: '' },
  },
  webhook: {
    name: 'Webhook Outbound',
    config: { provider: 'webhook', method: 'POST', url: '', authType: 'none', authHeader: '' },
    credentials: { authValue: '', authUser: '' },
  },
  webhook_inbound: {
    name: 'Webhook Inbound',
    config: { provider: 'webhook_inbound', messageField: '', senderField: '' },
    credentials: {},
  },
};

const ProviderFields = ({ providerKey, form, updateForm }) => {
  const cred = (key, label, placeholder, type = 'password') => (
    <Form.Group className="mb-3" key={key}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type={type}
        value={form.credentials?.[key] || ''}
        onChange={(e) => updateForm('credentials', key, e.target.value)}
        placeholder={placeholder}
      />
    </Form.Group>
  );

  const cfg = (key, label, placeholder, type = 'text') => (
    <Form.Group className="mb-3" key={key}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type={type}
        value={form.config?.[key] || ''}
        onChange={(e) => updateForm('config', key, e.target.value)}
        placeholder={placeholder}
      />
    </Form.Group>
  );

  const googleOAuth = [
    cred('clientId', 'Client ID do Google', 'xxxxx.apps.googleusercontent.com', 'text'),
    cred('clientSecret', 'Client Secret', 'GOCSPX-...'),
  ];

  const fields = {
    whatsapp: [cfg('phoneNumber', 'Número do WhatsApp', '+5511999990000')],
    telegram: [
      cred('botToken', 'Bot Token', '123456789:AAHxxxxxxxxxxxxxxxx'),
      cfg('botUsername', 'Username do bot (opcional)', '@veronica_ia_bot', 'text'),
    ],
    documents: [cfg('collection', 'Nome da coleção', 'atendimento_247')],
    crm: [
      cfg('endpoint', 'URL da API', 'https://api.seucrm.com'),
      cred('apiKey', 'API Key', 'sk-...'),
    ],
    helpdesk: [
      cfg('endpoint', 'URL da API', 'https://seudominio.freshdesk.com'),
      cred('apiKey', 'API Key', 'sk-...'),
    ],
    email: [
      cred('host', 'Servidor SMTP', 'smtp.gmail.com', 'text'),
      cred('port', 'Porta', '587', 'text'),
      cred('user', 'Usuário SMTP', 'voce@empresa.com', 'email'),
      cred('pass', 'Senha / App Password', '••••••••'),
      cred('from', 'Endereço de envio (from)', 'Empresa <atendimento@empresa.com>', 'text'),
    ],
    clickup: [
      cred('apiKey', 'API Key do ClickUp', 'pk_...'),
    ],
    notion: [cred('apiKey', 'Integration Token do Notion', 'secret_...')],
    google_calendar: [...googleOAuth, cfg('calendarId', 'Calendar ID', 'primary')],
    google_gmail: googleOAuth,
    google_drive: googleOAuth,
    google_sheets: googleOAuth,
    slack: [cred('botToken', 'Bot Token', 'xoxb-...')],
    hubspot: [cred('apiKey', 'Access Token do HubSpot', 'pat-na1-...')],
    pipedrive: [cred('apiKey', 'API Token do Pipedrive', 'abc123...')],
    webhook: [
      cfg('url', 'URL do Webhook', 'https://hooks.n8n.io/...'),
      cfg('method', 'Método HTTP', 'POST'),
      <Form.Group className="mb-3" key="authType">
        <Form.Label>Autenticação (opcional)</Form.Label>
        <Form.Select
          value={form.config?.authType || 'none'}
          onChange={(e) => updateForm('config', 'authType', e.target.value)}
        >
          <option value="none">Nenhuma</option>
          <option value="bearer">Bearer Token</option>
          <option value="apikey">API Key (header)</option>
          <option value="basic">Basic Auth</option>
        </Form.Select>
      </Form.Group>,
      ...(form.config?.authType && form.config.authType !== 'none' ? [
        form.config.authType === 'apikey' ? (
          <Form.Group className="mb-3" key="authHeader">
            <Form.Label>Nome do Header</Form.Label>
            <Form.Control
              type="text"
              value={form.config?.authHeader || ''}
              onChange={(e) => updateForm('config', 'authHeader', e.target.value)}
              placeholder="Ex: X-API-Key"
            />
          </Form.Group>
        ) : null,
        form.config.authType === 'basic' ? (
          <Form.Group className="mb-3" key="authUser">
            <Form.Label>Usuário</Form.Label>
            <Form.Control
              type="text"
              value={form.credentials?.authUser || ''}
              onChange={(e) => updateForm('credentials', 'authUser', e.target.value)}
              placeholder="username"
            />
          </Form.Group>
        ) : null,
        <Form.Group className="mb-0" key="authValue">
          <Form.Label>
            {form.config.authType === 'bearer' ? 'Bearer Token' :
             form.config.authType === 'basic'  ? 'Senha' : 'Valor da chave'}
          </Form.Label>
          <Form.Control
            type="password"
            value={form.credentials?.authValue || ''}
            onChange={(e) => updateForm('credentials', 'authValue', e.target.value)}
            placeholder={form.config.authType === 'bearer' ? 'sk-...' : '••••••••'}
          />
        </Form.Group>,
      ].filter(Boolean) : []),
    ],
    webhook_inbound: [
      form.config?.webhookUrl ? (
        <Form.Group className="mb-3" key="webhookUrl">
          <Form.Label className="d-flex align-items-center gap-2">
            URL do Webhook
            <span className="badge bg-success" style={{ fontSize: 10, fontWeight: 500 }}>Pronto para uso</span>
          </Form.Label>
          <div className="d-flex gap-2">
            <Form.Control
              type="text"
              value={form.config.webhookUrl}
              readOnly
              style={{ fontFamily: 'monospace', fontSize: 11 }}
            />
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm flex-shrink-0"
              onClick={() => navigator.clipboard?.writeText(form.config.webhookUrl)}
            >
              Copiar
            </button>
          </div>
          <div className="text-muted mt-1" style={{ fontSize: 11 }}>
            Cole essa URL no sistema externo. O token já está embutido — mantenha em segredo.
          </div>
        </Form.Group>
      ) : (
        <div key="placeholder" className="text-muted mb-3" style={{ fontSize: 13 }}>
          Clique em <strong>Conectar</strong> para gerar sua URL e token secreto automaticamente.
        </div>
      ),
      cfg('messageField', 'Campo da mensagem (opcional)', 'Ex: message ou data.text'),
      cfg('senderField', 'Campo do remetente (opcional)', 'Ex: phone ou userId'),
    ],
    openclaw_gateway: [cfg('healthPath', 'Health path', '/openclaw/gateway/health')],
  };

  return <>{(fields[providerKey] || [])}</>;
};

const AgentConnectorsPage = () => {
  const searchParams = useSearchParams();
  const agentIdFromUrl = searchParams.get('agentId') || '';

  const [providers, setProviders] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentLinks, setAgentLinks] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(agentIdFromUrl);
  const [form, setForm] = useState({ name: '', config: {}, credentials: {} });
  const [modalProvider, setModalProvider] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [autoLink, setAutoLink] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkingId, setLinkingId] = useState('');
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [clickupLists, setClickupLists] = useState([]);
  const [clickupListsLoading, setClickupListsLoading] = useState(false);
  const [clickupListId, setClickupListId] = useState('');
  const [clickupListsError, setClickupListsError] = useState('');

  const [slackChannels, setSlackChannels] = useState([]);
  const [slackChannelsLoading, setSlackChannelsLoading] = useState(false);
  const [slackChannelId, setSlackChannelId] = useState('');
  const [slackChannelsError, setSlackChannelsError] = useState('');

  const [smtpVerifying, setSmtpVerifying] = useState(false);
  const [smtpVerifyOk, setSmtpVerifyOk] = useState(false);
  const [smtpVerifyError, setSmtpVerifyError] = useState('');

  const [helpProvider, setHelpProvider] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [providersRes, integrationsRes, agentsRes] = await Promise.all([
        apiRequest('/integrations/providers'),
        apiRequest('/integrations'),
        apiRequest('/agents'),
      ]);
      setProviders(providersRes?.providers || []);
      setIntegrations(integrationsRes?.integrations || []);
      const agentList = agentsRes?.agents || [];
      setAgents(agentList);
      if (!selectedAgentId && agentList[0]) setSelectedAgentId(agentList[0].id);
    } catch (err) {
      setLoadError(err?.message || 'Erro ao carregar conectores.');
    } finally {
      setLoading(false);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadAgentLinks = useCallback(async () => {
    if (!selectedAgentId) {
      setAgentLinks([]);
      return;
    }
    try {
      const res = await apiRequest(`/agents/${selectedAgentId}/integrations`);
      setAgentLinks(res?.integrations || []);
    } catch {
      // non-critical, skip
    }
  }, [selectedAgentId]);

  useEffect(() => {
    loadAgentLinks();
  }, [loadAgentLinks]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    if (connected !== 'google' && connected !== 'slack') return;
    if (!selectedAgentId || integrations.length === 0) return;

    const toAutoLink = integrations.filter((i) => {
      if (connected === 'google') {
        return ['google_calendar', 'google_gmail', 'google_drive', 'google_sheets'].includes(i.providerKey);
      }
      return i.providerKey === 'slack';
    });
    if (toAutoLink.length === 0) return;

    const alreadyLinked = new Set(agentLinks.map((l) => l.integrationId));
    const toLink = toAutoLink.filter((i) => !alreadyLinked.has(i.id));

    if (toLink.length === 0) return;

    Promise.all(
      toLink.map((integration) =>
        apiRequest(`/agents/${selectedAgentId}/integrations`, {
          method: 'POST',
          body: { integrationId: integration.id, permissions: integration.scopes || [] },
        }),
      ),
    ).then(() => loadAgentLinks()).catch(() => {});
  }, [searchParams, selectedAgentId, integrations, agentLinks, loadAgentLinks]);

  const connectedProviderKeys = useMemo(
    () => new Set(integrations.map((i) => i.providerKey)),
    [integrations],
  );

  const linkedProviderKeys = useMemo(
    () => new Set(agentLinks.map((l) => l.integration?.providerKey).filter(Boolean)),
    [agentLinks],
  );

  const linkedIntegrationIds = useMemo(
    () => new Set(agentLinks.map((l) => l.integrationId)),
    [agentLinks],
  );

  const availableCategories = useMemo(() => {
    const cats = new Set(providers.filter((p) => !isGoogle(p.key)).map((p) => p.category));
    const hasGoogle = providers.some((p) => isGoogle(p.key));
    return [
      'all',
      ...CATEGORY_ORDER.filter((c) => cats.has(c)),
      ...(hasGoogle ? ['google'] : []),
    ];
  }, [providers]);

  const filteredProviders = useMemo(() => {
    let list = providers;
    if (activeCategory === 'google') {
      list = list.filter((p) => isGoogle(p.key));
    } else if (activeCategory !== 'all') {
      list = list.filter((p) => p.category === activeCategory && !isGoogle(p.key));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [providers, activeCategory, searchQuery]);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId),
    [agents, selectedAgentId],
  );

  const fetchClickupLists = useCallback(async (apiKeyOverride) => {
    setClickupListsLoading(true);
    setClickupLists([]);
    setClickupListsError('');
    try {
      let res;
      if (apiKeyOverride) {
        res = await apiRequest('/integrations/clickup/lists-preview', {
          method: 'POST',
          body: { apiKey: apiKeyOverride },
        });
      } else {
        res = await apiRequest('/integrations/clickup/lists');
      }
      const allLists = (res?.spaces || []).flatMap((space) =>
        (space.lists || []).map((list) => ({
          id: list.id,
          label: `${space.name} › ${list.name}`,
        })),
      );
      setClickupLists(allLists);
    } catch (err) {
      setClickupListsError(err?.message || 'Erro ao buscar listas');
      setClickupLists([]);
    } finally {
      setClickupListsLoading(false);
    }
  }, []);

  const fetchSlackChannels = useCallback(async (botTokenOverride) => {
    setSlackChannelsLoading(true);
    setSlackChannels([]);
    setSlackChannelsError('');
    try {
      let res;
      if (botTokenOverride) {
        res = await apiRequest('/integrations/slack/channels-preview', {
          method: 'POST',
          body: { botToken: botTokenOverride },
        });
      } else {
        res = await apiRequest('/integrations/slack/channels');
      }
      setSlackChannels(res?.channels || []);
    } catch (err) {
      setSlackChannelsError(err?.message || 'Erro ao buscar canais');
      setSlackChannels([]);
    } finally {
      setSlackChannelsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (modalProvider?.key !== 'clickup') return;
    const apiKey = form.credentials?.apiKey || '';
    if (!apiKey.startsWith('pk_') || apiKey.length < 20) return;
    const timer = setTimeout(() => fetchClickupLists(apiKey), 700);
    return () => clearTimeout(timer);
  }, [form.credentials?.apiKey, modalProvider?.key, fetchClickupLists]);

  useEffect(() => {
    if (modalProvider?.key !== 'slack') return;
    const token = form.credentials?.botToken || '';
    if (!token.startsWith('xoxb-') || token.length < 20) return;
    const timer = setTimeout(() => fetchSlackChannels(token), 700);
    return () => clearTimeout(timer);
  }, [form.credentials?.botToken, modalProvider?.key, fetchSlackChannels]);

  function openProviderModal(provider) {
    const defaults = defaultFormByProvider[provider.key] || {
      name: provider.name,
      config: provider.defaultConfig || {},
      credentials: {},
    };
    const existing = integrations.find((i) => i.providerKey === provider.key);
    const initialForm = existing
      ? {
          ...defaults,
          name: existing.name || defaults.name,
          config: { ...defaults.config, ...(existing.config || {}) },
          credentials: existing.credentials || defaults.credentials,
        }
      : defaults;
    const existingAgentLink = agentLinks.find((l) => l.providerKey === provider.key);
    const savedListId = existingAgentLink?.config?.list_id || '';
    const savedChannelId = existingAgentLink?.config?.default_channel || '';

    setModalProvider(provider);
    setForm(initialForm);
    setFormError('');
    setClickupLists([]);
    setClickupListsError('');
    setClickupListId(savedListId);
    setSlackChannels([]);
    setSlackChannelsError('');
    setSlackChannelId(savedChannelId);
    setSmtpVerifyOk(false);
    setSmtpVerifyError('');
    setShowModal(true);
    if (provider.key === 'clickup' && connectedProviderKeys.has('clickup')) {
      fetchClickupLists();
    }
    if (provider.key === 'slack' && connectedProviderKeys.has('slack')) {
      fetchSlackChannels();
    }
  }

  function closeModal() {
    setShowModal(false);
    setFormError('');
  }

  const updateForm = (section, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value },
    }));
    setFormError('');
  };

  const verifySmtp = async () => {
    setSmtpVerifying(true);
    setSmtpVerifyOk(false);
    setSmtpVerifyError('');
    try {
      await apiRequest('/integrations/email/verify', {
        method: 'POST',
        body: {
          host: form.credentials?.host || '',
          port: form.credentials?.port || '587',
          secure: form.credentials?.secure || 'false',
          user: form.credentials?.user || '',
          pass: form.credentials?.pass || '',
        },
      });
      setSmtpVerifyOk(true);
    } catch (err) {
      setSmtpVerifyError(err?.message || 'Falha ao verificar conexão SMTP.');
    } finally {
      setSmtpVerifying(false);
    }
  };

  const connectWithOAuth = async (providerKey) => {
    try {
      setSaving(true);
      setFormError('');
      const agentParam = selectedAgentId ? `?agentId=${selectedAgentId}` : '';
      const endpoint = isSlack(providerKey)
        ? `/integrations/slack/auth${agentParam}`
        : `/integrations/google/auth${agentParam}`;
      const data = await apiRequest(endpoint);
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      setFormError(err?.message || 'Erro ao iniciar autenticação.');
      setSaving(false);
    }
  };

  const connectProvider = async (event) => {
    event.preventDefault();
    if (!modalProvider) return;
    try {
      setSaving(true);
      setFormError('');

      const cleanCredentials = Object.fromEntries(
        Object.entries(form.credentials || {}).filter(
          ([, v]) => v && !/^\*+$/.test(String(v)),
        ),
      );
      const integration = await apiRequest('/integrations', {
        method: 'POST',
        body: {
          providerKey: modalProvider.key,
          name: form.name || modalProvider.name,
          config: form.config,
          credentials: cleanCredentials,
          scopes: modalProvider.requiredScopes || [],
        },
      });

      if (autoLink && selectedAgentId && integration?.id) {
        const agentConfig =
          modalProvider.key === 'clickup' && clickupListId
            ? { list_id: clickupListId }
            : modalProvider.key === 'slack' && slackChannelId
            ? { default_channel: slackChannelId }
            : {};
        await apiRequest(`/agents/${selectedAgentId}/integrations`, {
          method: 'POST',
          body: {
            integrationId: integration.id,
            permissions: modalProvider.requiredScopes || [],
            config: agentConfig,
          },
        });
        await loadAgentLinks();
      }

      const integrationsRes = await apiRequest('/integrations');
      setIntegrations(integrationsRes?.integrations || []);
      closeModal();
    } catch (err) {
      setFormError(err?.message || 'Erro ao conectar integração.');
    } finally {
      setSaving(false);
    }
  };

  const linkIntegration = async (integration) => {
    if (!selectedAgentId) return;
    try {
      setLinkingId(integration.id);
      await apiRequest(`/agents/${selectedAgentId}/integrations`, {
        method: 'POST',
        body: { integrationId: integration.id, permissions: integration.scopes || [] },
      });
      await loadAgentLinks();
    } catch (err) {
      setLoadError(err?.message || 'Erro ao vincular conector ao funcionário.');
    } finally {
      setLinkingId('');
    }
  };

  const unlinkIntegration = async (integration) => {
    if (!selectedAgentId) return;
    try {
      setLinkingId(integration.id);
      await apiRequest(`/agents/${selectedAgentId}/integrations/${integration.id}`, {
        method: 'DELETE',
      });
      await loadAgentLinks();
    } catch (err) {
      setLoadError(err?.message || 'Erro ao remover conector do funcionário.');
    } finally {
      setLinkingId('');
    }
  };

  if (loading) {
    return (
      <div className="hk-pg-body py-0">
        
      <div className={classNames('fmapp-wrap')}>
          <AgentsSidebar />
          <div className="fmapp-content">
            <div className="fmapp-detail-wrap">
              <div className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 mb-0">Carregando conectores...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const modalMeta = modalProvider ? (providerMeta[modalProvider.key] || defaultMeta) : defaultMeta;
  const ModalIsConnected = modalProvider ? connectedProviderKeys.has(modalProvider.key) : false;
  const modalIsConnected = ModalIsConnected;

  return (
    <div className="hk-pg-body py-0">
      
      <div
        className={classNames('fmapp-wrap', {
          'fmapp-sidebar-toggle': !showSidebar,
        })}
      >
        <AgentsSidebar />
        <div className="fmapp-content">
          <div className="fmapp-detail-wrap">
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem' }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
          <div className="d-flex align-items-center">
            <Button
              as={Link}
              href="/apps/agents"
              variant="flush-dark"
              className="btn-icon btn-rounded"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="ms-3">
              <h4 className="mb-1">Integrações</h4>
              <p className="text-muted mb-0">
                Conecte plataformas e ferramentas aos seus funcionários IA.
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Form.Select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              style={{ maxWidth: 240 }}
              size="sm"
            >
              <option value="">Escolha um funcionário</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </Form.Select>
            <Button variant="light" size="sm" onClick={load}>
              <RefreshCw size={14} className="me-1" />
              Atualizar
            </Button>
          </div>
        </div>

        {loadError && (
          <Alert variant="danger" dismissible onClose={() => setLoadError('')}>
            {loadError}
          </Alert>
        )}

        {/* Catalog */}
        <Card className="card-border mb-4">
          <Card.Header>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <span className="text-muted" style={{ fontSize: 13 }}>
                Clique em um conector para configurar e ativar.
              </span>
              <InputGroup size="sm" style={{ maxWidth: 220 }}>
                <InputGroup.Text className="bg-transparent border-end-0">
                  <Search size={13} />
                </InputGroup.Text>
                <Form.Control
                  className="border-start-0 ps-0"
                  placeholder="Buscar conector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </div>
            <Nav variant="pills" className="gap-1 flex-nowrap overflow-auto pb-1">
              {availableCategories.map((cat) => {
                const count =
                  cat === 'all'
                    ? providers.length
                    : cat === 'google'
                    ? providers.filter((p) => isGoogle(p.key)).length
                    : providers.filter((p) => p.category === cat && !isGoogle(p.key)).length;
                return (
                  <Nav.Item key={cat} className="flex-shrink-0">
                    <Nav.Link
                      active={activeCategory === cat}
                      onClick={() => setActiveCategory(cat)}
                      className="d-flex align-items-center gap-2 px-3 py-1"
                      style={{ fontSize: 13, cursor: 'pointer' }}
                    >
                      {cat === 'all' ? 'Todos' : (categoryLabels[cat] || cat)}
                      <Badge bg="light" text="dark" style={{ fontSize: 10 }}>
                        {count}
                      </Badge>
                    </Nav.Link>
                  </Nav.Item>
                );
              })}
            </Nav>
          </Card.Header>
          <Card.Body>
            {filteredProviders.length === 0 ? (
              <p className="text-muted mb-0 text-center py-3">Nenhum conector encontrado.</p>
            ) : (
              <Row className="g-3">
                {filteredProviders.map((provider) => {
                  const meta = providerMeta[provider.key] || defaultMeta;
                  const connected = connectedProviderKeys.has(provider.key);
                  const linked = linkedProviderKeys.has(provider.key);
                  const isComingSoon = provider.status === 'coming_soon';
                  return (
                    <Col md={6} lg={4} key={provider.key}>
                      <div
                        role={isComingSoon ? undefined : 'button'}
                        tabIndex={isComingSoon ? undefined : 0}
                        onClick={() => !isComingSoon && openProviderModal(provider)}
                        onKeyDown={(e) => !isComingSoon && e.key === 'Enter' && openProviderModal(provider)}
                        className="rounded-3 border p-3 h-100 d-flex flex-column gap-2"
                        style={{
                          cursor: isComingSoon ? 'default' : 'pointer',
                          borderColor: 'var(--bs-border-color)',
                          background: isComingSoon ? 'var(--bs-tertiary-bg)' : 'var(--bs-card-bg)',
                          opacity: isComingSoon ? 0.7 : 1,
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                          outline: 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (isComingSoon) return;
                          e.currentTarget.style.borderColor = '#0d6efd';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,110,253,0.12)';
                        }}
                        onMouseLeave={(e) => {
                          if (isComingSoon) return;
                          e.currentTarget.style.borderColor = 'var(--bs-border-color)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 42, height: 42, background: `${meta.color}1a`, border: `1px solid ${meta.color}33` }}
                          >
                            <ProviderIconRenderer meta={meta} size={22} />
                          </div>
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <span
                              className="fw-semibold d-block text-truncate"
                              style={{ fontSize: 14 }}
                            >
                              {provider.name}
                            </span>
                            <div className="d-flex align-items-center gap-1 flex-wrap">
                              <Badge
                                style={{
                                  fontSize: 10,
                                  background: 'var(--bs-secondary-bg)',
                                  color: 'var(--bs-secondary-color)',
                                }}
                              >
                                {categoryLabels[provider.category] || provider.category}
                              </Badge>
                              {isComingSoon && (
                                <Badge
                                  style={{
                                    fontSize: 10,
                                    background: 'rgba(234,179,8,0.15)',
                                    color: '#a16207',
                                    border: '1px solid rgba(234,179,8,0.3)',
                                  }}
                                >
                                  Em breve
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!isComingSoon && PROVIDER_HELP_GUIDE[provider.key] && (
                            <button
                              type="button"
                              title="Como conectar"
                              onClick={(e) => { e.stopPropagation(); setHelpProvider(provider); }}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 4,
                                cursor: 'pointer',
                                color: 'var(--bs-secondary-color)',
                                borderRadius: 6,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#0d6efd'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--bs-secondary-color)'; }}
                            >
                              <HelpCircle size={16} />
                            </button>
                          )}
                        </div>
                        <p className="text-muted mb-0 flex-grow-1" style={{ fontSize: 12, lineHeight: 1.5 }}>
                          {(provider.description || '').length > 80
                            ? provider.description.slice(0, 80) + '…'
                            : provider.description}
                        </p>
                        <div
                          className="pt-2 d-flex align-items-center gap-1"
                          style={{ borderTop: '1px solid var(--bs-border-color-translucent)' }}
                        >
                          {isComingSoon ? (
                            <small className="text-muted" style={{ fontSize: 11 }}>
                              Disponível em breve
                            </small>
                          ) : connected && linked && selectedAgentId ? (
                            <>
                              <CheckCircle size={12} color="#198754" />
                              <small className="text-success" style={{ fontSize: 11 }}>
                                Ativo neste agente
                              </small>
                            </>
                          ) : connected ? (
                            <>
                              <CheckCircle size={12} color="#198754" />
                              <small className="text-muted" style={{ fontSize: 11 }}>
                                Credencial disponível — clique para ativar neste agente
                              </small>
                            </>
                          ) : (
                            <small className="text-muted" style={{ fontSize: 11 }}>
                              Não configurado — clique para conectar
                            </small>
                          )}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* Linked integrations summary */}
        {agentLinks.length > 0 && selectedAgentId && (
          <Card className="card-border">
            <Card.Header>
              <div className="d-flex align-items-center gap-2">
                <LinkIcon size={16} />
                <h5 className="mb-0">
                  Integrações ativas
                  {selectedAgent && (
                    <span className="text-muted fw-normal ms-2" style={{ fontSize: 13 }}>
                      — {selectedAgent.name}
                    </span>
                  )}
                </h5>
              </div>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {integrations.map((integration) => {
                  const linked = linkedIntegrationIds.has(integration.id);
                  const meta = providerMeta[integration.providerKey] || defaultMeta;
                  return (
                    <Col md={6} lg={4} key={integration.id}>
                      <div
                        className="rounded-3 border p-3 h-100 d-flex flex-column gap-2"
                        style={{
                          borderColor: linked ? 'rgba(25,135,84,0.5)' : 'var(--bs-border-color)',
                          background: linked ? 'rgba(25,135,84,0.08)' : 'var(--bs-card-bg)',
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 38, height: 38, background: `${meta.color}1a`, border: `1px solid ${meta.color}33` }}
                          >
                            <ProviderIconRenderer meta={meta} size={18} />
                          </div>
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="d-flex align-items-center justify-content-between gap-2">
                              <span
                                className="fw-semibold text-truncate d-block"
                                style={{ fontSize: 13 }}
                              >
                                {integration.name}
                              </span>
                              <Badge
                                bg={integration.status === 'connected' ? 'success' : 'secondary'}
                                style={{ fontSize: 10 }}
                              >
                                {statusLabels[integration.status] || integration.status}
                              </Badge>
                            </div>
                            <span className="text-muted" style={{ fontSize: 11 }}>
                              {integration.providerKey}
                            </span>
                          </div>
                        </div>
                        {linked ? (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="mt-auto"
                            disabled={linkingId === integration.id}
                            onClick={() => unlinkIntegration(integration)}
                          >
                            {linkingId === integration.id && (
                              <Spinner animation="border" size="sm" className="me-1" />
                            )}
                            Remover do funcionário
                          </Button>
                        ) : (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="mt-auto"
                            disabled={linkingId === integration.id || !selectedAgentId}
                            onClick={() => linkIntegration(integration)}
                          >
                            {linkingId === integration.id && (
                              <Spinner animation="border" size="sm" className="me-1" />
                            )}
                            Vincular ao funcionário
                          </Button>
                        )}
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Config Modal */}
        <Modal show={showModal} onHide={closeModal} centered size="md">
          {modalProvider && (
            <>
              <Modal.Header closeButton className="border-bottom-0 pb-0">
                <Modal.Title className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 40, height: 40, background: `${modalMeta.color}1a`, border: `1px solid ${modalMeta.color}33` }}
                  >
                    <ProviderIconRenderer meta={modalMeta} size={22} />
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: 16 }}>{modalProvider.name}</span>
                      {modalIsConnected && (
                        <Badge bg="success" style={{ fontSize: 10 }}>
                          Conectado
                        </Badge>
                      )}
                    </div>
                    <Badge
                      style={{
                        fontSize: 10,
                        fontWeight: 400,
                        background: 'var(--bs-secondary-bg)',
                        color: 'var(--bs-secondary-color)',
                      }}
                    >
                      {categoryLabels[modalProvider.category] || modalProvider.category}
                    </Badge>
                  </div>
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p className="text-muted mb-4" style={{ fontSize: 13 }}>
                  {modalProvider.description}
                </p>

                {formError && (
                  <Alert variant="danger" className="mb-3" onClose={() => setFormError('')} dismissible>
                    {formError}
                  </Alert>
                )}

                {isOAuth(modalProvider.key) ? (
                  <div className="text-center py-3">
                    <div
                      className="rounded-3 p-4 mb-4"
                      style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}
                    >
                      {isSlack(modalProvider.key) ? (
                        <>
                          <p className="mb-1" style={{ fontSize: 13 }}>
                            Ao conectar, você autoriza o acesso ao workspace do Slack.
                          </p>
                          <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                            O agente poderá enviar mensagens e DMs. O acesso pode ser revogado a qualquer momento.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="mb-1" style={{ fontSize: 13 }}>
                            Ao conectar, você autoriza o acesso ao Google Calendar e Gmail do seu tenant.
                          </p>
                          <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                            O acesso pode ser revogado a qualquer momento na sua conta Google.
                          </p>
                        </>
                      )}
                    </div>
                    {isSlack(modalProvider.key) ? (
                      <Button
                        variant="light"
                        size="lg"
                        className="d-flex align-items-center gap-2 mx-auto border"
                        onClick={() => connectWithOAuth('slack')}
                        disabled={saving}
                        style={{ fontWeight: 500 }}
                      >
                        {saving ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <Icons.slack size={18} />
                        )}
                        {modalIsConnected ? 'Reconectar com Slack' : 'Conectar com Slack'}
                      </Button>
                    ) : (
                      <Button
                        variant="light"
                        size="lg"
                        className="d-flex align-items-center gap-2 mx-auto border"
                        onClick={() => connectWithOAuth('google')}
                        disabled={saving}
                        style={{ fontWeight: 500 }}
                      >
                        {saving ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.14z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z"/>
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.55 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                          </svg>
                        )}
                        {modalIsConnected ? 'Reconectar com Google' : 'Entrar com Google'}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Form id="connect-form" onSubmit={connectProvider}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nome da conexão</Form.Label>
                      <Form.Control
                        value={form.name || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder={modalProvider.name}
                      />
                    </Form.Group>

                    <ProviderFields
                      providerKey={modalProvider.key}
                      form={form}
                      updateForm={updateForm}
                    />

                    {modalProvider.key === 'email' && (
                      <div className="mb-3">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          type="button"
                          onClick={verifySmtp}
                          disabled={smtpVerifying || !form.credentials?.host || !form.credentials?.user || !form.credentials?.pass}
                        >
                          {smtpVerifying ? (
                            <><Spinner animation="border" size="sm" className="me-1" />Testando...</>
                          ) : (
                            'Testar conexão SMTP'
                          )}
                        </Button>
                        {smtpVerifyOk && (
                          <div className="text-success mt-1" style={{ fontSize: 12 }}>
                            ✓ Conexão SMTP verificada com sucesso
                          </div>
                        )}
                        {smtpVerifyError && (
                          <div className="text-danger mt-1" style={{ fontSize: 12 }}>
                            {smtpVerifyError}
                          </div>
                        )}
                      </div>
                    )}

                    {modalProvider.key === 'clickup' && (
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center justify-content-between w-100">
                          <span>Lista de destino dos leads</span>
                          {modalIsConnected && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-decoration-none"
                              style={{ fontSize: 12 }}
                              onClick={fetchClickupLists}
                              disabled={clickupListsLoading}
                            >
                              {clickupListsLoading ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                '↻ Atualizar listas'
                              )}
                            </Button>
                          )}
                        </Form.Label>
                        {!modalIsConnected ? (
                          <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                            Cole a API Key acima para ver as listas disponíveis.
                          </p>
                        ) : clickupListsLoading ? (
                          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: 13 }}>
                            <Spinner animation="border" size="sm" />
                            <span>Buscando listas do ClickUp...</span>
                          </div>
                        ) : clickupLists.length > 0 ? (
                          <>
                            <Form.Select
                              value={clickupListId}
                              onChange={(e) => setClickupListId(e.target.value)}
                            >
                              <option value="">Selecione a lista que receberá os leads...</option>
                              {clickupLists.map((l) => (
                                <option key={l.id} value={l.id}>{l.label}</option>
                              ))}
                            </Form.Select>
                            {clickupListId && (
                              <Form.Text className="text-success d-block mt-1">
                                ✓ Leads capturados por este agente serão salvos nessa lista
                              </Form.Text>
                            )}
                          </>
                        ) : clickupListsError ? (
                          <p className="text-danger mb-0" style={{ fontSize: 12 }}>
                            {clickupListsError}{' '}
                            <Button variant="link" size="sm" className="p-0 text-danger" style={{ fontSize: 12 }} onClick={() => fetchClickupLists()}>
                              Tentar novamente
                            </Button>
                          </p>
                        ) : (
                          <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                            Nenhuma lista encontrada.{' '}
                            <Button variant="link" size="sm" className="p-0" style={{ fontSize: 12 }} onClick={() => fetchClickupLists()}>
                              Tentar novamente
                            </Button>
                            {' '}— Crie uma lista no ClickUp e clique em atualizar.
                          </p>
                        )}
                      </Form.Group>
                    )}

                    {modalProvider.key === 'slack' && (
                      <Form.Group className="mb-3">
                        <Form.Label className="d-flex align-items-center justify-content-between w-100">
                          <span>Canal padrão de notificações</span>
                          {modalIsConnected && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-decoration-none"
                              style={{ fontSize: 12 }}
                              onClick={fetchSlackChannels}
                              disabled={slackChannelsLoading}
                            >
                              {slackChannelsLoading ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                '↻ Atualizar canais'
                              )}
                            </Button>
                          )}
                        </Form.Label>
                        {slackChannelsLoading ? (
                          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: 13 }}>
                            <Spinner animation="border" size="sm" />
                            <span>Buscando canais do Slack...</span>
                          </div>
                        ) : slackChannels.length > 0 ? (
                          <>
                            <Form.Select
                              value={slackChannelId}
                              onChange={(e) => setSlackChannelId(e.target.value)}
                            >
                              <option value="">Selecione o canal padrão (opcional)...</option>
                              {slackChannels.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.is_private ? '🔒 ' : '#'}{c.name}
                                  {c.member_count > 0 ? ` (${c.member_count} membros)` : ''}
                                </option>
                              ))}
                            </Form.Select>
                            {slackChannelId && (
                              <Form.Text className="text-success d-block mt-1">
                                ✓ O agente usará esse canal como destino padrão para mensagens
                              </Form.Text>
                            )}
                          </>
                        ) : slackChannelsError ? (
                          <p className="text-danger mb-0" style={{ fontSize: 12 }}>
                            {slackChannelsError}{' '}
                            <Button variant="link" size="sm" className="p-0 text-danger" style={{ fontSize: 12 }} onClick={() => fetchSlackChannels()}>
                              Tentar novamente
                            </Button>
                          </p>
                        ) : (
                          <div
                            className="rounded-3 p-3"
                            style={{ background: 'var(--bs-warning-bg-subtle)', border: '1px solid var(--bs-warning-border-subtle)', fontSize: 12 }}
                          >
                            <strong>Nenhum canal encontrado.</strong>
                            {' '}Cole o Bot Token acima para carregar os canais automaticamente, ou{' '}
                            <span>crie um canal no Slack e convide o bot com{' '}</span>
                            <code style={{ fontSize: 11 }}>/invite @nome-do-bot</code>.
                          </div>
                        )}
                      </Form.Group>
                    )}

                    {selectedAgentId && (
                      <div
                        className="rounded-3 p-3 mt-2"
                        style={{ background: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}
                      >
                        <Form.Check
                          type="checkbox"
                          id="auto-link-check"
                          checked={autoLink}
                          onChange={(e) => setAutoLink(e.target.checked)}
                          label={
                            <span style={{ fontSize: 13 }}>
                              Vincular automaticamente ao funcionário{' '}
                              <strong>{selectedAgent?.name || selectedAgentId}</strong>
                            </span>
                          }
                        />
                      </div>
                    )}
                  </Form>
                )}
              </Modal.Body>
              <Modal.Footer className="border-top-0">
                <Button variant="light" onClick={closeModal} disabled={saving}>
                  Cancelar
                </Button>
                {isOAuth(modalProvider?.key) && modalIsConnected && selectedAgentId && !linkedProviderKeys.has(modalProvider.key) && (
                  <Button
                    variant="success"
                    disabled={saving}
                    onClick={async () => {
                      const googleIntegrations = integrations.filter(
                        (i) => i.providerKey === modalProvider.key,
                      );
                      for (const integration of googleIntegrations) {
                        await linkIntegration(integration);
                      }
                      closeModal();
                    }}
                  >
                    <CheckCircle size={14} className="me-1" />
                    Vincular ao funcionário
                  </Button>
                )}
                {!isOAuth(modalProvider?.key) && (
                  <Button
                    type="submit"
                    form="connect-form"
                    variant="primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <Spinner animation="border" size="sm" className="me-2" />
                    ) : (
                      <Zap size={14} className="me-1" />
                    )}
                    {modalIsConnected ? 'Atualizar conexão' : 'Conectar'}
                  </Button>
                )}
              </Modal.Footer>
            </>
          )}
        </Modal>

        {helpProvider && (
          <HelpModal
            provider={helpProvider}
            meta={providerMeta[helpProvider.key] || defaultMeta}
            onHide={() => setHelpProvider(null)}
          />
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentConnectorsPage;
