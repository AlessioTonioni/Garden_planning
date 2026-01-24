'use client';

import { X } from 'lucide-react';

interface ZoneTypeModalProps {
    isOpen: boolean;
    onSelect: (type: string, name: string) => void;
    onCancel: () => void;
}

const ZONE_TYPES = [
    { id: 'planting', label: 'Planting Area', icon: '🌱', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
    { id: 'tree', label: 'Tree', icon: '🌳', color: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300' },
    { id: 'grass', label: 'Grass Field', icon: '🌿', color: 'bg-lime-100 hover:bg-lime-200 border-lime-300' },
    { id: 'pot', label: 'Pot', icon: '🪴', color: 'bg-orange-100 hover:bg-orange-200 border-orange-300' },
    { id: 'path', label: 'Walking Path', icon: '👣', color: 'bg-stone-100 hover:bg-stone-200 border-stone-300' },
    { id: 'building', label: 'Building', icon: '🏠', color: 'bg-slate-100 hover:bg-slate-200 border-slate-300' },
    { id: 'other', label: 'Other', icon: '❓', color: 'bg-gray-100 hover:bg-gray-200 border-gray-300' },
];

export const ZoneTypeModal = ({ isOpen, onSelect, onCancel }: ZoneTypeModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 border-4 border-black/10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">What did you just draw?</h2>
                    <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {ZONE_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => onSelect(type.id, type.label)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all active:scale-95 ${type.color}`}
                        >
                            <span className="text-3xl mb-1">{type.icon}</span>
                            <span className="font-semibold text-gray-700">{type.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
