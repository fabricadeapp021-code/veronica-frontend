import Link from 'next/link';
import { Button, Dropdown } from 'react-bootstrap';
import classNames from 'classnames';
import { Archive, ChevronDown, ChevronUp, Edit, ExternalLink, Grid, List, MoreVertical, RefreshCw, Server, Settings, Slash, Star, Trash2, CheckCircle, XCircle, Circle, Phone, MessageSquare } from 'react-feather';
import { usePathname } from 'next/navigation';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';

const CampaignAppHeader = ({ toggleSidebar, show }) => {
    const { states, dispatch } = useGlobalStateContext();
    const pathName = usePathname();
    const campaignListRoute = pathName.match("/apps/campaigns/list");

    return (
        <header className="contact-header">
            <div className="d-flex align-items-center">
                <div className="contactapp-title link-dark">
                    <h1>Campanhas</h1>
                </div>
                <Dropdown className="ms-3">
                    <Dropdown.Toggle size="sm" variant="success" className="flex-shrink-0 d-lg-inline-block d-none">Criar Nova</Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item as={Link} href="/apps/campaigns/create?type=voice">
                            <span className="feather-icon dropdown-icon">
                                <Phone />
                            </span>
                            <span>Campanha de Voz</span>
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} href="/apps/campaigns/create?type=whatsapp">
                            <span className="feather-icon dropdown-icon">
                                <MessageSquare />
                            </span>
                            <span>Campanha de WhatsApp</span>
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            <div className="contact-options-wrap">
                <Dropdown className="inline-block" >
                    <Dropdown.Toggle as="a" href="#" className="btn btn-icon btn-flush-dark flush-soft-hover no-caret active">
                        <span className="icon">
                            <span className="feather-icon">
                                {campaignListRoute ? <List /> : <Grid />}
                            </span>
                        </span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item as={Link} href="/apps/campaigns/list" className={classNames({ "active": campaignListRoute })} >
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
                        <HkTooltip placement={states.layoutState.topNavCollapse ? "bottom" : "top"} title="Gerenciar Campanhas">
                            <span className="icon">
                                <span className="feather-icon">
                                    <Settings />
                                </span>
                            </span>
                        </HkTooltip>
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end">
                        <Dropdown.Item>Gerenciar Campanhas</Dropdown.Item>
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

export default CampaignAppHeader;

