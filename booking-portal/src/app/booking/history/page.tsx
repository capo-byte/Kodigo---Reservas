import { Suspense } from 'react';
import { BookingHistoryView } from '@/components/booking/BookingHistoryView';

export default function BookingHistoryPage() {
    return (
        <Suspense
            fallback={
                <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 text-sm text-muted-foreground">
                    Cargando tus citas...
                </main>
            }
        >
            <BookingHistoryView />
        </Suspense>
    );
}
