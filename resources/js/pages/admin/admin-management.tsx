import { Head, router, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, RotateCw, UserPlus, XCircle } from 'lucide-react';
import { useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, tableDataClass } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Admin Management', href: '/admin/management' }];

export default function AdminManagement({ admins, invitations, companies }) {
    const { auth } = usePage().props;
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [confirmingDeactivation, setConfirmingDeactivation] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        email: '',
        role: 'super_admin',
    });

    const submitInvite = (e) => {
        e.preventDefault();
        post(route('admin.invite'), {
            onSuccess: () => {
                setShowInviteModal(false);
                reset();
            },
        });
    };

    const deactivateAdmin = (id) => {
        router.post(
            `/admin/admins/${id}/deactivate`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setConfirmingDeactivation(null),
            },
        );
    };

    const reactivateAdmin = (id) => {
        router.post(
            `/admin/admins/${id}/reactivate`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const resendInvitation = (id) => {
        router.post(route('admin.invitation.resend', id));
    };

    const cancelInvitation = (id) => {
        router.delete(`/admin/invitations/${id}`, {
            preserveScroll: true,
        });
    };

    const adminColumns = [
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role' },
        { key: 'status', header: 'Status' },
        { key: 'company', header: 'Company' },
        { key: 'actions', header: 'Actions' },
    ];

    const inviteColumns = [
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role' },
        { key: 'sent_by', header: 'Sent By' },
        { key: 'sent_at', header: 'Sent At' },
        { key: 'actions', header: 'Actions' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Management" />

            <div className="flex flex-col gap-8 p-6">
                <div>
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Active Admins</h2>
                            <p className="text-muted-foreground">Manage administrator accounts and permissions.</p>
                        </div>
                        <Button onClick={() => setShowInviteModal(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite New Admin
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table
                            columns={adminColumns}
                            data={admins}
                            renderRow={(admin, rowIdx) => (
                                <tr key={admin.id} className="hover:bg-muted/50 transition-colors">
                                    <td className={tableDataClass(rowIdx, adminColumns)}>{admin.name}</td>
                                    <td className={tableDataClass(rowIdx, adminColumns)}>{admin.email}</td>
                                    <td className={tableDataClass(rowIdx, adminColumns)}>
                                        <span className="capitalize">{admin.role.replace('_', ' ')}</span>
                                    </td>
                                    <td className={tableDataClass(rowIdx, adminColumns)}>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                admin.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            }`}
                                        >
                                            {admin.is_active ? 'Active' : 'Deactivated'}
                                        </span>
                                    </td>
                                    <td className={tableDataClass(rowIdx, adminColumns)}>{admin.company ? admin.company.name : '-'}</td>
                                    <td className={tableDataClass(rowIdx, adminColumns)}>
                                        <div className="flex justify-end gap-2">
                                            {admin.is_active ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    onClick={() => setConfirmingDeactivation(admin)}
                                                >
                                                    Deactivate
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                                                    onClick={() => reactivateAdmin(admin.id)}
                                                >
                                                    Reactivate
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        />
                        {admins.length === 0 && <div className="text-muted-foreground p-8 text-center">No other admins found.</div>}
                    </div>
                </div>

                {invitations.length > 0 && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold tracking-tight">Pending Invitations</h2>
                            <p className="text-muted-foreground">Invitations that haven't been accepted yet.</p>
                        </div>

                        <div className="rounded-md border">
                            <Table
                                columns={inviteColumns}
                                data={invitations}
                                renderRow={(invite, rowIdx) => (
                                    <tr key={invite.id} className="hover:bg-muted/50 transition-colors">
                                        <td className={tableDataClass(rowIdx, inviteColumns)}>{invite.email}</td>
                                        <td className={tableDataClass(rowIdx, inviteColumns)}>
                                            <span className="capitalize">{invite.role.replace('_', ' ')}</span>
                                        </td>
                                        <td className={tableDataClass(rowIdx, inviteColumns)}>{invite.invited_by?.name || 'Unknown'}</td>
                                        <td className={tableDataClass(rowIdx, inviteColumns)}>{new Date(invite.created_at).toLocaleDateString()}</td>
                                        <td className={tableDataClass(rowIdx, inviteColumns)}>
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => resendInvitation(invite.id)}>
                                                    <RotateCw className="mr-2 h-4 w-4" />
                                                    Resend
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                                    onClick={() => cancelInvitation(invite.id)}
                                                >
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            <Dialog
                open={showInviteModal}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowInviteModal(false);
                        reset();
                        clearErrors();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite New Admin</DialogTitle>
                        <DialogDescription>Send an invitation email to a new administrator.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitInvite} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="super_admin">Platform Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.role} />
                        </div>


                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Send Invitation
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Deactivation Confirmation Modal */}
            <Dialog open={!!confirmingDeactivation} onOpenChange={(open) => !open && setConfirmingDeactivation(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deactivate Administrator</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to deactivate {confirmingDeactivation?.name}? They will no longer be able to log in.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setConfirmingDeactivation(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => deactivateAdmin(confirmingDeactivation.id)} disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Deactivate Admin
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
