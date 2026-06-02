import Link from 'next/link';
import { Button, Dropdown } from 'react-bootstrap';
import classNames from 'classnames';
import { Archive, ChevronDown, ChevronUp, Grid, List, RefreshCw, Settings, Target, TrendingUp, FileText, Award } from 'react-feather';
import { usePathname } from 'next/navigation';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';

const OpportunityAppHeader = ({ toggleSidebar, show, onRefresh, onShowCreateModal }) => {
    const { states, dispatch } = useGlobalStateContext();
    const pathName = usePathname();
    const opportunityListRoute = pathName.match("/apps/opportunities/list");

    return (
        <header className="contact-header">
            <div className="d-flex align-items-center">
                <Dropdown>
                    <Dropdown.Toggle as="a" className="contactapp-title link-dark" href="#" >
                        <h1>Oportunidades</h1>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item>
                            <span className="feather-icon dropdown-icon">
                                <List />
                            </span>
                            <span>Todas Oportunidades</span>
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <span className="feather-icon dropdown-icon">
                                <Target />
                            </span>
                            <span>Prospecção</span>
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <span className="feather-icon dropdown-icon">
                                <TrendingUp />
                            </span>
                            <span>Qualificação</span>
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <span className="feather-icon dropdown-icon">
                                <FileText />
                            </span>
                            <span>Proposta</span>
                        </Dropdown.Item>
                        <Dropdown.Item>
                            <span className="feather-icon dropdown-icon">
                                <Award />
                            </span>
                            <span>Ganhas</span>
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Dropdown className="ms-3">
                    <Dropdown.Toggle size="sm" variant="outline-secondary" className="flex-shrink-0 d-lg-inline-block d-none">Criar Novo</Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={onShowCreateModal}>Nova Oportunidade</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            <div className="contact-options-wrap">
                <Dropdown className="inline-block" >
                    <Dropdown.Toggle as="a" href="#" className="btn btn-icon btn-flush-dark flush-soft-hover no-caret active">
                        <span className="icon">
                            <span className="feather-icon">
                                {opportunityListRoute ? <List /> : <Grid />}
                            </span>
                        </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item as={Link} href="/apps/opportunities/list" className={classNames({ "active": opportunityListRoute })} >
                            <span className="feather-icon dropdown-icon">
                                <List />
                            </span>
                            <span>Lista</span>
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Button 
                    as="a" 
                    variant="flush-dark" 
                    className="btn-icon btn-rounded flush-soft-hover no-caret d-sm-inline-block d-none" 
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        onRefresh();
                    }}
                >
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
                        <HkTooltip placement={states.layoutState.topNavCollapse ? "bottom" : "top"} title="Gerenciar Oportunidades">
                            <span className="icon">
                                <span className="feather-icon">
                                    <Settings />
                                </span>
                            </span>
                        </HkTooltip>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item>Gerenciar Oportunidades</Dropdown.Item>
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

export default OpportunityAppHeader;

