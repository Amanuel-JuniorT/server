import { Button } from '@/components/ui/button';
import { Table, tableDataClass } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Driver, type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Eye, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Drivers', href: '/drivers' }];

function DriverDetailModal({ driver, open, onClose }: { driver: Driver | null; open: boolean; onClose: () => void }) {
    const statusClassName = (): string => {
        let value = '';
        if (driver?.approval_state == 'approved') {
            value = 'border-2 border-green-500 text-green-500 font-bold';
        } else if (driver?.approval_state == 'pending') {
            value = 'bg-gray-300 text-white';
        } else if (driver?.approval_state == 'rejected') {
            value = 'border-2 border-red-500 font-bold text-red-500';
        }
        return value;
    };

    if (!open || !driver) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="max-h-[90vh] w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-900">
                <div className="max-h-[70vh] overflow-y-auto">
                    <div className="mt-4 mb-4 flex justify-between">
                        <h2 className="text-xl font-bold">Driver Details</h2>
                        <div>
                            <strong>State:</strong>{' '}
                            <span className={`${statusClassName()} rounded-md p-2`}>
                                {driver.approval_state.charAt(0).toUpperCase() + driver.approval_state.slice(1)}
                            </span>
                        </div>
                    </div>
                    <div className="w-full border-b-2 border-gray-500"></div>
                    {driver.approval_state === 'Not Submitted' ? (
                        <div className="mb-2">
                            <span className="mt-2 block text-gray-400">Driver has not submitted yet</span>
                        </div>
                    ) : (
                        <div className="mb-2">
                            <div className="flex items-center justify-center">
                                {driver.profile_picture_path ? (
                                    <a href={driver.profile_picture_path} target="_blank" rel="noopener noreferrer" className="align-middle">
                                        <img
                                            src={driver.profile_picture_path}
                                            alt="Profile"
                                            className="mt-2 h-32 w-32 cursor-pointer rounded-full border object-cover"
                                        />
                                    </a>
                                ) : (
                                    <span className="mt-2 block text-gray-400">No profile picture</span>
                                )}
                            </div>
                        </div>
                    )}

                    <ul className="mb-4">
                        <li>
                            <strong>Name:</strong> {driver.name}
                        </li>
                        <li>
                            <strong>Email:</strong> {driver.email}
                        </li>
                        <li>
                            <strong>Phone:</strong> {driver.phone}
                        </li>
                        <li>
                            <strong>License Number:</strong> {driver.license_number}
                        </li>
                        <li>
                            <strong>Status:</strong> {driver.status}
                        </li>
                        <li>
                            <strong>Vehicle Type:</strong> {(driver.vehicle_type as string) || 'N/A'}
                        </li>
                        <li>
                            <strong>Vehicle Details:</strong> {(driver.vehicle_details as string) || 'N/A'}
                        </li>
                        <li>
                            <strong>Created At:</strong> {driver.created_at}
                        </li>
                        <li>
                            <strong>Updated At:</strong> {driver.updated_at}
                        </li>
                    </ul>
                    <div className="mb-4">
                        <div className="mb-2">
                            <strong>License Picture:</strong>
                            {driver.approval_state === 'Not Submitted' ? (
                                <div>
                                    <span className="mt-2 block text-gray-400">Driver has not submitted yet</span>
                                </div>
                            ) : (
                                <div>
                                    {driver.license_image_path ? (
                                        <a href={driver.license_image_path} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={driver.license_image_path}
                                                alt="License"
                                                className="mt-2 h-24 w-24 cursor-pointer border object-cover"
                                            />
                                        </a>
                                    ) : (
                                        <span className="mt-2 block text-gray-400">No license picture</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="mb-2">
                            <strong>Car Picture:</strong>
                            {driver.approval_state === 'Not Submitted' ? (
                                <div>
                                    <span className="mt-2 block text-gray-400">Driver has not submitted yet</span>
                                </div>
                            ) : (
                                <div>
                                    {driver.car_picture_path ? (
                                        <a href={driver.car_picture_path} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={driver.car_picture_path}
                                                alt="Car"
                                                className="mt-2 h-24 w-24 cursor-pointer border object-cover"
                                            />
                                        </a>
                                    ) : (
                                        <span className="mt-2 block text-gray-400">No car picture</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {driver.approval_state === 'rejected' && (
                            <div className="mb-2">
                                <strong>Rejected Reason:</strong>

                                <div>
                                    <span className="mt-2 block">{driver.reject_message}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <button className="mt-2 rounded bg-blue-500 px-4 py-2 text-white" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}

export function RejectReasonModal({
    value,
    onChange,
    open,
    onClose,
    onSubmit,
}: {
    value: string;
    onChange: (v: string) => void;
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
}) {
    const [errorShown, setErrorShown] = useState(false);
    const handleSubmit = () => {
        if (!value) {
            setErrorShown(true);
        } else {
            setErrorShown(false);
            onSubmit();
        }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="max-h-[90vh] w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-900">
                <div className="max-h-[70vh] overflow-y-auto">
                    <div className="mt-4 mb-4 flex items-center">
                        <button className="mr-2 rounded bg-red-500 px-4 py-2 text-white" onClick={onClose}>
                            X
                        </button>
                        <h2 className="text-xl font-bold">Reject Reason</h2>
                    </div>
                    <div className="w-full border-b-2 border-gray-500"></div>
                    <div className="mt-2 mb-2">
                        <strong>Reason:</strong>
                        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border px-3 py-2" />
                        {errorShown && <p className="text-red-500">Please enter reason</p>}
                    </div>
                    <button className="mt-2 rounded bg-blue-500 px-4 py-2 text-white" onClick={handleSubmit}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DriversPage() {
    const { data, setData, post, processing, errors, reset } = useForm<Required<{ reject_message: string }>>({
        reject_message: '',
    });
    const { drivers } = usePage<{ drivers: Driver[] }>().props;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [approvalState, setApprovalState] = useState('');
    const [filteredDrivers, setFilteredDrivers] = useState(drivers);
    const [modalOpen, setModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    useEffect(() => {
        console.log('Drivers Data Received:', drivers);
    }, [drivers]);

    drivers.map((driver) => {
        console.log(driver.noOfRides);
    });

    console.log(filteredDrivers);

    const status: Record<string, string> = { available: 'Available', on_ride: 'On Ride', offline: 'Offline' };
    useEffect(() => {
        setFilteredDrivers(
            drivers.filter((driver) => {
                const matchesSearch =
                    driver.name.toLowerCase().includes(search.toLowerCase()) ||
                    driver.email?.toLowerCase().includes(search.toLowerCase()) ||
                    driver.phone.toLowerCase().includes(search.toLowerCase());
                const matchesStatus = !statusFilter || driver.status === statusFilter;
                const matchesApprovalState = !approvalState || driver.approval_state === approvalState;
                return matchesSearch && matchesStatus && matchesApprovalState;
            }),
        );
    }, [search, statusFilter, drivers, approvalState]);

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        { key: 'license_number', header: 'License Number' },
        { key: 'status', header: 'Status' },
        { key: 'noOfRides', header: 'Number of Rides' },
        { key: 'approval_state', header: 'Approval State' },
        { key: 'actions', header: 'Actions' },
    ];

    const approveDriver = (driverId: number) => {
        post(route('drivers.approve', driverId), {
            onSuccess: () => {
                router.reload({ only: ['pendingActions'] });
            },
        });
    };

    const rejectDriver = (driverId: number) => {
        post(route('drivers.reject', driverId), {
            data: {
                reject_message: data.reject_message,
            },
            onFinish: () => {
                reset();
                setRejectModalOpen(false);
            },
            onSuccess: () => {
                router.reload({ only: ['pendingActions'] });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Drivers" />
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-bold">Drivers</h1>
                <p className="text-muted-foreground">Driver management and overview will appear here.</p>
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded border px-3 py-2 md:w-64"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full rounded border px-3 py-2 md:w-48"
                    >
                        <option value="">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="on_ride">On Ride</option>
                        <option value="offline">Offline</option>
                    </select>
                    <select
                        value={approvalState}
                        onChange={(e) => setApprovalState(e.target.value)}
                        className="w-full rounded border px-3 py-2 md:w-48"
                    >
                        <option value="">All States</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div className="w-full">
                    <div className="overflow-x-auto rounded-lg border">
                        <div className="min-w-[1000px]">
                            <Table
                                columns={columns}
                                data={filteredDrivers}
                                renderRow={(row, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-neutral-900">
                                        <td className={tableDataClass(rowIdx, columns)}>{row.id}</td>
                                        <td className={tableDataClass(rowIdx, columns)}>{row.name}</td>
                                        <td className={tableDataClass(rowIdx, columns)}>{row.email}</td>
                                        <td className={tableDataClass(rowIdx, columns)}>{row.phone}</td>
                                        <td className={tableDataClass(rowIdx, columns)}>{row.license_number}</td>
                                        <td className={tableDataClass(rowIdx, columns)}>{status[row.status as keyof typeof status] || row.status}</td>
                                        <td className={tableDataClass(rowIdx, columns)}>{row.noOfRides}</td>
                                        <td
                                            className={`${row.approval_state == 'approved' ? 'text-green-500' : row.approval_state == 'rejected' ? 'text-red-500' : row.approval_state == 'pending' && 'text-yellow-500'} font-bold ${tableDataClass(rowIdx, columns)}`}
                                        >
                                            {row.approval_state.charAt(0).toUpperCase() + row.approval_state.slice(1)}
                                        </td>
                                        <td className={tableDataClass(rowIdx, columns)}>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedDriver(row);
                                                        setModalOpen(true);
                                                    }}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Quick View
                                                </Button>
                                                {row.approval_state !== 'Not Submitted' && (
                                                    <Button size="sm" asChild>
                                                        <Link href={`/driver/profile/${row.id}`}>
                                                            <UserIcon className="mr-2 h-4 w-4" />
                                                            View Profile
                                                        </Link>
                                                    </Button>
                                                )}
                                                {row.approval_state === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="positive"
                                                            onClick={() => {
                                                                approveDriver(row.id);
                                                            }}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                setRejectModalOpen(true);
                                                                setSelectedDriver(row);
                                                            }}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            />
                        </div>
                    </div>
                </div>
                <RejectReasonModal
                    value={data.reject_message}
                    onChange={(v) => setData('reject_message', v)}
                    open={rejectModalOpen}
                    onClose={() => setRejectModalOpen(false)}
                    onSubmit={() => selectedDriver && rejectDriver(selectedDriver.id)}
                />
                <DriverDetailModal driver={selectedDriver} open={modalOpen} onClose={() => setModalOpen(false)} />
            </div>
        </AppLayout>
    );
}
