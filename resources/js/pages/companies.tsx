import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Building2, Car, Edit, Eye, Mail, MapPin, MoreHorizontal, Phone, Plus, Trash2, Users, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Company {
    id: number;
    name: string;
    code: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
    employees_count?: number;
    pending_invitation_id?: number | null;
    created_at: string;
    updated_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Companies',
        href: '/companies',
    },
];

interface Driver {
    id: number;
    name: string;
    email: string;
    phone: string;
    license_number: string;
}

export default function CompaniesPage() {
    const { companies, stats, drivers } = usePage<
        SharedData & {
            companies: Company[];
            drivers: Driver[];
            stats: {
                total_companies: number;
                active_companies: number;
                total_employees: number;
                pending_requests: number;
            };
        }
    >().props;

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAssignDriverDialogOpen, setIsAssignDriverDialogOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        address: '',
        phone: '',
        email: '',
        is_active: true,
        admin_email: '',
    });

    const [assignDriverForm, setAssignDriverForm] = useState({
        driver_id: '',
        contract_start_date: '',
        contract_end_date: '',
        status: 'active',
        terms: '',
    });

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            address: '',
            phone: '',
            email: '',
            is_active: true,
            admin_email: '',
        });
    };

    const checkForDuplicates = (field: string, value: string) => {
        if (!companies) return false;

        return companies.some((company) => {
            if (field === 'name') {
                return company.name.toLowerCase() === value.toLowerCase();
            } else if (field === 'code') {
                return company.code.toLowerCase() === value.toLowerCase();
            } else if (field === 'email') {
                return company.email?.toLowerCase() === value.toLowerCase();
            }
            return false;
        });
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent double submission
        if (isSubmitting) return;

        // Client-side validation for duplicates
        if (checkForDuplicates('name', formData.name)) {
            toast.error('A company with this name already exists. Please choose a different name.');
            return;
        }

        if (formData.code && checkForDuplicates('code', formData.code)) {
            toast.error('A company with this code already exists. Please choose a different code.');
            return;
        }

        if (formData.email && checkForDuplicates('email', formData.email)) {
            toast.error('A company with this email already exists. Please choose a different email.');
            return;
        }

        setIsSubmitting(true);
        setIsLoading(true);

        try {
            await router.post('/companies', formData, {
                onSuccess: () => {
                    toast.success('Company created successfully');
                    setIsCreateDialogOpen(false);
                    resetForm();
                    router.reload();
                },
                onError: (errors) => {
                    // Handle validation errors
                    if (errors.name) {
                        toast.error(`Name: ${errors.name}`);
                    } else if (errors.code) {
                        toast.error(`Code: ${errors.code}`);
                    } else if (errors.email) {
                        toast.error(`Email: ${errors.email}`);
                    } else {
                        Object.values(errors).forEach((error) => {
                            toast.error(error as string);
                        });
                    }
                },
            });
        } catch (error) {
            toast.error('Failed to create company');
        } finally {
            setIsLoading(false);
            setIsSubmitting(false);
        }
    };

    const handleEditCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany) return;

        // Prevent double submission
        if (isSubmitting) return;

        // Client-side validation for duplicates (excluding current company)
        if (checkForDuplicates('name', formData.name) && formData.name !== selectedCompany.name) {
            toast.error('A company with this name already exists. Please choose a different name.');
            return;
        }

        if (formData.code && checkForDuplicates('code', formData.code) && formData.code !== selectedCompany.code) {
            toast.error('A company with this code already exists. Please choose a different code.');
            return;
        }

        if (formData.email && checkForDuplicates('email', formData.email) && formData.email !== selectedCompany.email) {
            toast.error('A company with this email already exists. Please choose a different email.');
            return;
        }

        setIsSubmitting(true);
        setIsLoading(true);

        try {
            await router.put(`/companies/${selectedCompany.id}`, formData, {
                onSuccess: () => {
                    toast.success('Company updated successfully');
                    setIsEditDialogOpen(false);
                    setSelectedCompany(null);
                    resetForm();
                    router.reload();
                },
                onError: (errors) => {
                    // Handle validation errors
                    if (errors.name) {
                        toast.error(`Name: ${errors.name}`);
                    } else if (errors.code) {
                        toast.error(`Code: ${errors.code}`);
                    } else if (errors.email) {
                        toast.error(`Email: ${errors.email}`);
                    } else {
                        Object.values(errors).forEach((error) => {
                            toast.error(error as string);
                        });
                    }
                },
            });
        } catch (error) {
            toast.error('Failed to update company');
        } finally {
            setIsLoading(false);
            setIsSubmitting(false);
        }
    };

    const handleDeleteCompany = async () => {
        if (!selectedCompany) return;

        // Prevent double submission
        if (isSubmitting) return;

        setIsSubmitting(true);
        setIsLoading(true);

        try {
            await router.delete(`/companies/${selectedCompany.id}`, {
                onSuccess: () => {
                    toast.success('Company deleted successfully');
                    setIsDeleteDialogOpen(false);
                    setSelectedCompany(null);
                    router.reload();
                },
                onError: () => {
                    toast.error('Failed to delete company');
                },
            });
        } catch (error) {
            toast.error('Failed to delete company');
        } finally {
            setIsLoading(false);
            setIsSubmitting(false);
        }
    };

    const handleResendInvitation = async (invitationId: number) => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        setIsLoading(true);

        try {
            await router.post(`/admin/invitations/${invitationId}/resend`, {}, {
                onSuccess: () => {
                    toast.success('Invitation resent successfully');
                },
                onError: () => {
                    toast.error('Failed to resend invitation');
                },
            });
        } catch (error) {
            toast.error('Failed to resend invitation');
        } finally {
            setIsLoading(false);
            setIsSubmitting(false);
        }
    };

    const openEditDialog = (company: Company) => {
        setSelectedCompany(company);
        setFormData({
            name: company.name,
            code: company.code,
            description: company.description || '',
            address: company.address || '',
            phone: company.phone || '',
            email: company.email || '',
            is_active: company.is_active,
            admin_email: '', // Not editable in edit mode
            admin_password: '', // Not editable in edit mode
        });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (company: Company) => {
        setSelectedCompany(company);
        setIsDeleteDialogOpen(true);
    };

    const openAssignDriverDialog = (company: Company) => {
        setSelectedCompany(company);
        setAssignDriverForm({
            driver_id: '',
            contract_start_date: new Date().toISOString().split('T')[0],
            contract_end_date: '',
            status: 'active',
            terms: '',
        });
        setIsAssignDriverDialogOpen(true);
    };

    const handleAssignDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCompany) return;

        if (isSubmitting) return;

        setIsSubmitting(true);
        setIsLoading(true);

        try {
            await router.post(`/companies/${selectedCompany.id}/assign-driver`, assignDriverForm, {
                onSuccess: (page) => {
                    // @ts-ignore
                    const flash = (page?.props as any)?.flash;
                    if (flash?.success) {
                        toast.success(flash.success as string);
                    } else if (flash?.error) {
                        toast.error(flash.error as string);
                    } else {
                        toast.success('Driver assigned successfully');
                    }
                    setIsAssignDriverDialogOpen(false);
                    setSelectedCompany(null);
                    setAssignDriverForm({
                        driver_id: '',
                        contract_start_date: new Date().toISOString().split('T')[0],
                        contract_end_date: '',
                        status: 'active',
                        terms: '',
                    });
                    router.reload();
                },
                onError: (errors) => {
                    Object.values(errors).forEach((error) => {
                        toast.error(error as string);
                    });
                },
            });
        } catch (error) {
            toast.error('Failed to assign driver');
        } finally {
            setIsLoading(false);
            setIsSubmitting(false);
        }
    };

    const filteredCompanies =
        companies?.filter(
            (company) =>
                company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.email?.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company Management" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Company Management</h1>
                        <p className="text-muted-foreground">Manage companies and their employees</p>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={resetForm}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Company
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create New Company</DialogTitle>
                                <DialogDescription>Add a new company to the system. A unique code will be generated automatically.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateCompany}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Company Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter company name"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="code">Company Code</Label>
                                        <Input
                                            id="code"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            placeholder="Leave empty for auto-generation"
                                            maxLength={10}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Enter company description"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Textarea
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Enter company address"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="Enter phone number"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Company Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="company@example.com"
                                                disabled={isSubmitting}
                                            />
                                            <p className="text-muted-foreground text-xs">General company contact email</p>
                                        </div>
                                    </div>

                                    {/* Admin Credentials Section */}
                                    <div className="mt-2 border-t pt-4">
                                        <h4 className="mb-3 text-sm font-semibold">Company Admin Credentials</h4>
                                        <p className="text-muted-foreground mb-4 text-xs">Create login credentials for the company administrator</p>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="admin_email">Admin Email (Login) *</Label>
                                                <Input
                                                    id="admin_email"
                                                    type="email"
                                                    value={formData.admin_email}
                                                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                                    placeholder="admin@example.com"
                                                    required
                                                    disabled={isSubmitting}
                                                />
                                                <p className="text-muted-foreground text-xs">
                                                    Email for admin login credentials (can be different from company email)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading || isSubmitting}>
                                        {isLoading ? 'Creating...' : 'Create Company'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                            <Building2 className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_companies || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
                            <Building2 className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.active_companies || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_employees || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.pending_requests || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <div className="flex items-center space-x-2">
                    <div className="relative max-w-sm flex-1">
                        <Input placeholder="Search companies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {/* Companies Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Companies</CardTitle>
                        <CardDescription>Manage all companies in the system</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <SimpleTable>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Company</TableHead>
                                    <TableHead className="w-[100px]">Code</TableHead>
                                    <TableHead className="w-[120px]">Employees</TableHead>
                                    <TableHead className="w-[250px]">Contact</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[120px]">Created</TableHead>
                                    <TableHead className="w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCompanies.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center">
                                            <div className="flex flex-col items-center space-y-2">
                                                <Building2 className="text-muted-foreground h-8 w-8" />
                                                <p className="text-muted-foreground">No companies found</p>
                                                {searchTerm && <p className="text-muted-foreground text-sm">Try adjusting your search terms</p>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCompanies.map((company) => (
                                        <TableRow
                                            key={company.id}
                                            className="hover:bg-muted/50 cursor-pointer"
                                            onClick={() => router.visit(`/company/profile/${company.id}`)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e: React.KeyboardEvent) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    router.visit(`/company/profile/${company.id}`);
                                                }
                                            }}
                                        >
                                            <TableCell className="w-[300px]">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium">{company.name}</div>
                                                    {company.description && (
                                                        <div className="text-muted-foreground line-clamp-2 text-xs">{company.description}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[100px]">
                                                <Badge variant="outline" className="text-xs">
                                                    {company.code}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="w-[120px]">
                                                <div className="flex items-center text-sm">
                                                    <Users className="text-muted-foreground mr-1 h-3 w-3" />
                                                    <span className="font-medium">{company.employees_count || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[250px]">
                                                <div className="space-y-1">
                                                    {company.email && (
                                                        <div className="flex items-center text-xs">
                                                            <Mail className="text-muted-foreground mr-1 h-3 w-3" />
                                                            <span className="truncate">{company.email}</span>
                                                        </div>
                                                    )}
                                                    {company.phone && (
                                                        <div className="flex items-center text-xs">
                                                            <Phone className="text-muted-foreground mr-1 h-3 w-3" />
                                                            <span>{company.phone}</span>
                                                        </div>
                                                    )}
                                                    {company.address && (
                                                        <div className="flex items-start text-xs">
                                                            <MapPin className="text-muted-foreground mt-0.5 mr-1 h-3 w-3 flex-shrink-0" />
                                                            <span className="line-clamp-2">{company.address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[100px]">
                                                <Badge variant={company.is_active ? 'default' : 'secondary'} className="text-xs">
                                                    {company.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="w-[120px]">
                                                <span className="text-muted-foreground text-sm">
                                                    {new Date(company.created_at).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell
                                                className="w-[80px]"
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <a href={`/company/profile/${company.id}`} className="flex items-center">
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Profile
                                                            </a>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openEditDialog(company)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openAssignDriverDialog(company)}>
                                                            <Car className="mr-2 h-4 w-4" />
                                                            Assign Driver
                                                        </DropdownMenuItem>
                                                        {company.pending_invitation_id && (
                                                            <DropdownMenuItem onClick={() => handleResendInvitation(company.pending_invitation_id!)}>
                                                                <RotateCw className="mr-2 h-4 w-4" />
                                                                Resend Admin Invite
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => openDeleteDialog(company)} className="text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </SimpleTable>
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Company</DialogTitle>
                            <DialogDescription>Update company information.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditCompany}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Company Name *</Label>
                                    <Input
                                        id="edit-name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-code">Company Code</Label>
                                    <Input
                                        id="edit-code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        maxLength={10}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-address">Address</Label>
                                    <Textarea
                                        id="edit-address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-phone">Phone</Label>
                                        <Input
                                            id="edit-phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-email">Email</Label>
                                        <Input
                                            id="edit-email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading || isSubmitting}>
                                    {isLoading ? 'Updating...' : 'Update Company'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Company</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{selectedCompany?.name}"? This action cannot be undone. All associated employees and
                                rides will also be removed.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteCompany} disabled={isLoading || isSubmitting}>
                                {isLoading ? 'Deleting...' : 'Delete Company'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign Driver Dialog */}
                <Dialog open={isAssignDriverDialogOpen} onOpenChange={setIsAssignDriverDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Assign Driver to Company</DialogTitle>
                            <DialogDescription>
                                Assign a driver to {selectedCompany?.name}. The driver will be able to receive ride requests from this company.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAssignDriver}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="driver_id">Driver *</Label>
                                    <Select
                                        value={assignDriverForm.driver_id}
                                        onValueChange={(value) => setAssignDriverForm({ ...assignDriverForm, driver_id: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a driver" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {drivers && drivers.length > 0 ? (
                                                drivers.map((driver) => (
                                                    <SelectItem key={driver.id} value={driver.id.toString()}>
                                                        {driver.name} - {driver.license_number}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="" disabled>
                                                    No approved drivers available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="contract_start_date">Contract Start Date *</Label>
                                        <Input
                                            id="contract_start_date"
                                            type="date"
                                            value={assignDriverForm.contract_start_date}
                                            onChange={(e) => setAssignDriverForm({ ...assignDriverForm, contract_start_date: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="contract_end_date">Contract End Date</Label>
                                        <Input
                                            id="contract_end_date"
                                            type="date"
                                            value={assignDriverForm.contract_end_date}
                                            onChange={(e) => setAssignDriverForm({ ...assignDriverForm, contract_end_date: e.target.value })}
                                            min={assignDriverForm.contract_start_date || new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={assignDriverForm.status}
                                        onValueChange={(value) => setAssignDriverForm({ ...assignDriverForm, status: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="terms">Terms (Optional)</Label>
                                    <Textarea
                                        id="terms"
                                        value={assignDriverForm.terms}
                                        onChange={(e) => setAssignDriverForm({ ...assignDriverForm, terms: e.target.value })}
                                        placeholder="Enter contract terms or notes"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsAssignDriverDialogOpen(false)} disabled={isSubmitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isLoading || isSubmitting}>
                                    {isLoading ? 'Assigning...' : 'Assign Driver'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
