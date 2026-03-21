import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SimpleTable as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Car, CheckCircle, Clock, MapPin, User, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RideGroupDetailSheetProps {
    groupId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function RideGroupDetailSheet({ groupId, open, onOpenChange }: RideGroupDetailSheetProps) {
    const [group, setGroup] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (open && groupId) {
            fetchGroupDetails();
        }
    }, [open, groupId]);

    const fetchGroupDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/company-admin/api/ride-groups/${groupId}`);
            const data = await res.json();
            if (data.success) {
                setGroup(data.data);
            } else {
                toast.error(data.message || 'Failed to load group details');
            }
        } catch (error) {
            console.error('Error fetching group details:', error);
            toast.error('An error occurred while loading group details');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
            case 'cancelled':
                return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
            case 'requested':
                return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Requested</Badge>;
            case 'accepted':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1"><Car className="h-3 w-3" /> Assigned</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const dayLabels: Record<string, string> = {
        mon: 'Monday',
        tue: 'Tuesday',
        wed: 'Wednesday',
        thu: 'Thursday',
        fri: 'Friday',
        sat: 'Saturday',
        sun: 'Sunday'
    };

    if (!group && isLoading) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="sm:max-w-2xl overflow-y-auto">
                    <div className="flex h-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    if (!group) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-3xl overflow-y-auto">
                <SheetHeader className="pb-6">
                    <div className="flex items-center justify-between pr-8">
                        <div>
                            <SheetTitle className="text-2xl font-bold">{group.group_name}</SheetTitle>
                            <SheetDescription>
                                Detailed view of this recurring ride group
                            </SheetDescription>
                        </div>
                        <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                            {group.status}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="space-y-6">
                    {/* General Info & Schedule */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{group.scheduled_time}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(group.start_date).toLocaleDateString()} - {new Date(group.end_date).toLocaleDateString()}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-1">
                                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                                        <Badge 
                                            key={day} 
                                            variant={group.active_days?.includes(day) ? 'default' : 'outline'}
                                            className="text-[10px] px-1.5 py-0"
                                        >
                                            {day.toUpperCase()}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    Capacity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{group.members?.length || 0} / {group.max_capacity}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Employees enrolled in this group
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Route Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Route Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground">From ({group.origin_type})</p>
                                    <p className="text-sm font-medium">{group.pickup_address}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase text-muted-foreground">To ({group.destination_type})</p>
                                    <p className="text-sm font-medium">{group.destination_address}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assigned Drivers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                Assigned Drivers
                            </CardTitle>
                            <CardDescription>Drivers enrolled to provide service for this group</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Driver Name</TableHead>
                                        <TableHead>Days</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.assignments && group.assignments.length > 0 ? (
                                        group.assignments.map((assignment: any) => (
                                            <TableRow key={assignment.id}>
                                                <TableCell className="font-medium">
                                                    {assignment.driver?.user?.name || 'Unassigned'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {assignment.days_of_week?.map((day: string) => (
                                                            <Badge key={day} variant="outline" className="text-[9px] px-1 py-0">{day.substring(0, 3)}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>{assignment.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                No drivers assigned yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Recent Instances with Opt-outs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Recent Instances
                            </CardTitle>
                            <CardDescription>Recent and upcoming ride executions</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Attendance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.ride_instances && group.ride_instances.length > 0 ? (
                                        group.ride_instances.map((instance: any) => {
                                            const optedOutCount = instance.opted_out_employees?.length || 0;
                                            const totalCapacity = group.members?.length || 0;
                                            const aboardCount = instance.aboard_employees?.length || 0;

                                            return (
                                                <TableRow key={instance.id}>
                                                    <TableCell>
                                                        <div className="text-sm font-medium">
                                                            {new Date(instance.scheduled_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(instance.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(instance.status)}</TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <span className="text-muted-foreground">Opt-outs:</span>
                                                                <span className={optedOutCount > 0 ? "text-orange-600 font-medium" : ""}>{optedOutCount}</span>
                                                            </div>
                                                            {instance.status === 'completed' && (
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <span className="text-muted-foreground">Aboard:</span>
                                                                    <span className="text-green-600 font-medium">{aboardCount}/{totalCapacity}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                                No ride instances recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </SheetContent>
        </Sheet>
    );
}
