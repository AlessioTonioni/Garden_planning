import React, { useEffect, useRef } from 'react';
import { Layers, Droplets, FlaskConical, Trash2 } from 'lucide-react';
import { calculateArea } from '../Map/utils';
import { renderNotes } from '@/lib/helpers';

interface SchematicSidebarProps {
    zones: any[];
    items: any[];
    showAll: boolean;
    mobileVisible?: boolean;
    selectedZoneId: string | null;
    selectedZoneIds?: string[];
    setSelectedZoneId: (id: string | null) => void;
    editingZoneId: string | null;
    zoneNameInput: string;
    setZoneNameInput: (name: string) => void;
    saveZoneName: () => void;
    handleRenameZone: (zone: any) => void;
    handleUpdateZoneAction: (zoneId: string, field: 'lastWateredAt' | 'lastFertilizedAt') => void;
    selectedItemId: string | null;
    selectedItemIds?: string[];
    setSelectedItemId: (id: string | null) => void;
    handleEditItem: (item: any) => void;
    onDeleteItem: (id: string) => void;
    editingMetadata: any;
    setEditingMetadata: (meta: any) => void;
    handleSaveMetadata: () => void;
}

export const SchematicSidebar: React.FC<SchematicSidebarProps> = ({
    zones, items, showAll, mobileVisible = false,
    selectedZoneId, selectedZoneIds = [], setSelectedZoneId,
    editingZoneId, zoneNameInput, setZoneNameInput, saveZoneName, handleRenameZone,
    handleUpdateZoneAction,
    selectedItemId, selectedItemIds = [], setSelectedItemId,
    handleEditItem, onDeleteItem,
    editingMetadata, setEditingMetadata, handleSaveMetadata
}) => {
    const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const zoneRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        if (selectedItemId && itemRefs.current[selectedItemId]) {
            itemRefs.current[selectedItemId]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [selectedItemId, mobileVisible]);

    useEffect(() => {
        if (selectedZoneId && zoneRefs.current[selectedZoneId]) {
            zoneRefs.current[selectedZoneId]?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [selectedZoneId]);

    return (
        <aside className={`${mobileVisible ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-96 bg-white border-t md:border-t-0 md:border-l shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[30] p-6 md:p-8 overflow-y-auto`}>
            <div className="flex items-center gap-2 mb-8">
                <Layers size={14} className="text-green-600" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Garden Inventory</h3>
            </div>

            {zones.map(zone => {
                const zoneItems = items.filter(i => i.zoneId === zone.id);
                const isSelected = selectedZoneIds.includes(zone.id);

                return (
                    <div key={zone.id} ref={(el) => { zoneRefs.current[zone.id] = el; }} className="mb-10">
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between cursor-pointer group" onClick={() => { setSelectedItemId(null); setSelectedZoneId(selectedZoneId === zone.id ? null : zone.id); }}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full transition-all ${isSelected ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)] scale-125' : 'bg-slate-200'}`} />
                                    {editingZoneId === zone.id ? (
                                        <input autoFocus className="text-sm font-black uppercase bg-slate-100 px-2 py-0.5 rounded w-40 text-slate-900" value={zoneNameInput} onChange={e => setZoneNameInput(e.target.value)} onBlur={saveZoneName} onKeyDown={e => e.key === 'Enter' && saveZoneName()} onClick={e => e.stopPropagation()} />
                                    ) : (
                                        <span className={`text-sm font-black uppercase text-slate-800 transition-opacity ${!isSelected && 'opacity-40'}`} onDoubleClick={(e) => { e.stopPropagation(); handleRenameZone(zone); }}>{zone.name}</span>
                                    )}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">{calculateArea(zone.geoJson).toFixed(1)} m²</span>
                                    <span className="text-[8px] font-bold text-slate-300">{zoneItems.length} ITEMS</span>
                                </div>
                            </div>
                            {selectedZoneId === zone.id && (
                                <div className="flex gap-2 mt-2 px-5">
                                    <button onClick={(e) => { e.stopPropagation(); handleUpdateZoneAction(zone.id, 'lastWateredAt'); }} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase"><Droplets size={12} /> {zone.lastWateredAt ? new Date(zone.lastWateredAt).toLocaleDateString() : 'Water'}</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleUpdateZoneAction(zone.id, 'lastFertilizedAt'); }} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[9px] font-black uppercase"><FlaskConical size={12} /> {zone.lastFertilizedAt ? new Date(zone.lastFertilizedAt).toLocaleDateString() : 'Fertilize'}</button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 pt-4">
                            {zoneItems.map(item => {
                                const isEditing = selectedItemId === item.id;
                                const metadata = isEditing ? editingMetadata : (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata);
                                return (
                                    <div
                                        key={item.id}
                                        ref={(el) => { itemRefs.current[item.id] = el; }}
                                        className={`transition-all border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer ${isEditing ? 'bg-white border-green-500 shadow-xl' : 'bg-slate-50 border-slate-100'}`}
                                        onClick={() => handleEditItem(item)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="text-xl">{item.type === 'tree' ? '🌳' : item.type === 'pot' ? '🪴' : item.type === 'flower' ? '🌸' : '🌱'}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-800 uppercase">{metadata?.species || item.type}</span>
                                                    <span className="text-[8px] font-bold text-slate-400">Lat: {item.lat.toFixed(5)}</span>
                                                </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) onDeleteItem(item.id); }} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                        {metadata?.notes && !isEditing && (
                                            <div className="text-[10px] text-slate-500 leading-relaxed bg-white/50 p-2 rounded-lg border border-slate-100/50">
                                                {renderNotes(metadata.notes)}
                                            </div>
                                        )}
                                        {isEditing && (
                                            <div className="flex flex-col gap-3 pt-3 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase">Species</label>
                                                        <input className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-900 placeholder:text-slate-400" value={editingMetadata?.species || ''} placeholder="e.g. Rose" onChange={e => setEditingMetadata({ ...editingMetadata, species: e.target.value })} />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase">Variety</label>
                                                        <input className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-900 placeholder:text-slate-400" value={editingMetadata?.variety || ''} placeholder="e.g. Climbing" onChange={e => setEditingMetadata({ ...editingMetadata, variety: e.target.value })} />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase">Date Planted</label>
                                                        <input type="date" className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-900" value={editingMetadata?.datePlanted || ''} onChange={e => setEditingMetadata({ ...editingMetadata, datePlanted: e.target.value })} />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase">Quantity</label>
                                                        <input type="text" inputMode="numeric" className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-900" value={editingMetadata?.quantity ?? ''} placeholder="1" onChange={e => setEditingMetadata({ ...editingMetadata, quantity: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase">Notes</label>
                                                    <textarea className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs text-slate-900 placeholder:text-slate-400 resize-none" rows={2} value={editingMetadata?.notes || ''} placeholder="Any notes about this plant..." onChange={e => setEditingMetadata({ ...editingMetadata, notes: e.target.value })} />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={handleSaveMetadata} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-[10px] font-black uppercase">Save</button>
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
    );
};
