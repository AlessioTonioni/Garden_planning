'use client';

import { Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { getItemIcon } from './ItemIcons';
import { useState } from 'react';
import { ItemPopup } from './ItemPopup';

interface PlacementsLayerProps {
    placements: any[];
    activeZoneId: string | null;
    activeTool: string | null; // 'tree', 'pot', etc.
    onPlace: (lat: number, lng: number) => void;
    onUpdate: (id: string, lat?: number, lng?: number, metadata?: any) => void;
    onDelete: (id: string) => void;
}

const DraggableMarker = ({ item, onUpdate, onDelete }: { item: any, onUpdate: any, onDelete: any }) => {
    const [position, setPosition] = useState({ lat: item.lat, lng: item.lng });

    // Sync state with props only when not dragging (useEffect? No, simplier to just update key or rely on props)
    // Actually the issue is usually that the optimistic update is slow.
    // We can use useMemo for eventHandlers to capture current closure

    return (
        <Marker
            position={[item.lat, item.lng]} // Use prop position for SSOT
            icon={getItemIcon(item.type)}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    onUpdate(item.id, pos.lat, pos.lng);
                },
                click: (e) => {
                    L.DomEvent.stopPropagation(e as any);
                }
            }}
        >
            <ItemPopup
                item={item}
                onDelete={() => onDelete(item.id)}
                onUpdate={(id, metadata) => onUpdate(id, undefined, undefined, metadata)}
            />
        </Marker>
    )
}

const PlacementsLayer = ({ placements, activeZoneId, activeTool, onPlace, onUpdate, onDelete }: PlacementsLayerProps) => {
    // Handle map clicks for placement
    useMapEvents({
        click(e) {
            if (activeZoneId && activeTool) {
                onPlace(e.latlng.lat, e.latlng.lng);
            }
        }
    });

    return (
        <>
            {placements.map((item) => (
                <DraggableMarker
                    key={`${item.id}-${item.lat}-${item.lng}`} // Force re-render on move to snap
                    item={item}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                />
            ))}
        </>
    );
};

export default PlacementsLayer;
