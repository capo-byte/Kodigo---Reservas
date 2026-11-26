import { Skeleton } from '@/components/ui/skeleton';

export default function BusinessLoading() {
    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 rounded-xl" />
                ))}
            </div>
            <div className="grid gap-4 xl:grid-cols-3">
                <Skeleton className="h-96 rounded-xl xl:col-span-2" />
                <Skeleton className="h-96 rounded-xl" />
            </div>
        </div>
    );
}
