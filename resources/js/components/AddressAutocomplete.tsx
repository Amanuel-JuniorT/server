import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useRef, useState } from 'react';

type Suggestion = {
    display_name: string;
    lat: string;
    lon: string;
};

export interface AddressAutocompleteValue {
    address: string;
    lat: number;
    lng: number;
}

export function AddressAutocomplete({
    label,
    placeholder,
    value,
    onChange,
    className,
}: {
    label?: string;
    placeholder?: string;
    value?: AddressAutocompleteValue | null;
    onChange: (val: AddressAutocompleteValue | null) => void;
    className?: string;
}) {
    const [query, setQuery] = useState(value?.address ?? '');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const controllerRef = useRef<AbortController | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setQuery(value?.address ?? '');
    }, [value?.address]);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    // Explicit search (Addis Ababa, Ethiopia bounded) - triggered by button or Enter
    const performSearch = useMemo(() => {
        return async (q: string) => {
            if (!q || q.trim().length < 3) {
                setSuggestions([]);
                return;
            }
            try {
                controllerRef.current?.abort();
                const controller = new AbortController();
                controllerRef.current = controller;
                setLoading(true);
                const url = new URL('https://nominatim.openstreetmap.org/search');
                url.searchParams.set('format', 'jsonv2');
                url.searchParams.set('limit', '6');
                url.searchParams.set('q', q);
                url.searchParams.set('countrycodes', 'et');
                // Addis Ababa bbox: left,top,right,bottom (lon,lat)
                url.searchParams.set('viewbox', '38.65,9.15,38.95,8.80');
                url.searchParams.set('bounded', '1');
                const res = await fetch(url.toString(), {
                    signal: controller.signal,
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) throw new Error('Failed to fetch suggestions');
                const data: Suggestion[] = await res.json();
                setSuggestions(data);
            } catch (e) {
                if ((e as any)?.name !== 'AbortError') {
                    setSuggestions([]);
                }
            } finally {
                setLoading(false);
            }
        };
    }, []);

    return (
        <div className={cn('relative', className)} ref={containerRef}>
            {label && <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200">{label}</label>}
            <div className="flex items-center gap-2">
                <Input
                    value={query}
                    placeholder={placeholder || 'Search address (Addis Ababa, Ethiopia)'}
                    onChange={(e) => {
                        setQuery(e.target.value);
                    }}
                    onFocus={() => setOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            setOpen(true);
                            performSearch(query);
                        }
                    }}
                />
                <button
                    type="button"
                    className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
                    onClick={() => {
                        setOpen(true);
                        performSearch(query);
                    }}
                >
                    Search
                </button>
            </div>
            {open && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-neutral-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900">
                    {loading ? (
                        <div className="p-3 text-sm text-neutral-500 dark:text-neutral-400">Searching...</div>
                    ) : suggestions.length === 0 ? (
                        <div className="p-3 text-sm text-neutral-500 dark:text-neutral-400">No results</div>
                    ) : (
                        <ul className="max-h-64 overflow-auto">
                            {suggestions.map((s, idx) => (
                                <li
                                    key={`${s.lat}-${s.lon}-${idx}`}
                                    className="cursor-pointer px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    onClick={() => {
                                        const selected = {
                                            address: s.display_name,
                                            lat: Number(s.lat),
                                            lng: Number(s.lon),
                                        };
                                        onChange(selected);
                                        setQuery(selected.address);
                                        setOpen(false);
                                    }}
                                >
                                    {s.display_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
