'use client';

import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

export const AutoCenter = ({ zones }: { zones: any[] }) => {
    const map = useMap();

    useEffect(() => {
        if (zones.length > 0) {
            const group = new L.FeatureGroup();
            zones.forEach(z => {
                const layer = L.geoJSON(z.geoJson);
                group.addLayer(layer);
            });
            const bounds = group.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 });
            }
        }
    }, [zones, map]);

    return null;
};
