'use client';

import Link from 'next/link';
import { Nav } from 'react-bootstrap';
import classNames from 'classnames';
import { User, Image, Video, Music, Share2 } from 'react-feather';
import { usePathname } from 'next/navigation';

const items = [
    { href: '/apps/studio/avatar-generator', label: 'Gerador de Avatares', icon: User },
    { href: '/apps/studio/image-generator', label: 'Gerador de Imagens', icon: Image },
    { href: '/apps/studio/video-generator', label: 'Gerador de Videos', icon: Video },
    { href: '/apps/studio/jingle-generator', label: 'Gerador de Jingles', icon: Music },
    { href: '/apps/studio/social-post-generator', label: 'Posts e Banners', icon: Share2 },
];

const activeLinkStyle = {
    backgroundColor: '#d5ebee',
    color: '#0a8b98',
    borderRadius: '8px',
};

const StudioSidebarTopNav = ({ variant = 'contact' }) => {
    const pathname = usePathname();

    return (
        <div className="menu-group">
            <p className="navbar-text text-uppercase text-muted mb-2">Studio</p>
            {variant === 'fmapp' ? (
                <Nav className="nav nav-light">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Nav.Item key={item.href}>
                                <Nav.Link
                                    as={Link}
                                    href={item.href}
                                    className={classNames('nav-link', { active: isActive })}
                                    style={isActive ? activeLinkStyle : undefined}
                                >
                                    <span className="nav-icon">
                                        <Icon size={16} />
                                    </span>
                                    <span className="nav-link-text">{item.label}</span>
                                </Nav.Link>
                            </Nav.Item>
                        );
                    })}
                </Nav>
            ) : (
                <ul className="nav nav-light navbar-nav flex-column">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <li className="nav-item" key={item.href}>
                                <Nav.Link
                                    as={Link}
                                    href={item.href}
                                    className={classNames({ active: isActive })}
                                    style={isActive ? activeLinkStyle : undefined}
                                >
                                    <span className="nav-icon-wrap">
                                        <Icon size={16} />
                                    </span>
                                    <span className="nav-link-text">{item.label}</span>
                                </Nav.Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default StudioSidebarTopNav;
