'use client';
import MainLayout from '@/layout/apps-layout';
import { AuthGuard } from '@/lib/auth/AuthGuard';

const AppsLayout = ({ children }) => {
    return (
        <MainLayout>
            <AuthGuard>{children}</AuthGuard>
        </MainLayout>
    );
};

export default AppsLayout;
