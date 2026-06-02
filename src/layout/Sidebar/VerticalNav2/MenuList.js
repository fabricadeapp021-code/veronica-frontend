import * as Icons from 'tabler-icons-react';
import { nanoid } from 'nanoid';

export const DashboardMenu = [
    {
        id: nanoid(),
        title: 'ADMIN',
        grouptitle: true,
    },
    {
        id: nanoid(),
        title: 'Funcionários IA',
        icon: <Icons.Robot />,
        link: '/apps/agents',
    },
    {
        id: nanoid(),
        title: 'Usuários',
        icon: <Icons.Users />,
        link: '/apps/users/list',
    },
    {
        id: nanoid(),
        title: 'Documentos',
        icon: <Icons.FileText />,
        link: '/apps/documents/list-view',
    },
    {
        id: nanoid(),
        title: 'Perfil da empresa',
        icon: <Icons.BuildingStore />,
        link: '/apps/admin/settings',
    },
    {
        id: nanoid(),
        title: 'Monitor',
        icon: <Icons.Activity />,
        link: '/apps/monitoring',
    },
    {
        id: nanoid(),
        title: 'Suporte',
        icon: <Icons.Headset />,
        link: '/apps/support',
    },
    {
        id: nanoid(),
        title: 'Planos & Créditos',
        icon: <Icons.CreditCard />,
        link: '/apps/billing',
    },
];
