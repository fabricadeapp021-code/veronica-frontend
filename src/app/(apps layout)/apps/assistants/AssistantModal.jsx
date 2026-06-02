'use client';
import { useState, useRef, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Send, X, MessageCircle, RefreshCw } from 'react-feather';
import { apiRequest } from '@/lib/api/client';

/**
 * Modal para interagir com um assistente
 * Permite enviar mensagens e ver o histórico da conversa
 */
const AssistantModal = ({ assistant, onClose }) => {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage('');
    setError(null);

    // Adicionar mensagem do usuário imediatamente
    setConversation(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      setLoading(true);

      const payload = {
        message: userMessage,
      };

      // Se já existe uma conversa, incluir o ID
      if (conversationId) {
        payload.conversationId = conversationId;
      }

      const response = await apiRequest(
        `/assistants/${assistant.assistantId}/run`,
        {
          method: 'POST',
          body: payload
        }
      );

      // Salvar conversationId para próximas mensagens
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      // A API retorna: { success, executionId, conversationId, message, data }
      // Extrair a mensagem do assistente
      const assistantMessage = response.message || response.data?.output || 'Sem resposta';

      // Adicionar resposta do assistente
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
        data: response.data,
        executionId: response.executionId
      }]);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError(err.message || 'Erro ao enviar mensagem. Tente novamente.');
      
      // Adicionar mensagem de erro na conversa
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    setConversation([]);
    setConversationId(null);
    setMessage('');
    setError(null);
  };

  return (
    <Modal 
      show 
      onHide={onClose} 
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header className="bg-light">
        <Modal.Title className="d-flex align-items-center">
          <span className="fs-1 me-2">{assistant.icon || '🤖'}</span>
          <div>
            <div>{assistant.name}</div>
            <small className="text-muted fs-7">{assistant.description}</small>
          </div>
        </Modal.Title>
        <div className="d-flex align-items-center gap-2">
          {conversationId && (
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={handleNewConversation}
              title="Nova conversa"
            >
              <RefreshCw size={14} />
            </Button>
          )}
          <Button 
            variant="link" 
            className="text-dark p-0" 
            onClick={onClose}
          >
            <X size={24} />
          </Button>
        </div>
      </Modal.Header>

      <Modal.Body style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
        {/* Área de mensagens */}
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}
        >
          {conversation.length === 0 ? (
            <div className="text-center text-muted py-5">
              <MessageCircle size={48} className="mb-3 opacity-50" />
              <p>Inicie uma conversa com {assistant.name}</p>
              <small>Envie uma mensagem para começar</small>
            </div>
          ) : (
            <>
              {conversation.map((msg, index) => (
                <div 
                  key={index} 
                  className={`mb-3 d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div 
                    style={{
                      maxWidth: '75%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      backgroundColor: msg.role === 'user' ? '#0d6efd' : msg.error ? '#dc3545' : '#fff',
                      color: msg.role === 'user' ? '#fff' : msg.error ? '#fff' : '#212529',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      wordWrap: 'break-word'
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    <small 
                      className="d-block mt-1 opacity-75" 
                      style={{ fontSize: '0.7rem' }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </small>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Erro */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
            {error}
          </Alert>
        )}

        {/* Input de mensagem */}
        <div className="d-flex gap-2">
          <Form.Control
            as="textarea"
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Pergunte algo ao ${assistant.name}...`}
            disabled={loading}
            style={{ resize: 'none' }}
          />
          <Button 
            variant="primary" 
            onClick={handleSend} 
            disabled={loading || !message.trim()}
            style={{ minWidth: '60px' }}
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>

        {conversationId && (
          <small className="text-muted mt-2">
            Conversa: {conversationId.split('-')[1]}
          </small>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default AssistantModal;
