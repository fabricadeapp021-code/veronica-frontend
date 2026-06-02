'use client';
import { use } from 'react';
import EditUserBody from './EditUserBody';

const EditUserPage = ({ params }) => {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  return <EditUserBody userId={id} />;
};

export default EditUserPage;

