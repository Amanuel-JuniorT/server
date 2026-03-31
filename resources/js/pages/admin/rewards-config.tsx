import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Loader2, Save, Sparkles, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

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
    const { configs: initialConfigs } = usePage<{ configs: ConfigItem[] }>().props;
    const [configs, setConfigs] = useState<ConfigItem[]>(initialConfigs ?? []);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sync if props change (e.g., after Inertia visit)
    useEffect(() => {
        if (initialConfigs) {
            setConfigs(initialConfigs);
        }
    }, [initialConfigs]);

    const handleToggle = (key: string, checked: boolean) => {
        setConfigs((prev) => {
            const exists = prev.some((item) => item.key === key);
            const valueStr = checked ? 'true' : 'false';
            if (exists) {
                return prev.map((item) => (item.key === key ? { ...item, value: valueStr } : item));
            }
            // Inject if missing from DB response
            return [...prev, { id: 0, key, value: valueStr, type: 'boolean', group: 'rewards', description: '' }];
        });
    };

    const handleInputChange = (key: string, value: string) => {
        // Simple numeric cleaning if the key relates to amounts or targets
        const cleanValue = (key.includes('amount') || key.includes('target')) 
            ? value.replace(/[^0-9.]/g, '') 
            : value;
            
        setConfigs((prev) => {
            const exists = prev.some((item) => item.key === key);
            if (exists) {
                return prev.map((item) => (item.key === key ? { ...item, value: cleanValue } : item));
            }
            return [...prev, { id: 0, key, value: cleanValue, type: 'string', group: 'rewards', description: '' }];
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await axios.post('/admin/config/update', {
                settings: configs.map((c) => ({ key: c.key, value: String(c.value) })),
            });

            if (response.data.success) {
                toast.success('Settings saved successfully');
                // Reload Inertia props to confirm persisted values from server
                router.reload({ only: ['configs'] });
            } else {
                throw new Error(response.data.message || 'Failed to save settings');
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || 'Error saving settings';
            toast.error(msg);
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
                                <div className="flex items-center justify-between space-x-2 pb-4 border-b">
                                    <Label htmlFor="referral_enabled" className="flex flex-col gap-1">
                                        <span className="font-semibold text-base">Enable Referrals</span>
                                        <span className="text-muted-foreground font-normal text-xs">Toggle the entire automatic referral payout system ON/OFF.</span>
                                    </Label>
                                    <Switch
                                        id="referral_enabled"
                                        checked={getConfigValue('referral_enabled') === 'true'}
                                        onCheckedChange={(checked) => handleToggle('referral_enabled', checked)}
                                    />
                                </div>
                                
                                {/* Inviter Config */}
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm">Reward for the Inviter</h4>
                                    <p className="text-muted-foreground text-xs">What does the user who shared the code get?</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Discount Type</Label>
                                            <Select 
                                                value={getConfigValue('referral_inviter_reward_type') || 'flat'} 
                                                onValueChange={(val) => handleInputChange('referral_inviter_reward_type', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="flat">Flat ETB Amount</SelectItem>
                                                    <SelectItem value="percent">Percentage Off</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Amount Value</Label>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                value={getConfigValue('referral_inviter_reward_amount')}
                                                onChange={(e) => handleInputChange('referral_inviter_reward_amount', e.target.value)}
                                                placeholder="e.g. 50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Invitee Config */}
                                <div className="space-y-3 pt-4 border-t">
                                    <h4 className="font-medium text-sm">Reward for the Invitee</h4>
                                    <p className="text-muted-foreground text-xs">What does the new user taking their first ride get?</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Discount Type</Label>
                                            <Select 
                                                value={getConfigValue('referral_invitee_reward_type') || 'percent'} 
                                                onValueChange={(val) => handleInputChange('referral_invitee_reward_type', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="flat">Flat ETB Amount</SelectItem>
                                                    <SelectItem value="percent">Percentage Off</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Amount Value</Label>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                value={getConfigValue('referral_invitee_reward_amount')}
                                                onChange={(e) => handleInputChange('referral_invitee_reward_amount', e.target.value)}
                                                placeholder="e.g. 30"
                                            />
                                        </div>
                                    </div>
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
                                <CardDescription>Reward loyal users for consistently riding with ETHIOCAB.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between space-x-2 pb-4 border-b">
                                    <Label htmlFor="streak_enabled" className="flex flex-col gap-1">
                                        <span className="font-semibold text-base">Enable Milestone Streaks</span>
                                        <span className="text-muted-foreground font-normal text-xs">Automatically deposit a reward when users hit their target.</span>
                                    </Label>
                                    <Switch
                                        id="streak_enabled"
                                        checked={getConfigValue('streak_enabled') === 'true'}
                                        onCheckedChange={(checked) => handleToggle('streak_enabled', checked)}
                                    />
                                </div>
                                
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm">Milestone Definition</h4>
                                    <div className="grid gap-2">
                                        <Label htmlFor="streak_target_rides">Target Rides (per 7 Days)</Label>
                                        <Input
                                            id="streak_target_rides"
                                            type="text"
                                            inputMode="numeric"
                                            value={getConfigValue('streak_target_rides')}
                                            onChange={(e) => handleInputChange('streak_target_rides', e.target.value)}
                                            placeholder="e.g., 5"
                                        />
                                        <p className="text-muted-foreground text-xs">Number of completed rides required within a week to hit the streak.</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t">
                                    <h4 className="font-medium text-sm">Payout Reward</h4>
                                    <p className="text-muted-foreground text-xs">What voucher is deposited into their wallet upon completion?</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Discount Type</Label>
                                            <Select 
                                                value={getConfigValue('streak_reward_type') || 'flat'} 
                                                onValueChange={(val) => handleInputChange('streak_reward_type', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="flat">Flat ETB Amount</SelectItem>
                                                    <SelectItem value="percent">Percentage Off</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Amount Value</Label>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                value={getConfigValue('streak_reward_amount')}
                                                onChange={(e) => handleInputChange('streak_reward_amount', e.target.value)}
                                                placeholder="e.g. 50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
