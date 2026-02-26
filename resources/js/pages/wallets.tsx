import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Wallets', href: '/wallets' }];

export default function WalletsPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Wallets" />
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-bold">Wallets</h1>
                <p className="text-muted-foreground">Wallet management and overview will appear here.</p>
            </div>
        </AppLayout>
    );
}
