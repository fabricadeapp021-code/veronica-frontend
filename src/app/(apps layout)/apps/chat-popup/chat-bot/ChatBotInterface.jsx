import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import SimpleBar from 'simplebar-react';
import { Button, Card, Dropdown, Form, InputGroup, Alert } from 'react-bootstrap';
import * as Icons from 'react-feather';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import { sendChatMessage, getChatHistory } from '@/lib/api/services/chat';
import { useColorMode } from '@/hooks/useColorMode';

//Image
import logo from '@/assets/img/logo-governai.png';

// Chave para localStorage
const CONVERSATION_ID_KEY = 'voxx.chat.conversationId';

const ChatBotInterface = ({ show = true }) => {
    const { states, dispatch } = useGlobalStateContext();
    const { isDark } = useColorMode();
    const [showChatbot, setShowChatbot] = useState(false); // Inicia fechado, abre ao clicar no botão
    const [showPopup, setshowPopup] = useState(true);
    const [startConversation, setStartConversation] = useState(false);
    const [typing, setTyping] = useState(false);
    const [messages, setMessages] = useState('');
    const [conversationId, setConversationId] = useState(() => {
        // Restaurar conversationId do localStorage ao inicializar
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(CONVERSATION_ID_KEY);
            return saved || null;
        }
        return null;
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false); // Flag para controlar se já carregou histórico

    // Carregar histórico quando abrir o chat e tiver conversationId
    useEffect(() => {
        if (showChatbot && startConversation && conversationId && !loadingHistory && !historyLoaded) {
            console.log('🔄 Carregando histórico da conversa:', conversationId);
            loadConversationHistory();
        }
    }, [showChatbot, startConversation, conversationId]);

    // Função para carregar histórico da conversa
    const loadConversationHistory = async () => {
        if (!conversationId) return;

        setLoadingHistory(true);
        try {
            const response = await getChatHistory(conversationId, 50);
            
            if (response.success && response.data && Array.isArray(response.data)) {
                console.log(`📚 Carregando ${response.data.length} mensagens do histórico`);
                
                // Limpar mensagens atuais antes de carregar histórico
                // (opcional: você pode querer manter as mensagens atuais e adicionar o histórico)
                
                // Adicionar mensagens do histórico ao estado
                response.data.forEach((msg) => {
                    dispatch({
                        type: "send_popup_msg",
                        popupMsgs: {
                            text: msg.content,
                            types: msg.role === 'user' ? 'sent' : 'received',
                        },
                    });
                });
                
                // Marcar que o histórico foi carregado
                setHistoryLoaded(true);
                console.log('✅ Histórico carregado com sucesso');
            }
        } catch (err) {
            console.error('❌ Erro ao carregar histórico:', err);
            // Não mostrar erro ao usuário, apenas logar
        } finally {
            setLoadingHistory(false);
        }
    };

    // Persistir conversationId no localStorage quando mudar
    useEffect(() => {
        if (conversationId && typeof window !== 'undefined') {
            localStorage.setItem(CONVERSATION_ID_KEY, conversationId);
        }
    }, [conversationId]);

    //Sent New Messages
    const sendMessage = async () => {
        const messageText = messages.trim();
        
        if (!messageText) {
            alert("Por favor, digite algo!");
            return;
        }

        // Limpar erro anterior
        setError(null);
        
        // Enviar mensagem do usuário
        dispatch({ type: "send_popup_msg", popupMsgs: { text: messageText, types: "sent" } });
        setMessages(""); // Limpar input
        setTyping(true); // Mostrar "digitando..."
        setLoading(true);

        try {
            // Chamar backend que roteia para n8n
            const response = await sendChatMessage(messageText, conversationId);
            
            // Log para debug
            console.log('Resposta do backend:', response);
            
            if (response.success && response.data) {
                // Atualizar conversationId se retornado (sempre deve retornar)
                if (response.data.conversationId) {
                    const isNewConversation = !conversationId; // Detectar se é primeira mensagem
                    
                    if (isNewConversation) {
                        console.log('✨ Nova conversa iniciada:', response.data.conversationId);
                    }
                    
                    setConversationId(response.data.conversationId);
                    
                    // Se for nova conversa, marcar histórico como "carregado" para evitar duplicação
                    if (isNewConversation) {
                        setHistoryLoaded(true);
                    }
                    
                    // Salvar no localStorage (já é feito no useEffect, mas garantimos aqui também)
                    if (typeof window !== 'undefined') {
                        localStorage.setItem(CONVERSATION_ID_KEY, response.data.conversationId);
                    }
                }
                
                // Exibir resposta do agente
                // Tentar diferentes formatos possíveis
                // IMPORTANTE: n8n geralmente retorna em 'output'
                const agentMessage = 
                    response.data.output ||  // n8n geralmente retorna aqui
                    response.data.message || 
                    response.data.response || 
                    response.data.text ||
                    response.data.content ||
                    'Desculpe, não consegui processar sua mensagem.';
                
                console.log('Mensagem do agente extraída:', agentMessage);
                
                dispatch({ 
                    type: "send_popup_msg", 
                    popupMsgs: { 
                        text: agentMessage, 
                        types: "received" 
                    } 
                });
            } else {
                console.error('Resposta inválida:', response);
                throw new Error('Resposta inválida do servidor');
            }
        } catch (err) {
            console.error('Erro ao enviar mensagem:', err);
            const errorMessage = err?.body?.message || err?.message || 'Desculpe, ocorreu um erro. Tente novamente.';
            setError(errorMessage);
            
            // Exibir mensagem de erro no chat
            dispatch({ 
                type: "send_popup_msg", 
                popupMsgs: { 
                    text: `❌ Erro: ${errorMessage}`, 
                    types: "received" 
                } 
            });
        } finally {
            setTyping(false); // Parar "digitando..."
            setLoading(false);
        }
    }
    
    const onKeyDown = (e) => {
        if (e.keyCode === 13 && !loading) {
            sendMessage();
        }
    }

    // 👇️ scroll to bottom every time messages change
    const bottomRef = useRef(null);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [states.chatPopupState, startConversation]);

    return (
        <>
            {isDark && (
                <style>{`
                    .hk-chatbot-popup {
                        background: #1e2130 !important;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
                    }
                    .hk-chatbot-popup .chatbot-popup-body {
                        background: #1e2130 !important;
                    }
                    .hk-chatbot-popup .chatbot-popup-body .init-content-wrap {
                        background: #1e2130 !important;
                    }
                    .hk-chatbot-popup .chatbot-popup-body .media.received .media-body .msg-box > div {
                        background: #2a2f3d !important;
                    }
                    .hk-chatbot-popup .chatbot-popup-body .media.received .media-body .msg-box > div p {
                        color: #c9d1e0 !important;
                    }
                    .hk-chatbot-popup .chatbot-popup-body .media.sent .media-body .msg-box > div p {
                        color: #fff !important;
                    }
                    .hk-chatbot-popup .chatbot-popup-body .media .media-body .msg-box > div p:first-child {
                        color: #c9d1e0 !important;
                    }
                    .hk-chatbot-popup footer {
                        background: #1e2130 !important;
                        border-top: 1px solid #2a2f3d !important;
                    }
                    .hk-chatbot-popup footer .input-group {
                        background: #13151a !important;
                        border: 1px solid #2a2f3d !important;
                        border-radius: 0.5rem !important;
                    }
                    .hk-chatbot-popup footer .form-control,
                    .hk-chatbot-popup footer .input-group-text {
                        background: #13151a !important;
                        color: #c9d1e0 !important;
                        border-color: transparent !important;
                    }
                    .hk-chatbot-popup footer .form-control::placeholder {
                        color: #5a6480 !important;
                    }
                    .hk-chatbot-popup .chatbot-intro-text p,
                    .hk-chatbot-popup .chatbot-intro-text a {
                        color: #8d97b0 !important;
                    }
                    .hk-chatbot-popup .separator-full {
                        border-color: #2a2f3d !important;
                    }
                    .chat-popover {
                        background: #1e2130 !important;
                        color: #c9d1e0 !important;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
                    }
                    .chat-popover p { color: #c9d1e0 !important; }
                `}</style>
            )}
            <div className={classNames("hk-chatbot-popup", { "d-md-block d-flex": showChatbot })}>
                <header className={classNames({ "pb-2": startConversation })} >
                    <div className="chatbot-head-top">
                        <Dropdown>
                            <Dropdown.Toggle variant="dark" size="sm" className="btn-icon btn-rounded no-caret">
                                <span className="icon">
                                    <span className="feather-icon">
                                        <Icons.MoreHorizontal />
                                    </span>
                                </span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item>
                                    <i className="dropdown-icon zmdi zmdi-notifications-active" />
                                    <span>Enviar notificações push</span>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <i className="dropdown-icon zmdi zmdi-volume-off" />
                                    <span>Silenciar Chat</span>
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <span className="text-white">Conversar Conosco</span>
                        <Button variant="dark" size="sm" className="btn-icon btn-rounded" onClick={() => setShowChatbot(!showChatbot)} >
                            <span className="icon">
                                <span className="feather-icon">
                                    <Icons.Minus />
                                </span>
                            </span>
                        </Button>
                    </div>
                    <div className="separator-full separator-light mt-0 opacity-10" />
                    <div className="media-wrap">
                        <div className="media">
                            <div className="media-head">
                                <div className="avatar avatar-sm avatar-soft-primary avatar-icon avatar-rounded position-relative">
                                    <span className="initial-wrap">
                                        <i className="ri-customer-service-2-line" />
                                    </span>
                                    <span className="badge badge-success badge-indicator badge-indicator-lg badge-indicator-nobdr position-bottom-end-overflow-1" />
                                </div>
                            </div>
                            <div className="media-body">
                                <div className="user-name">Assistente Virtual</div>
                                <div className="user-status">Online</div>
                            </div>
                        </div>
                    </div>
                </header>
                <div className={classNames("chatbot-popup-body")}>
                    <SimpleBar className={classNames("nicescroll-bar", { "mt-0": startConversation })}>
                        <div>
                            <div className={classNames("init-content-wrap", { "d-none": startConversation })}>
                                <Card className="card-shadow">
                                    <Card.Body>
                                        <Card.Text>Olá! Eu sou o assistente virtual do TMS-Fácil 🚛<br />Posso ajudar com sua frota e telemetria?<br /><br />Selecione um tópico ou comece a conversar.</Card.Text>
                                        <Button variant="primary" className="btn-block text-nonecase start-conversation" onClick={() => setStartConversation(!startConversation)} >Iniciar conversa</Button>
                                    </Card.Body>
                                </Card>
                                <div className="btn-wrap">
                                    <Button variant="soft-primary" className="text-nonecase btn-rounded start-conversation" onClick={() => setStartConversation(!startConversation)}>
                                        <span>
                                            <span className="icon">
                                                <span className="feather-icon">
                                                    <Icons.Eye />
                                                </span>
                                            </span>
                                            <span className="btn-text">Apenas explorando a plataforma</span>
                                        </span>
                                    </Button>
                                    <Button variant="soft-danger" className="text-nonecase btn-rounded start-conversation" onClick={() => setStartConversation(!startConversation)}>
                                        <span>
                                            <span className="icon">
                                                <span className="feather-icon">
                                                    <Icons.CreditCard />
                                                </span>
                                            </span>
                                            <span className="btn-text">Dúvida sobre planos e valores</span>
                                        </span>
                                    </Button>
                                    <Button variant="soft-warning" className="text-nonecase btn-rounded start-conversation" onClick={() => setStartConversation(!startConversation)}>
                                        <span>
                                            <span className="icon">
                                                <span className="feather-icon">
                                                    <Icons.Cpu />
                                                </span>
                                            </span>
                                            <span className="btn-text">Suporte técnico da plataforma</span>
                                        </span>
                                    </Button>
                                    <Button variant="soft-success" className="text-nonecase btn-rounded start-conversation" onClick={() => setStartConversation(!startConversation)}>
                                        <span>
                                            <span className="icon">
                                                <span className="feather-icon">
                                                    <Icons.Zap />
                                                </span>
                                            </span>
                                            <span className="btn-text">Dúvida antes de contratar</span>
                                        </span>
                                    </Button>
                                </div>
                            </div>
                            <ul className={classNames("list-unstyled", { "d-none": !startConversation })}>
                                {
                                    states.chatPopupState.popupMsgs.map((elem, index) => (
                                        <li className={classNames("media", (elem.types))} key={index}>
                                            {elem.types === "received" && <div className="avatar avatar-xs avatar-soft-primary avatar-icon avatar-rounded">
                                                <span className="initial-wrap">
                                                    <i className="ri-customer-service-2-line" />
                                                </span>
                                            </div>}
                                            <div className="media-body">
                                                <div className="msg-box">
                                                    <div>
                                                        <p>{elem.text}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))
                                }
                                {typing && <li className="media received">
                                    <div className="avatar avatar-xs avatar-soft-primary avatar-icon avatar-rounded">
                                        <span className="initial-wrap">
                                            <i className="ri-customer-service-2-line" />
                                        </span>
                                    </div>
                                    <div className="media-body">
                                        <div className="msg-box typing-wrap">
                                            <div>
                                                <div className="typing">
                                                    <div className="dot" />
                                                    <div className="dot" />
                                                    <div className="dot" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>}
                                {error && !typing && (
                                    <li className="media received">
                                        <div className="media-body">
                                            <Alert variant="danger" className="py-2 mb-0">
                                                {error}
                                            </Alert>
                                        </div>
                                    </li>
                                )}
                            </ul>
                            <div ref={bottomRef} />
                        </div>
                    </SimpleBar>
                </div>
                <footer>
                    <div className={classNames("chatbot-intro-text fs-7", { "d-none": startConversation })}>
                        <div className="separator-full separator-light" />
                        <p className="mb-2">Esta é a versão beta do TMS-Fácil. Cadastre-se agora para ter acesso antecipado à versão completa da plataforma de gestão de frota</p>
                        <a className="d-block mb-2" href="#some"><u>Enviar Feedback</u></a>
                    </div>
                    <InputGroup className={classNames({ "d-none": !startConversation })}>
                        <div className="input-group-text overflow-show border-0">
                            <Dropdown>
                                <Dropdown.Toggle variant="flush-dark" className="btn-icon flush-soft-hover btn-rounded no-caret" >
                                    <span className="icon">
                                        <span className="feather-icon">
                                            <Icons.Share />
                                        </span>
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar avatar-icon avatar-xs avatar-soft-primary avatar-rounded me-3">
                                                <span className="initial-wrap">
                                                    <i className="ri-image-line" />
                                                </span>
                                            </div>
                                            <div>
                                                <span className="h6 mb-0">Biblioteca de Fotos ou Vídeos</span>
                                            </div>
                                        </div>
                                    </Dropdown.Item>
                                    <Dropdown.Item>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar avatar-icon avatar-xs avatar-soft-info avatar-rounded me-3">
                                                <span className="initial-wrap">
                                                    <i className="ri-file-4-line" />
                                                </span>
                                            </div>
                                            <div>
                                                <span className="h6 mb-0">Documentos</span>
                                            </div>
                                        </div>
                                    </Dropdown.Item>
                                    <Dropdown.Item>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar avatar-icon avatar-xs avatar-soft-success avatar-rounded me-3">
                                                <span className="initial-wrap">
                                                    <i className="ri-map-pin-line" />
                                                </span>
                                            </div>
                                            <div>
                                                <span className="h6 mb-0">Localização</span>
                                            </div>
                                        </div>
                                    </Dropdown.Item>
                                    <Dropdown.Item>
                                        <div className="d-flex align-items-center">
                                            <div className="avatar avatar-icon avatar-xs avatar-soft-blue avatar-rounded me-3">
                                                <span className="initial-wrap">
                                                    <i className="ri-contacts-line" />
                                                </span>
                                            </div>
                                            <div>
                                                <span className="h6 mb-0">Contato</span>
                                            </div>
                                        </div>
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                        <Form.Control 
                            type="text" 
                            id="input_msg_chat_popup_2" 
                            name="send-msg" 
                            className="input-msg-send border-0 shadow-none" 
                            placeholder="Digite algo..." 
                            value={messages} 
                            onChange={e => setMessages(e.target.value)} 
                            onKeyDown={onKeyDown}
                            disabled={loading}
                        />
                        <div className="input-group-text overflow-show border-0">
                            <Button variant="flush-dark" className="btn-icon flush-soft-hover btn-rounded">
                                <span className="icon">
                                    <span className="feather-icon">
                                        <Icons.Smile />
                                    </span>
                                </span>
                            </Button>
                        </div>
                    </InputGroup>
                 
                </footer>
            </div>
            <Button variant="primary" size="lg" className="btn-icon btn-floating btn-rounded btn-popup-open" onClick={() => { setShowChatbot(!showChatbot); setshowPopup(false); }} >
                <span className="icon">
                    <span className="feather-icon">
                        <Icons.MessageCircle />
                    </span>
                </span>
            </Button>
            <div className={classNames("chat-popover shadow-xl", { "d-flex": showPopup })}><p>Assistente virtual do TMS-Fácil — tire dúvidas sobre sua frota!</p></div>
        </>
    )
}


export default ChatBotInterface;