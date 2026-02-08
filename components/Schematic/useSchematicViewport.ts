import { useState, useMemo, useEffect } from 'react';

interface ViewportState {
    rotation: number;
    zoom: number;
    panOffset: { x: number; y: number };
    centerLat: number;
    centerLng: number;
    scale: number;
    cosFactor: number;
}

interface UseSchematicViewportProps {
    zones: any[];
}

export const useSchematicViewport = ({ zones }: UseSchematicViewportProps) => {
    // --- PERSISTENCE & STATE ---
    const [rotation, setRotation] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('garden_rotation');
            return saved ? Number(saved) : 0;
        }
        return 0;
    });

    const [zoom, setZoom] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('garden_zoom');
            return saved ? Number(saved) : 1;
        }
        return 1;
    });

    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    useEffect(() => { localStorage.setItem('garden_rotation', rotation.toString()); }, [rotation]);
    useEffect(() => { localStorage.setItem('garden_zoom', zoom.toString()); }, [zoom]);

    // --- PROJECTION MATH ---
    const { centerLat, centerLng } = useMemo(() => {
        let lats: number[] = [];
        let lngs: number[] = [];
        zones.forEach(z => {
            if (z.geoJson.geometry.type === 'Polygon') {
                z.geoJson.geometry.coordinates[0].forEach((c: any) => {
                    lngs.push(c[0]);
                    lats.push(c[1]);
                });
            }
        });
        if (lats.length === 0) return { centerLat: 0, centerLng: 0 };
        return {
            centerLat: (Math.min(...lats) + Math.max(...lats)) / 2,
            centerLng: (Math.min(...lngs) + Math.max(...lngs)) / 2
        };
    }, [zones]);

    const scale = 100000;
    const cosFactor = Math.cos(centerLat * Math.PI / 180);

    const project = (lat: number, lng: number) => {
        const y = -(lat - centerLat) * scale;
        const x = (lng - centerLng) * scale * cosFactor;
        return { x, y };
    };

    const unproject = (x: number, y: number) => {
        const lat = -(y / scale) + centerLat;
        const lng = x / (scale * cosFactor) + centerLng;
        return { lat, lng };
    };

    // --- VIEW BOX CALCULATION ---
    const { viewBox, contentBounds } = useMemo(() => {
        if (zones.length === 0) return { viewBox: "-500 -500 1000 1000", contentBounds: { centerX: 0, centerY: 0 } };
        let projectedX: number[] = [];
        let projectedY: number[] = [];
        zones.forEach(z => {
            if (z.geoJson.geometry.type === 'Polygon') {
                z.geoJson.geometry.coordinates[0].forEach((c: any) => {
                    const p = project(c[1], c[0]);
                    projectedX.push(p.x);
                    projectedY.push(p.y);
                });
            }
        });
        const minX = Math.min(...projectedX);
        const maxX = Math.max(...projectedX);
        const minY = Math.min(...projectedY);
        const maxY = Math.max(...projectedY);
        const w = maxX - minX;
        const h = maxY - minY;
        const padding = Math.max(w, h) * 0.4;
        return {
            viewBox: `${minX - padding / 2} ${minY - padding / 2} ${w + padding} ${h + padding}`,
            contentBounds: { centerX: (minX + maxX) / 2, centerY: (minY + maxY) / 2 }
        };
    }, [zones, centerLat, centerLng, scale, cosFactor]); // Added missing deps

    const resetView = () => {
        setPanOffset({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
    };

    return {
        rotation, setRotation,
        zoom, setZoom,
        panOffset, setPanOffset,
        project, unproject,
        viewBox, contentBounds,
        resetView,
        scale, cosFactor, centerLat // Exported for interaction hook if needed
    };
};
