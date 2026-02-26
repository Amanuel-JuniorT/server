import { UserProvider } from '@/contexts/UserContext';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';
import React from 'react';

export function withDriverLayout(page: React.ReactElement) {
    const { user_id } = page.props as { user_id: number };
    const breadcrumbs = (page.type as unknown as { breadcrumbs?: { title: string; href: string }[] }).breadcrumbs || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <UserProvider userId={user_id}>
                <UserLayout role="driver" userId={user_id}>
                    {page}
                </UserLayout>
            </UserProvider>
        </AppLayout>
    );
}
