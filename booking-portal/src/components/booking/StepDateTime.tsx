'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Globe, AlertCircle } from 'lucide-react';
import { bookingService } from '@/services/booking.service';
import { ServiceItem, TimeSlot } from '@/types/booking.contracts';
import {
    formatDatePill,
    formatSlotTime,
    getBrowserTimeZone,
    getTimeZoneShortLabel,
    getUpcomingDatesInSalonTz,
    isForeignTimeZone,
} from '@/lib/timezone';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StepDateTimeProps {
    salonSlug: string;
    salonTimeZone: string;
    service: ServiceItem;
    staffId: string | 'ANY';
    selectedDate: string;
    selectedSlot: TimeSlot | null;
    onSelectDate: (date: string) => void;
    onSelectSlot: (slot: TimeSlot | null) => void;
}

export function StepDateTime({
    salonSlug,
    salonTimeZone,
    service,
    staffId,
    selectedDate,
    selectedSlot,
    onSelectDate,
    onSelectSlot,
}: StepDateTimeProps) {
    const dates = useMemo(
        () => getUpcomingDatesInSalonTz(salonTimeZone, 14),
        [salonTimeZone]
    );

    const browserTz = useMemo(() => getBrowserTimeZone(), []);
    const showForeignTzNotice = useMemo(
        () => isForeignTimeZone(salonTimeZone),
        [salonTimeZone]
    );

    // Por defecto mostramos la hora local del salón (evita confusión en reservas locales/presenciales)
    const [useClientTz, setUseClientTz] = useState(false);
    const activeTimeZone = showForeignTzNotice && useClientTz ? browserTz : salonTimeZone;

    useEffect(() => {
        if (!selectedDate && dates.length > 0) {
            onSelectDate(dates[0]);
        }
    }, [dates, selectedDate, onSelectDate]);

    const {
        data: slots = [],
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ['availability', salonSlug, selectedDate, service.id, staffId],
        queryFn: () =>
            bookingService.getAvailableSlots({
                slug: salonSlug,
                date: selectedDate,
                serviceId: service.id,
                staffId,
            }),
        enabled: Boolean(selectedDate && service.id),
    });

    const handleDateChange = (date: string) => {
        onSelectDate(date);
        onSelectSlot(null);
    };

    const sampleIsoForLabel =
        slots[0]?.startTime ?? `${selectedDate || dates[0]}T15:00:00Z`;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">
                    Elige fecha y hora
                </h2>
                <p className="text-sm text-muted-foreground">
                    {service.name} ({service.durationMinutes} min)
                </p>
            </div>

            {/* Aviso discreto solo cuando el navegador está en otra zona horaria */}
            {showForeignTzNotice && (
                <div className="rounded-xl border bg-muted/40 p-3.5 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                            <Globe className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                            <div className="space-y-0.5">
                                <p className="font-medium text-foreground">
                                    Tu dispositivo está en otra zona horaria ({browserTz})
                                </p>
                                <p className="text-muted-foreground">
                                    La cita se agenda en hora del salón:{' '}
                                    <strong className="text-foreground">
                                        {getTimeZoneShortLabel(sampleIsoForLabel, salonTimeZone)}
                                    </strong>
                                    .
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setUseClientTz((prev) => !prev)}
                            className="shrink-0 rounded-md border bg-background px-2.5 py-1.5 font-medium hover:bg-accent transition-colors"
                        >
                            {useClientTz ? 'Ver hora del salón' : 'Ver mi hora'}
                        </button>
                    </div>
                </div>
            )}

            {/* Selector horizontal de fechas */}
            <section aria-label="Fechas disponibles" className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Próximos 14 días</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {dates.map((dateStr) => {
                        const pill = formatDatePill(dateStr, salonTimeZone);
                        const isSelected = dateStr === selectedDate;

                        return (
                            <button
                                key={dateStr}
                                type="button"
                                onClick={() => handleDateChange(dateStr)}
                                aria-pressed={isSelected}
                                className={cn(
                                    'flex min-w-[68px] shrink-0 flex-col items-center rounded-xl border px-3 py-2.5 text-center transition-all active:scale-[0.98]',
                                    isSelected
                                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-card hover:border-foreground/30'
                                )}
                            >
                                <span
                                    className={cn(
                                        'text-[11px] font-medium uppercase',
                                        isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                    )}
                                >
                                    {pill.weekday}
                                </span>
                                <span className="text-lg font-bold leading-tight">
                                    {pill.dayNumber}
                                </span>
                                <span
                                    className={cn(
                                        'text-[11px]',
                                        isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                                    )}
                                >
                                    {pill.monthShort}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Grilla de horarios disponibles */}
            <section aria-label="Horarios disponibles" className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                            Horarios ({getTimeZoneShortLabel(sampleIsoForLabel, activeTimeZone)})
                        </span>
                    </div>
                    {selectedDate && (
                        <span className="text-xs text-muted-foreground capitalize">
                            {formatDatePill(selectedDate, salonTimeZone).fullLabel}
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <Skeleton key={idx} className="h-11 w-full rounded-lg" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-center space-y-2">
                        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <span>No pudimos cargar los horarios</span>
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={() => refetch()}
                                className="text-xs underline font-medium"
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No hay horarios disponibles para esta fecha. Prueba con otro día.
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map((slot) => {
                            const isSelected = selectedSlot?.startTime === slot.startTime;
                            const formattedTime = formatSlotTime(slot.startTime, activeTimeZone);

                            return (
                                <button
                                    key={slot.startTime}
                                    type="button"
                                    onClick={() => onSelectSlot(slot)}
                                    aria-pressed={isSelected}
                                    className={cn(
                                        'rounded-lg border py-2.5 px-2 text-sm font-medium transition-all active:scale-[0.98]',
                                        isSelected
                                            ? 'border-primary bg-primary text-primary-foreground ring-2 ring-primary/20'
                                            : 'bg-card hover:border-foreground/40'
                                    )}
                                >
                                    {formattedTime}
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}