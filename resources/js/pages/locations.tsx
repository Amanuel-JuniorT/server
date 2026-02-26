import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Locations', href: '/locations' }];

export default function LocationsPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Locations" />
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-bold">Locations</h1>
                <p className="text-muted-foreground">Location management and overview will appear here.</p>
            </div>
        </AppLayout>
    );
}
