import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Form, Nav } from 'react-bootstrap';
import { 
  Archive, 
  Book, 
  Briefcase, 
  CheckSquare, 
  Clock, 
  Cpu, 
  DollarSign, 
  Heart, 
  MessageSquare, 
  Settings, 
  TrendingUp, 
  Users 
} from 'react-feather';
import SimpleBar from 'simplebar-react';
import HkTooltip from '@/components/@hk-tooltip/HkTooltip';

/**
 * Sidebar de navegação dos assistentes
 */
const AssistantsSidebar = () => {
  const pathName = usePathname();

  return (
    <nav className="integrationsapp-sidebar">
      <SimpleBar className="nicescroll-bar">
        <div className="menu-content-wrap">
          <Form className="mb-4" role="search">
            <Form.Control type="text" placeholder="Buscar assistente..." />
          </Form>
          
          <div className="menu-group">
            <Nav as="ul" className="nav-light navbar-nav flex-column">
              <Nav.Item as="li">
                <Nav.Link 
                  as={Link} 
                  href="/apps/assistants" 
                  className={pathName === "/apps/assistants" ? "active" : ""}
                >
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <Cpu />
                    </span>
                  </span>
                  <span className="nav-link-text">Assistentes</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as="li">
                <Nav.Link>
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <MessageSquare />
                    </span>
                  </span>
                  <span className="nav-link-text">Conversas</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as="li">
                <Nav.Link>
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <Clock />
                    </span>
                  </span>
                  <span className="nav-link-text">Histórico</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          <div className="menu-gap" />
          <div className="nav-header">
            <span>Categorias</span>
          </div>

          <div className="menu-group">
            <Nav as="ul" className="nav-light navbar-nav flex-column">
              <Nav.Item as="li">
                <Nav.Link>
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <DollarSign />
                    </span>
                  </span>
                  <span className="nav-link-text">Financeiro</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as="li">
                <Nav.Link>
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <CheckSquare />
                    </span>
                  </span>
                  <span className="nav-link-text">Legal & TSE</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as="li">
                <Nav.Link>
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <Users />
                    </span>
                  </span>
                  <span className="nav-link-text">Suporte</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as="li">
                <Nav.Link>
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <TrendingUp />
                    </span>
                  </span>
                  <span className="nav-link-text">Marketing</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item as="li">
                <Nav.Link>
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <Briefcase />
                    </span>
                  </span>
                  <span className="nav-link-text">Analytics</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          <div className="menu-gap" />
          <div className="nav-header">
            <span>Favoritos</span>
          </div>

          <div className="menu-group">
            <Nav as="ul" className="nav-light navbar-nav flex-column">
              <Nav.Item as="li">
                <Nav.Link>
                  <span className="nav-icon-wrap">
                    <span className="feather-icon">
                      <Heart />
                    </span>
                  </span>
                  <span className="nav-link-text">Mais Usados</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>
        </div>
      </SimpleBar>

      {/* Sidebar Fixnav */}
      <div className="integrationsapp-fixednav">
        <div className="hk-toolbar">
          <Nav as="ul" className="nav-light">
            <Nav.Item className="nav-link">
              <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                <HkTooltip id="tooltip2" placement="top" title="Configurações">
                  <span className="icon">
                    <span className="feather-icon">
                      <Settings />
                    </span>
                  </span>
                </HkTooltip>
              </Button>
            </Nav.Item>
            <Nav.Item className="nav-link">
              <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                <HkTooltip id="tooltip3" placement="top" title="Arquivados">
                  <span className="icon">
                    <span className="feather-icon">
                      <Archive />
                    </span>
                  </span>
                </HkTooltip>
              </Button>
            </Nav.Item>
            <Nav.Item className="nav-link">
              <Button variant="flush-dark" className="btn-icon btn-rounded flush-soft-hover">
                <HkTooltip id="tooltip4" placement="top" title="Ajuda">
                  <span className="icon">
                    <span className="feather-icon">
                      <Book />
                    </span>
                  </span>
                </HkTooltip>
              </Button>
            </Nav.Item>
          </Nav>
        </div>
      </div>
    </nav>
  );
};

export default AssistantsSidebar;
