import { cn } from '@/lib/utils';
import * as React from 'react';

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(({ className, checked = false, onCheckedChange, ...props }, ref) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn(
            'peer focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-input inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className,
        )}
        onClick={() => onCheckedChange?.(!checked)}
        ref={ref}
        {...props}
    >
        <div
            className={cn(
                'bg-background pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
            )}
        />
    </button>
));
Switch.displayName = 'Switch';

export { Switch };
