'use client';
import AdminSidebar from '../AdminSidebar';
import UsersAppBody from './UsersAppBody';

export default function UsersList() {
  return (
    <div className="hk-pg-body py-0">
      <div className="fmapp-wrap">
        <AdminSidebar />
        <div className="fmapp-content">
          <div className="fmapp-detail-wrap">
            <UsersAppBody />
          </div>
        </div>
      </div>
    </div>
  );
}
