'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
});

interface MapWrapperProps {
    initialView?: 'map' | 'schematic';
}

const MapWrapper = ({ initialView = 'map' }: MapWrapperProps) => {
    return <Map initialView={initialView} />;
};

export default MapWrapper;
