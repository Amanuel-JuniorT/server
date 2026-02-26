import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Vehicles', href: '/vehicles' }];

export default function VehiclesPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicles" />
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-bold">Vehicles</h1>
                <p className="text-muted-foreground">Vehicle management and overview will appear here.</p>
            </div>
        </AppLayout>
    );
}
