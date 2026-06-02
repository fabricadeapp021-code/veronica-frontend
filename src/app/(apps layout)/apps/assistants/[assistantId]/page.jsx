'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import classNames from 'classnames';
import { apiRequest } from '@/lib/api/client';
import { Spinner, Alert } from 'react-bootstrap';
import { Upload } from 'react-feather';
import AssistantChatSidebar from './AssistantChatSidebar';
import AssistantChatArea from './AssistantChatArea';
import AssistantChatInput from './AssistantChatInput';

/**
 * Página de chat com assistente individual
 * Layout tipo ChatGPT com histórico de conversas
 */
const AssistantChatPage = () => {
  const params = useParams();
  const router = useRouter();
  const assistantId = params.assistantId;

  const [assistant, setAssistant] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const chatInputRef = useRef(null);
  const dragDepthRef = useRef(0);

  // Carregar dados do assistente
  useEffect(() => {
    loadAssistant();
    loadConversations();
  }, [assistantId]);

  // Carregar mensagens quando conversa mudar
  useEffect(() => {
    if (currentConversation) {
      loadConversationHistory(currentConversation.conversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  const loadAssistant = async () => {
    try {
      const response = await apiRequest(`/assistants/${assistantId}`, {
        method: 'GET',
      });
      setAssistant(response.data);
    } catch (err) {
      console.error('Erro ao carregar assistente:', err);
      setError('Assistente não encontrado');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await apiRequest(
        `/assistants/${assistantId}/conversations`,
        { method: 'GET' }
      );
      setConversations(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    }
  };

  const loadConversationHistory = async (conversationId) => {
    try {
      const response = await apiRequest(
        `/assistants/${assistantId}/conversations/${conversationId}`,
        { method: 'GET' }
      );
      setMessages(response.data?.messages || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  const handleSelectConversation = (conversation) => {
    setCurrentConversation(conversation);
  };

  const handleSendMessage = async (message, files = []) => {
    // Adicionar mensagem do usuário imediatamente
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
      attachments: files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsAssistantTyping(true);

    try {
      const payload = {
        message,
        conversationId: currentConversation?.conversationId,
      };

      const response = await apiRequest(`/assistants/${assistantId}/run`, {
        method: 'POST',
        body: payload,
      });

      // Atualizar conversa atual se for nova
      if (!currentConversation && response.conversationId) {
        setCurrentConversation({
          conversationId: response.conversationId,
          assistantId,
          lastMessage: message,
          lastMessageAt: new Date(),
        });
        loadConversations(); // Recarregar lista
      }

      // Adicionar resposta do assistente
      const assistantMessage = {
        role: 'assistant',
        content: response.message || response.data?.output || 'Sem resposta',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsAssistantTyping(false);
    }
  };

  const handleDropFiles = (files) => {
    chatInputRef.current?.addFiles?.(files);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) handleDropFiles(files);
  };

  if (loading) {
    return (
      <div className="hk-pg-body py-0">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <Spinner animation="border" variant="primary" />
        </div>
      </div>
    );
  }

  if (error || !assistant) {
    return (
      <div className="hk-pg-body py-0">
        <div className="container py-5">
          <Alert variant="danger">{error || 'Assistente não encontrado'}</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="hk-pg-body py-0">
      <div
        className={classNames('assistant-chat-wrap', {
          'sidebar-collapsed': !showSidebar,
        })}
        style={{
          display: 'flex',
          height: 'calc(100vh - 60px)',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar com histórico */}
        <AssistantChatSidebar
          assistant={assistant}
          conversations={conversations}
          currentConversation={currentConversation}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          show={showSidebar}
          onToggle={() => setShowSidebar(!showSidebar)}
        />

        {/* Área principal de chat */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
            position: 'relative',
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isDragActive && (
            <>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.55)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  pointerEvents: 'none',
                  zIndex: 4,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '1.5rem',
                  borderRadius: '18px',
                  border: '2px dashed #0d6efd',
                  backgroundColor: 'rgba(13, 110, 253, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.9rem',
                  color: '#0d6efd',
                  fontWeight: 600,
                  fontSize: '1rem',
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
              >
                <span
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 18px rgba(13, 110, 253, 0.2)',
                    border: '1px solid #e7eaf0',
                    color: '#0d6efd',
                  }}
                >
                  <Upload size={24} />
                </span>
                Arraste arquivo aqui
              </div>
            </>
          )}
          {/* Área de mensagens */}
          <AssistantChatArea
            assistant={assistant}
            messages={messages}
            currentConversation={currentConversation}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            onBack={() => router.push('/apps/assistants')}
            showSidebar={showSidebar}
            isAssistantTyping={isAssistantTyping}
          />

          {/* Input de mensagem */}
          <AssistantChatInput ref={chatInputRef} onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default AssistantChatPage;
