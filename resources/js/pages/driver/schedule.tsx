import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProvider } from '@/contexts/UserContext';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';
import { Driver, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Calendar, Clock, MapPin } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Schedule',
        href: '/driver/schedule',
    },
];

function ScheduleContent({ schedules }: { schedules: any[] }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <HeadingSmall title="Driver Schedule" description="Upcoming assigned rides and shifts" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Rides</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {schedules.length === 0 ? (
                            <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
                                <Calendar className="mb-2 h-12 w-12 opacity-20" />
                                <p>No upcoming schedules for this driver</p>
                            </div>
                        ) : (
                            schedules.map((schedule) => (
                                <div key={schedule.id} className="rounded-lg border p-4 transition-colors hover:bg-slate-50">
                                    <div className="flex flex-col space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Clock className="h-4 w-4 text-blue-600" />
                                                <span className="font-bold">
                                                    {new Date(schedule.scheduled_time).toLocaleString([], {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                            <Badge variant={schedule.status === 'accepted' ? 'completed' : 'pending'}>{schedule.status}</Badge>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-start space-x-2">
                                                <MapPin className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                                                <div>
                                                    <p className="text-sm font-medium">Pickup</p>
                                                    <p className="text-muted-foreground text-xs">{schedule.pickup_address}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <MapPin className="mt-1 h-4 w-4 shrink-0 text-red-600" />
                                                <div>
                                                    <p className="text-sm font-medium">Destination</p>
                                                    <p className="text-muted-foreground text-xs">{schedule.destination_address}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {schedule.price && (
                                            <div className="flex items-center justify-between border-t pt-2">
                                                <span className="text-muted-foreground text-sm">Estimated Fare</span>
                                                <span className="font-bold">{schedule.price} ETB</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function DriverSchedule() {
    const { driver, schedules, user_id } = usePage<{
        driver: Driver;
        schedules: any[];
        user_id: number;
    }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Driver Schedule" />

            <UserProvider userId={user_id}>
                <UserLayout role="driver">
                    <ScheduleContent schedules={schedules} />
                </UserLayout>
            </UserProvider>
        </AppLayout>
    );
}
