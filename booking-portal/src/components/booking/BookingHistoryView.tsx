'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, History } from 'lucide-react';
import { BookingDetails } from '@/types/booking.contracts';
import { bookingService } from '@/services/booking.service';
import { formatDatePill, formatSlotTime } from '@/lib/timezone';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function BookingHistoryView() {
    const searchParams = useSearchParams();
    const salonSlug = searchParams.get('salon') ?? undefined;
    const [bookings, setBookings] = useState<BookingDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isCurrent = true;

        bookingService
            .getBookingHistory(salonSlug)
            .then((results) => {
                if (isCurrent) setBookings(results);
            })
            .catch((cause: unknown) => {
                if (isCurrent) {
                    setError(
                        cause instanceof Error
                            ? cause.message
                            : 'No se pudo cargar tu historial de citas.'
                    );
                }
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [salonSlug]);

    return (
        <main className="mx-auto min-h-screen max-w-2xl space-y-6 px-4 py-8">
            <header className="space-y-5 border-b pb-5">
                <div>
                    <Link
                        href={salonSlug ? `/embed/${salonSlug}` : '/'}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-foreground/25 hover:bg-accent active:scale-[0.98]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Volver al salón</span>
                    </Link>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <History className="h-4 w-4" />
                        </span>
                        <h1 className="text-2xl font-bold tracking-tight">Mis citas</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Consulta tus reservas guardadas en este navegador y cancela las que ya no necesites.
                    </p>
                </div>
            </header>

            {isLoading && <p className="text-sm text-muted-foreground">Cargando tus citas...</p>}

            {error && (
                <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
                    {error}
                </p>
            )}

            {!isLoading && !error && bookings.length === 0 && (
                <Card>
                    <CardContent className="space-y-3 p-6 text-center">
                        <p className="font-medium">Todavía no tienes citas guardadas en este navegador.</p>
                        <Link
                            href={salonSlug ? `/embed/${salonSlug}` : '/'}
                            className={cn(buttonVariants(), 'inline-flex')}
                        >
                            Reservar una cita
                        </Link>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                {bookings.map((booking) => {
                    const date = formatDatePill(
                        booking.startTime.split('T')[0],
                        booking.salon.timezone
                    );
                    const statusLabel =
                        booking.status === 'CANCELLED'
                            ? 'Cancelada'
                            : booking.status === 'PENDING_PAYMENT'
                              ? 'Pendiente de pago'
                              : 'Confirmada';

                    return (
                        <Card key={booking.manageToken}>
                            <CardContent className="space-y-3 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold">{booking.salon.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {booking.service.name} · {booking.staff.name}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={booking.status === 'CANCELLED' ? 'destructive' : 'secondary'}
                                    >
                                        {statusLabel}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span className="capitalize">{date.fullLabel}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatSlotTime(booking.startTime, booking.salon.timezone)}
                                    </span>
                                </div>
                                <Link
                                    href={`/booking/${booking.manageToken}`}
                                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                                >
                                    Ver o cancelar cita
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </main>
    );
}
