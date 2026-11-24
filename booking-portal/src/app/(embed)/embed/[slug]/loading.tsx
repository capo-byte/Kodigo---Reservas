import { Skeleton } from '@/components/ui/skeleton';

export default function EmbedLoading() {
    return (
        <main className="mx-auto min-h-screen max-w-xl p-4 space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                </div>
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
        </main>
    );
}
