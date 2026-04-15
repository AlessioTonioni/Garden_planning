import { useState, useRef, useEffect } from 'react';
import { getZoneStyle, calculateArea } from './utils';
import { Layers, Droplets, FlaskConical, Trash2, LayoutDashboard } from 'lucide-react';
import { useSchematicViewport } from '../Schematic/useSchematicViewport';
import { useSchematicInteraction } from '../Schematic/useSchematicInteraction';
import { SchematicToolbar } from '../Schematic/SchematicToolbar';
import { SchematicTools } from '../Schematic/SchematicTools';
import { SchematicSidebar } from '../Schematic/SchematicSidebar';
import { AIChat } from '../AI/AIChat';

interface CopiedItem {
    zoneId: string;
    lat: number;
    lng: number;
    type: string;
    metadata: any;
}

interface SchematicViewProps {
    zones: any[];
    items: any[];
    onClose: () => void;
    onPlace: (zoneId: string, lat: number, lng: number, type: string) => void;
    onPaste: (copies: CopiedItem[]) => Promise<string[]>;
    onDeleteItem: (id: string) => void;
    onUpdateItem: (id: string, lat?: number, lng?: number, metadata?: any) => void;
    onUpdateZone: (id: string, updates: any) => void;
    isPrimary?: boolean;
    globalSelectedZoneIds?: string[];
    setGlobalSelectedZoneIds?: React.Dispatch<React.SetStateAction<string[]>>;
    globalSelectedItemIds?: string[];
    setGlobalSelectedItemIds?: React.Dispatch<React.SetStateAction<string[]>>;
}

export const SchematicView = ({
    zones, items, onClose, onPlace, onPaste, onDeleteItem, onUpdateItem, onUpdateZone,
    isPrimary = false,
    globalSelectedZoneIds = [],
    setGlobalSelectedZoneIds = (() => { }) as any,
    globalSelectedItemIds = [],
    setGlobalSelectedItemIds = (() => { }) as any
}: SchematicViewProps) => {

    const selectedZoneIds = globalSelectedZoneIds;
    const setSelectedZoneIds = setGlobalSelectedZoneIds;
    const selectedItemIds = globalSelectedItemIds;
    const setSelectedItemIds = setGlobalSelectedItemIds;

    // --- STATE ---
    const [localZones, setLocalZones] = useState(zones);
    const [localItems, setLocalItems] = useState(items);
    const [showAll, setShowAll] = useState(false);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [mobileTab, setMobileTab] = useState<'map' | 'inventory'>('map');
    const [editingMetadata, setEditingMetadata] = useState<any>(null);
    const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
    const [zoneNameInput, setZoneNameInput] = useState('');

    const svgRef = useRef<SVGSVGElement>(null);

    // --- TOUCH INTERACTION REFS (stable ones, no viewport deps) ---
    const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
    const lastPinchDistRef = useRef<number | null>(null);
    const draggingItemIdRef = useRef<string | null>(null);
    const touchDraggedRef = useRef(false);
    const localItemsRef = useRef(localItems);
    useEffect(() => { localItemsRef.current = localItems; }, [localItems]);
    const onUpdateItemRef = useRef(onUpdateItem);
    useEffect(() => { onUpdateItemRef.current = onUpdateItem; }, [onUpdateItem]);

    // Sync props to local state
    useEffect(() => { setLocalZones(zones); }, [zones]);
    useEffect(() => { setLocalItems(items); }, [items]);

    // --- HOOKS ---
    const {
        rotation, setRotation,
        zoom, setZoom,
        panOffset, setPanOffset,
        project, unproject,
        viewBox, contentBounds,
        resetView,
        centerView,
        cosFactor
    } = useSchematicViewport({ zones });

    // Refs for viewport values used in non-reactive touch event handlers
    const zoomRef = useRef(zoom);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    const rotationRef = useRef(rotation);
    useEffect(() => { rotationRef.current = rotation; }, [rotation]);
    const cosFactorRef = useRef(cosFactor);
    useEffect(() => { cosFactorRef.current = cosFactor; }, [cosFactor]);

    const {
        isDragging, setIsDragging,
        draggingVertex, setDraggingVertex,
        handleMouseDown, handleMouseMove, handleMouseUp,
        handleZoneClick
    } = useSchematicInteraction({
        rotation, zoom, panOffset, setPanOffset, unproject, contentBounds,
        onPlace, onPaste, onDeleteItem, onUpdateZone, onUpdateItem,
        activeTool, setActiveTool,
        selectedZoneIds, setSelectedZoneId: (id) => setSelectedZoneIds(id ? [id] : []),
        selectedItemIds,
        setSelectedItemId: (id) => setSelectedItemIds(id ? [id] : []),
        setSelectedItemIds,
        localZones, setLocalZones,
        localItems, setLocalItems,
        cosFactor, svgRef
    });

    const handleMultiZoneClick = (zone: any, e: React.MouseEvent) => {
        const isMeta = e.metaKey || e.ctrlKey;
        if (isMeta) {
            setSelectedZoneIds(prev =>
                prev.includes(zone.id) ? prev.filter(id => id !== zone.id) : [...prev, zone.id]
            );
            setSelectedItemIds([]);
        } else {
            handleZoneClick(zone, e);
        }
    };

    // --- TOUCH HANDLERS (pinch zoom, pan, item drag) ---
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const onTouchStart = (e: TouchEvent) => {
            if (draggingItemIdRef.current) return; // item handler takes over
            if (e.touches.length === 1) {
                lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                lastPinchDistRef.current = null;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
                lastTouchRef.current = null;
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const curZoom = zoomRef.current;
            const curRotation = rotationRef.current;
            const curCosFactor = cosFactorRef.current;
            const SCALE = 100000;

            if (draggingItemIdRef.current && e.touches.length === 1 && lastTouchRef.current) {
                // Convert screen delta → SVG viewBox delta → lat/lng delta
                const ctmInverse = svg.getScreenCTM()?.inverse();
                if (!ctmInverse) return;
                const pt1 = svg.createSVGPoint();
                pt1.x = lastTouchRef.current.x;
                pt1.y = lastTouchRef.current.y;
                const svgP1 = pt1.matrixTransform(ctmInverse);
                const pt2 = svg.createSVGPoint();
                pt2.x = e.touches[0].clientX;
                pt2.y = e.touches[0].clientY;
                const svgP2 = pt2.matrixTransform(ctmInverse);

                // Undo scale then rotation to get world-space delta
                const dvx = (svgP2.x - svgP1.x) / curZoom;
                const dvy = (svgP2.y - svgP1.y) / curZoom;
                const angle = -curRotation * Math.PI / 180;
                const drx = dvx * Math.cos(angle) - dvy * Math.sin(angle);
                const dry = dvx * Math.sin(angle) + dvy * Math.cos(angle);
                const dLat = -dry / SCALE;
                const dLng = drx / (SCALE * curCosFactor);

                // Mark as drag if moved more than 5 screen px
                const screenDx = e.touches[0].clientX - lastTouchRef.current.x;
                const screenDy = e.touches[0].clientY - lastTouchRef.current.y;
                if (Math.sqrt(screenDx * screenDx + screenDy * screenDy) > 5) {
                    touchDraggedRef.current = true;
                }

                const itemId = draggingItemIdRef.current;
                setLocalItems(prev => prev.map(item =>
                    item.id === itemId ? { ...item, lat: item.lat + dLat, lng: item.lng + dLng } : item
                ));
                lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

            } else if (e.touches.length === 1 && lastTouchRef.current) {
                // Single-finger pan
                const ctm = svg.getScreenCTM();
                const sx = ctm ? 1 / ctm.a : 1;
                const sy = ctm ? 1 / ctm.d : 1;
                const dx = (e.touches[0].clientX - lastTouchRef.current.x) * sx;
                const dy = (e.touches[0].clientY - lastTouchRef.current.y) * sy;
                setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

            } else if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
                // Two-finger pinch zoom
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const scaleFactor = dist / lastPinchDistRef.current;
                setZoom(prev => Math.min(Math.max(prev * scaleFactor, 0.1), 50));
                lastPinchDistRef.current = dist;
            }
        };

        const onTouchEnd = (e: TouchEvent) => {
            if (draggingItemIdRef.current) {
                if (touchDraggedRef.current) {
                    // Save new item position
                    const itemId = draggingItemIdRef.current;
                    const item = localItemsRef.current.find(i => i.id === itemId);
                    if (item) onUpdateItemRef.current(item.id, item.lat, item.lng);
                } else {
                    // It was a tap — switch to inventory so user can read the info
                    setMobileTab('inventory');
                }
                draggingItemIdRef.current = null;
                touchDraggedRef.current = false;
            }
            if (e.touches.length < 2) lastPinchDistRef.current = null;
            if (e.touches.length === 0) lastTouchRef.current = null;
        };

        svg.addEventListener('touchstart', onTouchStart, { passive: false });
        svg.addEventListener('touchmove', onTouchMove, { passive: false });
        svg.addEventListener('touchend', onTouchEnd, { passive: false });
        return () => {
            svg.removeEventListener('touchstart', onTouchStart);
            svg.removeEventListener('touchmove', onTouchMove);
            svg.removeEventListener('touchend', onTouchEnd);
        };
    }, [setPanOffset, setZoom, setLocalItems]);

    // --- SIDEBAR HANDLERS (Rename Zone, Edit Item Metadata etc.) ---
    // These could also be extracted to useSchematicSidebar or similar if needed,
    // but they are relatively simple UI state handlers.

    const handleEditItem = (item: any, e?: React.MouseEvent) => {
        const isMeta = e?.metaKey || e?.ctrlKey;
        if (isMeta) {
            setSelectedItemIds(prev =>
                prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
            );
            setSelectedZoneIds([]);
        } else {
            setSelectedZoneIds([]);
            setSelectedItemIds([item.id]);
            const meta = item.metadata ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata) : {};
            setEditingMetadata(meta);
            // On mobile: switch to inventory so the user can read the plant info
            setMobileTab('inventory');
        }
    };

    const handleSaveMetadata = () => {
        if (selectedItemIds.length > 0 && editingMetadata) {
            const quantityRaw = editingMetadata.quantity;
            let metadataToSave = editingMetadata;
            if (quantityRaw !== undefined && quantityRaw !== '') {
                const parsed = Number(quantityRaw);
                if (!Number.isInteger(parsed) || parsed < 1) {
                    alert('Quantity must be a positive whole number.');
                    return;
                }
                metadataToSave = { ...editingMetadata, quantity: parsed };
            }
            onUpdateItem(selectedItemIds[0], undefined, undefined, metadataToSave);
            setSelectedItemIds([]);
            setEditingMetadata(null);
        }
    };

    const handleUpdateZoneAction = (zoneId: string, field: 'lastWateredAt' | 'lastFertilizedAt') => {
        onUpdateZone(zoneId, { [field]: new Date().toISOString() });
    };

    const handleRenameZone = (zone: any) => {
        setEditingZoneId(zone.id);
        setZoneNameInput(zone.name || '');
    };

    const saveZoneName = () => {
        if (editingZoneId) {
            onUpdateZone(editingZoneId, { name: zoneNameInput });
            setEditingZoneId(null);
        }
    };

    return (
        <div className="absolute inset-0 z-[50] bg-white flex flex-col font-sans select-none overflow-hidden">

            <SchematicTools
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                visible={selectedZoneIds.length > 0}
            />

            <SchematicToolbar
                rotation={rotation} setRotation={setRotation}
                zoom={zoom} setZoom={setZoom}
                showAll={showAll} setShowAll={setShowAll}
                onReset={resetView}
                onCenter={centerView}
                onClose={onClose}
                isPrimary={isPrimary}
                hiddenOnMobile={mobileTab === 'inventory'}
            />

            {/* Main Content */}
            <div className="flex-1 flex relative overflow-hidden pb-14 md:pb-0">

                {/* Canvas Area */}
                <main className={`flex-1 overflow-hidden relative bg-slate-50 flex items-center justify-center p-8 ${mobileTab === 'inventory' ? 'hidden md:flex' : 'flex'}`}>
                    {activeTool && (
                        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-8 py-3 rounded-3xl z-[100] text-sm font-black shadow-2xl border-2 border-white uppercase tracking-widest animate-bounce">
                            ✨ Click on zone to place {activeTool}
                        </div>
                    )}

                    <svg
                        ref={svgRef}
                        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        viewBox={viewBox}
                        onWheel={(e) => {
                            const delta = e.deltaY;
                            setZoom(Math.min(Math.max((delta > 0 ? zoom / 1.1 : zoom * 1.1), 0.1), 50));
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
                            <g transform={`scale(${zoom})`}>
                                <g transform={`rotate(${rotation}, 0, 0)`}>
                                    {/* Zones Layer */}
                                    <g key="zones-layer">
                                        {localZones.map((zone) => {
                                            if (zone.geoJson.geometry.type !== 'Polygon') return null;
                                            const points = zone.geoJson.geometry.coordinates[0].map((c: any) => {
                                                const p = project(c[1], c[0]);
                                                return `${p.x},${p.y}`;
                                            }).join(' ');

                                            const style = getZoneStyle(zone.type);
                                            const isSelected = selectedZoneIds.includes(zone.id);

                                            return (
                                                <polygon
                                                    key={zone.id}
                                                    points={points}
                                                    fill={style.style.fillColor}
                                                    stroke={isSelected ? '#000' : style.style.color}
                                                    strokeWidth={isSelected ? 0.15 : 0.08}
                                                    opacity={isSelected ? 1 : 0.4}
                                                    className="cursor-pointer transition-all duration-300"
                                                    onClick={(e) => {
                                                        handleMultiZoneClick(zone, e);
                                                    }}
                                                />
                                            );
                                        })}
                                    </g>

                                    {/* Handles Layer */}
                                    <g key="handles-layer">
                                        {localZones.filter(z => selectedZoneIds.includes(z.id) && selectedZoneIds.length === 1).map(zone => {
                                            const polygonPoints = zone.geoJson.geometry.coordinates[0];
                                            return polygonPoints.map((coord: any, vIdx: number) => {
                                                if (vIdx === polygonPoints.length - 1) return null;
                                                const p = project(coord[1], coord[0]);
                                                return (
                                                    <circle
                                                        key={`${zone.id}-v-${vIdx}`}
                                                        cx={p.x}
                                                        cy={p.y}
                                                        r={0.3 / zoom}
                                                        fill="white"
                                                        stroke="#000"
                                                        strokeWidth={0.08 / zoom}
                                                        className="cursor-move hover:fill-blue-500 transition-colors shadow-lg"
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            setDraggingVertex({ zoneId: zone.id, vertexIndex: vIdx });
                                                            setIsDragging(true);
                                                            // lastMousePos handled in hook via shared ref if passed, 
                                                            // or we let the hook capture it via mouse move start
                                                            // In this refactor, hooks handle move logic assuming start is set.
                                                            // We might need to expose setLastMousePos or similar if drag starts here.
                                                            // Actually, in the hook 'handleMouseDown' sets it for pan.
                                                            // For vertex drag, we need to set it too.
                                                            // Simplification: We'll handle this in the hook's returned handler if we bind it there.
                                                            // But here we are binding inline.
                                                            // Ideally, pass handleVertexMouseDown from hook.
                                                        }}
                                                    />
                                                );
                                            });
                                        })}
                                    </g>

                                    {/* Items Layer */}
                                    <g key="items-layer">
                                        {localItems.map((item) => {
                                            const isSelected = selectedItemIds.includes(item.id);
                                            const isVisible = showAll || selectedZoneIds.includes(item.zoneId) || isSelected;

                                            if (!isVisible) return null;
                                            const p = project(item.lat, item.lng);
                                            if (!isFinite(p.x) || !isFinite(p.y)) return null;

                                            const label = (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata)?.species || '';
                                            let fontSize = item.type === 'tree' ? 1.0 : item.type === 'plant' ? 0.8 : item.type === 'flower' ? 0.8 : 0.4;

                                            return (
                                                <g key={item.id} transform={`translate(${p.x}, ${p.y})`} className="cursor-pointer">
                                                    <g
                                                        transform={`rotate(${-rotation})`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditItem(item, e);
                                                        }}
                                                        onTouchStart={(e) => {
                                                            e.stopPropagation();
                                                            draggingItemIdRef.current = item.id;
                                                            touchDraggedRef.current = false;
                                                            lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                                                            // Select the item immediately so it highlights
                                                            setSelectedZoneIds([]);
                                                            setSelectedItemIds([item.id]);
                                                            const meta = item.metadata ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata) : {};
                                                            setEditingMetadata(meta);
                                                        }}
                                                        onTouchEnd={(e) => {
                                                            // Prevent the browser from synthesising a ghost click after
                                                            // the touch sequence, which would land on a random sidebar
                                                            // item once we switch to the inventory tab.
                                                            e.preventDefault();
                                                        }}
                                                    >
                                                        {isSelected && <circle r={fontSize * 0.5} fill="none" stroke="#3b82f6" strokeWidth={0.1} strokeDasharray="0.5,0.5" className="animate-spin-slow" />}
                                                        <text textAnchor="middle" dominantBaseline="central" fontSize={fontSize}>{item.type === 'tree' ? '🌳' : item.type === 'pot' ? '🪴' : item.type === 'flower' ? '🌸' : '🌱'}</text>
                                                        {label && <text y={fontSize * 0.8} textAnchor="middle" fontSize={fontSize * 0.15} className="font-black uppercase">{label}</text>}
                                                    </g>
                                                </g>
                                            );
                                        })}
                                    </g>
                                </g>
                            </g>
                        </g>
                    </svg>
                </main>

                {/* Sidebar */}
                <SchematicSidebar
                    zones={localZones}
                    items={localItems}
                    showAll={showAll}
                    mobileVisible={mobileTab === 'inventory'}
                    selectedZoneId={selectedZoneIds.length === 1 ? selectedZoneIds[0] : null}
                    selectedZoneIds={selectedZoneIds}
                    setSelectedZoneId={(id) => setSelectedZoneIds(id ? [id] : [])}
                    editingZoneId={editingZoneId}
                    zoneNameInput={zoneNameInput}
                    setZoneNameInput={setZoneNameInput}
                    saveZoneName={saveZoneName}
                    handleRenameZone={handleRenameZone}
                    handleUpdateZoneAction={handleUpdateZoneAction}
                    selectedItemId={selectedItemIds.length === 1 ? selectedItemIds[0] : null}
                    selectedItemIds={selectedItemIds}
                    setSelectedItemId={(id) => setSelectedItemIds(id ? [id] : [])}
                    handleEditItem={handleEditItem}
                    onDeleteItem={onDeleteItem}
                    editingMetadata={editingMetadata}
                    setEditingMetadata={setEditingMetadata}
                    handleSaveMetadata={handleSaveMetadata}
                />
            </div>

            {/* Mobile bottom tab bar */}
            <div className="fixed bottom-0 left-0 right-0 z-[102] flex md:hidden bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-lg">
                <button
                    onClick={() => setMobileTab('map')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-colors ${mobileTab === 'map' ? 'text-green-600 bg-green-50' : 'text-slate-400'}`}
                >
                    <LayoutDashboard size={16} />
                    Map
                </button>
                <div className="w-px bg-slate-200" />
                <button
                    onClick={() => setMobileTab('inventory')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-colors ${mobileTab === 'inventory' ? 'text-green-600 bg-green-50' : 'text-slate-400'}`}
                >
                    <Layers size={16} />
                    Inventory
                </button>
            </div>
        </div>
    );
};
