'use client';
import * as Icons from 'react-feather';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';
import { usePathname, useRouter } from 'next/navigation';

const DocumentsSidebar = ({ activeFilter = 'all', onFilterChange }) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleFilter = (filter) => {
    if (onFilterChange) onFilterChange(filter);
  };

  const isActive = (filter) => activeFilter === filter;
  const adminMenuItems = [
    { icon: Icons.Users, label: 'Usuários', path: '/apps/users/list' },
    { icon: Icons.Folder, label: 'Documentos', path: '/apps/documents/list-view' },
    { icon: Icons.Settings, label: 'Configurações', path: '/apps/admin/settings' },
    { icon: Icons.Activity, label: 'Monitor', path: '/apps/monitoring' },
  ];

  const isAdminActive = (path) => {
    if (path === '/apps/users/list') return pathname.startsWith('/apps/users');
    if (path === '/apps/documents/list-view') return pathname.startsWith('/apps/documents');
    if (path === '/apps/admin/settings') return pathname.startsWith('/apps/admin/settings');
    if (path === '/apps/monitoring') return pathname.startsWith('/apps/monitoring');
    return pathname === path;
  };

  return (
    <nav className="fmapp-sidebar">
      <SimpleBar className="nicescroll-bar">
        <div className="menu-content-wrap">
          <div className="menu-group">
            <ul className="nav nav-light navbar-nav flex-column">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isAdminActive(item.path);
                return (
                  <li key={item.path} className={classNames('nav-item', { active })}>
                    <a
                      className={classNames('nav-link', { active })}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(item.path);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="nav-icon-wrap">
                        <span className="feather-icon"><Icon size={18} /></span>
                      </span>
                      <span className="nav-link-text">{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="separator separator-light my-3" />

          <div className="menu-group">
            <p className="menu-title text-muted mb-2">Documentos</p>
            <ul className="nav nav-light navbar-nav flex-column">
              {[
                { filter: 'all', label: 'Todos os Documentos', Icon: Icons.FileText },
                { filter: 'recent', label: 'Recentes', Icon: Icons.Clock },
                { filter: 'favorites', label: 'Favoritos', Icon: Icons.Star },
                { filter: 'shared', label: 'Compartilhados', Icon: Icons.Users },
              ].map(({ filter, label, Icon }) => (
                <li key={filter} className={classNames('nav-item', { active: isActive(filter) })}>
                  <a
                    href="#"
                    className={classNames('nav-link', { active: isActive(filter) })}
                    onClick={(e) => {
                      e.preventDefault();
                      handleFilter(filter);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="nav-icon-wrap">
                      <span className="feather-icon"><Icon size={16} /></span>
                    </span>
                    <span className="nav-link-text">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </SimpleBar>
    </nav>
  );
};

export default DocumentsSidebar;
