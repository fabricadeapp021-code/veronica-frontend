import Link from 'next/link';
import { Nav } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { Speakerphone, Target, CurrencyDollar, Cpu } from 'tabler-icons-react';
const CampaignAppSidebar = () => {
    const pathname = usePathname();
    const primaryMenu = [
        {
            label: 'Campanhas',
            path: '/apps/campaigns/list',
            activePrefix: '/apps/campaigns',
            icon: Speakerphone,
        },
        {
            label: 'Leads',
            path: '/apps/leads/list',
            activePrefix: '/apps/leads',
            icon: Target,
        },
        {
            label: 'Oportunidades',
            path: '/apps/opportunities/list',
            activePrefix: '/apps/opportunities',
            icon: CurrencyDollar,
        },
        {
            label: 'Assistentes',
            path: '/apps/assistants',
            activePrefix: '/apps/assistants',
            icon: Cpu,
        },
    ];

    return (
        <>
            <Nav className="contactapp-sidebar" style={{ background: 'var(--bs-secondary-bg)', borderRight: '1px solid var(--bs-border-color)' }}>
                <SimpleBar className="nicescroll-bar">
                    <div className="menu-content-wrap">
                        <style>{`
                            .campaign-sidenav .nav-link {
                                color: var(--bs-secondary-color);
                                display: flex;
                                align-items: center;
                                gap: 10px;
                                padding: 8px 14px;
                                border-radius: 8px;
                                font-weight: 500;
                                transition: all .15s;
                            }
                            .campaign-sidenav .nav-link:hover {
                                color: var(--bs-body-color);
                                background: var(--bs-tertiary-bg);
                            }
                            .campaign-sidenav .nav-link.active {
                                color: var(--bs-primary);
                                background: var(--bs-primary-bg-subtle);
                            }
                        `}</style>
                        <div className="menu-group campaign-sidenav">
                            {primaryMenu.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname?.startsWith(item.activePrefix);
                                return (
                                    <Nav.Item key={item.path}>
                                        <Nav.Link
                                            as={Link}
                                            href={item.path}
                                            className={classNames({ active: isActive })}
                                        >
                                            <Icon size={18} />
                                            <span>{item.label}</span>
                                        </Nav.Link>
                                    </Nav.Item>
                                );
                            })}
                        </div>
                    </div>
                </SimpleBar>
            </Nav>
        </>
    )
}

export default CampaignAppSidebar
