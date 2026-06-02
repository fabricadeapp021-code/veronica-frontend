'use client';
import { use } from 'react';
import EditAdminBody from './EditAdminBody';

const EditAdminPage = ({ params }) => {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  return <EditAdminBody adminId={id} />;
};

export default EditAdminPage;
