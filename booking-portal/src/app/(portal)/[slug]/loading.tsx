import { Skeleton } from '@/components/ui/skeleton';

export default function PortalLoading() {
    return (
        <main className="mx-auto min-h-screen max-w-2xl px-4 py-6 space-y-6">
            <div className="flex items-center gap-4 border-b pb-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
            </div>
        </main>
    );
}