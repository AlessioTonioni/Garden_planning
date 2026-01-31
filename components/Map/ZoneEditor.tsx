'use client';

import { X, Trash2 } from 'lucide-react';

interface ZoneEditorProps {
    zone: any;
    onClose: () => void;
    activeTool: string | null;
    onToolSelect: (tool: string | null) => void;
    onDeleteZone: (id: string) => void;
    onUpdateZone: (id: string, updates: any) => void;
}

const TOOLS = [
    { id: 'plant', label: 'Plant', icon: '🌱' },
    { id: 'tree', label: 'Tree', icon: '🌳' },
    { id: 'pot', label: 'Pot', icon: '🪴' },
    { id: 'furniture', label: 'Furniture', icon: '🪑' },
];

export const ZoneEditor = ({ zone, onClose, activeTool, onToolSelect, onDeleteZone, onUpdateZone }: ZoneEditorProps) => {
    if (!zone) return null;

    return (
        <div className="absolute top-4 left-16 z-[1000] bg-white p-4 rounded-xl shadow-xl w-64 border border-gray-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <div className="flex-1 mr-2">
                    <input
                        type="text"
                        value={zone.name || ''}
                        onChange={(e) => onUpdateZone(zone.id, { name: e.target.value })}
                        placeholder="Zone Name..."
                        className="font-bold text-lg w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-1"
                    />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pl-1">{zone.type}</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Add Items</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {TOOLS.map((tool) => (
                            <button
                                key={tool.id}
                                onClick={() => onToolSelect(activeTool === tool.id ? null : tool.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-sm
                            ${activeTool === tool.id
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                <span>{tool.icon}</span>
                                {tool.label}
                            </button>
                        ))}
                    </div>
                    {activeTool && (
                        <p className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                            Click on the map to place a <strong>{activeTool}</strong>.
                        </p>
                    )}
                </div>

                <button
                    onClick={() => {
                        if (confirm('Delete this zone and all its items?')) onDeleteZone(zone.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 p-2 rounded-lg border border-transparent hover:border-red-200 transition-colors text-sm"
                >
                    <Trash2 size={16} /> Delete Zone
                </button>
            </div>
        </div>
    );
};
