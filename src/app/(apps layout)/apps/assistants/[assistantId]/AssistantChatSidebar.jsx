'use client';
import { Button, ListGroup, Badge } from 'react-bootstrap';
import { Plus, MessageSquare, X } from 'react-feather';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';

/**
 * Sidebar com histórico de conversas (tipo ChatGPT)
 */
const AssistantChatSidebar = ({
  assistant,
  conversations,
  currentConversation,
  onNewConversation,
  onSelectConversation,
  show,
  onToggle,
}) => {
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div
      className={classNames('assistant-chat-sidebar', {
        'd-none d-md-block': !show,
      })}
      style={{
        width: show ? '280px' : '0',
        borderRight: '1px solid #e7eaf0',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid #e7eaf0',
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <span style={{ fontSize: '1.5rem' }} className="me-2">
              {assistant.icon || '🤖'}
            </span>
            <div>
              <h6 className="mb-0">{assistant.name}</h6>
              <small className="text-muted">{assistant.category}</small>
            </div>
          </div>
          <Button
            variant="link"
            size="sm"
            className="btn-icon d-md-none"
            onClick={onToggle}
          >
            <X size={18} />
          </Button>
        </div>

        <Button
          variant="primary"
          className="w-100"
          onClick={onNewConversation}
          style={{
            borderRadius: '8px',
            fontWeight: 500,
          }}
        >
          <Plus size={18} className="me-2" />
          Nova Conversa
        </Button>
      </div>

      {/* Lista de conversas */}
      <SimpleBar
        style={{
          flex: 1,
          padding: '0.5rem',
          minHeight: 0,
        }}
      >
        {conversations.length === 0 ? (
          <div className="text-center text-muted py-5">
            <MessageSquare size={48} className="mb-3 opacity-50" />
            <p className="mb-0">Nenhuma conversa ainda</p>
            <small>Inicie uma nova conversa</small>
          </div>
        ) : (
          <ListGroup variant="flush">
            {conversations.map((conv) => (
              <ListGroup.Item
                key={conv.conversationId}
                action
                active={
                  currentConversation?.conversationId === conv.conversationId
                }
                onClick={() => onSelectConversation(conv)}
                style={{
                  cursor: 'pointer',
                  borderRadius: '8px',
                  marginBottom: '0.25rem',
                  border: 'none',
                  backgroundColor:
                    currentConversation?.conversationId === conv.conversationId
                      ? '#f0f4ff'
                      : 'transparent',
                  color: '#1f2d3d',
                }}
                className="conversation-item"
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        marginBottom: '0.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#1f2d3d',
                      }}
                    >
                      {conv.title || 'Conversa sem título'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#6c757d',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conv.lastMessage}
                    </div>
                  </div>
                  <small className="text-muted ms-2" style={{ fontSize: '0.7rem' }}>
                    {formatDate(conv.lastMessageAt)}
                  </small>
                </div>
                {conv.messageCount && (
                  <Badge bg="secondary" pill className="mt-1">
                    {conv.messageCount} msgs
                  </Badge>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </SimpleBar>

      {/* Footer */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid #e7eaf0',
          fontSize: '0.75rem',
          color: '#6c757d',
          marginTop: 'auto',
        }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <span>{conversations.length} conversas</span>
          <Badge bg="success" pill>
            Online
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default AssistantChatSidebar;
