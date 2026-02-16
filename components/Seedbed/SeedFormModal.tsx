import React from 'react';
import { Save } from 'lucide-react';
import Modal from '@/components/UI/Modal';
import { Seed } from '@/lib/types';
import { MONTH_NAMES } from '@/lib/constants';

interface SeedFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Seed>) => void;
    editingSeed: Partial<Seed> | null;
    setEditingSeed: (seed: Partial<Seed> | null) => void;
}

export const SeedFormModal: React.FC<SeedFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editingSeed,
    setEditingSeed
}) => {
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSeed) onSave(editingSeed);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingSeed?.id ? "Edit Seed Packet" : "Add Seed Packet"}
        >
            <form onSubmit={handleSave} className="space-y-6">
                <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Species / Variety</label>
                        <input
                            required
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                            value={editingSeed?.species || ''}
                            onChange={e => setEditingSeed({ ...editingSeed!, species: e.target.value })}
                            placeholder="e.g. Tomato 'San Marzano'"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Packet Quantity</label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                value={editingSeed?.packetQuantity || 0}
                                onChange={e => setEditingSeed({ ...editingSeed!, packetQuantity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Acquired Date</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                value={editingSeed?.acquiredAt || ''}
                                onChange={e => setEditingSeed({ ...editingSeed!, acquiredAt: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Seeding Period</label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    value={editingSeed?.seedingStart || ''}
                                    onChange={e => setEditingSeed({ ...editingSeed!, seedingStart: parseInt(e.target.value) || null })}
                                >
                                    <option value="">Start</option>
                                    {MONTH_NAMES.map((name: string, i: number) => <option key={name} value={i + 1}>{name}</option>)}
                                </select>
                                <select
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    value={editingSeed?.seedingEnd || ''}
                                    onChange={e => setEditingSeed({ ...editingSeed!, seedingEnd: parseInt(e.target.value) || null })}
                                >
                                    <option value="">End</option>
                                    {MONTH_NAMES.map((name: string, i: number) => <option key={name} value={i + 1}>{name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Harvest Period</label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    value={editingSeed?.harvestingStart || ''}
                                    onChange={e => setEditingSeed({ ...editingSeed!, harvestingStart: parseInt(e.target.value) || null })}
                                >
                                    <option value="">Start</option>
                                    {MONTH_NAMES.map((name: string, i: number) => <option key={name} value={i + 1}>{name}</option>)}
                                </select>
                                <select
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    value={editingSeed?.harvestingEnd || ''}
                                    onChange={e => setEditingSeed({ ...editingSeed!, harvestingEnd: parseInt(e.target.value) || null })}
                                >
                                    <option value="">End</option>
                                    {MONTH_NAMES.map((name: string, i: number) => <option key={name} value={i + 1}>{name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Notes</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all min-h-[80px]"
                            value={editingSeed?.notes || ''}
                            onChange={e => setEditingSeed({ ...editingSeed!, notes: e.target.value })}
                            placeholder="Sowing depth, spacing, or other info..."
                        />
                    </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]">
                    <Save size={18} /> Save Seed Packet
                </button>
            </form>
        </Modal>
    );
};
