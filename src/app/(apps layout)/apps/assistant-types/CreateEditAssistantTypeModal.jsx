'use client'
import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge, Alert } from 'react-bootstrap';
import * as Icons from 'react-feather';
import assistantTypesAPI, { AVAILABLE_TOOLS, WEBHOOK_TYPES } from '@/lib/api/services/assistantTypes';

const CreateEditAssistantTypeModal = ({ show, onHide, onSuccess, editData = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        tools: [],
        webhookType: 'unique',
        status: 'active',
    });
    
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Modo de edição
    const isEditMode = !!editData;

    // Preencher formulário ao editar
    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                description: editData.description || '',
                tools: editData.tools || [],
                webhookType: editData.webhookType || 'unique',
                status: editData.status || 'active',
            });
        } else {
            // Resetar ao criar novo
            setFormData({
                name: '',
                description: '',
                tools: [],
                webhookType: 'unique',
                status: 'active',
            });
        }
        setErrors({});
        setSubmitError(null);
    }, [editData, show]);

    // Validar campo individual
    const validateField = (name, value) => {
        const newErrors = { ...errors };

        switch (name) {
            case 'name':
                if (!value.trim()) {
                    newErrors.name = 'Nome é obrigatório';
                } else if (value.trim().length < 3) {
                    newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
                } else {
                    delete newErrors.name;
                }
                break;
            
            case 'tools':
                if (value.length === 0) {
                    newErrors.tools = 'Selecione pelo menos uma ferramenta';
                } else {
                    delete newErrors.tools;
                }
                break;
            
            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validar formulário completo
    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        } else if (formData.name.trim().length < 3) {
            newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
        }

        if (formData.tools.length === 0) {
            newErrors.tools = 'Selecione pelo menos uma ferramenta';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Atualizar campo
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        validateField(name, value);
        setSubmitError(null);
    };

    // Toggle ferramenta
    const handleToggleTool = (toolId) => {
        const newTools = formData.tools.includes(toolId)
            ? formData.tools.filter(id => id !== toolId)
            : [...formData.tools, toolId];
        
        setFormData(prev => ({ ...prev, tools: newTools }));
        validateField('tools', newTools);
        setSubmitError(null);
    };

    // Selecionar/deselecionar todas as ferramentas
    const handleSelectAllTools = () => {
        const allToolIds = AVAILABLE_TOOLS.map(t => t.id);
        const newTools = formData.tools.length === allToolIds.length ? [] : allToolIds;
        setFormData(prev => ({ ...prev, tools: newTools }));
        validateField('tools', newTools);
        setSubmitError(null);
    };

    // Submeter formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setSubmitError(null);

            let response;
            if (isEditMode) {
                response = await assistantTypesAPI.update(editData.id, formData);
            } else {
                response = await assistantTypesAPI.create(formData);
            }

            console.log('✅ Tipo salvo:', response);

            // Callback de sucesso
            if (onSuccess) {
                onSuccess(response.data);
            }

            // Fechar modal
            onHide();

            // Mostrar mensagem de sucesso
            alert(response.message || `Tipo ${isEditMode ? 'atualizado' : 'criado'} com sucesso!`);
        } catch (err) {
            console.error('Erro ao salvar tipo:', err);
            setSubmitError(err.message || `Erro ao ${isEditMode ? 'atualizar' : 'criar'} tipo. Tente novamente.`);
        } finally {
            setLoading(false);
        }
    };

    // Agrupar ferramentas por categoria
    const toolsByCategory = AVAILABLE_TOOLS.reduce((acc, tool) => {
        if (!acc[tool.category]) {
            acc[tool.category] = [];
        }
        acc[tool.category].push(tool);
        return acc;
    }, {});

    return (
        <Modal 
            show={show} 
            onHide={onHide}
            size="lg"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <Icons.Cpu className="me-2" size={20} />
                    {isEditMode ? 'Editar Tipo de Assistente' : 'Novo Tipo de Assistente'}
                </Modal.Title>
            </Modal.Header>
            
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {submitError && (
                        <Alert variant="danger" dismissible onClose={() => setSubmitError(null)}>
                            {submitError}
                        </Alert>
                    )}

                    {/* Nome */}
                    <Form.Group className="mb-3">
                        <Form.Label>
                            Nome <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            isInvalid={!!errors.name}
                            placeholder="Ex: Assistente de Agenda"
                            maxLength={100}
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.name}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {/* Descrição */}
                    <Form.Group className="mb-3">
                        <Form.Label>Descrição</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Descreva o propósito deste tipo de assistente..."
                            maxLength={500}
                        />
                        <Form.Text className="text-muted">
                            {formData.description.length}/500 caracteres
                        </Form.Text>
                    </Form.Group>

                    {/* Ferramentas */}
                    <Form.Group className="mb-3">
                        <Form.Label className="d-flex justify-content-between align-items-center">
                            <span>
                                Ferramentas Disponíveis <span className="text-danger">*</span>
                            </span>
                            <Button 
                                variant="link" 
                                size="sm" 
                                onClick={handleSelectAllTools}
                                className="p-0"
                            >
                                {formData.tools.length === AVAILABLE_TOOLS.length 
                                    ? 'Desmarcar Todas' 
                                    : 'Selecionar Todas'}
                            </Button>
                        </Form.Label>
                        
                        {Object.entries(toolsByCategory).map(([category, tools]) => (
                            <div key={category} className="mb-3">
                                <div className="text-uppercase text-muted small fw-medium mb-2">
                                    {category === 'google' ? '🔵 Google Workspace' : category}
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {tools.map(tool => (
                                        <Badge
                                            key={tool.id}
                                            bg={formData.tools.includes(tool.id) ? 'primary' : 'light'}
                                            text={formData.tools.includes(tool.id) ? 'white' : 'dark'}
                                            className="p-2 cursor-pointer border"
                                            style={{ 
                                                cursor: 'pointer', 
                                                fontSize: '0.9rem',
                                                fontWeight: 'normal'
                                            }}
                                            onClick={() => handleToggleTool(tool.id)}
                                        >
                                            <span className="me-1">{tool.icon}</span>
                                            {tool.name}
                                            {formData.tools.includes(tool.id) && (
                                                <Icons.Check size={14} className="ms-1" />
                                            )}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        {errors.tools && (
                            <div className="text-danger small mt-2">
                                {errors.tools}
                            </div>
                        )}
                        
                        {formData.tools.length > 0 && (
                            <div className="mt-2">
                                <small className="text-muted">
                                    {formData.tools.length} ferramenta(s) selecionada(s)
                                </small>
                            </div>
                        )}
                    </Form.Group>

                    {/* Tipo de Webhook */}
                    <Form.Group className="mb-3">
                        <Form.Label>Tipo de Webhook</Form.Label>
                        <div>
                            {WEBHOOK_TYPES.map(type => (
                                <Form.Check
                                    key={type.value}
                                    type="radio"
                                    id={`webhook-${type.value}`}
                                    name="webhookType"
                                    label={
                                        <div>
                                            <div className="fw-medium">{type.label}</div>
                                            <small className="text-muted">{type.description}</small>
                                        </div>
                                    }
                                    value={type.value}
                                    checked={formData.webhookType === type.value}
                                    onChange={handleChange}
                                    className="mb-2"
                                />
                            ))}
                        </div>
                    </Form.Group>

                    {/* Status */}
                    <Form.Group className="mb-0">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>

                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={onHide}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        variant="primary" 
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                {isEditMode ? 'Atualizando...' : 'Criando...'}
                            </>
                        ) : (
                            <>
                                <Icons.Save size={16} className="me-2" />
                                {isEditMode ? 'Atualizar' : 'Criar'}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default CreateEditAssistantTypeModal;

