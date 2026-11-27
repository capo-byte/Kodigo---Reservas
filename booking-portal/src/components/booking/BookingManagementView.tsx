'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Calendar,
    Clock,
    MapPin,
    User,
    ExternalLink,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    CalendarPlus,
} from 'lucide-react';
import { BookingDetails } from '@/types/booking.contracts';
import { bookingService } from '@/services/booking.service';
import { formatDatePill, formatSlotTime } from '@/lib/timezone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BookingManagementViewProps {
    initialBooking: BookingDetails;
}

const CANCELLATION_REASONS = [
    'Cambio de planes',
    'Incompatibilidad de horario',
    'Enfermedad o emergencia',
    'Encontré otra opción',
    'Otro motivo',
];

export function BookingManagementView({ initialBooking }: BookingManagementViewProps) {
    const [booking, setBooking] = useState<BookingDetails>(initialBooking);
    const [showCancelPrompt, setShowCancelPrompt] = useState(false);
    const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        if (!bookingService.usesMocks) return;

        let isCurrent = true;
        bookingService
            .getBookingByToken(initialBooking.manageToken)
            .then((storedBooking) => {
                if (isCurrent) setBooking(storedBooking);
            })
            .catch((error: unknown) => {
                if (isCurrent) {
                    toast.error('No se pudo cargar el estado actualizado de la cita', {
                        description:
                            error instanceof Error ? error.message : 'Intenta nuevamente más tarde.',
                    });
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [initialBooking.manageToken]);

    const dateStr = booking.startTime.split('T')[0];
    const dateInfo = formatDatePill(dateStr, booking.salon.timezone);

    const handleConfirmCancel = async () => {
        setIsCancelling(true);
        try {
            const response = await bookingService.cancelBooking(
                booking.manageToken,
                selectedReason
            );
            setBooking(response.booking);
            setShowCancelPrompt(false);
            toast.success('Cita cancelada con éxito');
        } catch (error) {
            toast.error('No se pudo cancelar la cita', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente más tarde.',
            });
        } finally {
            setIsCancelling(false);
        }
    };

    const isCancelled = booking.status === 'CANCELLED';
    const isConfirmed = booking.status === 'CONFIRMED';
    const canCancel = !isCancelled;

    return (
        <div className="space-y-5">
            <div>
                <Link
                    href={`/booking/history?salon=${encodeURIComponent(booking.salon.slug)}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-foreground/25 hover:bg-accent active:scale-[0.98]"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Volver a mis citas</span>
                </Link>
            </div>

            {/* Cabecera con estado de la reserva */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Gestión de Cita
                        </span>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            {booking.salon.name}
                        </h1>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            ID: {booking.id}
                        </p>
                    </div>

                    <div className="self-start sm:self-center">
                        {isConfirmed && (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 gap-1.5 px-3 py-1 font-medium border-emerald-500/30">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Cita Confirmada
                            </Badge>
                        )}
                        {isCancelled && (
                            <Badge variant="destructive" className="gap-1.5 px-3 py-1 font-medium">
                                <XCircle className="h-3.5 w-3.5" />
                                Cita Cancelada
                            </Badge>
                        )}
                        {booking.status === 'PENDING_PAYMENT' && (
                            <Badge variant="secondary" className="gap-1.5 px-3 py-1 font-medium text-amber-700 bg-amber-500/15 border-amber-500/30">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Pendiente de Pago
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Mensaje informativo de cancelación si aplica */}
                {isCancelled && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs space-y-1">
                        <p className="font-semibold text-destructive">Esta cita ya no es válida</p>
                        <p className="text-muted-foreground">
                            Motivo:{' '}
                            <strong className="text-foreground">
                                {booking.cancellationReason ?? 'Cancelado por el cliente'}
                            </strong>
                        </p>
                    </div>
                )}

                {/* Resumen de servicio, especialista, fecha y hora */}
                <div className="grid gap-4 sm:grid-cols-2 text-sm pt-1">
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Servicio</p>
                            <p className="font-semibold text-foreground">{booking.service.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {booking.service.durationMinutes} min · ${booking.service.price} {booking.service.currency}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">Especialista</p>
                            <div className="flex items-center gap-2 mt-1">
                                {booking.staff.avatarUrl ? (
                                    <img
                                        src={booking.staff.avatarUrl}
                                        alt={booking.staff.name}
                                        className="h-7 w-7 rounded-full object-cover border"
                                    />
                                ) : (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                        <User className="h-3.5 w-3.5" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs font-medium leading-none">{booking.staff.name}</p>
                                    <p className="text-[11px] text-muted-foreground">{booking.staff.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Fecha y Hora</p>
                            <div className="flex items-center gap-1.5 font-semibold text-foreground capitalize mt-0.5">
                                <Calendar className="h-4 w-4 text-primary shrink-0" />
                                <span>{dateInfo.fullLabel}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                    {formatSlotTime(booking.startTime, booking.salon.timezone)} (hora del salón)
                                </span>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground">Ubicación</p>
                            <div className="flex items-start justify-between gap-2 mt-0.5">
                                <div className="flex items-start gap-1.5 text-xs text-foreground">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                                    <span>{booking.salon.address}</span>
                                </div>
                                {booking.salon.googleMapsUrl && (
                                    <a
                                        href={booking.salon.googleMapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 text-xs font-medium underline inline-flex items-center gap-1 text-foreground"
                                    >
                                        Mapa <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datos del Cliente */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Tus Datos de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-xs sm:grid-cols-3">
                    <div>
                        <span className="text-muted-foreground">Nombre:</span>
                        <p className="font-medium text-foreground">{booking.customer.name}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Teléfono:</span>
                        <p className="font-medium text-foreground">{booking.customer.phone}</p>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Correo:</span>
                        <p className="font-medium text-foreground">{booking.customer.email}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Acciones de Gestión */}
            <div className="space-y-3">
                {canCancel && !showCancelPrompt && (
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <Button
                            type="button"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => setShowCancelPrompt(true)}
                        >
                            Cancelar cita
                        </Button>

                        <Link
                            href={`/${booking.salon.slug}`}
                            className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 gap-1.5 text-center')}
                        >
                            <CalendarPlus className="h-4 w-4" />
                            Agendar otra cita
                        </Link>
                    </div>
                )}

                {/* Cuadro de confirmación de cancelación */}
                {canCancel && showCancelPrompt && (
                    <Card className="border-destructive/40 shadow-sm animate-in fade-in duration-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base text-destructive flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                ¿Seguro que deseas cancelar tu cita?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-xs sm:text-sm">
                            <p className="text-muted-foreground">
                                Liberaremos el horario de inmediato para que otros clientes puedan reservarlo. Esta acción no se puede deshacer.
                            </p>

                            <div className="space-y-1.5">
                                <label htmlFor="cancel-reason" className="font-medium text-foreground text-xs">
                                    Motivo de la cancelación (opcional)
                                </label>
                                <select
                                    id="cancel-reason"
                                    value={selectedReason}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="w-full rounded-lg border bg-background p-2 text-xs text-foreground focus-visible:outline-primary"
                                >
                                    {CANCELLATION_REASONS.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    disabled={isCancelling}
                                    onClick={() => setShowCancelPrompt(false)}
                                >
                                    Volver
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="flex-1"
                                    disabled={isCancelling}
                                    onClick={handleConfirmCancel}
                                >
                                    {isCancelling ? 'Cancelando...' : 'Confirmar cancelación'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Si ya está cancelada, opción para volver al salón a agendar */}
                {isCancelled && (
                    <Link
                        href={`/${booking.salon.slug}`}
                        className={cn(buttonVariants({ variant: 'default' }), 'w-full gap-2 text-center')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a agendar en {booking.salon.name}
                    </Link>
                )}
            </div>
        </div>
    );
}
