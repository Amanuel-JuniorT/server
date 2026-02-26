import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Ratings', href: '/ratings' }];

export default function RatingsPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ratings" />
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-bold">Ratings</h1>
                <p className="text-muted-foreground">Rating management and overview will appear here.</p>
            </div>
        </AppLayout>
    );
}
