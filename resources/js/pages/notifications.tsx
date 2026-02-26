import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Bell, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notifications',
        href: '/notifications',
    },
];

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Array<{ id: number; title: string; message: string; type?: 'success' | 'error' }>>([]);
    const [loading, setLoading] = useState(false);

    const pushNotification = useCallback((title: string, message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setNotifications((prev) => [...prev, { id, title, message, type }]);
        window.setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 4500);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Send Notifications" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Notification stack */}
                <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-80 flex-col gap-3">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`pointer-events-auto rounded-md border p-4 shadow-md transition ${
                                n.type === 'error'
                                    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                                    : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                            }`}
                        >
                            <div className="mb-1 text-sm font-semibold">{n.title}</div>
                            <div className="text-sm opacity-90">{n.message}</div>
                        </div>
                    ))}
                </div>

                <div className="mx-auto w-full max-w-2xl">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="rounded-md bg-neutral-100 p-2 dark:bg-neutral-800">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle>Send Push Notification</CardTitle>
                                    <CardDescription>Send FCM messages to all passengers or specific users</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="flex flex-col gap-4"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (loading) return;
                                    setLoading(true);

                                    const form = e.currentTarget as HTMLFormElement & {
                                        targetSel: HTMLSelectElement;
                                        userId: HTMLInputElement;
                                        title: HTMLInputElement;
                                        body: HTMLTextAreaElement;
                                        data: HTMLTextAreaElement;
                                        high: HTMLInputElement;
                                    };

                                    const payload: any = {
                                        target: form.targetSel.value,
                                        title: form.title.value,
                                        body: form.body.value,
                                        high_priority: form.high.checked,
                                    };

                                    if (form.targetSel.value === 'user_id' && form.userId.value) {
                                        payload.user_id = Number(form.userId.value);
                                    }

                                    try {
                                        // Using the verified API route
                                        // Using the verified API route
                                        const res = await fetch('/api/send-notification', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-Requested-With': 'XMLHttpRequest',
                                                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                                            },
                                            body: JSON.stringify({
                                                ...payload,
                                                data: form.data.value ? JSON.parse(form.data.value) : {},
                                            }),
                                        });

                                        let errorMsg = 'Failed to queue FCM notification';
                                        if (!res.ok) {
                                            try {
                                                const json = await res.json();
                                                errorMsg = json.error || json.message || errorMsg;
                                            } catch (e) {
                                                errorMsg = await res.text();
                                            }
                                            throw new Error(errorMsg);
                                        }

                                        const json = await res.json();
                                        pushNotification('Success', `Notification sent to ${json.fcm_count ?? 'users'} recipients.`, 'success');
                                    } catch (err: any) {
                                        console.error(err);
                                        pushNotification('Error', err.message, 'error');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Target Audience</label>
                                    <select
                                        name="targetSel"
                                        className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700"
                                        onChange={(e) => {
                                            const userIdInput = document.getElementsByName('userId')[0] as HTMLElement;
                                            if (e.target.value === 'user_id') {
                                                userIdInput.style.display = 'block';
                                            } else {
                                                userIdInput.style.display = 'none';
                                            }
                                        }}
                                    >
                                        <option value="all_passengers">All Passengers</option>
                                        <option value="all_drivers">All Drivers</option>
                                        <option value="user_id">Specific User ID</option>
                                    </select>
                                </div>

                                <div className="hidden" id="userIdWrapper">
                                    <input
                                        name="userId"
                                        placeholder="Enter User ID"
                                        type="number"
                                        style={{ display: 'none' }}
                                        className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Title</label>
                                    <input
                                        name="title"
                                        placeholder="Brief title"
                                        required
                                        className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Body</label>
                                    <textarea
                                        name="body"
                                        placeholder="Notification message content..."
                                        required
                                        rows={4}
                                        className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Additional Data (JSON)</label>
                                    <textarea
                                        name="data"
                                        placeholder='{"promo_code": "SAVE50", "screen": "rides"}'
                                        rows={2}
                                        className="rounded-md border border-neutral-300 bg-transparent px-3 py-2 font-mono text-sm text-xs shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700"
                                    />
                                </div>

                                <label className="inline-flex items-center gap-2 text-sm">
                                    <input type="checkbox" name="high" defaultChecked className="rounded border-neutral-300" />
                                    High Priority
                                </label>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                                >
                                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {loading ? 'Sending...' : 'Send Notification'}
                                </button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
