import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Hook para verificar permissões do usuário atual
 * 
 * @example Verificar permissão única
 * ```jsx
 * const { hasPermission } = usePermissions();
 * 
 * if (hasPermission('financial', 'read')) {
 *   // Mostrar relatórios financeiros
 * }
 * ```
 * 
 * @example Verificar múltiplas permissões (OR)
 * ```jsx
 * if (hasAnyPermission([
 *   { module: 'financial', action: 'read' },
 *   { module: 'marketing', action: 'read' }
 * ])) {
 *   // Mostrar dashboard se tiver qualquer uma
 * }
 * ```
 * 
 * @example Verificar múltiplas permissões (AND)
 * ```jsx
 * if (hasAllPermissions([
 *   { module: 'financial', action: 'write' },
 *   { module: 'financial', action: 'delete' }
 * ])) {
 *   // Mostrar botão de deletar apenas se tiver ambas
 * }
 * ```
 */
export function usePermissions() {
  const { user } = useAuth();
  
  const role = user?.role;
  const permissions = user?.permissions || {};
  
  /**
   * Verifica se o usuário tem uma permissão específica
   * 
   * @param module - Módulo (admin, financial, marketing, citizen, studio)
   * @param action - Ação (read, write, delete)
   * @returns true se o usuário tem a permissão
   */
  const hasPermission = (module, action) => {
    // OWNER e ADMIN sempre têm acesso total
    if (role === 'owner' || role === 'admin') {
      return true;
    }
    
    // EMPLOYEE e EXTERNAL: verificação granular
    return permissions[module]?.[action] === true;
  };
  
  /**
   * Verifica se o usuário tem QUALQUER UMA das permissões (OR)
   * 
   * @param permissionsArray - Array de { module, action }
   * @returns true se o usuário tem pelo menos uma das permissões
   */
  const hasAnyPermission = (permissionsArray) => {
    return permissionsArray.some(({ module, action }) => 
      hasPermission(module, action)
    );
  };
  
  /**
   * Verifica se o usuário tem TODAS as permissões (AND)
   * 
   * @param permissionsArray - Array de { module, action }
   * @returns true se o usuário tem todas as permissões
   */
  const hasAllPermissions = (permissionsArray) => {
    return permissionsArray.every(({ module, action }) => 
      hasPermission(module, action)
    );
  };
  
  /**
   * Verifica se o usuário é OWNER ou ADMIN
   */
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  
  /**
   * Verifica se o usuário é OWNER
   */
  const isOwner = role === 'owner';
  
  /**
   * Verifica se o usuário é ADMIN (Político)
   */
  const isAdmin = role === 'admin';
  
  /**
   * Verifica se o usuário é EMPLOYEE (Funcionário)
   */
  const isEmployee = role === 'employee';
  
  /**
   * Verifica se o usuário é EXTERNAL
   */
  const isExternal = role === 'external';
  
  return {
    // Estado
    role,
    permissions,
    
    // Verificações de permissão
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Verificações de role
    isOwnerOrAdmin,
    isOwner,
    isAdmin,
    isEmployee,
    isExternal,
  };
}
