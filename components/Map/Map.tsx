'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import EditControl from './EditControl';
import { getZoneStyle } from './utils';
import { ZoneTypeModal } from './ZoneTypeModal';
import BackupControls from './BackupControls';
import PlacementsLayer from './PlacementsLayer';
import { ZoneEditor } from './ZoneEditor';
import { SchematicView } from './SchematicView';

// Fix for default Leaflet icons in Next.js
const iconFix = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

interface MapProps {
    initialView?: 'map' | 'schematic';
}

const Map: React.FC<MapProps> = ({ initialView = 'map' }) => {
    // @ts-ignore
    const featureGroupRef = useRef<L.FeatureGroup | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingLayer, setPendingLayer] = useState<any>(null);

    // State
    const [zones, setZones] = useState<any[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<string | null>(null);

    const [showSchematic, setShowSchematic] = useState(initialView === 'schematic');

    // Sync showSchematic with prop if it changes (e.g. navigation)
    useEffect(() => {
        setShowSchematic(initialView === 'schematic');
    }, [initialView]);

    // Refs for access in Leaflet Drag/Click handlers (closures)
    const activeToolRef = useRef(activeTool);
    const selectedZoneIdRef = useRef(selectedZoneId);
    const handlePlaceItemRef = useRef<(lat: number, lng: number) => void>(() => { });

    useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
    useEffect(() => { selectedZoneIdRef.current = selectedZoneId; }, [selectedZoneId]);

    // Fetch Helper
    const loadZones = async () => {
        try {
            const res = await fetch('/api/zones');
            if (res.ok) {
                const data = await res.json();
                const parsedZones = data.map((z: any) => ({
                    ...z,
                    geoJson: JSON.parse(z.geoJson)
                }));
                setZones(parsedZones);
                syncFeatureGroup(parsedZones);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const syncFeatureGroup = (loadedZones: any[]) => {
        if (!featureGroupRef.current) return;
        featureGroupRef.current.clearLayers();

        loadedZones.forEach((zone: any) => {
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

                        // If we are in "Placement Mode" (tool active) AND clicking the correct zone
                        if (currentTool && currentZoneId === clickedZoneId) {
                            handlePlaceItemRef.current(e.latlng.lat, e.latlng.lng);
                        } else {
                            // Otherwise, just select the zone
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
    };

    useEffect(() => {
        iconFix();
        loadZones();
    }, []);

    // --- Placement Handlers ---
    const handlePlaceItem = async (lat: number, lng: number, zoneIdOverride?: string, typeOverride?: string) => {
        const targetZoneId = zoneIdOverride || selectedZoneId;
        const targetType = typeOverride || activeTool;

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
            loadZones(); // Refresh to show new item
        }
    };

    useEffect(() => { handlePlaceItemRef.current = handlePlaceItem; }, [handlePlaceItem]);

    const handleUpdateItem = async (id: string, lat?: number, lng?: number, metadata?: any) => {
        await fetch(`/api/placements/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, metadata })
        });
        loadZones(); // Refresh to show new metadata/position
    };

    const handleDeleteItem = async (id: string) => {
        await fetch(`/api/placements/${id}`, { method: 'DELETE' });
        loadZones();
    };


    // --- Zone Handlers ---
    const handleCreated = (e: any) => {
        setPendingLayer(e.layer);
        setIsModalOpen(true);
    };

    const handleTypeSelect = async (type: string, label: string) => {
        setIsModalOpen(false);
        if (!pendingLayer) return;

        const layer = pendingLayer;
        const geoJson = layer.toGeoJSON();
        const payload = { geoJson, type, name: label, notes: '' };

        const res = await fetch('/api/zones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            loadZones(); // Re-sync EVERYTHING
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

    const handleUpdateZone = async (id: string, updates: any) => {
        await fetch(`/api/zones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        loadZones();
    };

    // --- Derived State ---
    const activeZone = zones.find(z => z.id === selectedZoneId);
    // Let's show ALL placements, but only allow adding to active zone.
    const allPlacements = zones.flatMap(z => z.placements || []);

    return (
        <>
            {showSchematic && (
                <SchematicView
                    zones={zones}
                    items={allPlacements}
                    onClose={() => setShowSchematic(false)}
                    onPlace={(zoneId, lat, lng, type) => handlePlaceItem(lat, lng, zoneId, type)}
                    onDeleteItem={handleDeleteItem}
                    onUpdateItem={handleUpdateItem}
                    onUpdateZone={handleUpdateZone}
                    isPrimary={initialView === 'schematic'}
                />
            )}

            <ZoneTypeModal
                isOpen={isModalOpen}
                onSelect={handleTypeSelect}
                onCancel={handleCancelType}
            />

            {/* Zone Editor Overlay */}
            {selectedZoneId && activeZone && (
                <ZoneEditor
                    zone={activeZone}
                    onClose={() => {
                        setSelectedZoneId(null);
                        setActiveTool(null);
                    }}
                    onDeleteZone={handleDeleteZone}
                    onUpdateZone={handleUpdateZone}
                />
            )}

            <MapContainer
                center={[47.3769, 8.5417]}
                zoom={18}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
                // Deselect on map bg click
                // @ts-ignore
                onClick={() => {
                    setSelectedZoneId(null);
                    setActiveTool(null);
                }}
            >
                <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxNativeZoom={19}
                    maxZoom={22}
                />
                <TileLayer
                    attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                    url="https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}{r}.png"
                    opacity={0.6}
                    zIndex={100}
                />

                <EditControl
                    onMounted={(fg) => {
                        featureGroupRef.current = fg;
                    }}
                    onCreated={handleCreated}
                    // We disabled standard delete/edit in favor of our custom UI, 
                    // or we keep them for geometry editing? 
                    // Let's keep geometry edit, but delete via UI is safer for cascade.
                    onEdited={(e) => console.log('Edited feature')}
                    onDeleted={(e) => console.log('Deleted via toolbar')} // Fallback
                />

                <PlacementsLayer
                    placements={allPlacements}
                    activeZoneId={selectedZoneId}
                    activeTool={activeTool}
                    onPlace={handlePlaceItem}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                />

            </MapContainer>
        </>
    );
};

export default Map;
