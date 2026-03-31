import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ChevronRight, Info } from 'lucide-react';

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

    // Configuration Validation
    const getValidationStatus = () => {
        const issues: string[] = [];
        
        if (getConfigValue('streak_enabled') === 'true') {
            if (!getConfigValue('streak_target_rides') || Number(getConfigValue('streak_target_rides')) <= 0) {
                issues.push('Passenger Streak: Target rides must be greater than 0.');
            }
            if (!getConfigValue('streak_reward_amount') || Number(getConfigValue('streak_reward_amount')) <= 0) {
                issues.push('Passenger Streak: Reward amount must be greater than 0.');
            }
        }

        if (getConfigValue('referral_enabled') === 'true') {
            if (!getConfigValue('referral_inviter_reward_amount') || Number(getConfigValue('referral_inviter_reward_amount')) <= 0) {
                issues.push('Referral: Inviter reward is missing.');
            }
            if (!getConfigValue('referral_invitee_reward_amount') || Number(getConfigValue('referral_invitee_reward_amount')) <= 0) {
                issues.push('Referral: Invitee reward is missing.');
            }
        }

        return issues;
    };

    const validationIssues = getValidationStatus();


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Rewards Configuration" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Advanced Rewards Configuration</h1>
                        <p className="text-muted-foreground">Manage global toggles for Referrals, Streaks, and automated bonuses.</p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving || isLoading} size="lg" className="shadow-lg">
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>

                {/* Configuration Guard Bar */}
                {validationIssues.length > 0 ? (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle className="font-bold">Configuration Required</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                                {validationIssues.map((issue, idx) => (
                                    <li key={idx}>{issue}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 animate-in fade-in duration-500">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <AlertTitle className="text-emerald-800 dark:text-emerald-400 font-bold">System Optimized</AlertTitle>
                        <AlertDescription className="text-emerald-700/80 dark:text-emerald-500/80">
                            All enabled reward features have valid configurations. Your hub is ready to go!
                        </AlertDescription>
                    </Alert>
                )}

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
                                                value={getConfigValue('referral_inviter_reward_type') || 'fixed'} 
                                                onValueChange={(val) => handleInputChange('referral_inviter_reward_type', val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="fixed">Fixed ETB Amount</SelectItem>
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
                                                    <SelectItem value="fixed">Fixed ETB Amount</SelectItem>
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

                        <div className="space-y-6 flex flex-col h-full">
                            {/* Passenger Streak Settings */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-amber-500" />
                                        <CardTitle>Passenger Streaks</CardTitle>
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
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Discount Type</Label>
                                                <Select 
                                                    value={getConfigValue('streak_reward_type') || 'fixed'} 
                                                    onValueChange={(val) => handleInputChange('streak_reward_type', val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="fixed">Fixed ETB Amount</SelectItem>
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

                            {/* Driver Streak Settings */}
                            <Card className="border-emerald-500/20 shadow-sm">
                                <CardHeader className="bg-emerald-50/50 pb-4 dark:bg-emerald-950/20">
                                    <div className="flex items-center gap-2">
                                        <Car className="h-5 w-5 text-emerald-500" />
                                        <CardTitle>Driver Execution Streaks</CardTitle>
                                    </div>
                                    <CardDescription>Massively increase supply by incentivizing consecutive driving.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="flex items-center justify-between space-x-2 pb-4 border-b">
                                        <Label htmlFor="driver_streak_enabled" className="flex flex-col gap-1">
                                            <span className="font-semibold text-base text-emerald-700 dark:text-emerald-400">Enable Driver Streaks</span>
                                            <span className="text-muted-foreground font-normal text-xs">Automatically deposit direct ETB cash into their wallet.</span>
                                        </Label>
                                        <Switch
                                            id="driver_streak_enabled"
                                            checked={getConfigValue('driver_streak_enabled') === 'true'}
                                            onCheckedChange={(checked) => handleToggle('driver_streak_enabled', checked)}
                                        />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm">Milestone Definition</h4>
                                        <div className="grid gap-2">
                                            <Label htmlFor="driver_streak_target_rides">Consecutive Rides Target</Label>
                                            <Input
                                                id="driver_streak_target_rides"
                                                type="text"
                                                inputMode="numeric"
                                                value={getConfigValue('driver_streak_target_rides')}
                                                onChange={(e) => handleInputChange('driver_streak_target_rides', e.target.value)}
                                                placeholder="e.g., 10"
                                            />
                                            <p className="text-muted-foreground text-xs">Number of consecutive ride completions required for the bonus.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t">
                                        <h4 className="font-medium text-sm">Real Cash Payout</h4>
                                        <div className="grid gap-2">
                                            <Label>Flat ETB Amount Deposit</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">Br</span>
                                                <Input
                                                    className="pl-8 bg-emerald-50/30 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={getConfigValue('driver_streak_reward_amount')}
                                                    onChange={(e) => handleInputChange('driver_streak_reward_amount', e.target.value)}
                                                    placeholder="e.g. 500"
                                                />
                                            </div>
                                            <p className="text-muted-foreground text-xs">This is instantly credited to the driver's withdrawable wallet balance.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
