import { Skeleton } from '@/components/ui/skeleton';

export default function BookingManageLoading() {
    return (
        <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
            <div className="rounded-xl border bg-card p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-10 w-full rounded-lg" />
            </div>
        </main>
    );
}
