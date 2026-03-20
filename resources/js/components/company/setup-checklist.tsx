import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { CheckCircle2, Circle, MapPin, Phone, UserCircle, ArrowRight } from 'lucide-react';

interface SetupChecklistProps {
    setupStatus: {
        progress: number;
        steps: Array<{
            id: string;
            title: string;
            description: string;
            completed: boolean;
        }>;
    };
}

const stepIcons: Record<string, any> = {
    profile: UserCircle,
    phone: Phone,
    address: MapPin,
    location: MapPin,
};

export default function SetupChecklist({ setupStatus }: SetupChecklistProps) {
    return (
        <Card className="border-none shadow-xl bg-gradient-to-br from-white to-slate-50 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <CheckCircle2 className="h-24 w-24" />
            </div>
            <CardHeader>
                <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Welcome to EthioCab!
                    </CardTitle>
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                        {setupStatus.progress}% Complete
                    </span>
                </div>
                <CardDescription className="text-slate-500">
                    Complete these steps to unlock all features for your company.
                </CardDescription>
                <div className="mt-4">
                    <Progress value={setupStatus.progress} className="h-2 bg-slate-100" />
                </div>
            </CardHeader>
            <CardContent className="grid gap-4 mt-2">
                {setupStatus.steps.map((step) => {
                    const Icon = stepIcons[step.id] || Circle;
                    return (
                        <div 
                            key={step.id} 
                            className={cn(
                                "flex items-start gap-4 p-4 rounded-xl transition-all border",
                                step.completed 
                                    ? "bg-emerald-50/50 border-emerald-100 shadow-sm" 
                                    : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md cursor-pointer group"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-lg",
                                step.completed ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                            )}>
                                {step.completed ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                                <h4 className={cn(
                                    "text-sm font-bold",
                                    step.completed ? "text-emerald-800" : "text-slate-800"
                                )}>
                                    {step.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                            </div>
                            {!step.completed && (
                                <Link 
                                    href="/company-admin/profile" 
                                    className="text-indigo-600 hover:text-indigo-800 self-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ArrowRight className="h-5 w-5" />
                                </Link>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
