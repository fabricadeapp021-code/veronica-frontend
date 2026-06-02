import { useState, useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';
import { Menu, UploadCloud } from 'react-feather';

const DocumentsHeader = ({ toggleSidebar, onUploadClick, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (onSearch) onSearch(searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, onSearch]);

  return (
    <header className="fm-header">
      <div className="d-flex align-items-center gap-3 flex-grow-1">
        <Button
          variant="flush-dark"
          className="btn-icon btn-rounded flush-soft-hover d-xl-none d-inline-flex"
          onClick={toggleSidebar}
        >
          <span className="icon">
            <span className="feather-icon">
              <Menu />
            </span>
          </span>
        </Button>

        <div className="fmapp-title">
          <h1 className="mb-0">Documentos</h1>
        </div>

        <Form className="mx-2 flex-grow-1 mw-400p" role="search" onSubmit={(e) => e.preventDefault()}>
          <Form.Control
            type="text"
            placeholder="Buscar por nome, descrição ou tag"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Form>
      </div>

      <div className="fm-options-wrap">
        <Button variant="primary" className="d-inline-flex align-items-center" onClick={onUploadClick}>
          <UploadCloud size={16} className="me-2" />
          Novo Documento
        </Button>
      </div>
    </header>
  );
};

export default DocumentsHeader;
