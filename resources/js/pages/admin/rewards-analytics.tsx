import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleTable as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { 
    BarChart3, 
    Gift, 
    TrendingUp, 
    Users, 
    Zap, 
    Clock, 
    CheckCircle2, 
    Ticket,
    ArrowUpRight,
    Search
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';

interface Stat {
    total_redeemed: number;
    total_issued: number;
    total_active_value: number;
    streak_wins: number;
    promo_code_redemptions: number;
}

interface Trend {
    date: string;
    total: number;
    redeemed: number;
}

interface TopEarner {
    id: number;
    name: string;
    count: number;
    profile_picture: string | null;
}

interface Activity {
    id: number;
    user_name: string;
    campaign_name: string;
    type: 'streak' | 'promo';
    amount: number;
    discount_type: string;
    time_ago: string;
    date: string;
}

interface Props {
    stats: Stat;
    trends: Trend[];
    topEarners: TopEarner[];
    recentActivity: Activity[];
    filters: {
        range: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Rewards Analytics', href: '/admin/rewards/analytics' },
];

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1'];

export default function RewardsAnalytics({ stats, trends, topEarners, recentActivity, filters }: Props) {
    
    const handleRangeChange = (value: string) => {
        router.get('/admin/rewards/analytics', { range: value }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rewards Analytics" />
            
            <div className="flex flex-1 flex-col gap-6 p-6 lg:gap-8 lg:p-10 bg-slate-50/50">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 line-clamp-1">Rewards & Growth Analytics</h1>
                        <p className="text-slate-500 mt-2 text-lg">Real-time performance tracking for streaks, promo codes, and user incentives.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={filters.range} onValueChange={handleRangeChange}>
                            <SelectTrigger className="w-[180px] bg-white border-slate-200 h-11 text-base shadow-sm ring-0 focus:ring-0">
                                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                <SelectValue placeholder="Select Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 Days</SelectItem>
                                <SelectItem value="30">Last 30 Days</SelectItem>
                                <SelectItem value="90">Last 90 Days</SelectItem>
                                <SelectItem value="365">Last Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden group">
                        <div className="h-1.5 w-full bg-orange-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Rewards Issued</CardTitle>
                            <div className="p-2 bg-orange-50 rounded-lg group-hover:scale-110 transition-transform">
                                <Gift className="h-5 w-5 text-orange-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{stats.total_issued.toLocaleString()}</div>
                            <p className="text-xs text-orange-600 mt-2 font-medium flex items-center">
                                <ArrowUpRight className="w-3 h-3 mr-1" /> Lifetime accumulation
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden group">
                        <div className="h-1.5 w-full bg-blue-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Promo Redemptions</CardTitle>
                            <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
                                <Ticket className="h-5 w-5 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{stats.promo_code_redemptions.toLocaleString()}</div>
                            <p className="text-xs text-blue-600 mt-2 font-medium flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> {((stats.promo_code_redemptions / stats.total_issued) * 100).toFixed(1)}% Usage rate
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden group">
                        <div className="h-1.5 w-full bg-emerald-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Streak Milestones</CardTitle>
                            <div className="p-2 bg-emerald-50 rounded-lg group-hover:scale-110 transition-transform">
                                <Zap className="h-5 w-5 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{stats.streak_wins.toLocaleString()}</div>
                            <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
                                <TrendingUp className="w-3 h-3 mr-1" /> Habit-building rewards
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden group">
                        <div className="h-1.5 w-full bg-indigo-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Wallet Value</CardTitle>
                            <div className="p-2 bg-indigo-50 rounded-lg group-hover:scale-110 transition-transform">
                                <BarChart3 className="h-5 w-5 text-indigo-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-slate-900">{stats.total_active_value.toLocaleString()} <span className="text-sm font-normal text-slate-400 ml-1">ETB</span></div>
                            <p className="text-xs text-indigo-600 mt-2 font-medium flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> Pending redemptions
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-7">
                    {/* Main Trend Chart */}
                    <Card className="lg:col-span-4 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold">Reward Issuance Trends</CardTitle>
                                <CardDescription>Issuance vs. Actual Usage over time</CardDescription>
                            </div>
                            <div className="flex items-center gap-4 text-sm font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                                    <span>Issued</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span>Redeemed</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[400px] mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorRedeemed" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorIssued)" />
                                    <Area type="monotone" dataKey="redeemed" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRedeemed)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top Earners / Leaderboard */}
                    <Card className="lg:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center">
                                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                                Reward Power Users
                            </CardTitle>
                            <CardDescription>Top users by total rewards earned</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {topEarners.length === 0 ? (
                                    <p className="text-center text-slate-400 py-10">No data available</p>
                                ) : (
                                    topEarners.map((user, index) => (
                                        <div key={user.id} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-slate-500 font-bold uppercase">
                                                        {user.profile_picture ? (
                                                            <img src={user.profile_picture} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            user.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{user.name}</span>
                                                    <span className="text-xs text-slate-400 font-medium">User ID: #{user.id}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{user.count} Rewards</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity Feed */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold">Recent Global Activity</CardTitle>
                            <CardDescription>The latest achievements across your user base</CardDescription>
                        </div>
                        <Search className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600" />
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-100">
                                    <TableHead className="text-slate-500 font-semibold uppercase text-xs tracking-wider">User</TableHead>
                                    <TableHead className="text-slate-500 font-semibold uppercase text-xs tracking-wider">Reward</TableHead>
                                    <TableHead className="text-slate-500 font-semibold uppercase text-xs tracking-wider">Category</TableHead>
                                    <TableHead className="text-slate-500 font-semibold uppercase text-xs tracking-wider">Value</TableHead>
                                    <TableHead className="text-right text-slate-500 font-semibold uppercase text-xs tracking-wider">Achievement Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentActivity.map((activity) => (
                                    <TableRow key={activity.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                                        <TableCell className="font-bold text-slate-900">{activity.user_name}</TableCell>
                                        <TableCell className="text-slate-600 font-medium">{activity.campaign_name}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                activity.type === 'streak' 
                                                ? 'bg-emerald-100 text-emerald-700' 
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {activity.type === 'streak' ? <Zap className="w-3 h-3 mr-1" /> : <Ticket className="w-3 h-3 mr-1" />}
                                                {activity.type} win
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900">
                                            {activity.discount_type === 'percentage' ? `${activity.amount}%` : `${activity.amount} ETB`}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-400 font-medium">
                                            <div className="flex flex-col items-end">
                                                <span>{activity.date}</span>
                                                <span className="text-[10px] uppercase font-bold text-slate-300">{activity.time_ago}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
