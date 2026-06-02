'use client';

import React from 'react';
import { Nav } from 'react-bootstrap';
import { Image, Menu } from 'react-feather';

const ImageGeneratorHeader = ({ toggleSidebar }) => {
  return (
    <header className="contact-header">
      <div className="d-flex align-items-center">
        <Nav.Link
          className="contactapp-sidebar-toggle"
          href="#"
          onClick={toggleSidebar}
        >
          <span className="feather-icon text-primary">
            <Menu size={18} />
          </span>
        </Nav.Link>
        <div className="ms-3 d-flex align-items-center gap-3">
          <div className="avatar avatar-sm avatar-soft-success avatar-rounded">
            <span className="initial-wrap">
              <Image size={15} />
            </span>
          </div>
          <div>
            <h5 className="mb-0">Gerador de Imagens</h5>
            <div className="small text-muted">Crie imagens profissionais com IA, descreva e gere</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ImageGeneratorHeader;
