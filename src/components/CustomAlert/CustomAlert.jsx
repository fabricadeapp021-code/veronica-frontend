'use client';
import React from 'react';
import { Alert } from 'react-bootstrap';
import * as Icons from 'react-feather';
import classNames from 'classnames';
import Swal from 'sweetalert2';

const swalIconMap = {
  success: 'success',
  danger: 'error',
  warning: 'warning',
  info: 'info',
  primary: 'info',
};

const defaultSwalButtonClasses = {
  confirmButton: 'btn btn-primary',
  cancelButton: 'btn btn-outline-secondary',
  denyButton: 'btn btn-outline-secondary',
};

const defaultSwalCustomClass = {
  ...defaultSwalButtonClasses,
  actions: 'swal2-actions-gap',
};

const mergeSwalCustomClass = (customClass = {}) => ({
  ...defaultSwalCustomClass,
  ...customClass,
  actions: [defaultSwalCustomClass.actions, customClass.actions].filter(Boolean).join(' '),
});

export const showCustomAlert = async ({
  variant = 'info',
  title = '',
  text = '',
  html,
  confirmButtonText = 'OK',
  customClass,
  ...rest
} = {}) => {
  return Swal.fire({
    icon: swalIconMap[variant] || 'info',
    title,
    text,
    html,
    confirmButtonText,
    buttonsStyling: false,
    customClass: mergeSwalCustomClass(customClass),
    ...rest,
  });
};

export const showCustomToast = async ({
  variant = 'info',
  title = '',
  timer = 3500,
  position = 'top-end',
  customClass,
  ...rest
} = {}) => {
  return Swal.fire({
    toast: true,
    position,
    icon: swalIconMap[variant] || 'info',
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    buttonsStyling: false,
    customClass: mergeSwalCustomClass(customClass),
    ...rest,
  });
};

/**
 * CustomAlert - Componente de alerta moderno e reutilizável
 * 
 * @param {string} variant - Tipo: success, danger, warning, info, primary (default: info)
 * @param {boolean} dismissible - Se pode ser fechado (default: false)
 * @param {function} onClose - Callback ao fechar
 * @param {string} icon - Nome do ícone do react-feather (ex: 'Info', 'CheckCircle')
 * @param {string} title - Título em negrito
 * @param {string} className - Classes CSS adicionais
 * @param {boolean} bordered - Borda lateral colorida (default: false)
 * @param {React.ReactNode} children - Conteúdo do alerta
 */
const CustomAlert = ({
  variant = 'info',
  dismissible = false,
  onClose,
  icon,
  title,
  className,
  bordered = false,
  children,
  ...props
}) => {
  // Mapeamento de ícones padrão por variant
  const defaultIcons = {
    success: 'CheckCircle',
    danger: 'AlertTriangle',
    warning: 'AlertCircle',
    info: 'Info',
    primary: 'Star',
  };

  // Selecionar ícone
  const iconName = icon || defaultIcons[variant];
  const IconComponent = iconName ? Icons[iconName] : null;

  return (
    <Alert
      variant={variant}
      dismissible={dismissible}
      onClose={onClose}
      className={classNames(
        'd-flex align-items-start',
        bordered && `border-start border-${variant} border-4`,
        className
      )}
      style={{
        backgroundColor: variant === 'info' ? '#e7f3ff' : undefined,
        borderColor: variant === 'info' ? '#0d6efd' : undefined,
      }}
      {...props}
    >
      {IconComponent && (
        <div className="me-3 flex-shrink-0 mt-1">
          <IconComponent size={20} />
        </div>
      )}
      
      <div className="flex-grow-1">
        {title && (
          <strong className="d-block mb-1">
            {title}
          </strong>
        )}
        
        <div>
          {children}
        </div>
      </div>
    </Alert>
  );
};

export default CustomAlert;
