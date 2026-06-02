'use client';
import { useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { ArrowLeft, Menu } from 'react-feather';
import SimpleBar from 'simplebar-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Área de mensagens do chat (tipo ChatGPT)
 */
const AssistantChatArea = ({
  assistant,
  messages,
  currentConversation,
  onToggleSidebar,
  onBack,
  showSidebar,
  isAssistantTyping,
}) => {
  const messagesEndRef = useRef(null);
  const formatFileSize = (size) => {
    if (size == null) return '';
    if (size < 1024) return `${size} B`;
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <>
      <style jsx>{`
        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #6c757d;
          animation: typing 1.4s infinite;
          display: inline-block;
        }
        
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
      
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          backgroundColor: '#f8f9fa',
        }}
      >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e7eaf0',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onBack}
        >
          <ArrowLeft size={16} className="me-1" />
          Voltar
        </Button>
        {!showSidebar && (
          <Button
            variant="link"
            size="sm"
            className="btn-icon"
            onClick={onToggleSidebar}
          >
            <Menu size={20} />
          </Button>
        )}
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '1.5rem' }} className="me-2">
            {assistant.icon || '🤖'}
          </span>
          <div>
            <h6 className="mb-0">{assistant.name}</h6>
            <small className="text-muted">{assistant.description}</small>
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
        }}
      >

        <SimpleBar
          style={{
            flex: 1,
            height: '100%',
            minHeight: 0,
            padding: '2rem 1.5rem',
          }}
        >
        {messages.length === 0 ? (
          <div
            className="d-flex flex-column align-items-center justify-content-center text-center"
            style={{ height: '100%', minHeight: '300px' }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#f0f4ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                marginBottom: '1.5rem',
              }}
            >
              {assistant.icon || '🤖'}
            </div>
            <h5>{assistant.name}</h5>
            <p className="text-muted mb-4" style={{ maxWidth: '500px' }}>
              {assistant.description}
            </p>
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <div
                className="bg-white p-3 rounded shadow-sm"
                style={{ maxWidth: '200px', cursor: 'default' }}
              >
                <small className="text-muted d-block mb-1">Exemplo:</small>
                <small>"Como você pode me ajudar?"</small>
              </div>
              <div
                className="bg-white p-3 rounded shadow-sm"
                style={{ maxWidth: '200px', cursor: 'default' }}
              >
                <small className="text-muted d-block mb-1">Exemplo:</small>
                <small>"Qual é sua especialidade?"</small>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 d-flex ${
                  msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'
                }`}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    display: 'flex',
                    gap: '0.75rem',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor:
                        msg.role === 'user' ? '#0d6efd' : '#f0f4ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: msg.role === 'user' ? '#fff' : '#333',
                      fontSize: '1.2rem',
                    }}
                  >
                    {msg.role === 'user' ? '👤' : assistant.icon || '🤖'}
                  </div>

                  {/* Mensagem */}
                  <div>
                    <div
                      style={{
                        backgroundColor: msg.role === 'user' ? '#0d6efd' : '#fff',
                        color: msg.role === 'user' ? '#fff' : '#212529',
                        padding: '0.875rem 1.125rem',
                        borderRadius: '12px',
                        boxShadow:
                          msg.role === 'user'
                            ? '0 2px 8px rgba(13, 110, 253, 0.15)'
                            : '0 2px 8px rgba(0, 0, 0, 0.08)',
                        wordWrap: 'break-word',
                        whiteSpace: 'normal',
                      }}
                    >
                      <div className="assistant-message-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        {msg.attachments.map((file, fileIndex) => (
                          <div
                            key={`${file.name}-${fileIndex}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.35rem 0.6rem',
                              borderRadius: '999px',
                              backgroundColor:
                                msg.role === 'user' ? 'rgba(13, 110, 253, 0.08)' : '#f8f9fa',
                              border: '1px solid #e7eaf0',
                              fontSize: '0.75rem',
                              color: '#495057',
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{file.name}</span>
                            <span style={{ color: '#6c757d' }}>
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <small
                      className={`d-block mt-1 ${
                        msg.role === 'user' ? 'text-end' : 'text-start'
                      }`}
                      style={{ fontSize: '0.7rem', color: '#6c757d' }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Indicador de "digitando..." */}
            {isAssistantTyping && (
              <div className="mb-4 d-flex justify-content-start">
                <div
                  style={{
                    maxWidth: '70%',
                    display: 'flex',
                    gap: '0.75rem',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#f0f4ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '1.2rem',
                    }}
                  >
                    {assistant.icon || '🤖'}
                  </div>

                  {/* Indicador de digitação */}
                  <div
                    style={{
                      backgroundColor: '#fff',
                      padding: '0.875rem 1.125rem',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center',
                    }}
                  >
                    <span className="typing-dot" style={{ animationDelay: '0ms' }}></span>
                    <span className="typing-dot" style={{ animationDelay: '150ms' }}></span>
                    <span className="typing-dot" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
        </SimpleBar>
      </div>
    </div>
    </>
  );
};

export default AssistantChatArea;
