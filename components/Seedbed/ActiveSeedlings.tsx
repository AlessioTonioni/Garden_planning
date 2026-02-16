import React from 'react';
import { Leaf, Plus, Edit2, Trash2, Package, MapPin, Calendar, Clock, Sprout, AlertCircle } from 'lucide-react';
import { Seed, Seedling } from '@/lib/types';
import { cn } from '@/lib/utils';
import { renderNotes } from '@/lib/helpers';

interface ActiveSeedlingsProps {
    seedlings: Seedling[];
    seeds: Seed[];
    onSowFromInventory: () => void;
    onEditSeedling: (seedling: Seedling) => void;
    onDeleteSeedling: (id: string) => void;
}

export const ActiveSeedlings: React.FC<ActiveSeedlingsProps> = ({
    seedlings,
    seeds,
    onSowFromInventory,
    onEditSeedling,
    onDeleteSeedling
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Leaf size={20} className="text-green-500" />
                        Growth Monitoring
                    </h3>
                    <button
                        onClick={onSowFromInventory}
                        className="text-green-600 font-bold text-sm hover:underline flex items-center gap-1"
                    >
                        <Plus size={16} /> Sow from Inventory
                    </button>
                </div>

                {seedlings.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                            <Sprout size={32} />
                        </div>
                        <h4 className="text-slate-900 font-bold mb-1">No active seedlings</h4>
                        <p className="text-slate-400 text-sm max-w-xs">Start your first batch by selecting a seed from your inventory.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {seedlings.map(seedling => (
                            <div key={seedling.id} className="group bg-white border border-slate-100 p-6 rounded-3xl hover:border-green-200 transition-all duration-500 hover:shadow-2xl hover:shadow-green-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block shadow-sm",
                                            seedling.status === 'seeded' && "bg-amber-100 text-amber-700",
                                            seedling.status === 'sprouted' && "bg-green-100 text-green-700",
                                            seedling.status === 'transplanted' && "bg-blue-100 text-blue-700",
                                            seedling.status === 'failed' && "bg-red-100 text-red-700"
                                        )}>
                                            {seedling.status}
                                        </span>
                                        <h4 className="text-xl font-bold text-slate-900 group-hover:text-green-700 transition-colors">
                                            {seedling.seed?.species || 'Unknown Species'}
                                        </h4>
                                        {seedling.notes && (
                                            <div className="mt-2 text-[11px] text-slate-500 leading-relaxed italic border-l-2 border-green-100 pl-3">
                                                {renderNotes(seedling.notes)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <button onClick={() => onEditSeedling(seedling)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => onDeleteSeedling(seedling.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Package size={14} className="text-slate-300" />
                                        <span className="text-xs font-bold leading-none">{seedling.quantity} Seedlings</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MapPin size={14} className="text-slate-300" />
                                        <span className="text-xs font-bold leading-none truncate">{seedling.location || 'Not set'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Calendar size={14} className="text-slate-300" />
                                        <span className="text-xs font-bold leading-none">
                                            {new Date(seedling.seededAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Clock size={14} className="text-slate-300" />
                                        <span className="text-xs font-bold leading-none italic">
                                            {seedling.status === 'seeded' ? 'Sprouting soon' : 'Active'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
                <section className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-500/20 rounded-full -mb-16 -mr-16 blur-3xl transition-all duration-700 group-hover:scale-150" />
                    <div className="relative z-10">
                        <h3 className="text-xs font-black uppercase text-green-400 tracking-[0.2em] mb-4">Garden Summary</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <span className="text-slate-400 text-sm font-medium">In Seedbed</span>
                                <span className="text-2xl font-black text-white">{seedlings.filter(s => s.status !== 'transplanted').length}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <span className="text-slate-400 text-sm font-medium">Unique Species</span>
                                <span className="text-2xl font-black text-white">{new Set(seeds.map(s => s.species)).size}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400 text-sm font-medium">Expiring Soon</span>
                                <span className="text-2xl font-black text-amber-400">0</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="bg-green-50 border border-green-100 p-6 rounded-3xl">
                    <h4 className="font-bold text-green-900 flex items-center gap-2 mb-2">
                        <AlertCircle size={18} />
                        Growth Tip
                    </h4>
                    <p className="text-green-800/70 text-sm leading-relaxed">
                        Most seedlings need at least 12-16 hours of light per day. If using a windowsill, rotate trays daily!
                    </p>
                </div>
            </div>
        </div>
    );
};
