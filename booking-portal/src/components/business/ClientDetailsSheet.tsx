'use client';

import { useMemo, useState } from 'react';
import {
    CalendarPlus,
    Clock,
    Loader2,
    Mail,
    Pencil,
    Phone,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useBusiness } from '@/components/business/BusinessProvider';
import {
    StatusBadge,
    getInitials,
    useNow,
} from '@/components/business/shared';
import {
    formatCurrency,
    formatDateKey,
    formatSalonDateTime,
    getSalonDateKey,
} from '@/lib/timezone';
import { BusinessClient } from '@/types/booking.contracts';

interface ClientDetailsSheetProps {
    client: BusinessClient | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: (client: BusinessClient) => void;
    onNewAppointment: (client: BusinessClient) => void;
}

export function ClientDetailsSheet({
    client,
    open,
    onOpenChange,
    onEdit,
    onNewAppointment,
}: ClientDetailsSheetProps) {
    const { data, actions } = useBusiness();
    const [deleting, setDeleting] = useState(false);
    const now = useNow();

    const liveClient = useMemo(
        () =>
            (data?.clients ?? []).find((item) => item.id === client?.id) ?? client,
        [data?.clients, client]
    );

    const appointments = useMemo(
        () =>
            (data?.appointments ?? [])
                .filter((appointment) => appointment.clientId === liveClient?.id)
                .sort(
                    (a, b) =>
                        new Date(b.startTime).getTime() -
                        new Date(a.startTime).getTime()
                ),
        [data?.appointments, liveClient?.id]
    );

    const salon = data?.salon;

    if (!liveClient || !salon) {
        return null;
    }

    const visits = appointments.filter(
        (appointment) => appointment.status === 'COMPLETED'
    );
    const noShows = appointments.filter(
        (appointment) => appointment.status === 'NO_SHOW'
    );
    const upcoming = appointments
        .filter(
            (appointment) =>
                ['CONFIRMED', 'PENDING_PAYMENT'].includes(appointment.status) &&
                new Date(appointment.startTime).getTime() >= now
        )
        .sort(
            (a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
    const history = appointments
        .filter(
            (appointment) =>
                appointment.status !== 'CONFIRMED' &&
                appointment.status !== 'PENDING_PAYMENT'
        )
        .slice(0, 6);
    const totalSpent = visits.reduce(
        (total, appointment) => total + appointment.price,
        0
    );
    const lastVisit = visits[0]?.startTime;

    const handleDelete = async () => {
        if (
            !window.confirm(
                `¿Eliminar a ${liveClient.name} de la base de clientes? Esta acción no se puede deshacer.`
            )
        ) {
            return;
        }

        setDeleting(true);
        try {
            await actions.deleteClient(liveClient.id);
            toast.success('Cliente eliminado');
            onOpenChange(false);
        } catch (error) {
            toast.error('No se pudo eliminar al cliente', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
                <SheetHeader className="border-b">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-400 text-sm font-semibold text-white">
                            {getInitials(liveClient.name)}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                            <SheetTitle className="truncate">
                                {liveClient.name}
                            </SheetTitle>
                            <p className="text-[11px] text-muted-foreground">
                                Cliente desde{' '}
                                {formatDateKey(
                                    getSalonDateKey(
                                        liveClient.createdAt,
                                        salon.timezone
                                    ),
                                    salon.timezone,
                                    "MMMM 'de' yyyy"
                                )}
                            </p>
                        </div>
                    </div>
                    <SheetDescription className="sr-only">
                        Ficha e historial del cliente
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                    <div className="grid gap-2 text-xs">
                        <a
                            href={`tel:${liveClient.phone}`}
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 font-medium transition-colors hover:bg-muted"
                        >
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {liveClient.phone}
                        </a>
                        {liveClient.email && (
                            <a
                                href={`mailto:${liveClient.email}`}
                                className="flex items-center gap-2 rounded-lg border px-3 py-2 font-medium transition-colors hover:bg-muted"
                            >
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="truncate">{liveClient.email}</span>
                            </a>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-xl border bg-muted/20 p-3 text-center">
                        <div>
                            <p className="text-lg font-semibold">{visits.length}</p>
                            <p className="text-[10px] text-muted-foreground">Visitas</p>
                        </div>
                        <div>
                            <p className="text-lg font-semibold">{noShows.length}</p>
                            <p className="text-[10px] text-muted-foreground">
                                Inasistencias
                            </p>
                        </div>
                        <div>
                            <p className="text-lg font-semibold">
                                {formatCurrency(totalSpent, salon.currency)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                Consumido
                            </p>
                        </div>
                    </div>

                    {lastVisit && (
                        <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Última visita:{' '}
                            <span className="font-medium text-foreground">
                                {formatSalonDateTime(
                                    lastVisit,
                                    salon.timezone,
                                    "d MMM 'de' yyyy"
                                )}
                            </span>
                        </div>
                    )}

                    {liveClient.notes && (
                        <section className="space-y-1">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Notas internas
                            </h3>
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
                                {liveClient.notes}
                            </p>
                        </section>
                    )}

                    <section className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Próximas citas
                            </h3>
                            <span className="text-[10px] text-muted-foreground">
                                {upcoming.length}
                            </span>
                        </div>
                        {upcoming.length === 0 ? (
                            <p className="rounded-lg border border-dashed px-3 py-4 text-center text-[11px] text-muted-foreground">
                                Sin citas próximas.
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {upcoming.slice(0, 3).map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-center gap-2 rounded-lg border px-3 py-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-medium">
                                                {appointment.serviceName}
                                            </p>
                                            <p className="text-[10px] capitalize text-muted-foreground">
                                                {formatDateKey(
                                                    getSalonDateKey(
                                                        appointment.startTime,
                                                        salon.timezone
                                                    ),
                                                    salon.timezone,
                                                    "EEE d MMM"
                                                )}{' '}
                                                ·{' '}
                                                {formatSalonDateTime(
                                                    appointment.startTime,
                                                    salon.timezone,
                                                    'h:mm a'
                                                )}{' '}
                                                · {appointment.staffName}
                                            </p>
                                        </div>
                                        <StatusBadge status={appointment.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="space-y-2 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Historial reciente
                            </h3>
                            <span className="text-[10px] text-muted-foreground">
                                {appointments.length} en total
                            </span>
                        </div>
                        {history.length === 0 ? (
                            <p className="rounded-lg border border-dashed px-3 py-4 text-center text-[11px] text-muted-foreground">
                                Aún no hay visitas registradas.
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {history.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-[11px] font-medium">
                                                {appointment.serviceName}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {formatSalonDateTime(
                                                    appointment.startTime,
                                                    salon.timezone,
                                                    'd MMM yyyy'
                                                )}{' '}
                                                · {appointment.staffName}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <span className="text-[10px] font-medium">
                                                {formatCurrency(
                                                    appointment.price,
                                                    salon.currency
                                                )}
                                            </span>
                                            <StatusBadge status={appointment.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-[11px] text-muted-foreground">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <p>
                            Usa las notas internas para recordar preferencias y evita
                            reprogramar citas con menos de{' '}
                            {data?.cancellationPolicy.allowRescheduleHours ?? 12} horas
                            de anticipación si aplica penalidad.
                        </p>
                    </div>
                </div>

                <SheetFooter className="border-t bg-muted/20">
                    <div className="grid w-full grid-cols-2 gap-2">
                        <Button
                            type="button"
                            onClick={() => onNewAppointment(liveClient)}
                        >
                            <CalendarPlus className="h-4 w-4" />
                            Nueva cita
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onEdit(liveClient)}
                        >
                            <Pencil className="h-4 w-4" />
                            Editar
                        </Button>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Eliminar cliente
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
