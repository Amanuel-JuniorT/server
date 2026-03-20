import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface SetupBannerProps {
    setupStatus: {
        is_complete: boolean;
        progress: number;
        missing_fields: string[];
    };
}

export default function SetupBanner({ setupStatus }: SetupBannerProps) {
    if (setupStatus.is_complete) return null;

    return (
        <Alert variant="destructive" className="mb-6 border-amber-500 bg-amber-50 text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div className="flex w-full items-center justify-between gap-4">
                <div>
                    <AlertTitle className="text-amber-800 font-bold">Action Required: Complete Your Profile</AlertTitle>
                    <AlertDescription className="text-amber-700">
                        Your company profile is only {setupStatus.progress}% complete. 
                        {setupStatus.missing_fields.includes('location') && " Please set your office location to enable employee and ride management."}
                    </AlertDescription>
                </div>
                <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-md transition-all hover:scale-105">
                    <Link href="/company-admin/profile" className="flex items-center gap-1">
                        Complete Setup <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </Alert>
    );
}
