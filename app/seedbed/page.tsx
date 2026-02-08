import SeedbedView from '@/components/Seedbed/SeedbedView';

export const metadata = {
    title: 'Seedbed Manager - Garden Planning',
    description: 'Track your seeds and seedling growth.',
};

export default function SeedbedPage() {
    return (
        <main className="min-h-screen bg-slate-50 pt-24">
            <SeedbedView />
        </main>
    );
}
