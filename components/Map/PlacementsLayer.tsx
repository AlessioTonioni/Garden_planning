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
    readOnly?: boolean;
}

const DraggableMarker = ({ item, onUpdate, onDelete, readOnly }: { item: any, onUpdate: any, onDelete: any, readOnly?: boolean }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const [position, setPosition] = useState({ lat: item.lat, lng: item.lng });

    return (
        <Marker
            position={[item.lat, item.lng]} // Use prop position for SSOT
            icon={getItemIcon(item.type)}
            draggable={!readOnly}
            eventHandlers={{
                dragend: (e) => {
                    if (readOnly) return;
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    onUpdate(item.id, pos.lat, pos.lng);
                },
                click: (e) => {
                    L.DomEvent.stopPropagation(e as any);
                }
            }}
        >
            {!readOnly && (
                <ItemPopup
                    item={item}
                    onDelete={() => onDelete(item.id)}
                    onUpdate={(id, metadata) => onUpdate(id, undefined, undefined, metadata)}
                />
            )}
        </Marker>
    )
}

const PlacementsLayer = ({ placements, activeZoneId, activeTool, onPlace, onUpdate, onDelete, readOnly = false }: PlacementsLayerProps) => {
    // Handle map clicks for placement
    useMapEvents({
        click(e) {
            if (!readOnly && activeZoneId && activeTool) {
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
                    readOnly={readOnly}
                />
            ))}
        </>
    );
};

export default PlacementsLayer;
