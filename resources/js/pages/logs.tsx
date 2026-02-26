import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Activity, Search, Terminal } from 'lucide-react';
import { useState } from 'react';

interface LogStats {
    memory_usage: string;
    uptime: string;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'System Logs', href: '/logs' }];

export default function LogsPage() {
    const { logs, stats } = usePage<{ logs: string[]; stats: LogStats }>().props;
    const [searchTerm, setSearchTerm] = useState('');

    const getLogColor = (line: string) => {
        if (line.includes('.ERROR') || line.includes('.CRITICAL') || line.includes('.ALERT') || line.includes('.EMERGENCY')) return 'text-red-400';
        if (line.includes('.WARNING')) return 'text-yellow-400';
        if (line.includes('.DEBUG')) return 'text-blue-400';
        if (line.includes('.INFO')) return 'text-green-400';
        return 'text-slate-400';
    };

    const filteredLogs = searchTerm ? logs.filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase())) : logs;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Logs" />

            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
                    <p className="text-muted-foreground">Monitoring real-time application behavior and server output (laravel.log)</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.memory_usage}</div>
                            <p className="text-muted-foreground text-xs">Current PHP process heap</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.uptime}</div>
                            <p className="text-muted-foreground text-xs">Server health status</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="min-h-0 flex-1 border-slate-800 bg-slate-950 text-slate-50">
                    <CardHeader className="border-b border-slate-800">
                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                            <CardTitle className="flex items-center gap-2 text-slate-200">
                                <Terminal className="h-5 w-5" />
                                laravel.log (Last 100 lines)
                            </CardTitle>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Search logs..."
                                    className="border-slate-700 bg-slate-900 pl-9 text-slate-200 placeholder:text-slate-500 focus-visible:ring-slate-600"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        {searchTerm && (
                            <p className="mt-2 text-xs text-slate-500">
                                Showing {filteredLogs.length} of {logs.length} log entries
                            </p>
                        )}
                    </CardHeader>
                    <CardContent className="overflow-hidden p-0">
                        <div className="scrollbar-thin scrollbar-thumb-slate-800 max-h-[600px] space-y-1.5 overflow-y-auto p-6 font-mono text-[10px] sm:text-xs">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((line, idx) => (
                                    <p
                                        key={idx}
                                        className={`${getLogColor(line)} leading-relaxed break-all opacity-90 transition-opacity hover:opacity-100`}
                                    >
                                        {line}
                                    </p>
                                ))
                            ) : searchTerm ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-600 italic">
                                    <Search className="mb-4 h-10 w-10 opacity-20" />
                                    <p>No logs match your search.</p>
                                    <button onClick={() => setSearchTerm('')} className="mt-2 text-xs text-blue-400 underline hover:text-blue-300">
                                        Clear search
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-600 italic">
                                    <Activity className="mb-4 h-10 w-10 opacity-20" />
                                    <p>Log file is empty or unreachable.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
