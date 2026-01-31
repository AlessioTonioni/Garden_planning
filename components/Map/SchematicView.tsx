'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { getZoneStyle } from './utils';
import { getItemIcon } from './ItemIcons';
import { Trash2, Move, Map as MapIcon, Layers, Info, Save, X } from 'lucide-react';

interface SchematicViewProps {
    zones: any[];
    items: any[];
    onClose: () => void;
    onPlace: (zoneId: string, lat: number, lng: number, type: string) => void;
    onDeleteItem: (id: string) => void;
    onUpdateItem: (id: string, lat?: number, lng?: number, metadata?: any) => void;
}

export const SchematicView = ({ zones, items, onClose, onPlace, onDeleteItem, onUpdateItem }: SchematicViewProps) => {
    // --- PERSISTENCE ---
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

    useEffect(() => { localStorage.setItem('garden_rotation', rotation.toString()); }, [rotation]);
    useEffect(() => { localStorage.setItem('garden_zoom', zoom.toString()); }, [zoom]);

    // --- EDITOR STATE ---
    const [showAll, setShowAll] = useState(false);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [editingMetadata, setEditingMetadata] = useState<any>(null);

    // --- PAN STATE ---
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);

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
    }, [zones, centerLat, centerLng]);

    // --- HANDLERS ---
    const handleEditItem = (item: any) => {
        setSelectedItemId(item.id);
        const meta = item.metadata ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata) : {};
        setEditingMetadata(meta);
    };

    const handleSaveMetadata = () => {
        if (selectedItemId && editingMetadata) {
            onUpdateItem(selectedItemId, undefined, undefined, editingMetadata);
            setSelectedItemId(null);
            setEditingMetadata(null);
        }
    };

    const handleZoneClick = (zone: any, e: React.MouseEvent) => {
        const isSelected = selectedZoneId === zone.id;
        if (activeTool && isSelected) {
            const svg = svgRef.current;
            if (svg) {
                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());

                const angle = -rotation * Math.PI / 180;
                const ox = contentBounds.centerX;
                const oy = contentBounds.centerY;

                // Subtract pan
                const px = svgP.x - panOffset.x;
                const py = svgP.y - panOffset.y;

                // Inverse rotate
                const rx = ox + (px - ox) * Math.cos(angle) - (py - oy) * Math.sin(angle);
                const ry = oy + (px - ox) * Math.sin(angle) + (py - oy) * Math.cos(angle);

                // Inverse scale
                const sx = (rx - ox) / zoom + ox;
                const sy = (ry - oy) / zoom + oy;

                const { lat, lng } = unproject(sx, sy);
                onPlace(zone.id, lat, lng, activeTool);
            }
        } else {
            setSelectedZoneId(isSelected ? null : zone.id);
            setActiveTool(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-white flex flex-col font-sans select-none overflow-hidden">
            {/* Header */}
            <header className="flex justify-between items-center p-4 border-b bg-white shadow-sm z-[40]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg border-2 border-white">
                            <MapIcon size={24} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Garden Editor</h1>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Schematic View Mode</span>
                        </div>
                    </div>

                    {selectedZoneId && (
                        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                            {['plant', 'tree', 'pot'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTool(activeTool === t ? null : t)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2
                                        ${activeTool === t ? 'bg-white shadow-md text-green-600 border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    {t === 'tree' ? '🌳' : t === 'pot' ? '🪴' : '🌱'}
                                    <span className="capitalize">{t}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6 text-slate-600">
                    <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-2xl border border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Show All</span>
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className={`w-12 h-6 rounded-full relative transition-all ${showAll ? 'bg-green-500' : 'bg-slate-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showAll ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-1 w-24">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                            <span>Rotate</span>
                            <span className="text-green-600">{rotation}°</span>
                        </div>
                        <input type="range" min="0" max="360" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-green-600" />
                    </div>

                    <div className="flex flex-col gap-1 w-24">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                            <span>Zoom</span>
                            <span className="text-green-600">{zoom.toFixed(1)}x</span>
                        </div>
                        <input type="range" min="0.5" max="5" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-green-600" />
                    </div>

                    <button
                        onClick={() => {
                            setPanOffset({ x: 0, y: 0 });
                            setZoom(1);
                            setRotation(0);
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                        Reset
                    </button>

                    <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 border-b-4 border-slate-700">
                        Close Plan
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex relative overflow-hidden">

                {/* Canvas Area */}
                <main className="flex-1 overflow-hidden relative bg-slate-50 flex items-center justify-center p-8">
                    {activeTool && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-8 py-3 rounded-3xl z-[100] text-sm font-black shadow-2xl border-2 border-white uppercase tracking-widest animate-bounce">
                            ✨ Click on zone to place {activeTool}
                        </div>
                    )}

                    <svg
                        ref={svgRef}
                        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                        viewBox={viewBox}
                        onWheel={(e) => {
                            const delta = e.deltaY;
                            setZoom(prev => {
                                const newZoom = delta > 0 ? prev / 1.1 : prev * 1.1;
                                return Math.min(Math.max(newZoom, 0.1), 50);
                            });
                        }}
                        onMouseDown={(e) => {
                            if (e.button === 0 && !activeTool) {
                                setIsDragging(true);
                                lastMousePos.current = { x: e.clientX, y: e.clientY };
                            }
                        }}
                        onMouseMove={(e) => {
                            if (isDragging) {
                                // Pan sensitivity divisor
                                const sensitivity = 5;

                                const dx = (e.clientX - lastMousePos.current.x) / (zoom * sensitivity);
                                const dy = (e.clientY - lastMousePos.current.y) / (zoom * sensitivity);

                                setPanOffset(prev => {
                                    const nextX = prev.x + dx;
                                    const nextY = prev.y + dy;

                                    // simple constraint: don't let pan offset exceed approx 1000 units
                                    // Ideally this would be dynamic based on content bounds but a simple clamp is safer/easier
                                    const CLAMP = 10;
                                    return {
                                        x: Math.max(-CLAMP, Math.min(CLAMP, nextX)),
                                        y: Math.max(-CLAMP, Math.min(CLAMP, nextY))
                                    };
                                });
                                lastMousePos.current = { x: e.clientX, y: e.clientY };
                            }
                        }}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                    >
                        <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
                            <g transform={`scale(${zoom}) rotate(${rotation}, ${contentBounds.centerX || 0}, ${contentBounds.centerY || 0})`}>
                                {/* Zones layer - always renders all zones */}
                                <g key="zones-layer">
                                    {zones.map((zone, idx) => {
                                        if (zone.geoJson.geometry.type !== 'Polygon') return null;
                                        const points = zone.geoJson.geometry.coordinates[0].map((c: any) => {
                                            const p = project(c[1], c[0]);
                                            return `${p.x},${p.y}`;
                                        }).join(' ');

                                        const style = getZoneStyle(zone.type);
                                        const isSelected = selectedZoneId === zone.id;

                                        return (
                                            <polygon
                                                key={zone.id}
                                                points={points}
                                                fill={style.style.fillColor}
                                                stroke={isSelected ? '#000' : style.style.color}
                                                strokeWidth={isSelected ? 0.3 : 0.08}
                                                opacity={isSelected ? 1 : 0.4}
                                                className="cursor-pointer"
                                                onClick={(e) => handleZoneClick(zone, e)}
                                            />
                                        );
                                    })}
                                </g>

                                {/* Items layer - visibility controlled by showAll */}
                                <g key="items-layer">
                                    {items.map((item) => {
                                        if (!showAll && selectedZoneId !== item.zoneId) return null;
                                        const p = project(item.lat, item.lng);

                                        // Safety check for invalid coordinates
                                        if (!isFinite(p.x) || !isFinite(p.y)) {
                                            console.warn('Invalid coordinates for item:', item);
                                            return null;
                                        }

                                        const label = (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata)?.species || '';
                                        let fontSize = 1.0;
                                        switch (item.type) {
                                            case 'tree': fontSize = 2.2; break;
                                            case 'plant': fontSize = 0.6; break;
                                            case 'pot': fontSize = 0.4; break;
                                        }

                                        return (
                                            <g key={item.id} transform={`translate(${p.x}, ${p.y})`} className="cursor-pointer">
                                                <g transform={`rotate(${-rotation})`} onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditItem(item);
                                                }}>
                                                    <text textAnchor="middle" dominantBaseline="middle" fontSize={fontSize}>
                                                        {item.type === 'tree' ? '🌳' : item.type === 'pot' ? '🪴' : '🌱'}
                                                    </text>
                                                    {label && (
                                                        <text y={fontSize * 0.8} textAnchor="middle" fontSize={fontSize * 0.3} fill="#1e293b" className="font-black uppercase">
                                                            {label}
                                                        </text>
                                                    )}
                                                </g>
                                            </g>
                                        );
                                    })}
                                </g>
                            </g>
                        </g>
                    </svg>
                </main>

                {/* Sidebar */}
                <aside className="w-96 bg-white border-l shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[30] flex flex-col p-8 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-8">
                        <Layers size={14} className="text-green-600" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Garden Inventory</h3>
                    </div>

                    {zones.map(zone => {
                        const localItems = items.filter(i => i.zoneId === zone.id);
                        if (localItems.length === 0 && !showAll) return null;

                        return (
                            <div key={zone.id} className="mb-10">
                                <header
                                    className="flex items-center justify-between mb-4 cursor-pointer group"
                                    onClick={() => setSelectedZoneId(selectedZoneId === zone.id ? null : zone.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full transition-all ${selectedZoneId === zone.id ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)] scale-125' : 'bg-slate-200'}`} />
                                        <span className={`text-sm font-black uppercase text-slate-800 tracking-tight ${selectedZoneId !== zone.id && 'opacity-40'}`}>
                                            {zone.name}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-200">{localItems.length} ITEMS</span>
                                </header>

                                <div className="space-y-3">
                                    {localItems.map(item => {
                                        const isEditing = selectedItemId === item.id;
                                        const metadata = isEditing ? editingMetadata : (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata);

                                        return (
                                            <div
                                                key={item.id}
                                                className={`transition-all border rounded-2xl p-4 flex flex-col gap-3 group/item cursor-pointer
                                                    ${isEditing ? 'bg-white border-green-500 shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}
                                                onClick={() => handleEditItem(item)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-xl">{item.type === 'tree' ? '🌳' : item.type === 'pot' ? '🪴' : '🌱'}</div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-slate-800 uppercase">{metadata?.species || item.type}</span>
                                                            <span className="text-[8px] font-bold text-slate-400">Lat: {item.lat.toFixed(5)}</span>
                                                        </div>
                                                    </div>
                                                    {!isEditing && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) onDeleteItem(item.id); }}
                                                            className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover/item:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>

                                                {isEditing && (
                                                    <div className="flex flex-col gap-3 pt-3 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                                                        <input
                                                            autoFocus
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20"
                                                            value={editingMetadata?.species || ''}
                                                            onChange={e => setEditingMetadata({ ...editingMetadata, species: e.target.value })}
                                                            onKeyDown={e => e.key === 'Enter' && handleSaveMetadata()}
                                                            placeholder="Species Name..."
                                                        />
                                                        <div className="flex gap-2">
                                                            <button onClick={handleSaveMetadata} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95">Save</button>
                                                            <button onClick={() => setSelectedItemId(null)} className="px-4 bg-slate-100 text-slate-500 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">X</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </aside>
            </div>
        </div>
    );
};
