'use client';

import { Trash2, Save } from 'lucide-react';
import { Popup } from 'react-leaflet';
import { useState } from 'react';

interface ItemPopupProps {
    item: any;
    onDelete: () => void;
    onUpdate: (id: string, metadata: any) => void;
}

export const ItemPopup = ({ item, onDelete, onUpdate }: ItemPopupProps) => {
    const [metadata, setMetadata] = useState(() => {
        try {
            return JSON.parse(item.metadata || '{}');
        } catch {
            return {};
        }
    });

    const getLabel = () => {
        switch (item.type) {
            case 'tree': return 'Tree Species';
            case 'plant': return 'Plant Name';
            case 'pot': return 'What is inside?';
            default: return 'Details';
        }
    };

    return (
        <Popup closeButton={false} offset={[0, -10]}>
            <div className="flex flex-col gap-3 p-1 min-w-[160px]">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {getLabel()}
                    </label>
                    <input
                        type="text"
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                        value={metadata.species || metadata.name || ''}
                        onChange={(e) => setMetadata({ ...metadata, species: e.target.value })}
                        placeholder="e.g. Oak, Tomato..."
                    />
                </div>

                <div className="flex gap-2 pt-1">
                    <button
                        onClick={() => onUpdate(item.id, metadata)}
                        className="flex-1 flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                    >
                        <Save size={12} /> Save
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Delete Item"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </Popup>
    );
};
