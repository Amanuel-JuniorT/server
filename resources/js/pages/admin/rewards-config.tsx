import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Loader2, Save, Sparkles, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ConfigItem {
    id: number;
    key: string;
    value: string;
    type: string;
    group: string;
    description: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Rewards Configuration',
        href: '/admin/config/rewards',
    },
];

export default function RewardsConfigPage() {
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchConfigs = async () => {
        try {
            const res = await fetch('/api/admin/config/rewards', {
                headers: {
                    Accept: 'application/json',
                },
            });
            if (res.ok) {
                const result = await res.json();
                setConfigs(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch configurations', error);
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleToggle = (key: string, checked: boolean) => {
        setConfigs((prev) =>
            prev.map((item) => (item.key === key ? { ...item, value: checked ? 'true' : 'false' } : item))
        );
    };

    const handleInputChange = (key: string, value: string) => {
        // Simple numeric cleaning if the key relates to amounts or targets
        const cleanValue = (key.includes('amount') || key.includes('target')) 
            ? value.replace(/[^0-9.]/g, '') 
            : value;
            
        setConfigs((prev) => 
            prev.map((item) => (item.key === key ? { ...item, value: cleanValue } : item))
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/config/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: JSON.stringify({
                    settings: configs.map((c) => ({ key: c.key, value: String(c.value) })),
                }),
            });

            const result = await res.json();
            if (res.ok && result.success) {
                toast.success('Settings saved successfully');
                fetchConfigs(); // Refresh to confirm
            } else {
                throw new Error(result.message || 'Failed to save settings');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error saving settings');
        } finally {
            setIsSaving(false);
        }
    };

    const getConfigValue = (key: string) => {
        const item = configs.find((c) => c.key === key);
        return item ? item.value : '';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rewards Configuration" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Advanced Rewards Configuration</h1>
                        <p className="text-muted-foreground">Manage global toggles for Referrals, Streaks, and automated bonuses.</p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving || isLoading}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="text-muted-foreground h-10 w-10 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Referral Settings */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-500" />
                                    <CardTitle>Referral System</CardTitle>
                                </div>
                                <CardDescription>Allow users to earn rewards by inviting friends.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between space-x-2">
                                    <Label htmlFor="referral_enabled" className="flex flex-col gap-1">
                                        <span>Enable Referrals</span>
                                        <span className="text-muted-foreground font-normal text-xs">Toggle the entire referral system ON/OFF.</span>
                                    </Label>
                                    <Switch
                                        id="referral_enabled"
                                        checked={getConfigValue('referral_enabled') === 'true'}
                                        onCheckedChange={(checked) => handleToggle('referral_enabled', checked)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="referral_reward_amount">Reward Percentage (%)</Label>
                                    <Input
                                        id="referral_reward_amount"
                                        type="text"
                                        inputMode="numeric"
                                        value={getConfigValue('referral_reward_amount')}
                                        onChange={(e) => handleInputChange('referral_reward_amount', e.target.value)}
                                        placeholder="e.g., 20"
                                    />
                                    <p className="text-muted-foreground text-xs">Discount applied to both the inviter and the invitee.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Streak Settings */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-amber-500" />
                                    <CardTitle>Ride Streaks</CardTitle>
                                </div>
                                <CardDescription>Reward loyal users for completing multiple rides.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between space-x-2">
                                    <Label htmlFor="streak_enabled" className="flex flex-col gap-1">
                                        <span>Enable Streaks</span>
                                        <span className="text-muted-foreground font-normal text-xs">Reward users after hitting a ride milestone.</span>
                                    </Label>
                                    <Switch
                                        id="streak_enabled"
                                        checked={getConfigValue('streak_enabled') === 'true'}
                                        onCheckedChange={(checked) => handleToggle('streak_enabled', checked)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="streak_target_rides">Target Rides (7 Days)</Label>
                                    <Input
                                        id="streak_target_rides"
                                        type="text"
                                        inputMode="numeric"
                                        value={getConfigValue('streak_target_rides')}
                                        onChange={(e) => handleInputChange('streak_target_rides', e.target.value)}
                                        placeholder="e.g., 5"
                                    />
                                    <p className="text-muted-foreground text-xs">Number of completed rides required within a week to earn a reward.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
