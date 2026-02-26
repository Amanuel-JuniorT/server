import 'leaflet/dist/leaflet.css';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

configureEcho({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY as string | undefined,
    wsHost: (import.meta.env.VITE_REVERB_HOST as string | undefined) ?? window.location.hostname,
    wsPort: Number((import.meta.env.VITE_REVERB_PORT as string | undefined) ?? 80),
    wssPort: Number((import.meta.env.VITE_REVERB_PORT as string | undefined) ?? 443),
    forceTLS: ((import.meta.env.VITE_REVERB_SCHEME as string | undefined) ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
});
console.log('[Echo] Initialized with Reverb', {
    wsHost: (import.meta.env.VITE_REVERB_HOST as string | undefined) ?? window.location.hostname,
    port: import.meta.env.VITE_REVERB_PORT,
    scheme: import.meta.env.VITE_REVERB_SCHEME,
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
