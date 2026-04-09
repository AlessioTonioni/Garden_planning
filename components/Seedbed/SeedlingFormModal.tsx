import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import Modal from '@/components/UI/Modal';
import { Seedling, SeedlingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SeedlingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<Seedling>) => void;
    editingSeedling: Partial<Seedling> | null;
    setEditingSeedling: (seedling: Partial<Seedling> | null) => void;
}

// Which status transitions require a "how many made it?" count
const STAGE_QUANTITY_FIELD: Partial<Record<SeedlingStatus, keyof Seedling>> = {
    sprouted: 'sproutedQuantity',
    transplanted: 'transplantedQuantity',
};

const STAGE_LABELS: Partial<Record<SeedlingStatus, string>> = {
    sprouted: 'How many seeds sprouted?',
    transplanted: 'How many seedlings were transplanted?',
};

export const SeedlingFormModal: React.FC<SeedlingFormModalProps> = ({
    isOpen,
    onClose,
    onUpdate,
    editingSeedling,
    setEditingSeedling
}) => {
    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSeedling?.id) {
            onUpdate(editingSeedling.id, editingSeedling);
        }
    };

    const stageField = editingSeedling?.status ? STAGE_QUANTITY_FIELD[editingSeedling.status] : undefined;
    const stageLabel = editingSeedling?.status ? STAGE_LABELS[editingSeedling.status] : undefined;
    const stageValue = stageField ? (editingSeedling?.[stageField] as number | null | undefined) : undefined;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Update Seedling Status"
        >
            <form onSubmit={handleUpdate} className="space-y-6">
                <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Current Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['seeded', 'sprouted', 'transplanted', 'failed'] as SeedlingStatus[]).map(status => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setEditingSeedling({ ...editingSeedling!, status })}
                                    className={cn(
                                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                        editingSeedling?.status === status
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {stageField && stageLabel && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                                {stageLabel}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    max={editingSeedling?.quantity ?? undefined}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                                    value={stageValue ?? ''}
                                    onChange={e => setEditingSeedling({
                                        ...editingSeedling!,
                                        [stageField]: e.target.value === '' ? null : Number(e.target.value)
                                    })}
                                    placeholder={`out of ${editingSeedling?.quantity ?? '?'}`}
                                />
                                {editingSeedling?.quantity != null && (
                                    <span className="text-xs text-slate-400 font-bold whitespace-nowrap">
                                        / {editingSeedling.quantity}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Location</label>
                        <input
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none"
                            value={editingSeedling?.location || ''}
                            onChange={e => setEditingSeedling({ ...editingSeedling!, location: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Notes</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-900 focus:outline-none min-h-[100px]"
                            value={editingSeedling?.notes || ''}
                            onChange={e => setEditingSeedling({ ...editingSeedling!, notes: e.target.value })}
                            placeholder="Any observations?"
                        />
                    </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]">
                    <CheckCircle2 size={18} /> Update Batch
                </button>
            </form>
        </Modal>
    );
};
