'use client'
import { useState, useRef, useCallback } from 'react';
import DocumentsHeader from '../DocumentsHeader';
import DocumentsList from '../DocumentsList';
import DocumentsSidebar from '../DocumentsSidebar';
import DocumentInfo from '../DocumentInfo';
import UploadModal from '../UploadModal';
import classNames from 'classnames';

const DocumentsListView = () => {
    const [showInfo, setShowInfo] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');
    const [currentFolderCategory, setCurrentFolderCategory] = useState(null);
    const documentsListRef = useRef(null);

    const handleDocumentSelect = (document) => {
        setSelectedDocument(document);
        setShowInfo(true);
    };

    const handleUploadSuccess = () => {
        if (documentsListRef.current?.reload) {
            documentsListRef.current.reload();
        }
    };

    const handleSearch = useCallback((query) => {
        if (documentsListRef.current?.search) {
            documentsListRef.current.search(query);
        }
    }, []);

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setShowInfo(false);
        setSelectedDocument(null);
        setCurrentFolderCategory(null);
    };

    const handleFolderChange = useCallback((categoryId) => {
        setCurrentFolderCategory(categoryId);
    }, []);

    return (
        <div className="hk-pg-body py-0">
            <div className={classNames("fmapp-wrap", { "fmapp-sidebar-toggle": !showSidebar }, { "fmapp-info-active": showInfo })}>
                <DocumentsSidebar
                    onUploadClick={() => setShowUploadModal(true)}
                    activeFilter={activeFilter}
                    onFilterChange={handleFilterChange}
                />
                <div className="fmapp-content">
                    <div className="fmapp-detail-wrap">
                        <DocumentsHeader
                            toggleSidebar={() => setShowSidebar(!showSidebar)}
                            onUploadClick={() => setShowUploadModal(true)}
                            onSearch={handleSearch}
                        />
                        <DocumentsList
                            ref={documentsListRef}
                            toggleInfo={() => setShowInfo(true)}
                            onDocumentSelect={handleDocumentSelect}
                            activeFilter={activeFilter}
                            onFolderChange={handleFolderChange}
                        />
                        <DocumentInfo
                            document={selectedDocument}
                            onHide={() => setShowInfo(false)}
                            onDocumentDeleted={handleUploadSuccess}
                        />
                    </div>
                </div>
            </div>

            <UploadModal
                show={showUploadModal}
                onHide={() => setShowUploadModal(false)}
                onUploadSuccess={handleUploadSuccess}
                initialCategory={currentFolderCategory}
            />
        </div>
    );
}

export default DocumentsListView
