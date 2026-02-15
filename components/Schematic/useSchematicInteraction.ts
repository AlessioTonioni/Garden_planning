import { useState, useRef, useEffect } from 'react';

interface UseSchematicInteractionProps {
    rotation: number;
    zoom: number;
    panOffset: { x: number; y: number };
    setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    unproject: (x: number, y: number) => { lat: number; lng: number };
    contentBounds: { centerX: number; centerY: number };
    onPlace: (zoneId: string, lat: number, lng: number, type: string) => void;
    onUpdateZone: (id: string, updates: any) => void;
    onUpdateItem: (id: string, lat?: number, lng?: number, metadata?: any) => void;
    activeTool: string | null;
    setActiveTool: (t: string | null) => void;
    selectedZoneIds: string[];
    setSelectedZoneId: (id: string | null) => void;
    selectedItemIds: string[];
    setSelectedItemId: (id: string | null) => void;
    localZones: any[];
    setLocalZones: React.Dispatch<React.SetStateAction<any[]>>;
    localItems: any[];
    setLocalItems: React.Dispatch<React.SetStateAction<any[]>>;
    cosFactor: number;
    svgRef: React.RefObject<SVGSVGElement | null>;
}

export const useSchematicInteraction = ({
    rotation, zoom, panOffset, setPanOffset, unproject, contentBounds,
    onPlace, onUpdateZone, onUpdateItem,
    activeTool, setActiveTool,
    selectedZoneIds, setSelectedZoneId,
    selectedItemIds, setSelectedItemId,
    localZones, setLocalZones,
    localItems, setLocalItems,
    cosFactor, svgRef
}: UseSchematicInteractionProps) => {

    const [isDragging, setIsDragging] = useState(false);
    const [draggingVertex, setDraggingVertex] = useState<{ zoneId: string, vertexIndex: number } | null>(null);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // --- KEYBOARD MOVEMENT ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const wasdKeys = ['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
            if (wasdKeys.includes(e.key)) {
                e.preventDefault();
                const PAN_SPEED = 1 / zoom;
                let dx = 0, dy = 0;
                if (e.key.toLowerCase() === 'w') dy = PAN_SPEED;
                else if (e.key.toLowerCase() === 's') dy = -PAN_SPEED;
                else if (e.key.toLowerCase() === 'a') dx = PAN_SPEED;
                else if (e.key.toLowerCase() === 'd') dx = -PAN_SPEED;
                setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                return;
            }

            if (activeTool) return;
            if (selectedZoneIds.length === 0 && selectedItemIds.length === 0) return;

            const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (!arrowKeys.includes(e.key)) return;

            e.preventDefault();

            const DELTA = 0.000001;
            let dX = 0, dY = 0;
            if (e.key === 'ArrowUp') dY = -1;
            else if (e.key === 'ArrowDown') dY = 1;
            else if (e.key === 'ArrowLeft') dX = -1;
            else if (e.key === 'ArrowRight') dX = 1;

            const rad = (rotation * Math.PI) / 180;
            const sin = Math.sin(rad);
            const cos = Math.cos(rad);
            const dLat = (dX * sin - dY * cos) * DELTA;
            const dLng = (dX * cos + dY * sin) * (DELTA / cosFactor);

            if (selectedItemIds.length > 0) {
                setLocalItems(prev => prev.map(item => {
                    if (!selectedItemIds.includes(item.id)) return item;
                    return { ...item, lat: item.lat + dLat, lng: item.lng + dLng };
                }));
            } else if (selectedZoneIds.length > 0) {
                setLocalZones(prev => prev.map(z => {
                    if (!selectedZoneIds.includes(z.id)) return z;
                    const newGeoJson = JSON.parse(JSON.stringify(z.geoJson));
                    newGeoJson.geometry.coordinates[0] = newGeoJson.geometry.coordinates[0].map((coord: [number, number]) => [
                        coord[0] + dLng, coord[1] + dLat
                    ]);
                    return { ...z, geoJson: newGeoJson };
                }));
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            if (!keys.includes(e.key)) return;

            if (selectedItemIds.length > 0) {
                selectedItemIds.forEach(id => {
                    const item = localItems.find(i => i.id === id);
                    if (item) onUpdateItem(item.id, item.lat, item.lng);
                });
            } else if (selectedZoneIds.length > 0) {
                selectedZoneIds.forEach(id => {
                    const zone = localZones.find(z => z.id === id);
                    if (zone) onUpdateZone(zone.id, { geoJson: JSON.stringify(zone.geoJson) });
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedZoneIds, selectedItemIds, activeTool, cosFactor, rotation, zoom, onUpdateZone, onUpdateItem, localItems, localZones, setPanOffset]);

    // --- MOUSE HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0 && !activeTool) {
            setIsDragging(true);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingVertex && svgRef.current) {
            const svg = svgRef.current;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

            const angle = -rotation * Math.PI / 180;
            const ox = contentBounds.centerX;
            const oy = contentBounds.centerY;

            const px = svgP.x - panOffset.x;
            const py = svgP.y - panOffset.y;
            const rx = ox + (px - ox) * Math.cos(angle) - (py - oy) * Math.sin(angle);
            const ry = oy + (px - ox) * Math.sin(angle) + (py - oy) * Math.cos(angle);
            const sx = (rx - ox) / zoom + ox;
            const sy = (ry - oy) / zoom + oy;

            const { lat, lng } = unproject(sx, sy);

            setLocalZones(prev => prev.map(z => {
                if (z.id !== draggingVertex.zoneId) return z;
                const newGeoJson = JSON.parse(JSON.stringify(z.geoJson));
                const newCoords = [...newGeoJson.geometry.coordinates[0]];
                newCoords[draggingVertex.vertexIndex] = [lng, lat];
                if (draggingVertex.vertexIndex === 0) newCoords[newCoords.length - 1] = [lng, lat];
                newGeoJson.geometry.coordinates[0] = newCoords;
                return { ...z, geoJson: newGeoJson };
            }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (isDragging) {
            const dx = (e.clientX - lastMousePos.current.x) / zoom;
            const dy = (e.clientY - lastMousePos.current.y) / zoom;
            setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        if (draggingVertex) {
            const zone = localZones.find(z => z.id === draggingVertex.zoneId);
            if (zone) onUpdateZone(zone.id, { geoJson: JSON.stringify(zone.geoJson) });
            setDraggingVertex(null);
        }
        setIsDragging(false);
    };

    const handleZoneClick = (zone: any, e: React.MouseEvent) => {
        const isSelected = selectedZoneIds.includes(zone.id);
        if (activeTool && isSelected && svgRef.current) {
            const svg = svgRef.current;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

            const angle = -rotation * Math.PI / 180;
            const px = svgP.x - panOffset.x;
            const py = svgP.y - panOffset.y;
            const zx = px / zoom;
            const zy = py / zoom;
            const rx = zx * Math.cos(angle) - zy * Math.sin(angle);
            const ry = zx * Math.sin(angle) + zy * Math.cos(angle);
            const { lat, lng } = unproject(rx, ry);

            onPlace(zone.id, lat, lng, activeTool);
            setActiveTool(null);
        } else {
            setSelectedZoneId(isSelected ? null : zone.id);
            setActiveTool(null);
            setSelectedItemId(null);
        }
    };

    return {
        isDragging, setIsDragging,
        draggingVertex, setDraggingVertex,
        handleMouseDown, handleMouseMove, handleMouseUp,
        handleZoneClick
    };
};
