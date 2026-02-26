<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function () {
            const appearance = '{{ $appearance ?? "system" }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Laravel') }}</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])

    @php
        $googleMapsKey = config('services.google.maps_key');
        $hasGoogleMapsKey = !empty($googleMapsKey);
    @endphp
    <meta name="google-maps-key-present" content="{{ $hasGoogleMapsKey ? '1' : '0' }}">
    @if ($hasGoogleMapsKey)
        <meta name="google-maps-key" content="{{ $googleMapsKey }}">
        <script id="google-maps-script"
            src="https://maps.googleapis.com/maps/api/js?key={{ $googleMapsKey }}&libraries=places" defer></script>
        <script>
            (function () {
                var s = document.getElementById('google-maps-script');
                if (!s) return;
                s.addEventListener('load', function () { console.log('[Maps] Script tag loaded'); });
                s.addEventListener('error', function (e) { console.warn('[Maps] Script tag failed to load', e); });
            })();
        </script>
    @else
        <script>
            console.warn('[Maps] No GOOGLE_MAPS_API_KEY configured (config(\'services.google.maps_key\') is empty).');
        </script>
    @endif
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>