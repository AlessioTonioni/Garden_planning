'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="px-8 py-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
