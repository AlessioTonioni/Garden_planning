import { useState, useEffect, useCallback, useRef } from 'react';
import { Seed, Seedling } from '@/lib/types';

export function useSeedbed() {
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
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sorting and Filtering states
    const [sortConfig, setSortConfig] = useState<{ key: keyof Seed | 'none', direction: 'asc' | 'desc' }>({ key: 'species', direction: 'asc' });
    const [showOnlySowable, setShowOnlySowable] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const currentMonth = new Date().getMonth() + 1;

    const fetchData = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveSeed = async (data: Partial<Seed>) => {
        const url = data.id ? `/api/seeds/${data.id}` : '/api/seeds';
        const method = data.id ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            setIsSeedModalOpen(false);
            fetchData();
        }
    };

    const handleDeleteSeed = async (id: string) => {
        if (!confirm('Are you sure you want to delete this seed packet and all related seedlings?')) return;
        const res = await fetch(`/api/seeds/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
    };

    const handlePhotoUpload = async (files: FileList) => {
        setIsAnalyzing(true);
        const images: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
                images.push(base64);
            }

            const res = await fetch('/api/seeds/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images })
            });

            if (res.ok) {
                const data = await res.json();
                setEditingSeed({
                    species: data.species || '',
                    packetQuantity: data.packetQuantity || 10,
                    acquiredAt: data.acquiredAt || new Date().toISOString().split('T')[0],
                    expiryDate: data.expiryDate || null,
                    seedingStart: data.seedingStart || null,
                    seedingEnd: data.seedingEnd || null,
                    harvestingStart: data.harvestingStart || null,
                    harvestingEnd: data.harvestingEnd || null,
                    notes: data.notes || ''
                });
                setIsSeedModalOpen(true);
            } else {
                alert('Failed to analyze seed packet.');
            }
        } catch (error) {
            console.error('Error analyzing photo:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSowSeed = async (quantity: number, seededAt: string, location: string) => {
        if (!selectedSeedForSowing) return;

        const res = await fetch('/api/seedlings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quantity,
                seededAt,
                location,
                seedId: selectedSeedForSowing.id,
                status: 'seeded'
            })
        });
        if (res.ok) {
            setIsSowModalOpen(false);
            setActiveTab('active');
            fetchData();
        }
    };

    const handleUpdateSeedling = async (id: string, updates: Partial<Seedling>) => {
        const res = await fetch(`/api/seedlings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (res.ok) {
            setIsSeedlingModalOpen(false);
            fetchData();
        }
    };

    const handleDeleteSeedling = async (id: string) => {
        if (!confirm('Delete this seedling batch?')) return;
        const res = await fetch(`/api/seedlings/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
    };

    const getSortedAndFilteredSeeds = useCallback(() => {
        let filtered = seeds;

        if (showOnlySowable) {
            filtered = seeds.filter(seed => {
                if (!seed.seedingStart || !seed.seedingEnd) return false;
                if (seed.seedingStart <= seed.seedingEnd) {
                    return currentMonth >= seed.seedingStart && currentMonth <= seed.seedingEnd;
                } else {
                    return currentMonth >= seed.seedingStart || currentMonth <= seed.seedingEnd;
                }
            });
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(seed =>
                seed.species.toLowerCase().includes(query) ||
                (seed.notes?.toLowerCase() || '').includes(query)
            );
        }

        if (sortConfig.key === 'none') return filtered;

        const key = sortConfig.key as keyof Seed;

        return [...filtered].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [seeds, showOnlySowable, currentMonth, searchQuery, sortConfig]);

    const sortedSeeds = getSortedAndFilteredSeeds();

    return {
        seeds: sortedSeeds, // Return filtered/sorted seeds
        allSeeds: seeds, // Keep access to raw seeds for stats
        seedlings,
        loading,
        activeTab,
        setActiveTab,
        isSeedModalOpen,
        setIsSeedModalOpen,
        isSowModalOpen,
        setIsSowModalOpen,
        isSeedlingModalOpen,
        setIsSeedlingModalOpen,
        editingSeed,
        setEditingSeed,
        editingSeedling,
        setEditingSeedling,
        selectedSeedForSowing,
        setSelectedSeedForSowing,
        isAnalyzing,
        fileInputRef,
        sortConfig,
        setSortConfig,
        showOnlySowable,
        setShowOnlySowable,
        searchQuery,
        setSearchQuery,
        currentMonth,
        handleSaveSeed,
        handleDeleteSeed,
        handlePhotoUpload,
        handleSowSeed,
        handleUpdateSeedling,
        handleDeleteSeedling
    };
}
