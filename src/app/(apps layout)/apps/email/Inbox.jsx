import Image from 'next/image';
import { useState } from 'react';
import { Badge, Button, Dropdown, Form, ListGroup } from 'react-bootstrap';
import SimpleBar from 'simplebar-react';
import classNames from 'classnames';
import { useWindowWidth } from '@react-hook/window-size';
import { Archive, Calendar, Check, Edit, Inbox, Layout, Mail, RefreshCw, Send, Settings, Star, Trash2 } from 'react-feather';
import { useGlobalStateContext } from '@/context/GolobalStateProvider';
import ComposeEmail from './ComposeEmail';

//Images
import avatar2 from '@/assets/img/avatar2.jpg';
import avatar3 from '@/assets/img/avatar3.jpg';
import avatar7 from '@/assets/img/avatar7.jpg';
import avatar8 from '@/assets/img/avatar8.jpg';
import avatar9 from '@/assets/img/avatar9.jpg';
import avatar10 from '@/assets/img/avatar10.jpg';

const InboxList = ({ show, toggleSidebar }) => {
    const { states, dispatch } = useGlobalStateContext();
    const [showComposePopup, setShowComposePopup] = useState(false);

    const width = useWindowWidth();
    const Conversation = () => {
        if (width <= 991) {
            dispatch({ type: "open_email" })
            dispatch({ type: "top_nav_toggle" })

        }
    }

    return (
        <>
            <div className="emailapp-aside">
                <header className="aside-header">
                    <Dropdown>
                        <Dropdown.Toggle as="a" className="emailapp-title link-dark" href="#">
                            <h1>Inbox</h1>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item>
                                <span className="feather-icon dropdown-icon">
                                    <Inbox />
                                </span>
                                <span>Inbox</span>
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <span className="feather-icon dropdown-icon">
                                    <Send />
                                </span>
                                <span>Sent</span>
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <span className="feather-icon dropdown-icon">
                                    <Archive />
                                </span>
                                <span>Archive</span>
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <span className="feather-icon dropdown-icon">
                                    <Edit />
                                </span>
                                <span>Draft</span>
                            </Dropdown.Item>
                            <Dropdown.Item>
                                <span className="feather-icon dropdown-icon">
                                    <Trash2 />
                                </span>
                                <span>Trash</span>
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <div className="d-flex">
                        <Button as="a" href="#" className="btn-icon btn-flush-dark btn-rounded flush-soft-hover me-0">
                            <span className="icon">
                                <span className="feather-icon">
                                    <RefreshCw />
                                </span>
                            </span>
                        </Button>
                        <Dropdown>
                            <Dropdown.Toggle as="a" href="#" className="btn btn-icon  btn-rounded flush-soft-hover btn-flush-dark dropdown-toggle no-caret me-1">
                                <span className="icon">
                                    <span className="feather-icon">
                                        <Settings />
                                    </span>
                                </span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end" >
                                <Dropdown.Item>
                                    <span className="feather-icon dropdown-icon">
                                        <Mail />
                                    </span>
                                    <span>Show unread messages</span>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <span className="feather-icon dropdown-icon">
                                        <Star />
                                    </span>
                                    <span>Show Starred Messages</span>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <span className="feather-icon dropdown-icon">
                                        <Calendar />
                                    </span>
                                    <span>Sort by Date</span>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <span className="feather-icon dropdown-icon">
                                        <Layout />
                                    </span>
                                    <span>Sort by Category</span>
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <span className="feather-icon dropdown-icon">
                                        <Check />
                                    </span>
                                    <span>Mark all as read</span></Dropdown.Item>
                                <div className="dropdown-divider" />
                                <Dropdown.Item>Settings</Dropdown.Item>
                                <Dropdown.Item>Help</Dropdown.Item>
                                <Dropdown.Item>Report a problem	</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        <Button as="a" href="#" className="btn-icon btn-rounded show-compose-popup" onClick={() => dispatch({ type: "compose_email", composeEmail: !states.emailState.composeEmail })} >
                            <span className="icon">
                                <span className="feather-icon">
                                    <Edit />
                                </span>
                            </span>
                        </Button>
                    </div>
                    <div className={classNames("hk-sidebar-togglable", { "active": !show })} onClick={toggleSidebar} />
                </header>
                <SimpleBar className="aside-body">
                    <Form className="aside-search" role="search">
                        <Form.Control type="text" placeholder="Buscar mensagens" />
                    </Form>
                    <ListGroup as="ul" variant="flush" className="email-list">
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-rounded">
                                        <Image src={avatar2} alt="user" className="avatar-img" />
                                    </div>
                                    <Badge bg="primary" className="badge-indicator badge-indicator-nobdr" />
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">Carlos Mendes - Coordenador Zona Norte</div>
                                            <div>
                                                <span className="email-star marked">
                                                    <span className="feather-icon">
                                                        <Star />
                                                    </span>
                                                </span>
                                                <div className="email-time">9:30 AM</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Cronograma das carreatas - Zona Norte</div>
                                        <div className="email-text">
                                            <p>Candidato, envio o cronograma atualizado das carreatas na Zona Norte. Precisamos confirmar a presença...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media read-email">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-rounded">
                                        <Image src={avatar9} alt="user" className="avatar-img" />
                                    </div>
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">Ana Paula Silva - Assessoria</div>
                                            <Badge pill bg="warning" className="badge-sm ">campanha</Badge>
                                            <div>
                                                <span className="email-star"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">7:51 AM</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Proposta de conteúdo para redes sociais</div>
                                        <div className="email-text">
                                            <p>Segue proposta de grid para Instagram e Facebook desta semana. Material aprovado pela equipe de design...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media read-email active-user">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-soft-success avatar-rounded">
                                        <span className="initial-wrap">C</span>
                                    </div>
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">Roberto Costa - Financeiro</div>
                                            <div>
                                                <span className="email-star"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">Ontem</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Prestação de contas TSE - Janeiro</div>
                                        <div className="email-text">
                                            <p>Candidato, anexo a prestação de contas de Janeiro para aprovação. Todas as despesas estão categorizadas conforme TSE...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-rounded">
                                        <Image src={avatar10} alt="user" className="avatar-img" />
                                    </div>
                                    <Badge bg="primary" className="badge-indicator badge-indicator-nobdr" />
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">Mariana Santos - Marketing</div>
                                            <div>
                                                <span className="email-star marked"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">24 Jan</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Relatório de Campanhas - Facebook Ads</div>
                                        <div className="email-text">
                                            <p>Candidato, segue relatório semanal das campanhas. Alcançamos 45 mil pessoas com engajamento de 8.5%...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media read-email">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-rounded">
                                        <Image src={avatar3} alt="user" className="avatar-img" />
                                    </div>
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">João Pedro - Designer</div>
                                            <Badge bg="primary" pill className="badge-sm">Equipe</Badge>
                                            <div>
                                                <span className="email-star marked"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">23 Jan</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Novos banners criados com IA - Aprovação</div>
                                        <div className="email-text">
                                            <p>Candidato, criei 5 variações de banners usando o GovernAI Studio. Peço aprovação para publicação nas redes...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media read-email">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-rounded">
                                        <Image src={avatar7} alt="user" className="avatar-img" />
                                    </div>
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">Lucia Fernandes - Apoiadora</div>
                                            <Badge bg="success" pill className="badge-sm">apoiadores</Badge>
                                            <div>
                                                <span className="email-star"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">22 Jan</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Doação e sugestões para a campanha</div>
                                        <div className="email-text">
                                            <p>Olá, candidato! Gostaria de fazer uma doação e também sugerir algumas ações para o bairro Vila Nova...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-soft-danger avatar-rounded">
                                        <span className="initial-wrap">D</span>
                                    </div>
                                    <Badge bg="primary" className="badge-indicator badge-indicator-nobdr" />
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">Diego Almeida - Jurídico</div>
                                            <div>
                                                <span className="email-star"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">20 Jan</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Aprovação de materiais - Conformidade TSE</div>
                                        <div className="email-text">
                                            <p>Candidato, revisei os materiais de campanha e todos estão em conformidade com as normas eleitorais...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media read-email">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-rounded">
                                        <Image src={avatar8} alt="user" className="avatar-img" />
                                    </div>
                                    <Badge bg="primary" className="badge-indicator badge-indicator-nobdr" />
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">Patricia Oliveira - Cidadã</div>
                                            <div>
                                                <span className="email-star marked">
                                                    <span className="feather-icon">
                                                        <Star />
                                                    </span>
                                                </span>
                                                <div className="email-time">18 Jan</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Agradecimento pelo atendimento via WhatsApp</div>
                                        <div className="email-text">
                                            <p>Muito obrigada pelo atendimento rápido! Minha solicitação sobre a creche já foi encaminhada. Conte com meu voto!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                        <ListGroup.Item as="li" onClick={Conversation} >
                            <div className="media read-email">
                                <div className="media-head">
                                    <div className="avatar avatar-sm avatar-success avatar-rounded">
                                        <span className="initial-wrap">H</span>
                                    </div>
                                </div>
                                <div className="media-body">
                                    <div>
                                        <div>
                                            <div className="email-head">GovernAI Suporte</div>
                                            <div>
                                                <span className="email-star marked"><span className="feather-icon"><Star /></span></span>
                                                <div className="email-time">15 Jan</div>
                                            </div>
                                        </div>
                                        <div className="email-subject">Bem-vindo à plataforma GovernAI!</div>
                                        <div className="email-text">
                                            <p>Seja bem-vindo! Sua conta foi ativada com sucesso. Explore todos os módulos: Marketing, Citizen, Studio e Financeiro...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ListGroup.Item>
                    </ListGroup>
                </SimpleBar>
            </div>
            {/* Compose email */}
            <ComposeEmail show={showComposePopup} onClose={() => setShowComposePopup(!showComposePopup)} />
            {/* /Compose email */}
        </>
    )
}


export default InboxList;
