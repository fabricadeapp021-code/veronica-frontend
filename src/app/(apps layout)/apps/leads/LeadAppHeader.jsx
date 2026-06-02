'use client';
import Link from 'next/link';
import { Button, Dropdown } from 'react-bootstrap';
import classNames from 'classnames';
import { ChevronDown, ChevronUp, Grid, List, Plus, RefreshCw, Settings } from 'react-feather';
import { usePathname } from 'next/navigation';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';
import { useAuth } from '@/lib/auth/AuthProvider';

const LeadAppHeader = ({ toggleSidebar, show }) => {
    const { states, dispatch } = useGlobalStateContext();
    const { user } = useAuth();
    const pathName = usePathname();
    const leadListRoute = pathName.match("/apps/leads/list");
    const isExternal = user?.role === 'external';

    return (
        <header className="contact-header">
            <div className="d-flex align-items-center">
                <div className="contactapp-title link-dark">
                    <h1>Leads</h1>
                </div>
                {!isExternal && (
                    <Button as={Link} href="/apps/leads/create" size="sm" variant="success" className="ms-3 flex-shrink-0 d-lg-inline-flex d-none align-items-center">
                        <Plus size={16} className="me-1" />
                        Criar Novo
                    </Button>
                )}
            </div>
            <div className="contact-options-wrap">
                <Dropdown className="inline-block" >
                    <Dropdown.Toggle as="a" href="#" className="btn btn-icon btn-flush-dark flush-soft-hover no-caret active">
                        <span className="icon">
                            <span className="feather-icon">
                                {leadListRoute ? <List /> : <Grid />}
                            </span>
                        </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item as={Link} href="/apps/leads/list" className={classNames({ "active": leadListRoute })} >
                            <span className="feather-icon dropdown-icon">
                                <List />
                            </span>
                            <span>Lista</span>
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Button as="a" variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover no-caret d-sm-inline-block d-none" href="#">
                    <HkTooltip title="Refresh" placement={states.layoutState.topNavCollapse ? "bottom" : "top"} >
                        <span className="icon">
                            <span className="feather-icon">
                                <RefreshCw />
                            </span>
                        </span>
                    </HkTooltip>
                </Button>
                <div className="v-separator d-lg-block d-none" />
                <Dropdown className="inline-block" >
                    <Dropdown.Toggle as="a" href="#" className="btn btn-flush-dark btn-icon btn-rounded flush-soft-hover no-caret d-lg-inline-block d-none ms-sm-0">
                        <HkTooltip placement={states.layoutState.topNavCollapse ? "bottom" : "top"} title="Gerenciar Leads">
                            <span className="icon">
                                <span className="feather-icon">
                                    <Settings />
                                </span>
                            </span>
                        </HkTooltip>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item>Gerenciar Leads</Dropdown.Item>
                        <Dropdown.Item>Importar</Dropdown.Item>
                        <Dropdown.Item>Exportar</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Button as="a" href="#" className="btn-icon btn-flush-dark btn-rounded flush-soft-hover hk-navbar-togglable d-sm-inline-block d-none" onClick={() => dispatch({ type: 'top_nav_toggle' })} >
                    <HkTooltip placement={states.layoutState.topNavCollapse ? "bottom" : "top"} title="Collapse" >
                        <span className="icon">
                            <span className="feather-icon">
                                {
                                    states.layoutState.topNavCollapse ? <ChevronDown /> : <ChevronUp />
                                }
                            </span>
                        </span>
                    </HkTooltip>
                </Button>
            </div>
            <div className={classNames("hk-sidebar-togglable", { "active": show })} onClick={toggleSidebar} />
        </header>
    )
}

export default LeadAppHeader;

