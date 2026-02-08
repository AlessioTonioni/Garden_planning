import React from 'react';
import { Map as MapIcon } from 'lucide-react';

interface SchematicToolbarProps {
    rotation: number;
    setRotation: (r: number) => void;
    zoom: number;
    setZoom: (z: number) => void;
    showAll: boolean;
    setShowAll: (s: boolean) => void;
    onReset: () => void;
    onClose?: () => void;
    isPrimary?: boolean;
}

export const SchematicToolbar: React.FC<SchematicToolbarProps> = ({
    rotation, setRotation,
    zoom, setZoom,
    showAll, setShowAll,
    onReset,
    onClose,
    isPrimary
}) => {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-white/40 p-1.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-8 duration-700">

            {/* Show All Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50/50 rounded-full border border-slate-100/50">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Show All</span>
                <button
                    onClick={() => setShowAll(!showAll)}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${showAll ? 'bg-green-500 shadow-inner' : 'bg-slate-200'}`}
                >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${showAll ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            <div className="w-px h-8 bg-slate-200" />

            {/* Rotate Control */}
            <div className="flex flex-col gap-1 w-28 px-2">
                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tight">
                    <span>Rotate</span>
                    <span className="text-green-600 font-mono">{rotation}°</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600 hover:accent-green-500 transition-all"
                />
            </div>

            <div className="w-px h-8 bg-slate-200" />

            {/* Zoom Control */}
            <div className="flex flex-col gap-1 w-28 px-2">
                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tight">
                    <span>Zoom</span>
                    <span className="text-green-600 font-mono">{zoom.toFixed(1)}x</span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600 hover:accent-green-500 transition-all"
                />
            </div>

            <div className="w-px h-8 bg-slate-200" />

            {/* Actions */}
            <div className="flex items-center gap-2 pl-1">
                <button
                    onClick={onReset}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all active:scale-95"
                    title="Reset View"
                >
                    <MapIcon size={16} />
                </button>

                {!isPrimary && onClose && (
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
};
