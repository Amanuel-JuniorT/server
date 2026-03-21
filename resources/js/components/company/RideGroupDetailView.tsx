import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleTable as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { 
    Calendar, 
    Car, 
    CheckCircle, 
    Clock, 
    MapPin, 
    User, 
    Users, 
    XCircle, 
    ArrowLeft, 
    LayoutDashboard, 
    History, 
    BarChart3,
    FileText
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RideGroupDetailViewProps {
    groupId: number;
    onBack: () => void;
    companyId: number;
}

export default function RideGroupDetailView({ groupId, onBack, companyId }: RideGroupDetailViewProps) {
    const [group, setGroup] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'riders' | 'drivers' | 'history'>('overview');

    useEffect(() => {
        fetchGroupDetails();
    }, [groupId]);

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

    if (isLoading && !group) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!group) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Back Button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{group.group_name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="capitalize">{group.group_type?.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={group.status === 'active' ? 'default' : 'secondary'} className="px-3 py-1 text-xs">
                        {group.status.toUpperCase()}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1">
                    <Card className="p-2">
                        <div className="space-y-1">
                            <button
                                onClick={() => setActiveDetailTab('overview')}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    activeDetailTab === 'overview' 
                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveDetailTab('riders')}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    activeDetailTab === 'riders' 
                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Users className="h-4 w-4" />
                                Riders ({group.members?.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveDetailTab('drivers')}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    activeDetailTab === 'drivers' 
                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Car className="h-4 w-4" />
                                Assigned Drivers
                            </button>
                            <button
                                onClick={() => setActiveDetailTab('history')}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    activeDetailTab === 'history' 
                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <History className="h-4 w-4" />
                                Ride History
                            </button>
                        </div>
                    </Card>

                    {/* Quick Stats Card */}
                    <Card className="mt-4 overflow-hidden border-none bg-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary/70">Group Health</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <div className="text-2xl font-bold text-primary">85%</div>
                                <div className="text-[10px] text-muted-foreground">Attendance Rate</div>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-primary/10">
                                <div className="h-full w-[85%] rounded-full bg-primary" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    {activeDetailTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            Schedule & Timing
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{group.scheduled_time}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {new Date(group.start_date).toLocaleDateString()} to {new Date(group.end_date).toLocaleDateString()}
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
                                            Capacity & Utilization
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{group.members?.length || 0} / {group.max_capacity} Users</div>
                                        <div className="text-xs text-muted-foreground mt-1 text-green-600 font-medium">
                                            {group.max_capacity - (group.members?.length || 0)} seats remaining
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Route Overview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="relative pl-8 before:absolute before:left-[11px] before:top-[24px] before:h-[calc(100%-48px)] before:w-0.5 before:bg-muted">
                                        <div className="relative mb-8">
                                            <div className="absolute -left-8 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-4 ring-white">
                                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Origin ({group.origin_type})</p>
                                                <p className="text-sm font-semibold">{group.pickup_address}</p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute -left-8 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 ring-4 ring-white">
                                                <MapPin className="h-3 w-3" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Destination ({group.destination_type})</p>
                                                <p className="text-sm font-semibold">{group.destination_address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeDetailTab === 'riders' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Enrolled Employees</CardTitle>
                                <CardDescription>List of employees taking this ride</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Pickup Details</TableHead>
                                            <TableHead>Email</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.members?.map((member: any) => (
                                            <TableRow key={member.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                                                            {member.employee?.name?.charAt(0)}
                                                        </div>
                                                        {member.employee?.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={member.pickup_address}>
                                                        {member.pickup_address}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">{member.employee?.email}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {activeDetailTab === 'drivers' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Assigned Drivers</CardTitle>
                                <CardDescription>Drivers responsible for this group's transport</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Driver</TableHead>
                                            <TableHead>Service Days</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.assignments?.length > 0 ? (
                                            group.assignments.map((assignment: any) => (
                                                <TableRow key={assignment.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                <Car className="h-4 w-4" />
                                                            </div>
                                                            {assignment.driver?.user?.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            {assignment.days_of_week?.map((day: string) => (
                                                                <Badge key={day} variant="outline" className="text-[9px] px-1 py-0">{day.toUpperCase()}</Badge>
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
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                                                    No drivers assigned yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {activeDetailTab === 'history' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Recent Instances</CardTitle>
                                <CardDescription>Past and upcoming ride executions</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Analytics</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.ride_instances?.map((instance: any) => {
                                            const optedOutCount = instance.opted_out_employees?.length || 0;
                                            const totalCapacity = group.members?.length || 0;
                                            const aboardCount = instance.aboard_employees?.length || 0;

                                            return (
                                                <TableRow key={instance.id}>
                                                    <TableCell>
                                                        <div className="text-sm font-semibold">
                                                            {new Date(instance.scheduled_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {new Date(instance.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(instance.status)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Attendance</span>
                                                                <span className="text-xs font-medium">{aboardCount} / {totalCapacity} Aboard</span>
                                                            </div>
                                                            <div className="flex flex-col border-l pl-4">
                                                                <span className="text-[10px] text-muted-foreground uppercase font-bold">Opt-outs</span>
                                                                <span className={cn("text-xs font-medium", optedOutCount > 0 ? "text-orange-600" : "")}>{optedOutCount} Employees</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return <div className={cn("h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent", className)} />
}
