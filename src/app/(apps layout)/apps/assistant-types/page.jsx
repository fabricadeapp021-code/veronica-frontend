'use client'
import { useState, useRef } from 'react';
import classNames from 'classnames';
import AssistantTypesHeader from './AssistantTypesHeader';
import AssistantTypesSidebar from './AssistantTypesSidebar';
import AssistantTypesList from './AssistantTypesList';
import CreateEditAssistantTypeModal from './CreateEditAssistantTypeModal';

const AssistantTypesPage = () => {
    const [showSidebar, setShowSidebar] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const listRef = useRef(null);

    // Abrir modal para novo tipo
    const handleNewType = () => {
        setEditingType(null);
        setShowModal(true);
    };

    // Abrir modal para editar tipo
    const handleEditType = (type) => {
        setEditingType(type);
        setShowModal(true);
    };

    // Callback de sucesso ao criar/editar
    const handleModalSuccess = (savedType) => {
        console.log('✅ Tipo salvo com sucesso:', savedType);
        
        // Recarregar lista
        if (listRef.current && listRef.current.reload) {
            listRef.current.reload();
        }
    };

    // Fechar modal
    const handleModalClose = () => {
        setShowModal(false);
        setEditingType(null);
    };

    // Buscar tipos
    const handleSearch = (query) => {
        if (listRef.current && listRef.current.search) {
            listRef.current.search(query);
        }
    };

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("fmapp-wrap", { "fmapp-sidebar-toggle": !showSidebar })}>
                {/* Sidebar */}
                <AssistantTypesSidebar onNewType={handleNewType} />
                
                {/* Main Content */}
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        {/* Header */}
                        <AssistantTypesHeader 
                            onNewType={handleNewType}
                            onSearch={handleSearch}
                            showSidebar={showSidebar}
                            toggleSidebar={() => setShowSidebar(!showSidebar)}
                        />
                        
                        {/* Lista */}
                        <AssistantTypesList 
                            ref={listRef}
                            onEditClick={handleEditType}
                        />
                    </div>
                </div>
            </div>

            {/* Modal Criar/Editar */}
            <CreateEditAssistantTypeModal
                show={showModal}
                onHide={handleModalClose}
                onSuccess={handleModalSuccess}
                editData={editingType}
            />
        </div>
    );
};

export default AssistantTypesPage;

