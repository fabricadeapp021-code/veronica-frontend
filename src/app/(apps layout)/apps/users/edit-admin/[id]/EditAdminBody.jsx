'use client';
import CreateAdminBody from '../../create-admin/CreateAdminBody';

const EditAdminBody = ({ adminId }) => {
  return <CreateAdminBody mode="edit" adminId={adminId} />;
};

export default EditAdminBody;
