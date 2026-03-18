import React from 'react';
import { Package, Plus, Leaf, Search, X as CloseIcon, Calendar, Sprout, Edit2, Trash2 } from 'lucide-react';
import { Seed } from '@/lib/types';
import { cn } from '@/lib/utils';
import { renderNotes, formatMonthRange } from '@/lib/helpers';
import { MONTH_NAMES } from '@/lib/constants';

interface SeedInventoryTableProps {
    seeds: Seed[];
    selectedSeedIds: string[];
    onToggleSeedSelection: (id: string) => void;
    onAddSeed: () => void;
    onEditSeed: (seed: Seed) => void;
    onDeleteSeed: (id: string) => void;
    onSowSeed: (seed: Seed) => void;
    onPhotoUpload: (files: FileList) => void;
    isAnalyzing: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    showOnlySowable: boolean;
    setShowOnlySowable: (show: boolean) => void;
    sortConfig: { key: keyof Seed | 'none', direction: 'asc' | 'desc' };
    onToggleSort: (key: keyof Seed) => void;
}

export const SeedInventoryTable: React.FC<SeedInventoryTableProps> = ({
    seeds,
    selectedSeedIds,
    onToggleSeedSelection,
    onAddSeed,
    onEditSeed,
    onDeleteSeed,
    onSowSeed,
    onPhotoUpload,
    isAnalyzing,
    searchQuery,
    setSearchQuery,
    showOnlySowable,
    setShowOnlySowable,
    sortConfig,
    onToggleSort,
}) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const currentMonth = new Date().getMonth() + 1;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Package size={22} className="text-blue-500" />
                    Seed Collection
                </h3>
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple
                        capture="environment"
                        onChange={(e) => e.target.files && onPhotoUpload(e.target.files)}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzing}
                        className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2 border border-slate-200 disabled:opacity-50"
                    >
                        {isAnalyzing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <Leaf size={18} className="text-green-600" />
                                Scan Seed Packet
                            </>
                        )}
                    </button>
                    <button
                        onClick={onAddSeed}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95"
                    >
                        <Plus size={18} /> Add Seed Packet
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by species or notes..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <CloseIcon size={14} />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowOnlySowable(!showOnlySowable)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border shrink-0",
                        showOnlySowable
                            ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-100"
                            : "bg-white text-slate-600 border-slate-200 hover:border-green-400"
                    )}
                >
                    <Calendar size={16} />
                    Available to sow now ({MONTH_NAMES[currentMonth - 1]})
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest w-10">Select</th>
                                <th
                                    className="px-4 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:text-slate-600"
                                    onClick={() => onToggleSort('species')}
                                >
                                    Species {sortConfig.key === 'species' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:text-slate-600"
                                    onClick={() => onToggleSort('packetQuantity')}
                                >
                                    In Stock {sortConfig.key === 'packetQuantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:text-slate-600"
                                    onClick={() => onToggleSort('seedingStart')}
                                >
                                    Seeding {sortConfig.key === 'seedingStart' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:text-slate-600"
                                    onClick={() => onToggleSort('harvestingStart')}
                                >
                                    Harvesting {sortConfig.key === 'harvestingStart' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seeds.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                                        {showOnlySowable ? "No seeds available to sow this month." : "No seeds found. Time to go shopping?"}
                                    </td>
                                </tr>
                            ) : (
                                seeds.map(seed => {
                                    const isSelected = selectedSeedIds.includes(seed.id);
                                    return (
                                        <tr key={seed.id} className={cn(
                                            "border-b border-slate-50 transition-colors group",
                                            isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/50"
                                        )}>
                                            <td className="px-4 md:px-8 py-4 md:py-6">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => onToggleSeedSelection(seed.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 md:px-8 py-4 md:py-6">
                                                <div className="font-bold text-slate-900">{seed.species}</div>
                                                {seed.notes && <div className="text-[11px] text-slate-500 mt-1 max-w-xs">{renderNotes(seed.notes)}</div>}
                                                {seed.expiryDate && (
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight mt-1">Expires {new Date(seed.expiryDate).toLocaleDateString()}</div>
                                                )}
                                            </td>
                                            <td className="px-4 md:px-8 py-4 md:py-6">
                                                <span className="bg-slate-100 px-3 py-1 rounded-lg text-sm font-bold text-slate-700">
                                                    {seed.packetQuantity}
                                                </span>
                                            </td>
                                            <td className="px-4 md:px-8 py-4 md:py-6">
                                                <div className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-green-500" />
                                                    {formatMonthRange(seed.seedingStart, seed.seedingEnd)}
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-8 py-4 md:py-6">
                                                <div className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                                                    <Package size={14} className="text-amber-500" />
                                                    {formatMonthRange(seed.harvestingStart, seed.harvestingEnd)}
                                                </div>
                                            </td>
                                            <td className="px-4 md:px-8 py-4 md:py-6">
                                                <div className="flex gap-2">
                                                    <button
                                                        title="Sow Seeds"
                                                        onClick={() => onSowSeed(seed)}
                                                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                    >
                                                        <Sprout size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onEditSeed(seed)}
                                                        className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteSeed(seed.id)}
                                                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
