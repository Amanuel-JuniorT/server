import Pusher from 'pusher-js';
import Echo from 'laravel-echo';

declare global {
    interface Window {
        Pusher: typeof Pusher;
    }
}

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'e0ivkfsxpiu8rzoyyve2',
    wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
    wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    disableStats: true,
    enabledTransports: ['ws'],
});

// For manual debugging:
(window as unknown as { Echo?: unknown }).Echo = echo as unknown;

// Safely access underlying pusher connector (type-guarded)
const connector = (echo.connector as unknown) as {
    pusher?: { connection?: { bind: (event: string, cb: (arg?: unknown) => void) => void } };
};
connector.pusher?.connection?.bind('connected', () => {
    console.log('✅ Connected to Reverb WebSocket server!');
});

export function listenToAdminEvents(
    eventName: string,
    callBack: (e: { role?: string } & Record<string, unknown>) => void,
): void {
    console.log('👂 Listening to register events...');
    echo
        .channel('admin')
        .listen(eventName, (e: unknown) => {
            callBack(
                (e as
                {
                    role?: string
                }
            ) ?? {});
        });
}

export default echo;
