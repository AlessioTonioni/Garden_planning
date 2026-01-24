'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import EditControl from './EditControl';
import { getZoneStyle } from './utils';
import { ZoneTypeModal } from './ZoneTypeModal';
import BackupControls from './BackupControls';

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

const Map = () => {
    // @ts-ignore
    const featureGroupRef = useRef<L.FeatureGroup | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingLayer, setPendingLayer] = useState<any>(null);

    useEffect(() => {
        iconFix();

        // Load zones and add to FeatureGroup
        const fetchZones = async () => {
            const res = await fetch('/api/zones');
            if (res.ok) {
                const data = await res.json();
                const zones = data.map((z: any) => ({ ...z, geoJson: JSON.parse(z.geoJson) }));

                if (featureGroupRef.current) {
                    featureGroupRef.current.clearLayers();
                    zones.forEach((zone: any) => {
                        // Create Leaflet layer from GeoJSON
                        const layer = L.geoJSON(zone.geoJson, {
                            onEachFeature: (feature, layer) => {
                                // @ts-ignore
                                layer.options.dbId = zone.id;

                                const typeInfo = getZoneStyle(zone.type);
                                // Apply style if it's a polygon/path
                                if (layer instanceof L.Path) {
                                    layer.setStyle(typeInfo.style);
                                }

                                layer.bindTooltip(`
                     <div class="font-bold text-sm bg-white/90 px-2 py-1 rounded shadow-sm border border-black/10">
                       ${typeInfo.icon} ${zone.name || zone.type}
                     </div>
                   `, { permanent: true, direction: 'center', className: 'bg-transparent border-0 shadow-none' });
                            }
                        });
                        layer.eachLayer((l) => {
                            // @ts-ignore
                            l.options.dbId = zone.id;
                            featureGroupRef.current?.addLayer(l);
                        });
                    });
                }
            }
        };

        fetchZones();
    }, []);

    const handleCreated = (e: any) => {
        // defer saving until type is selected
        setPendingLayer(e.layer);
        setIsModalOpen(true);
    };

    const handleTypeSelect = async (type: string, label: string) => {
        setIsModalOpen(false);
        if (!pendingLayer) return;

        const layer = pendingLayer;
        const geoJson = layer.toGeoJSON();

        // Apply visual style immediately for feedback
        const typeInfo = getZoneStyle(type);
        if (layer instanceof L.Path) {
            layer.setStyle(typeInfo.style);
        }

        // Optimistic: Add Tooltip
        layer.bindTooltip(`${typeInfo.icon} ${label}`, { permanent: true, direction: 'center' }).openTooltip();

        const payload = {
            geoJson,
            type,
            name: label,
            notes: ''
        };

        try {
            const res = await fetch('/api/zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const newZone = await res.json();
                // @ts-ignore
                layer.options.dbId = newZone.id;
            }
        } catch (err) {
            console.error('Error saving zone:', err);
        }
        setPendingLayer(null);
    };

    const handleCancelType = () => {
        setIsModalOpen(false);
        // Remove the drawn layer if cancelled
        if (pendingLayer && featureGroupRef.current) {
            featureGroupRef.current.removeLayer(pendingLayer);
        }
        setPendingLayer(null);
    };

    const handleDeleted = async (e: any) => {
        const layers = e.layers;
        layers.eachLayer(async (layer: any) => {
            const id = layer.options?.dbId;
            if (id) {
                console.log('Deleting zone:', id);
                await fetch(`/api/zones/${id}`, { method: 'DELETE' });
            }
        });
    };

    return (
        <>
            <BackupControls onRestore={() => {
                // Determine simplest way to reload. Since we have fetchZones inside useEffect with no dependency to force-trigger, 
                // we might want to extract fetchZones or just force a window reload for simplicity in this prototype phase.
                // Or better: add a simple counter state to dependency array.
                window.location.reload();
            }} />
            <ZoneTypeModal
                isOpen={isModalOpen}
                onSelect={handleTypeSelect}
                onCancel={handleCancelType}
            />
            <MapContainer
                center={[47.3769, 8.5417]}
                zoom={18}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
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
                    onEdited={(e) => console.log('Edited feature, sync not implemented yet')}
                    onDeleted={handleDeleted}
                />
            </MapContainer>
        </>
    );
};

export default Map;
