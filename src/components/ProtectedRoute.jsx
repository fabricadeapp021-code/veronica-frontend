import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * Componente para proteger rotas/componentes por permissão
 * 
 * Esconde ou desabilita componentes baseado nas permissões do usuário.
 * 
 * @param module - Módulo requerido (admin, financial, marketing, citizen, studio)
 * @param action - Ação requerida (read, write, delete)
 * @param children - Componente a ser protegido
 * @param fallback - Componente a mostrar se não tiver permissão (default: null)
 * @param disable - Se true, desabilita ao invés de esconder (default: false)
 * 
 * @example Esconder componente
 * ```jsx
 * <ProtectedRoute module="financial" action="read">
 *   <FinancialReports />
 * </ProtectedRoute>
 * // Sem permissão: não renderiza nada
 * ```
 * 
 * @example Mostrar fallback customizado
 * ```jsx
 * <ProtectedRoute 
 *   module="financial" 
 *   action="write"
 *   fallback={<Alert>Você não tem permissão para editar</Alert>}
 * >
 *   <EditForm />
 * </ProtectedRoute>
 * // Sem permissão: mostra o Alert
 * ```
 * 
 * @example Desabilitar ao invés de esconder
 * ```jsx
 * <ProtectedRoute module="financial" action="delete" disable>
 *   <Button variant="danger">Deletar</Button>
 * </ProtectedRoute>
 * // Sem permissão: <Button disabled variant="danger">Deletar</Button>
 * ```
 */
export function ProtectedRoute({ 
  module, 
  action, 
  children, 
  fallback = null,
  disable = false 
}) {
  const { hasPermission } = usePermissions();
  
  const hasAccess = hasPermission(module, action);
  
  // Se não tem acesso
  if (!hasAccess) {
    // Modo "disable": desabilita o componente filho
    if (disable && children) {
      return React.cloneElement(children, { disabled: true });
    }
    
    // Modo "hide": mostra fallback ou esconde
    return fallback;
  }
  
  // Tem acesso: renderiza normalmente
  return children;
}

/**
 * Componente para mostrar conteúdo apenas se tiver TODAS as permissões (AND)
 * 
 * @example
 * ```jsx
 * <ProtectedMultiple permissions={[
 *   { module: 'financial', action: 'write' },
 *   { module: 'financial', action: 'delete' }
 * ]}>
 *   <Button variant="danger">Deletar Transação</Button>
 * </ProtectedMultiple>
 * ```
 */
export function ProtectedMultiple({ 
  permissions, 
  children, 
  fallback = null,
  disable = false 
}) {
  const { hasAllPermissions } = usePermissions();
  
  const hasAccess = hasAllPermissions(permissions);
  
  if (!hasAccess) {
    if (disable && children) {
      return React.cloneElement(children, { disabled: true });
    }
    return fallback;
  }
  
  return children;
}

/**
 * Componente para mostrar conteúdo se tiver QUALQUER UMA das permissões (OR)
 * 
 * @example
 * ```jsx
 * <ProtectedAny permissions={[
 *   { module: 'financial', action: 'read' },
 *   { module: 'marketing', action: 'read' }
 * ]}>
 *   <DashboardWidget />
 * </ProtectedAny>
 * ```
 */
export function ProtectedAny({ 
  permissions, 
  children, 
  fallback = null,
  disable = false 
}) {
  const { hasAnyPermission } = usePermissions();
  
  const hasAccess = hasAnyPermission(permissions);
  
  if (!hasAccess) {
    if (disable && children) {
      return React.cloneElement(children, { disabled: true });
    }
    return fallback;
  }
  
  return children;
}
