import * as Icons from 'tabler-icons-react';

export const SidebarMenu = [
    {
        group: 'ADMIN',
        contents: [
            {
                id: 'dash_ai_workers',
                name: 'Funcionários IA',
                icon: <Icons.Robot />,
                path: '/apps/agents',
                grp_name: 'admin',
            },
            {
                id: 'dash_users',
                name: 'Usuários',
                icon: <Icons.UserCheck />,
                path: '/apps/users/list',
                grp_name: 'admin',
            },
            {
                id: 'dash_documents',
                name: 'Documentos',
                icon: <Icons.FileText />,
                path: '/apps/documents/list-view',
                grp_name: 'admin',
            },
            {
                id: 'dash_settings',
                name: 'Perfil da empresa',
                icon: <Icons.Settings />,
                path: '/apps/admin/settings',
                grp_name: 'admin',
            },
            {
                id: 'dash_monitoring',
                name: 'Monitor',
                icon: <Icons.Activity />,
                path: '/apps/monitoring',
                grp_name: 'admin',
            },
            {
                id: 'dash_support',
                name: 'Suporte',
                icon: <Icons.MessageCircle />,
                path: '/apps/support',
                grp_name: 'admin',
            },
            {
                id: 'dash_billing_credits',
                name: 'Planos & Créditos',
                icon: <Icons.CreditCard />,
                path: '/apps/billing',
                grp_name: 'admin',
            },
            {
                id: 'dash_ai_config',
                name: 'Chaves de IA',
                icon: <Icons.Key />,
                path: '/apps/settings/ai-config',
                activePathPrefix: '/apps/settings/ai-config',
                grp_name: 'admin',
            },
        ],
    },
];
