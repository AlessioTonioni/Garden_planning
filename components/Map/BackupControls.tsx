'use client';

import { Download, Upload } from 'lucide-react';
import { useRef } from 'react';

const BackupControls = ({ onRestore }: { onRestore: () => void }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        try {
            const res = await fetch('/api/zones');
            const data = await res.json();

            const blob = new Blob([JSON.stringify({ zones: data }, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `garden-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export garden data');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('This will OVERWRITE your current garden map with the backup. Are you sure?')) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (!json.zones || !Array.isArray(json.zones)) throw new Error('Invalid backup file');

                const res = await fetch('/api/zones/restore', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(json)
                });

                if (res.ok) {
                    alert('Garden restored successfully!');
                    onRestore(); // Trigger parent reload
                } else {
                    throw new Error('Server rejected restore');
                }
            } catch (err) {
                console.error('Import failed:', err);
                alert('Failed to restore garden: ' + (err as Error).message);
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div className="absolute top-4 right-4 z-[1000] flex gap-2">
            <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 text-gray-700 font-medium"
                title="Download Backup"
            >
                <Download size={18} />
                Export
            </button>
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 text-gray-700 font-medium"
                title="Restore from Backup"
            >
                <Upload size={18} />
                Import
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".json"
                className="hidden"
            />
        </div>
    );
};

export default BackupControls;
