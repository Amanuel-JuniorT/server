import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import LocationPickerMap from '@/components/LocationPickerMap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Building2, Crosshair, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Company Dashboard',
        href: '/company-admin/dashboard',
    },
    {
        title: 'Company Profile',
        href: '/company-admin/profile',
    },
];

export default function CompanyAdminProfilePage() {
    const { company } = usePage<
        SharedData & {
            company: {
                id: number;
                name: string;
                code: string;
                description?: string;
                address?: string;
                phone?: string;
                email?: string;
                default_origin_lat?: number | string;
                default_origin_lng?: number | string;
            };
        }
    >().props;

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: company.name,
        description: company.description || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        default_origin_lat: (company as any).default_origin_lat ? String((company as any).default_origin_lat) : '',
        default_origin_lng: (company as any).default_origin_lng ? String((company as any).default_origin_lng) : '',
    });

    // Track unsaved changes
    const initialSnapshot = useMemo(
        () =>
            JSON.stringify({
                name: company.name || '',
                description: company.description || '',
                address: company.address || '',
                phone: company.phone || '',
                email: company.email || '',
                default_origin_lat: (company as any).default_origin_lat ? String((company as any).default_origin_lat) : '',
                default_origin_lng: (company as any).default_origin_lng ? String((company as any).default_origin_lng) : '',
            }),
        [company],
    );
    const isDirty = useMemo(() => JSON.stringify(formData) !== initialSnapshot, [formData, initialSnapshot]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = '';
        };
        if (isDirty) {
            window.addEventListener('beforeunload', handler);
        }
        return () => window.removeEventListener('beforeunload', handler);
    }, [isDirty]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await router.put('/company-admin/profile', formData, {
                onSuccess: () => {
                    toast.success('Company profile updated successfully');
                    router.reload();
                },
                onError: (errors) => {
                    Object.values(errors).forEach((error) => {
                        toast.error(error as string);
                    });
                },
            });
        } catch (error) {
            toast.error('Failed to update company profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company Profile" />

            <div className="space-y-6 pb-24">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
                        <p className="text-muted-foreground">Manage your company information</p>
                    </div>
                </div>

                {/* Company Profile Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Company Information
                        </CardTitle>
                        <CardDescription>Update your company details and contact information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Company Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter company name"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="code">Company Code</Label>
                                    <Input id="code" value={company.code} disabled className="bg-muted" />
                                    <p className="text-muted-foreground text-xs">Company code cannot be changed</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter company description"
                                    rows={3}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="Enter email address"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Company Address (Location)</Label>
                                <AddressAutocomplete
                                    placeholder="Search office location (Addis Ababa, Ethiopia)"
                                    value={
                                        formData.address
                                            ? {
                                                  address: formData.address,
                                                  lat: Number(formData.default_origin_lat || 0),
                                                  lng: Number(formData.default_origin_lng || 0),
                                              }
                                            : null
                                    }
                                    onChange={(val) => {
                                        if (!val) return;
                                        setFormData({
                                            ...formData,
                                            address: val.address,
                                            default_origin_lat: String(val.lat),
                                            default_origin_lng: String(val.lng),
                                        });
                                    }}
                                    onAddressChange={(address) => {
                                        setFormData({ ...formData, address });
                                    }}
                                />

                                {/* Map Integration */}
                                <div className="h-[300px] w-full overflow-hidden rounded-md border">
                                    <LocationPickerMap
                                        lat={Number(formData.default_origin_lat)}
                                        lng={Number(formData.default_origin_lng)}
                                        onLocationSelect={async (lat, lng) => {
                                            setFormData({
                                                ...formData,
                                                default_origin_lat: String(lat),
                                                default_origin_lng: String(lng),
                                            });
                                            
                                            // Reverse geocode on marker drop for cleaner address
                                            try {
                                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`);
                                                const data = await res.json();
                                                if (data.address) {
                                                    const parts = [];
                                                    const a = data.address;
                                                    if (a.road) parts.push(a.road);
                                                    if (a.suburb || a.neighbourhood) parts.push(a.suburb || a.neighbourhood);
                                                    if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
                                                    
                                                    const cleanAddress = parts.length > 0 ? parts.join(', ') : data.display_name;
                                                    setFormData(prev => ({ ...prev, address: cleanAddress }));
                                                }
                                            } catch (e) {
                                                console.error("Reverse geocoding failed", e);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="default_origin_lat">Latitude</Label>
                                        <Input
                                            id="default_origin_lat"
                                            type="number"
                                            step="any"
                                            value={formData.default_origin_lat}
                                            onChange={(e) => setFormData({ ...formData, default_origin_lat: e.target.value })}
                                            readOnly
                                            className="bg-muted"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="default_origin_lng">Longitude</Label>
                                        <Input
                                            id="default_origin_lng"
                                            type="number"
                                            step="any"
                                            value={formData.default_origin_lng}
                                            onChange={(e) => setFormData({ ...formData, default_origin_lng: e.target.value })}
                                            readOnly
                                            className="bg-muted"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            if (!navigator.geolocation) {
                                                toast.error('Geolocation not supported');
                                                return;
                                            }
                                            navigator.geolocation.getCurrentPosition(
                                                async (pos) => {
                                                    const lat = pos.coords.latitude;
                                                    const lng = pos.coords.longitude;
                                                    try {
                                                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`);
                                                        const data = await res.json();
                                                        let cleanAddress = data?.display_name || 'Current location';
                                                        if (data?.address) {
                                                            const a = data.address;
                                                            const parts = [];
                                                            if (a.road) parts.push(a.road);
                                                            if (a.suburb || a.neighbourhood) parts.push(a.suburb || a.neighbourhood);
                                                            if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
                                                            if (parts.length > 0) cleanAddress = parts.join(', ');
                                                        }
                                                        setFormData({
                                                            ...formData,
                                                            address: cleanAddress,
                                                            default_origin_lat: String(lat),
                                                            default_origin_lng: String(lng),
                                                        });
                                                        toast.success('Office location set');
                                                    } catch (e) {
                                                        setFormData({
                                                            ...formData,
                                                            default_origin_lat: String(lat),
                                                            default_origin_lng: String(lng),
                                                        });
                                                        toast.success('Coordinates captured');
                                                    }
                                                },
                                                () => toast.error('Failed to get current location')
                                            );
                                        }}
                                    >
                                        <Crosshair className="mr-2 h-4 w-4" /> Use My Location
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Company Statistics */}
                <Card>
                    <CardHeader>
                        <CardTitle>Company Statistics</CardTitle>
                        <CardDescription>Overview of your company's activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm font-medium">Company ID</Label>
                                <p className="font-mono text-sm">{company.id}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm font-medium">Company Code</Label>
                                <p className="font-mono text-sm">{company.code}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-sm font-medium">Status</Label>
                                <p className="text-sm text-green-600">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sticky Footer Action Bar */}
            <div className="bg-background fixed right-0 bottom-0 left-0 border-t p-4 shadow-lg md:left-64">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <p className="text-muted-foreground text-sm">{isDirty ? 'You have unsaved changes' : 'No changes to save'}</p>
                    <Button onClick={handleUpdateProfile} disabled={isLoading || !isDirty}>
                        <Save className="mr-2 h-4 w-4" />
                        {isLoading ? 'Updating...' : 'Update Profile'}
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
