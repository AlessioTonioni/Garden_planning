'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
});

interface MapWrapperProps {
    initialView?: 'map' | 'schematic';
    selectedZoneIds: string[];
    setSelectedZoneIds: React.Dispatch<React.SetStateAction<string[]>>;
    selectedItemIds: string[];
    setSelectedItemIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const MapWrapper = ({ initialView = 'map', selectedZoneIds, setSelectedZoneIds, selectedItemIds, setSelectedItemIds }: MapWrapperProps) => {
    return <Map
        initialView={initialView}
        globalSelectedZoneIds={selectedZoneIds}
        setGlobalSelectedZoneIds={setSelectedZoneIds}
        globalSelectedItemIds={selectedItemIds}
        setGlobalSelectedItemIds={setSelectedItemIds}
    />;
};

export default MapWrapper;
