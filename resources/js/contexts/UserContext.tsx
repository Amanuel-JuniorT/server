import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePage } from '@inertiajs/react';

interface UserData {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    avatar?: string;
    role?: string;
    driver_id?: number;
    license_number?: string;
    status?: string;
    approval_state?: string;
    noOfRides?: number;
    email_verified_at?: string | null;
    created_at: string;
    updated_at: string;
}

interface UserContextType {
    userData: UserData | null;
    isLoading: boolean;
    error: string | null;
    fetchUserData: (userId: number) => Promise<void>;
    clearUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
};

interface UserProviderProps {
    children: ReactNode;
    userId?: number;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children, userId }) => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUserData = async (userId: number) => {
        setIsLoading(true);
        setError(null);
        
        try {
            // In a real app, this would be an API call
            // For now, we'll simulate fetching user data
            const mockUserData: UserData = {
                id: userId,
                name: `User ${userId}`,
                email: `user${userId}@example.com`,
                phone: `+123456789${userId}`,
                address: `Address ${userId}, City, Country`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                role: userId % 2 === 0 ? 'driver' : 'passenger',
                driver_id: userId % 2 === 0 ? userId : undefined,
                license_number: userId % 2 === 0 ? `LIC${userId}` : undefined,
                status: userId % 2 === 0 ? 'available' : undefined,
                approval_state: userId % 2 === 0 ? 'approved' : undefined,
                noOfRides: userId % 2 === 0 ? Math.floor(Math.random() * 100) + 10 : undefined,
            };
            
            setUserData(mockUserData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        } finally {
            setIsLoading(false);
        }
    };

    const clearUserData = () => {
        setUserData(null);
        setError(null);
    };

    // Fetch user data when userId changes
    useEffect(() => {
        if (userId) {
            fetchUserData(userId);
        }
    }, [userId]);

    const value: UserContextType = {
        userData,
        isLoading,
        error,
        fetchUserData,
        clearUserData,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
