import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import { getZoneStyle } from '@/components/Map/utils';
import { Zone, Placement } from '@/lib/types';

export function useGardenData(featureGroupRef: React.MutableRefObject<L.FeatureGroup | null>) {
    const [zones, setZones] = useState<Zone[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingLayer, setPendingLayer] = useState<L.Layer | null>(null);

    // Refs for access in Leaflet Drag/Click handlers (closures)
    const activeToolRef = useRef(activeTool);
    const selectedZoneIdRef = useRef(selectedZoneId);

    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { selectedZoneIdRef.current = selectedZoneId; }, [selectedZoneId]);

    const syncFeatureGroup = useCallback((loadedZones: Zone[]) => {
        if (!featureGroupRef.current) return;
        featureGroupRef.current.clearLayers();

        loadedZones.forEach((zone: Zone) => {
            const layer = L.geoJSON(zone.geoJson, {
                onEachFeature: (feature, l) => {
                    // @ts-ignore
                    l.options.dbId = zone.id;
                    const typeInfo = getZoneStyle(zone.type);
                    if (l instanceof L.Path) {
                        l.setStyle(typeInfo.style);
                    }

                    // Click handler
                    l.on('click', (e) => {
                        L.DomEvent.stopPropagation(e);

                        const currentTool = activeToolRef.current;
                        const currentZoneId = selectedZoneIdRef.current;
                        const clickedZoneId = zone.id;

                        if (currentTool && currentZoneId === clickedZoneId) {
                            handlePlaceItem(e.latlng.lat, e.latlng.lng);
                        } else {
                            setSelectedZoneId(clickedZoneId);
                            setActiveTool(null);
                        }
                    });

                    l.bindTooltip(`
                        <div class="text-lg">${typeInfo.icon}</div>
                      `, { permanent: true, direction: 'center', className: 'bg-transparent border-0 shadow-none' });
                }
            });
            layer.eachLayer((l) => {
                // @ts-ignore
                l.options.dbId = zone.id;
                featureGroupRef.current?.addLayer(l);
            });
        });
    }, [featureGroupRef]);

    const loadZones = useCallback(async () => {
        try {
            const res = await fetch('/api/zones');
            if (res.ok) {
                const data = await res.json();
                const parsedZones = data.map((z: any): Zone => ({
                    ...z,
                    geoJson: JSON.parse(z.geoJson)
                }));
                setZones(parsedZones);
                syncFeatureGroup(parsedZones);
            }
        } catch (err) {
            console.error(err);
        }
    }, [syncFeatureGroup]);

    const handlePlaceItem = async (lat: number, lng: number, zoneIdOverride?: string, typeOverride?: string) => {
        const targetZoneId = zoneIdOverride || selectedZoneIdRef.current;
        const targetType = typeOverride || activeToolRef.current;

        if (!targetZoneId || !targetType) return;

        const payload = {
            zoneId: targetZoneId,
            type: targetType,
            lat,
            lng,
            metadata: {}
        };

        const res = await fetch('/api/placements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            loadZones();
        }
    };

    const handleUpdateItem = async (id: string, lat?: number, lng?: number, metadata?: any) => {
        await fetch(`/api/placements/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, metadata })
        });
        loadZones();
    };

    const handleDeleteItem = async (id: string) => {
        await fetch(`/api/placements/${id}`, { method: 'DELETE' });
        loadZones();
    };

    const handleCreated = (e: { layer: L.Layer }) => {
        setPendingLayer(e.layer);
        setIsModalOpen(true);
    };

    const handleTypeSelect = async (type: string, label: string) => {
        setIsModalOpen(false);
        if (!pendingLayer) return;

        const layer = pendingLayer as any;
        const geoJson = layer.toGeoJSON();
        const payload = { geoJson, type, name: label, notes: '' };

        const res = await fetch('/api/zones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            loadZones();
        }
        setPendingLayer(null);
    };

    const handleCancelType = () => {
        setIsModalOpen(false);
        if (pendingLayer && featureGroupRef.current) {
            featureGroupRef.current.removeLayer(pendingLayer);
        }
        setPendingLayer(null);
    };

    const handleDeleteZone = async (id: string) => {
        await fetch(`/api/zones/${id}`, { method: 'DELETE' });
        setSelectedZoneId(null);
        loadZones();
    };

    const handleUpdateZone = async (id: string, updates: Partial<Zone>) => {
        await fetch(`/api/zones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        loadZones();
    };

    return {
        zones,
        selectedZoneId,
        setSelectedZoneId,
        activeTool,
        setActiveTool,
        isModalOpen,
        loadZones,
        handlePlaceItem,
        handleUpdateItem,
        handleDeleteItem,
        handleCreated,
        handleTypeSelect,
        handleCancelType,
        handleDeleteZone,
        handleUpdateZone
    };
}
