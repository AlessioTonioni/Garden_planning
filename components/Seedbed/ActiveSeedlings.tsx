import React, { useEffect, useRef, useState } from 'react';
import { Leaf, Plus, Edit2, Trash2, Package, MapPin, Calendar, Clock, Sprout, AlertCircle, ImageIcon, Camera, X } from 'lucide-react';
import { Seed, Seedling, SeedlingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { renderNotes } from '@/lib/helpers';

interface ActiveSeedlingsProps {
    seedlings: Seedling[];
    seeds: Seed[];
    onSowFromInventory: () => void;
    onEditSeedling: (seedling: Seedling) => void;
    onDeleteSeedling: (id: string) => void;
}

type FilterOption = SeedlingStatus | 'all';

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'seeded', label: 'Seeded' },
    { value: 'sprouted', label: 'Sprouted' },
    { value: 'transplanted', label: 'Transplanted' },
    { value: 'failed', label: 'Failed' },
];

interface SeedlingPhotoAreaProps {
    seedling: Seedling;
    photoSrc: string | null;
    onUploaded: (id: string, photoPath: string) => void;
    onView: (src: string) => void;
}

const SeedlingPhotoArea: React.FC<SeedlingPhotoAreaProps> = ({ seedling, photoSrc, onUploaded, onView }) => {
    const galleryRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [hovered, setHovered] = useState(false);

    const handleFile = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('photo', file);
        try {
            const res = await fetch(`/api/seedlings/${seedling.id}/photo`, { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                onUploaded(seedling.id, `${data.photoPath}?t=${Date.now()}`);
            }
        } finally {
            setUploading(false);
        }
    };

    const showOverlay = uploading || hovered;

    return (
        <div
            className="relative w-full h-36 bg-slate-50 overflow-hidden rounded-t-[calc(1.5rem-1px)]"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {photoSrc ? (
                <img
                    src={photoSrc}
                    alt=""
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => onView(photoSrc)}
                />
            ) : (
                <div
                    className="w-full h-full flex flex-col items-center justify-center text-slate-200 gap-2 cursor-pointer"
                    onClick={() => galleryRef.current?.click()}
                >
                    <ImageIcon size={28} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add photo</span>
                </div>
            )}

            {/* Upload overlay — shown on hover or while uploading */}
            <div
                className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-opacity duration-200"
                style={{ opacity: showOverlay ? 1 : 0, pointerEvents: showOverlay ? 'auto' : 'none' }}
                onClick={() => { if (photoSrc) onView(photoSrc); }}
            >
                {uploading ? (
                    <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); galleryRef.current?.click(); }}
                            className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm transition-colors"
                        >
                            <ImageIcon size={13} /> Gallery
                        </button>
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); cameraRef.current?.click(); }}
                            className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm transition-colors"
                        >
                            <Camera size={13} /> Camera
                        </button>
                    </>
                )}
            </div>

            {/* Gallery / file picker — no capture, shows file browser or photo library on mobile */}
            <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {/* Camera — opens camera directly on mobile */}
            <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
        </div>
    );
};

export const ActiveSeedlings: React.FC<ActiveSeedlingsProps> = ({
    seedlings,
    seeds,
    onSowFromInventory,
    onEditSeedling,
    onDeleteSeedling
}) => {
    const [statusFilter, setStatusFilter] = useState<FilterOption>('all');
    // Local overrides for photo paths after upload (avoids full refetch)
    const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({});
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const filtered = statusFilter === 'all'
        ? seedlings
        : seedlings.filter(s => s.status === statusFilter);

    const handlePhotoUploaded = (id: string, photoPath: string) => {
        setPhotoOverrides(prev => ({ ...prev, [id]: photoPath }));
    };

    return (
        <>
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

                {/* Status filter */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {FILTER_OPTIONS.map(opt => {
                        const count = opt.value === 'all' ? seedlings.length : seedlings.filter(s => s.status === opt.value).length;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5",
                                    statusFilter === opt.value
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300"
                                )}
                            >
                                {opt.label}
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[9px] font-black",
                                    statusFilter === opt.value ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                                )}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {seedlings.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                            <Sprout size={32} />
                        </div>
                        <h4 className="text-slate-900 font-bold mb-1">No active seedlings</h4>
                        <p className="text-slate-400 text-sm max-w-xs">Start your first batch by selecting a seed from your inventory.</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                        <p className="text-slate-400 text-sm font-bold">No batches match this filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtered.map(seedling => {
                            const photoSrc = photoOverrides[seedling.id] ?? seedling.photoPath;
                            return (
                                <div key={seedling.id} className="group bg-white border border-slate-100 rounded-3xl hover:border-green-200 transition-all duration-500 hover:shadow-2xl hover:shadow-green-100 overflow-hidden">

                                    <SeedlingPhotoArea
                                        seedling={seedling}
                                        photoSrc={photoSrc}
                                        onUploaded={handlePhotoUploaded}
                                        onView={setLightboxSrc}
                                    />

                                    <div className="p-6 relative">
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
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 relative z-10">
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
                                                <span className="text-xs font-bold leading-none">{seedling.quantity} Sowed</span>
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

                                        {/* Stage progression */}
                                        {(seedling.sproutedQuantity != null || seedling.transplantedQuantity != null) && (
                                            <div className="mt-4 pt-4 border-t border-slate-100">
                                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                    Batch Progress
                                                </div>
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">{seedling.quantity} sowed</span>
                                                    {seedling.sproutedQuantity != null && (
                                                        <>
                                                            <span className="text-slate-300">→</span>
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full text-xs font-bold",
                                                                seedling.sproutedQuantity / seedling.quantity >= 0.7
                                                                    ? "bg-green-50 text-green-700"
                                                                    : seedling.sproutedQuantity / seedling.quantity >= 0.4
                                                                    ? "bg-yellow-50 text-yellow-700"
                                                                    : "bg-red-50 text-red-700"
                                                            )}>
                                                                {seedling.sproutedQuantity} sprouted
                                                                <span className="ml-1 opacity-60">
                                                                    ({Math.round(seedling.sproutedQuantity / seedling.quantity * 100)}%)
                                                                </span>
                                                            </span>
                                                        </>
                                                    )}
                                                    {seedling.transplantedQuantity != null && (
                                                        <>
                                                            <span className="text-slate-300">→</span>
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full text-xs font-bold",
                                                                seedling.transplantedQuantity / (seedling.sproutedQuantity ?? seedling.quantity) >= 0.7
                                                                    ? "bg-blue-50 text-blue-700"
                                                                    : seedling.transplantedQuantity / (seedling.sproutedQuantity ?? seedling.quantity) >= 0.4
                                                                    ? "bg-yellow-50 text-yellow-700"
                                                                    : "bg-red-50 text-red-700"
                                                            )}>
                                                                {seedling.transplantedQuantity} transplanted
                                                                <span className="ml-1 opacity-60">
                                                                    ({Math.round(seedling.transplantedQuantity / (seedling.sproutedQuantity ?? seedling.quantity) * 100)}%)
                                                                </span>
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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

        {lightboxSrc && (
            <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
        )}
        </>
    );
};

interface LightboxProps {
    src: string;
    onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ src, onClose }) => {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
                <X size={20} />
            </button>
            <img
                src={src}
                alt=""
                className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
                onClick={e => e.stopPropagation()}
            />
        </div>
    );
};
