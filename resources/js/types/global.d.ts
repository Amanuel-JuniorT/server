export {};

declare global {
	interface Window {
		google?: any;
	}
}

import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
}
