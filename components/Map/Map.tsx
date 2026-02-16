import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import EditControl from './EditControl';
import { ZoneTypeModal } from './ZoneTypeModal';
import PlacementsLayer from './PlacementsLayer';
import { ZoneEditor } from './ZoneEditor';
import { SchematicView } from './SchematicView';
import { useGardenData } from '@/hooks/useGardenData';

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
    globalSelectedZoneIds?: string[];
    setGlobalSelectedZoneIds?: React.Dispatch<React.SetStateAction<string[]>>;
    globalSelectedItemIds?: string[];
    setGlobalSelectedItemIds?: React.Dispatch<React.SetStateAction<string[]>>;
}

const Map: React.FC<MapProps> = ({
    initialView = 'map',
    globalSelectedZoneIds,
    setGlobalSelectedZoneIds,
    globalSelectedItemIds,
    setGlobalSelectedItemIds
}) => {
    const featureGroupRef = useRef<L.FeatureGroup | null>(null);
    const [showSchematic, setShowSchematic] = useState(initialView === 'schematic');

    const {
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
    } = useGardenData(featureGroupRef);

    useEffect(() => {
        setShowSchematic(initialView === 'schematic');
    }, [initialView]);

    useEffect(() => {
        iconFix();
        loadZones();
    }, [loadZones]);

    const activeZone = zones.find(z => z.id === selectedZoneId);
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
                    globalSelectedZoneIds={globalSelectedZoneIds}
                    setGlobalSelectedZoneIds={setGlobalSelectedZoneIds}
                    globalSelectedItemIds={globalSelectedItemIds}
                    setGlobalSelectedItemIds={setGlobalSelectedItemIds}
                />
            )}

            <ZoneTypeModal
                isOpen={isModalOpen}
                onSelect={handleTypeSelect}
                onCancel={handleCancelType}
            />

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
                    onEdited={(e) => console.log('Edited feature')}
                    onDeleted={(e) => console.log('Deleted via toolbar')}
                />

                <PlacementsLayer
                    placements={allPlacements}
                    activeZoneId={selectedZoneId}
                    activeTool={activeTool}
                    onPlace={handlePlaceItem}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    readOnly={true}
                />
            </MapContainer>
        </>
    );
};

export default Map;
