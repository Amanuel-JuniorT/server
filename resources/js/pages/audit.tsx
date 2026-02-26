import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, UserCheck, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Audit {
    id: number;
    action: string;
    subject: string;
    admin: string;
    admin_role: string;
    date: string;
    impact: string;
    details?: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Audit Trail', href: '/audit' }];

export default function AuditPage() {
    const { audits } = usePage<{ audits: Audit[] }>().props;

    const getImpactBadge = (impact: string) => {
        switch (impact) {
            case 'critical': return <Badge variant="destructive">Critical</Badge>;
            case 'high': return <Badge className="bg-orange-100 text-orange-700 border-orange-200">High</Badge>;
            case 'medium': return <Badge variant="secondary">Medium</Badge>;
            default: return <Badge variant="outline">Low</Badge>;
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'super_admin': return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] uppercase">Super Admin</Badge>;
            case 'company_admin': return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] uppercase">Company Admin</Badge>;
            default: return <Badge variant="outline" className="text-[10px] uppercase">{role}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Audit Trail" />
            
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Audit Trail</h1>
                    <p className="text-muted-foreground">Detailed record of administrative actions and security-relevant events</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Administrative Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {audits.length > 0 ? (
                                audits.map((audit) => (
                                    <div key={audit.id} className="flex gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                            <UserCheck className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-sm truncate">{audit.action}: <span className="text-muted-foreground">{audit.subject}</span></h3>
                                                    {audit.details && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-xs">
                                                                    <p className="text-xs">{audit.details}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                                {getImpactBadge(audit.impact)}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    Performed by: {audit.admin} {getRoleBadge(audit.admin_role)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    {audit.date}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic border-2 border-dashed rounded-lg">
                                    <Shield className="h-8 w-8 mb-2 opacity-20" />
                                    <p>No audit logs recorded yet.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
