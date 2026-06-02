'use client';
import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createUser } from '@/lib/api/services/users';
import { showCustomAlert } from '@/components/CustomAlert';

const CreateUserModal = ({ show, onHide, onSuccess, currentUserRole }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isOwner = currentUserRole === 'owner';
  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    if (!error) return;
    showCustomAlert({
      variant: 'danger',
      title: 'Erro',
      text: error,
    }).finally(() => setError(''));
  }, [error]);

  const validateField = (fieldName, value) => {
    let error = '';
    
    if (fieldName === 'name') {
      if (!value || value.trim() === '') {
        error = 'Nome é obrigatório';
      }
    } else if (fieldName === 'email') {
      if (!value || value.trim() === '') {
        error = 'E-mail é obrigatório';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          error = 'Por favor, insira um e-mail válido';
        }
      }
    } else if (fieldName === 'password') {
      if (!value || value.trim() === '') {
        error = 'Senha é obrigatória';
      } else if (value.length < 6) {
        error = 'A senha deve ter no mínimo 6 caracteres';
      }
    }
    
    return error;
  };

  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    let value;
    if (fieldName === 'name') value = name;
    else if (fieldName === 'email') value = email;
    else if (fieldName === 'password') value = password;
    
    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const handleChange = (fieldName, value) => {
    if (fieldName === 'name') {
      setName(value);
    } else if (fieldName === 'email') {
      setEmail(value);
    } else if (fieldName === 'password') {
      setPassword(value);
    }
    
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    }
    
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const errors = {
      name: validateField('name', name),
      email: validateField('email', email),
      password: validateField('password', password),
    };
    
    setFieldErrors(errors);
    setTouched({ name: true, email: true, password: true });
    
    return !errors.name && !errors.email && !errors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    // Valida permissões
    if (isAdmin && !['employee', 'external'].includes(role)) {
      setError('Admin só pode criar usuários com role EMPLOYEE ou EXTERNAL');
      return;
    }
    
    setLoading(true);
    try {
      await createUser({
        name,
        email,
        password,
        role,
      });
      
      // Limpa formulário
      setName('');
      setEmail('');
      setPassword('');
      setRole('employee');
      setFieldErrors({});
      setTouched({});
      
      onSuccess();
    } catch (err) {
      const msg = err?.body?.message || err?.message || 'Erro ao criar usuário';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('employee');
    setError('');
    setFieldErrors({});
    setTouched({});
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Adicionar Novo Usuário</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nome <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              placeholder="Digite o nome"
              value={name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              required
              isInvalid={touched.name && !!fieldErrors.name}
            />
            {touched.name && fieldErrors.name && (
              <Form.Control.Feedback type="invalid" className="d-block">
                {fieldErrors.name}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>E-mail <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="email"
              placeholder="Digite o e-mail"
              value={email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              required
              isInvalid={touched.email && !!fieldErrors.email}
            />
            {touched.email && fieldErrors.email && (
              <Form.Control.Feedback type="invalid" className="d-block">
                {fieldErrors.email}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Senha <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              required
              isInvalid={touched.password && !!fieldErrors.password}
            />
            {touched.password && fieldErrors.password && (
              <Form.Control.Feedback type="invalid" className="d-block">
                {fieldErrors.password}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Role <span className="text-danger">*</span></Form.Label>
            {isAdmin ? (
              <>
                <Form.Control
                  as="select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="employee">Employee</option>
                  <option value="external">External</option>
                </Form.Control>
                <Form.Text className="text-muted">
                  Admin pode criar usuários com role EMPLOYEE ou EXTERNAL
                </Form.Text>
              </>
            ) : isOwner ? (
              <Form.Control
                as="select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
                <option value="external">External</option>
              </Form.Control>
            ) : (
              <Form.Control
                as="select"
                value="employee"
                disabled
              >
                <option value="employee">Employee</option>
              </Form.Control>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateUserModal;

