import React from 'react';
import { Sprout } from 'lucide-react';
import Modal from '@/components/UI/Modal';
import { Seed, Seedling } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SowFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSow: (quantity: number, seededAt: string, location: string) => void;
    seed: Seed | null;
    editingSeedling: Partial<Seedling> | null;
    setEditingSeedling: (seedling: Partial<Seedling> | null) => void;
}

export const SowFormModal: React.FC<SowFormModalProps> = ({
    isOpen,
    onClose,
    onSow,
    seed,
    editingSeedling,
    setEditingSeedling
}) => {
    const handleSow = (e: React.FormEvent) => {
        e.preventDefault();
        onSow(
            editingSeedling?.quantity || 1,
            editingSeedling?.seededAt || new Date().toISOString().split('T')[0],
            editingSeedling?.location || ''
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Sowing ${seed?.species}`}
        >
            <form onSubmit={handleSow} className="space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Quantity</label>
                            <input
                                type="number"
                                required
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all"
                                value={editingSeedling?.quantity || 1}
                                onChange={e => setEditingSeedling({ ...editingSeedling!, quantity: parseInt(e.target.value) || 1 })}
                            />
                            {seed && (
                                <p className={cn(
                                    "text-[9px] font-bold uppercase px-1",
                                    (editingSeedling?.quantity || 1) > seed.packetQuantity ? "text-red-500" : "text-slate-400"
                                )}>
                                    Available: {seed.packetQuantity} seeds
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Sow Date</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all"
                                value={editingSeedling?.seededAt || ''}
                                onChange={e => setEditingSeedling({ ...editingSeedling!, seededAt: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Location / Tray</label>
                        <input
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all"
                            value={editingSeedling?.location || ''}
                            onChange={e => setEditingSeedling({ ...editingSeedling!, location: e.target.value })}
                            placeholder="e.g. Window Sill, Hotbed A"
                        />
                    </div>
                </div>
                <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-xl active:scale-[0.98]">
                    <Sprout size={18} /> Begin Batch
                </button>
            </form>
        </Modal>
    );
};
