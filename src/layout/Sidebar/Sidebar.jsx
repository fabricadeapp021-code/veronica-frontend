/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useState } from 'react';
import { Button, Card, Nav, NavLink } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import SidebarHeader from './SidebarHeader';
import { SidebarMenu } from './SidebarMenu';
import classNames from 'classnames';
import Link from 'next/link';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

const Sidebar = () => {
    const { dispatch } = useGlobalStateContext();
    const [activeMenu, setActiveMenu] = useState();
    const [activeSubMenu, setActiveSubMenu] = useState();
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    // Hook de permissões
    const { hasPermission, isOwnerOrAdmin } = usePermissions();

    useEffect(() => {
        require("bootstrap/js/dist/collapse");
        setMounted(true);
    }, []);

    useEffect(() => {
        if (pathname?.startsWith('/apps/campaigns')) {
            setActiveMenu('Campanhas');
        }
    }, [pathname]);

    const handleClick = (menuName) => {
        setActiveMenu(menuName);
    }

    // Antes de montar no client, renderiza o menu completo (igual ao server)
    // para evitar mismatch de hydration. Após montar, filtra por permissões.
    const filteredMenu = !mounted
        ? SidebarMenu
        : SidebarMenu
            .map(group => ({
                ...group,
                contents: group.contents.filter(item => {
                    if (!item.permission) return true;
                    if (isOwnerOrAdmin) return true;
                    return hasPermission(item.permission.module, item.permission.action);
                })
            }))
            .filter(group => group.contents.length > 0);

    return (
        <>
            <style>{`
                .hk-menu .navbar-nav .nav-link{gap:0.5rem;transition:all .15s ease}
                .hk-menu .navbar-nav .nav-link .badge{flex-shrink:0;white-space:nowrap;font-size:0.52rem;padding:0.15rem 0.3rem;line-height:1.2}
                .hk-menu .nav-header{color:#64748b !important;text-transform:uppercase !important;letter-spacing:0.05em !important;font-size:0.7rem !important}
                .hk-menu .navbar-nav .nav-link:hover{background-color:#f1f5f9 !important;color:#334155 !important;border-radius:0.5rem}
                .hk-menu .navbar-nav .nav-item.active>.nav-link,
                .hk-menu .navbar-nav .nav-link.active{background-color:#f0fdf4 !important;color:var(--bs-primary,#22c55e) !important;border-radius:0.5rem !important;border-left:3px solid var(--bs-primary,#22c55e) !important}
                .hk-menu .navbar-nav .nav-item.active>.nav-link>*,
                .hk-menu .navbar-nav .nav-link.active>*{color:var(--bs-primary,#22c55e) !important}
                .hk-menu .navbar-nav .nav-item.active>.nav-link .svg-icon svg,
                .hk-menu .navbar-nav .nav-link.active .svg-icon svg{stroke:var(--bs-primary,#22c55e) !important}
            `}</style>
            <div
                className="hk-menu"
                onMouseEnter={() => setIsSidebarHovered(true)}
                onMouseLeave={() => setIsSidebarHovered(false)}
            >
                {/* Brand */}
                <SidebarHeader isSidebarHovered={isSidebarHovered} />
                {/* Main Menu */}
                <SimpleBar className="nicescroll-bar">
                    <div className="menu-content-wrap">
                        {filteredMenu.map((routes, index) => (
                            <React.Fragment key={index}>
                                <div className="menu-group" >
                                    {routes.group && <div className="nav-header" >
                                        <span>{routes.group}</span>
                                    </div>}
                                    {routes.contents.map((menus, idx) => {
                                        const activePathPrefix = menus.activePathPrefix || menus.path;
                                        const isActive = pathname.startsWith(activePathPrefix);
                                        return (
                                        <Nav bsPrefix="navbar-nav" className="flex-column" key={idx}>
                                            <Nav.Item className={classNames({ "active": isActive })}>
                                                {
                                                    menus.childrens
                                                        ?
                                                        <>
                                                            <Nav.Link data-bs-toggle="collapse" data-bs-target={`#${menus.id}`} aria-expanded={activeMenu === menus.name ? "true" : "false"} onClick={() => setActiveMenu(menus.name)} >
                                                                <span className={classNames("nav-icon-wrap", { "position-relative": menus.iconBadge })}>
                                                                    {menus.iconBadge && menus.iconBadge}
                                                                    <span className="svg-icon">
                                                                        {menus.icon}
                                                                    </span>
                                                                </span>
                                                                <span className={classNames("nav-link-text", { "position-relative": menus.badgeIndicator })} >
                                                                    {menus.name}
                                                                    {menus.badgeIndicator && menus.badgeIndicator}
                                                                </span>
                                                                {menus.badge && menus.badge}
                                                            </Nav.Link>

                                                            {/* <Collapse in={open}> */}
                                                            <ul id={menus.id} className={classNames("nav flex-column nav-children", { "collapse": activeMenu !== menus.name })}>
                                                                <li className="nav-item">
                                                                    <ul className="nav flex-column">
                                                                        {menus.childrens.map((subMenu, indx) => (
                                                                            subMenu.childrens
                                                                                ?
                                                                                <li className="nav-item" key={indx} >
                                                                                    <Nav.Link as={Link} href={subMenu.path} className="nav-link" data-bs-toggle="collapse" data-bs-target={`#${subMenu.id}`} aria-expanded={activeSubMenu === subMenu.name ? "true" : "false"} onClick={() => setActiveSubMenu(subMenu.name)}>
                                                                                        <span className="nav-link-text">
                                                                                            {subMenu.name}
                                                                                        </span>
                                                                                    </Nav.Link>

                                                                                    {subMenu.childrens.map((childrenPath, i) => (
                                                                                        <ul id={subMenu.id} className={classNames("nav flex-column nav-children", { "collapse": activeSubMenu !== subMenu.name })} key={i}>
                                                                                            <li className="nav-item">
                                                                                                <ul className="nav flex-column">
                                                                                                    <li className="nav-item">
                                                                                                        <Link href={childrenPath.path} onClick={handleClick} className={classNames("nav-link", { "active": pathname === childrenPath.path })}>
                                                                                                            <span className="nav-link-text">
                                                                                                                {childrenPath.name}
                                                                                                            </span>
                                                                                                        </Link>
                                                                                                    </li>
                                                                                                </ul>
                                                                                            </li>
                                                                                        </ul>
                                                                                    ))}

                                                                                </li>
                                                                                :
                                                                                <li className="nav-item" key={indx}>
                                                                                    <Link href={subMenu.path} onClick={handleClick} className={classNames("nav-link", { "active": pathname === subMenu.path })}>
                                                                                        <span className="nav-link-text">
                                                                                            {subMenu.name}
                                                                                        </span>
                                                                                    </Link>
                                                                                </li>
                                                                        ))}
                                                                    </ul>
                                                                </li>
                                                            </ul>
                                                            {/* </Collapse> */}

                                                        </>
                                                        :
                                                        <>
                                                            {
                                                                (routes.group === "Documentation")
                                                                    ?
                                                                    <a className="nav-link" href={menus.path} target="_blank" rel="noreferrer" >
                                                                        <span className="nav-icon-wrap">
                                                                            <span className="svg-icon">
                                                                                {menus.icon}
                                                                            </span>
                                                                        </span>
                                                                        <span className="nav-link-text">{menus.name}</span>
                                                                        {menus.badge && menus.badge}
                                                                    </a>
                                                                    :
                                                                    <Link href={menus.path} onClick={() => handleClick(menus.name)} className={classNames("nav-link", { "active": isActive })} >
                                                                        <span className="nav-icon-wrap">
                                                                            <span className="svg-icon">
                                                                                {menus.icon}
                                                                            </span>
                                                                        </span>
                                                                        <span className="nav-link-text">{menus.name}</span>
                                                                        {menus.badge && menus.badge}
                                                                    </Link>
                                                            }
                                                        </>
                                                }
                                            </Nav.Item>
                                        </Nav>
                                    );
                                    })}
                                </div>
                                <div className="menu-gap" />
                            </React.Fragment>
                        ))}

                        {/* <Card bg="orange-light-5" className="callout card-flush  text-center w-220p mx-auto">
                            <Card.Body>
                                <h5 className="h5">Construa sua Campanha</h5>
                                <Card.Text className="p-sm">Criamos fluxos personalizados para seu time. Plataforma completa para gestão eleitoral com IA.</Card.Text>
                                <Button variant="primary" href="https://governai.com.br" target="_blank" rel="noreferrer" className="btn-block">Saiba Mais</Button>
                            </Card.Body>
                        </Card> */}
                    </div>
                </SimpleBar>
                {/* /Main Menu */}
            </div >
            <div onClick={() => dispatch({ type: 'sidebar_toggle' })} className="hk-menu-backdrop" />
        </>
    )
}



export default Sidebar;
