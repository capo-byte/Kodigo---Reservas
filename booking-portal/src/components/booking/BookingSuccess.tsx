
'use client';

import Link from 'next/link';
import { CheckCircle2, Calendar, Clock, MapPin, ExternalLink, Plus } from 'lucide-react';
import {
    SalonProfile,
    ServiceItem,
    TimeSlot,
} from '@/types/booking.contracts';
import type { BookingViewResult } from '@/types/booking-view.contracts';
import { formatDatePill, formatSlotTime } from '@/lib/timezone';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BookingSuccessProps {
    salon: SalonProfile;
    service: ServiceItem;
    staffLabel: string;
    date: string;
    slot: TimeSlot;
    customerName: string;
    bookingResult: BookingViewResult;
    onBookAnother: () => void;
}

export function BookingSuccess({
    salon,
    service,
    staffLabel,
    date,
    slot,
    customerName,
    bookingResult,
    onBookAnother,
}: BookingSuccessProps) {
    const dateInfo = formatDatePill(date, salon.timezone);

    return (
        <div className="space-y-6 py-2">
            <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                    <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">¡Cita confirmada!</h2>
                <p className="text-sm text-muted-foreground">
                    Te esperamos, <strong className="text-foreground">{customerName}</strong>. Código:{' '}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground">
                        {bookingResult.source === 'mock' ? bookingResult.bookingId : bookingResult.id}
                    </code>
                </p>
            </div>

            <Card>
                <CardContent className="p-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between border-b pb-2.5">
                        <span className="font-semibold">{salon.name}</span>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            Confirmada
                        </span>
                    </div>

                    <p className="font-medium">
                        {service.name} · <span className="font-normal text-muted-foreground">{staffLabel}</span>
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="capitalize">{dateInfo.fullLabel}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatSlotTime(slot.startTime, salon.timezone)}</span>
                    </div>

                    <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>{salon.address}</span>
                        </div>
                        {salon.googleMapsUrl && (
                            <a
                                href={salon.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 inline-flex items-center gap-1 font-medium text-foreground underline"
                            >
                                Mapa <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-2.5">
                {bookingResult.source === 'mock' && <Link
                    href={`/booking/${bookingResult.manageToken}`}
                    className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 text-center')}
                >
                    Ver o cancelar mi cita
                </Link>}

                <Button type="button" variant="secondary" className="flex-1 gap-1.5" onClick={onBookAnother}>
                    <Plus className="h-4 w-4" />
                    Agendar otra cita
                </Button>
            </div>
        </div>
    );
}
