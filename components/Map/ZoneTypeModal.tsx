'use client';

import { X } from 'lucide-react';
import { ZONE_TYPES } from '@/lib/constants';

interface ZoneTypeModalProps {
    isOpen: boolean;
    onSelect: (type: string, name: string) => void;
    onCancel: () => void;
}

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
