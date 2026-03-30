import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, Link } from '@inertiajs/react';
import { ArrowLeft, Bell, Calendar, Clock, Image as ImageIcon, Info, Power, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Promotion {
    id: number;
    title: string;
    description: string;
    image_url: string;
    type: 'news' | 'promotion' | 'alert';
    expiry_date: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function PromotionDetailPage({ promotion }: { promotion: Promotion }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Promotions', href: '/promotions' },
        { title: promotion.title, href: `/promotions/${promotion.id}` }
    ];

    const handleDelete = () => {
        if (!confirm('Are you certain you want to permanently delete this promotion? This action cannot be undone.')) return;
        router.delete(`/admin/promotions/${promotion.id}`, {
            onSuccess: () => toast.success('Promotion permanently deleted')
        });
    };

    const handleToggleActive = () => {
        router.patch(`/admin/promotions/${promotion.id}/toggle`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Promotion ${!promotion.is_active ? 'Activated' : 'Suspended'}`);
            }
        });
    };

    const handleBroadcast = async () => {
        if (!confirm(`Are you sure you want to broadcast "${promotion.title}" via Push Notification to all active passengers?`)) return;

        try {
            const res = await window.axios.post('/admin/notifications/send', {
                target: 'all_passengers',
                title: promotion.title,
                body: promotion.description,
                data: {
                    type: 'promotion',
                    promotion_id: String(promotion.id),
                    image: promotion.image_url || '',
                },
                high_priority: true,
            });
            if (res.data.success) {
                toast.success('Broadcast transmission completed successfully.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Broadcast failed.');
        }
    };

    const isExpired = promotion.expiry_date && new Date(promotion.expiry_date) < new Date();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View: ${promotion.title}`} />
            
            <div className="flex flex-1 flex-col gap-6 p-6 lg:gap-8 lg:p-10 max-w-7xl mx-auto w-full">
                
                {/* Top Action Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/promotions">
                            <Button variant="outline" size="icon" className="rounded-full shadow-sm hover:bg-slate-100">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Campaign Details</h1>
                            <p className="text-sm text-slate-500 font-medium">Unique ID: PROMO-{promotion.id.toString().padStart(5, '0')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={handleBroadcast} className="shadow-md bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6">
                            <Send className="mr-2 h-4 w-4" />
                            Broadcast Push
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} className="shadow-md rounded-full px-6">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Primary Content Column */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Hero Poster */}
                        <Card className="overflow-hidden border-0 shadow-xl rounded-2xl bg-white">
                            <div className="relative h-[320px] w-full bg-slate-100 border-b">
                                {promotion.image_url ? (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                                        <img 
                                            src={promotion.image_url} 
                                            alt={promotion.title} 
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-indigo-900', 'to-slate-800');
                                            }}
                                        />
                                    </>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 z-0 flex items-center justify-center">
                                        <ImageIcon className="h-24 w-24 text-white/10" />
                                    </div>
                                )}

                                {/* Floating Labels on Image */}
                                <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-3">
                                    <div className="flex gap-2">
                                        <Badge className={`px-3 py-1 text-sm uppercase tracking-wider font-bold ${
                                            promotion.type === 'alert' ? 'bg-red-500/90 text-white' : 
                                            promotion.type === 'promotion' ? 'bg-emerald-500/90 text-white' : 
                                            'bg-blue-500/90 text-white'
                                        }`}>
                                            {promotion.type}
                                        </Badge>
                                        
                                        {isExpired ? (
                                            <Badge variant="secondary" className="px-3 py-1 bg-zinc-800/90 text-zinc-200">EXPIRED</Badge>
                                        ) : promotion.is_active ? (
                                            <Badge variant="secondary" className="px-3 py-1 bg-green-500/90 text-white">LIVE ACTIVE</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="px-3 py-1 bg-amber-500/90 text-white">SUSPENDED</Badge>
                                        )}
                                    </div>
                                    <h2 className="text-4xl font-black text-white leading-tight drop-shadow-md">{promotion.title}</h2>
                                </div>
                            </div>
                            
                            <CardContent className="p-8">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Info className="h-5 w-5 text-indigo-500" />
                                    Marketing Content body
                                </h3>
                                <div className="prose prose-slate max-w-none">
                                    <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                                        {promotion.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Meta Sidebar */}
                    <div className="space-y-6">
                        
                        {/* Lifecycle & Status Card */}
                        <Card className="shadow-lg border-t-4 border-t-indigo-500 rounded-xl overflow-hidden">
                            <CardHeader className="bg-slate-50/50 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Power className="h-5 w-5 text-indigo-500" />
                                    Campaign Engine
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                
                                {/* Master Switch */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-inner">
                                    <div className="space-y-1 relative pr-4">
                                        <Label htmlFor="master-switch" className="text-base font-bold text-slate-900">Distribution Engine</Label>
                                        <p className="text-sm text-slate-500">Toggle visibility natively in Passenger wallets</p>
                                    </div>
                                    <Switch 
                                        id="master-switch" 
                                        checked={promotion.is_active} 
                                        onCheckedChange={handleToggleActive}
                                        className="scale-125 data-[state=checked]:bg-green-500"
                                    />
                                </div>

                                <div className="border-t pt-6" />

                                {/* Timeline */}
                                <div className="space-y-5 relative">
                                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
                                    
                                    <div className="flex gap-4 relative z-10">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Deployed</p>
                                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                <Calendar className="h-3.5 w-3.5" /> 
                                                {new Date(promotion.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                                            </p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                <Clock className="h-3 w-3" /> 
                                                {new Date(promotion.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 relative z-10 pb-2">
                                        <div className={`h-6 w-6 rounded-full ${isExpired ? 'bg-red-100' : 'bg-slate-100'} border-2 border-white shadow-sm flex items-center justify-center shrink-0`}>
                                            <div className={`h-2 w-2 rounded-full ${isExpired ? 'bg-red-500' : 'bg-slate-400'}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Expiration</p>
                                            {promotion.expiry_date ? (
                                                <p className={`text-sm flex items-center gap-1 mt-1 ${isExpired ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                                                    <Calendar className="h-3.5 w-3.5" /> 
                                                    {new Date(promotion.expiry_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-emerald-600 font-medium mt-1 inline-flex px-2 py-0.5 bg-emerald-50 rounded">Never (Permanent)</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
