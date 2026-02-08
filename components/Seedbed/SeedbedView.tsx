'use client';

import React, { useState, useEffect } from 'react';
import {
    Sprout,
    Plus,
    Calendar,
    Package,
    MapPin,
    Trash2,
    Edit2,
    ChevronRight,
    Leaf,
    Clock,
    CheckCircle2,
    AlertCircle,
    Save,
    X as CloseIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Modal from '@/components/UI/Modal';

// Types from Prisma (simplified for frontend)
interface Seed {
    id: string;
    species: string;
    packetQuantity: number;
    acquiredAt: string;
    expiryDate: string | null;
    notes: string | null;
    seedlings: Seedling[];
}

interface Seedling {
    id: string;
    seedId: string;
    quantity: number;
    seededAt: string;
    expectedSproutAt: string | null;
    sproutedAt: string | null;
    transplantedAt: string | null;
    location: string | null;
    status: 'seeded' | 'sprouted' | 'transplanted' | 'failed';
    notes: string | null;
    seed?: Seed;
}

const SeedbedView = () => {
    const [seeds, setSeeds] = useState<Seed[]>([]);
    const [seedlings, setSeedlings] = useState<Seedling[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'inventory' | 'active'>('active');

    // Modal states
    const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
    const [isSowModalOpen, setIsSowModalOpen] = useState(false);
    const [isSeedlingModalOpen, setIsSeedlingModalOpen] = useState(false);

    const [editingSeed, setEditingSeed] = useState<Partial<Seed> | null>(null);
    const [editingSeedling, setEditingSeedling] = useState<Partial<Seedling> | null>(null);
    const [selectedSeedForSowing, setSelectedSeedForSowing] = useState<Seed | null>(null);

    const fetchData = async () => {
        try {
            const [seedsRes, seedlingsRes] = await Promise.all([
                fetch('/api/seeds'),
                fetch('/api/seedlings')
            ]);

            if (!seedsRes.ok || !seedlingsRes.ok) throw new Error('Failed to fetch');

            const seedsData = await seedsRes.json();
            const seedlingsData = await seedlingsRes.json();
            setSeeds(seedsData);
            setSeedlings(seedlingsData);
        } catch (error) {
            console.error('Failed to fetch seed data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Seed Handlers
    const handleSaveSeed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSeed?.species) return;

        const url = editingSeed.id ? `/api/seeds/${editingSeed.id}` : '/api/seeds';
        const method = editingSeed.id ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingSeed)
            });
            if (res.ok) {
                setIsSeedModalOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error('Failed to save seed:', error);
        }
    };

    const handleDeleteSeed = async (id: string) => {
        if (!confirm('Are you sure you want to delete this seed packet and all related seedlings?')) return;
        try {
            const res = await fetch(`/api/seeds/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (error) {
            console.error('Failed to delete seed:', error);
        }
    };

    // Seedling Handlers
    const handleSowSeed = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSeedForSowing || !editingSeedling?.quantity) return;

        try {
            const res = await fetch('/api/seedlings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editingSeedling,
                    seedId: selectedSeedForSowing.id
                })
            });
            if (res.ok) {
                setIsSowModalOpen(false);
                setActiveTab('active');
                fetchData();
            }
        } catch (error) {
            console.error('Failed to sow seed:', error);
        }
    };

    const handleUpdateSeedling = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSeedling?.id) return;

        try {
            const res = await fetch(`/api/seedlings/${editingSeedling.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingSeedling)
            });
            if (res.ok) {
                setIsSeedlingModalOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error('Failed to update seedling:', error);
        }
    };

    const handleDeleteSeedling = async (id: string) => {
        if (!confirm('Delete this seedling batch?')) return;
        try {
            const res = await fetch(`/api/seedlings/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (error) {
            console.error('Failed to delete seedling:', error);
        }
    };

    const openAddSeedModal = () => {
        setEditingSeed({ species: '', packetQuantity: 10, acquiredAt: new Date().toISOString().split('T')[0] });
        setIsSeedModalOpen(true);
    };

    const openEditSeedModal = (seed: Seed) => {
        setEditingSeed({
            ...seed,
            acquiredAt: new Date(seed.acquiredAt).toISOString().split('T')[0],
            expiryDate: seed.expiryDate ? new Date(seed.expiryDate).toISOString().split('T')[0] : null
        });
        setIsSeedModalOpen(true);
    };

    const openSowModal = (seed: Seed) => {
        setSelectedSeedForSowing(seed);
        setEditingSeedling({ quantity: 1, seededAt: new Date().toISOString().split('T')[0], status: 'seeded', location: '' });
        setIsSowModalOpen(true);
    };

    const openEditSeedlingModal = (seedling: Seedling) => {
        setEditingSeedling({
            ...seedling,
            seededAt: new Date(seedling.seededAt).toISOString().split('T')[0],
            expectedSproutAt: seedling.expectedSproutAt ? new Date(seedling.expectedSproutAt).toISOString().split('T')[0] : null,
            sproutedAt: seedling.sproutedAt ? new Date(seedling.sproutedAt).toISOString().split('T')[0] : null,
            transplantedAt: seedling.transplantedAt ? new Date(seedling.transplantedAt).toISOString().split('T')[0] : null
        });
        setIsSeedlingModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium animate-pulse">Gathering garden data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 pb-20">
            {/* Header section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                            <Sprout size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Seedbed Manager</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Track your seeds from packet to soil.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300",
                                activeTab === 'active' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Active Seedlings
                        </button>
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300",
                                activeTab === 'inventory' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Seed Inventory
                        </button>
                    </div>
                </div>
            </header>

            {activeTab === 'active' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Seedlings List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Leaf size={20} className="text-green-500" />
                                Growth Monitoring
                            </h3>
                            <button
                                onClick={() => setActiveTab('inventory')}
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
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button onClick={() => openEditSeedlingModal(seedling)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteSeedling(seedling.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400">
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

                    {/* Stats or Action Sidebar */}
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
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Package size={22} className="text-blue-500" />
                            Seed Collection
                        </h3>
                        <button
                            onClick={openAddSeedModal}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95"
                        >
                            <Plus size={18} /> Add Seed Packet
                        </button>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Species</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">In Stock</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Acquired</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Expiry</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {seeds.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                                                No seeds found. Time to go shopping?
                                            </td>
                                        </tr>
                                    ) : (
                                        seeds.map(seed => (
                                            <tr key={seed.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6 font-bold text-slate-900">{seed.species}</td>
                                                <td className="px-8 py-6">
                                                    <span className="bg-slate-100 px-3 py-1 rounded-lg text-sm font-bold text-slate-700">
                                                        {seed.packetQuantity}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-slate-500 text-sm italic">
                                                    {new Date(seed.acquiredAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-8 py-6">
                                                    {seed.expiryDate ? (
                                                        <span className="text-slate-500 text-sm">
                                                            {new Date(seed.expiryDate).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs italic">Not set</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex gap-2">
                                                        <button
                                                            title="Sow Seeds"
                                                            onClick={() => openSowModal(seed)}
                                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm active:scale-90"
                                                        >
                                                            <Sprout size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditSeedModal(seed)}
                                                            className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSeed(seed.id)}
                                                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Seed Modal */}
            <Modal
                isOpen={isSeedModalOpen}
                onClose={() => setIsSeedModalOpen(false)}
                title={editingSeed?.id ? "Edit Seed Packet" : "Add Seed Packet"}
            >
                <form onSubmit={handleSaveSeed} className="space-y-6">
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
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]">
                        <Save size={18} /> Save Seed Packet
                    </button>
                </form>
            </Modal>

            {/* Sow Seedling Modal */}
            <Modal
                isOpen={isSowModalOpen}
                onClose={() => setIsSowModalOpen(false)}
                title={`Sowing ${selectedSeedForSowing?.species}`}
            >
                <form onSubmit={handleSowSeed} className="space-y-6">
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

            {/* Seedling Status Modal */}
            <Modal
                isOpen={isSeedlingModalOpen}
                onClose={() => setIsSeedlingModalOpen(false)}
                title="Update Seedling Status"
            >
                <form onSubmit={handleUpdateSeedling} className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Current Status</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['seeded', 'sprouted', 'transplanted', 'failed'].map(status => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setEditingSeedling({ ...editingSeedling!, status: status as any })}
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
        </div>
    );
};

export default SeedbedView;
