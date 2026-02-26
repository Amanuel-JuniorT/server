import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md border border-gray-200 bg-gray-100 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <AppLogoIcon className="size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">Ethio-Cab</span>
            </div>
        </>
    );
}
