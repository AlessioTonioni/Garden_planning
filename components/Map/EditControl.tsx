'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

interface EditControlProps {
    onCreated?: (e: any) => void;
    onEdited?: (e: any) => void;
    onDeleted?: (e: any) => void;
    onMounted?: (featureGroup: L.FeatureGroup) => void;
}

const EditControl = ({ onCreated, onEdited, onDeleted, onMounted }: EditControlProps) => {
    const map = useMap();
    const drawControlRef = useRef<L.Control.Draw>(null);
    // @ts-ignore
    const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());

    useEffect(() => {
        // Add the FeatureGroup to the map to hold Drawn Items
        map.addLayer(drawnItemsRef.current);
        if (onMounted) onMounted(drawnItemsRef.current);

        // Initialize the Draw Control
        const drawControl = new L.Control.Draw({
            edit: {
                featureGroup: drawnItemsRef.current,
                remove: true,
            },
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                },
                rectangle: {},
                circle: false,
                marker: {},
                polyline: false,
                circlemarker: false,
            },
        });

        map.addControl(drawControl);
        // @ts-ignore
        drawControlRef.current = drawControl;

        // Event Handlers
        const onDrawCreated = (e: any) => {
            const layer = e.layer;
            drawnItemsRef.current.addLayer(layer);
            if (onCreated) onCreated(e);
        };

        const onDrawEdited = (e: any) => {
            if (onEdited) onEdited(e);
        };

        const onDrawDeleted = (e: any) => {
            if (onDeleted) onDeleted(e);
        };

        map.on(L.Draw.Event.CREATED, onDrawCreated);
        map.on(L.Draw.Event.EDITED, onDrawEdited);
        map.on(L.Draw.Event.DELETED, onDrawDeleted);

        return () => {
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED, onDrawCreated);
            map.off(L.Draw.Event.EDITED, onDrawEdited);
            map.off(L.Draw.Event.DELETED, onDrawDeleted);
            // We don't remove drawnItemsRef from map strictly here to persists drawings? 
            // Actually usually we want to clear or sync. For now, cleanup.
            // map.removeLayer(drawnItemsRef.current);
        };
    }, [map, onCreated, onEdited, onDeleted, onMounted]);

    return null;
};

export default EditControl;
