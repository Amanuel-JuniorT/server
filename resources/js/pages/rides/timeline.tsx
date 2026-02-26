import AppLayout from '@/layouts/app-layout';
import RideLayout from '@/layouts/ride/layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';

interface Ride {
    id: number;
    status: string;
    requested_at: string;
    started_at?: string | null;
    completed_at?: string | null;
    cancelled_at?: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ride Management', href: '/rides' },
    { title: 'Ride Timeline', href: '#' },
];

export default function RideTimeline({ ride }: { ride: Ride }) {
    const timeline = [
        { 
            event: 'Ride Requested', 
            time: ride.requested_at, 
            done: true, 
            icon: Clock, 
            color: 'text-blue-500' 
        },
        { 
            event: 'Driver Accepted', 
            time: ride.started_at ? 'System Match' : null, 
            done: !!ride.started_at || ride.status === 'completed', 
            icon: CheckCircle2, 
            color: 'text-green-500' 
        },
        { 
            event: 'Ride Started', 
            time: ride.started_at, 
            done: !!ride.started_at, 
            icon: Circle, 
            color: 'text-indigo-500' 
        },
        { 
            event: ride.status === 'cancelled' ? 'Ride Cancelled' : 'Ride Completed', 
            time: ride.completed_at || ride.cancelled_at, 
            done: ride.status === 'completed' || ride.status === 'cancelled', 
            icon: ride.status === 'cancelled' ? XCircle : CheckCircle2, 
            color: ride.status === 'cancelled' ? 'text-red-500' : 'text-green-600' 
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Timeline Ride #${ride.id}`} />

            <RideLayout rideId={ride.id} status={ride.status}>
                <Card>
                    <CardHeader>
                        <CardTitle>Audit Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {timeline.map((item, idx) => (
                                <div key={idx} className="relative flex items-center justify-between md:justify-start md:odd:flex-row-reverse group is-active">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 shadow shrink-0 md:order-1 ${item.done ? 'bg-white' : 'opacity-40'}`}>
                                        <item.icon className={`h-5 w-5 ${item.done ? item.color : 'text-slate-400'}`} />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-full p-4 rounded border border-slate-200 bg-white ml-6 md:order-2 shadow-sm">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className={`font-bold ${item.done ? 'text-slate-900' : 'text-slate-400'}`}>{item.event}</div>
                                            <time className="text-xs font-medium text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{item.time || 'Pending'}</time>
                                        </div>
                                        <div className="text-slate-500 text-sm">Automated system log entry for lifecycle stage.</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </RideLayout>
        </AppLayout>
    );
}
