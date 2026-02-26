import { Button } from '@/components/ui/button';
import { Table, tableDataClass } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { User, type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Eye, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

declare global {
    interface Window {
        Echo: {
            channel: (channel: string) => {
                listen: (event: string, callback: (event: UserRegisteredEvent) => void) => void;
                leave: () => void;
            };
            leave: (channel: string) => void;
        };
    }
}

interface UserRegisteredEvent {
    user: User;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Passengers', href: '/passengers' }];

function PassengerDetailModal({ passenger, open, onClose }: { passenger: User | null; open: boolean; onClose: () => void }) {
    if (!open || !passenger) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="max-h-[90vh] w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-900">
                <div className="max-h-[70vh] overflow-y-auto">
                    <h2 className="mb-4 text-xl font-bold">Passenger Details</h2>
                    <ul className="mb-4">
                        <li>
                            <strong>Name:</strong> {passenger.name}
                        </li>
                        <li>
                            <strong>Email:</strong> {passenger.email}
                        </li>
                        <li>
                            <strong>Phone:</strong> {passenger.phone}
                        </li>
                    </ul>
                </div>
                <button className="mt-2 rounded bg-blue-500 px-4 py-2 text-white" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}

export default function PassengersPage() {
    const { passengers: initialPassengers = [] } = usePage<{ passengers: User[] }>().props;
    const [passengers, setPassengers] = useState<User[]>(initialPassengers);
    const [search, setSearch] = useState('');
    const [filteredPassengers, setFilteredPassengers] = useState(passengers);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPassenger, setSelectedPassenger] = useState<User | null>(null);

    useEffect(() => {
        setFilteredPassengers(
            passengers.filter((passenger) => {
                const matchesSearch =
                    passenger.name.toLowerCase().includes(search.toLowerCase()) ||
                    passenger.email?.toLowerCase().includes(search.toLowerCase()) ||
                    passenger.phone.toLowerCase().includes(search.toLowerCase());
                return matchesSearch;
            }),
        );
    }, [search, passengers]);

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        { key: 'actions', header: 'Actions' },
    ];

    // Listen for real-time updates
    useEffect(() => {
        // Check if Echo is available
        if (window.Echo) {
            // Listen for new user registrations
            window.Echo.channel('users').listen('user.registered', (event: UserRegisteredEvent) => {
                // Add new user to the list
                setPassengers((prev) => [...prev, event.user]);
            });

            return () => {
                if (window.Echo) {
                    window.Echo.leave('users');
                }
            };
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Passengers" />
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-bold">Passengers</h1>
                <p className="text-muted-foreground">Passenger management and overview will appear here.</p>
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded border px-3 py-2 md:w-64"
                    />
                </div>
                <Table
                    columns={columns}
                    data={filteredPassengers}
                    renderRow={(row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-neutral-900">
                            <td className={tableDataClass(rowIdx, columns)}>{row.id}</td>
                            <td className={tableDataClass(rowIdx, columns)}>{row.name}</td>
                            <td className={tableDataClass(rowIdx, columns)}>{row.email}</td>
                            <td className={tableDataClass(rowIdx, columns)}>{row.phone}</td>
                            <td className={tableDataClass(rowIdx, columns)}>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedPassenger(row);
                                            setModalOpen(true);
                                        }}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                    </Button>
                                    <Button size="sm" asChild>
                                        <Link href={`/passenger/profile/${row.id}`}>
                                            <UserIcon className="mr-2 h-4 w-4" />
                                            View Profile
                                        </Link>
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    )}
                />
                <PassengerDetailModal passenger={selectedPassenger} open={modalOpen} onClose={() => setModalOpen(false)} />
            </div>
        </AppLayout>
    );
}
