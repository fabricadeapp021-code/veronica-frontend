import Link from 'next/link';
import { Nav } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { Speakerphone, Target, CurrencyDollar } from 'tabler-icons-react';

const LeadAppSidebar = () => {
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
            label: 'Gestão Financeira',
            path: '/apps/opportunities/list',
            activePrefix: '/apps/opportunities',
            icon: CurrencyDollar,
        },
    ];

    return (
        <>
            <Nav className="contactapp-sidebar" style={{ background: 'var(--bs-secondary-bg)', borderRight: '1px solid var(--bs-border-color)' }}>
                <SimpleBar className="nicescroll-bar">
                    <div className="menu-content-wrap">
                        <style>{`
                            .lead-sidenav .nav-link {
                                color: var(--bs-secondary-color);
                                display: flex;
                                align-items: center;
                                gap: 10px;
                                padding: 8px 14px;
                                border-radius: 8px;
                                font-weight: 500;
                                transition: all .15s;
                            }
                            .lead-sidenav .nav-link:hover {
                                color: var(--bs-body-color);
                                background: var(--bs-tertiary-bg);
                            }
                            .lead-sidenav .nav-link.active {
                                color: var(--bs-primary);
                                background: var(--bs-primary-bg-subtle);
                            }
                        `}</style>
                        <div className="menu-group lead-sidenav">
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

export default LeadAppSidebar

