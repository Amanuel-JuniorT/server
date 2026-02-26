import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/whitelogopng.png" // Using the existing PNG file in public folder
            alt="Ethio-Cab Logo"
            className="h-full w-full object-contain"
        />
    );
}
