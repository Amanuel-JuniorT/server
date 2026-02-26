import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Poolings', href: '/poolings' }];

export default function PoolingsPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Poolings" />
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-bold">Poolings</h1>
                <p className="text-muted-foreground">Pooling management and overview will appear here.</p>
            </div>
        </AppLayout>
    );
}
