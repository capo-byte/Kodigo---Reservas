'use client';

import { useMemo, useState } from 'react';
import {
    CalendarClock,
    CheckCircle2,
    Clock,
    Loader2,
    Mail,
    Phone,
    RotateCcw,
    Scissors,
    Trash2,
    UserX,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Select } from '@/components/ui/select';
import { useBusiness } from '@/components/business/BusinessProvider';
import {
    FormField,
    StaffAvatar,
    StatusBadge,
    getInitials,
} from '@/components/business/shared';
import {
    dateKeyAndTimeToIso,
    formatCurrency,
    formatDateKey,
    formatSalonDateTime,
    getSalonDateKey,
    getSalonTimeInputValue,
} from '@/lib/timezone';
import { Appointment, SalonProfile } from '@/types/booking.contracts';

interface AppointmentDetailsSheetProps {
    appointment: Appointment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AppointmentDetailsSheet({
    appointment,
    open,
    onOpenChange,
}: AppointmentDetailsSheetProps) {
    const { data } = useBusiness();

    const liveAppointment = useMemo(
        () =>
            (data?.appointments ?? []).find(
                (item) => item.id === appointment?.id
            ) ?? appointment,
        [data?.appointments, appointment]
    );

    const salon = data?.salon;

    if (!open || !liveAppointment || !salon) {
        return null;
    }

    return (
        <AppointmentDetailsContent
            key={`${liveAppointment.id}-${liveAppointment.startTime}-${liveAppointment.staffId}`}
            appointment={liveAppointment}
            salon={salon}
            onOpenChange={onOpenChange}
        />
    );
}

interface AppointmentDetailsContentProps {
    appointment: Appointment;
    salon: SalonProfile;
    onOpenChange: (open: boolean) => void;
}

function AppointmentDetailsContent({
    appointment: liveAppointment,
    salon,
    onOpenChange,
}: AppointmentDetailsContentProps) {
    const { actions } = useBusiness();
    const [rescheduleDate, setRescheduleDate] = useState(() =>
        getSalonDateKey(liveAppointment.startTime, salon.timezone)
    );
    const [rescheduleTime, setRescheduleTime] = useState(() =>
        getSalonTimeInputValue(liveAppointment.startTime, salon.timezone)
    );
    const [rescheduleStaffId, setRescheduleStaffId] = useState(
        liveAppointment.staffId
    );
    const [pendingAction, setPendingAction] = useState<string | null>(null);

    const service = salon.services.find(
        (item) => item.id === liveAppointment.serviceId
    );
    const staff = salon.staff.find((item) => item.id === liveAppointment.staffId);
    const eligibleStaff = (
        service?.staffIds.length
            ? salon.staff.filter(
                  (member) =>
                      member.isActive !== false &&
                      service.staffIds.includes(member.id)
              )
            : salon.staff.filter((member) => member.isActive !== false)
    );

    const canOperate =
        liveAppointment.status === 'CONFIRMED' ||
        liveAppointment.status === 'PENDING_PAYMENT';

    const handleStatus = async (
        status: 'COMPLETED' | 'NO_SHOW' | 'CANCELLED',
        key: string
    ) => {
        if (
            (status === 'CANCELLED' || status === 'NO_SHOW') &&
            !window.confirm(
                status === 'NO_SHOW'
                    ? '¿Registrar que el cliente no asistió a la cita?'
                    : '¿Cancelar esta cita? El horario quedará libre.'
            )
        ) {
            return;
        }

        setPendingAction(key);
        try {
            await actions.updateAppointmentStatus(liveAppointment.id, status);
            toast.success(
                status === 'COMPLETED'
                    ? 'Cita marcada como atendida'
                    : status === 'NO_SHOW'
                      ? 'Inasistencia registrada'
                      : 'Cita cancelada'
            );
        } catch (error) {
            toast.error('No se pudo actualizar la cita', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        } finally {
            setPendingAction(null);
        }
    };

    const handleReschedule = async () => {
        if (!rescheduleDate || !rescheduleTime) {
            toast.error('Selecciona la nueva fecha y hora.');
            return;
        }

        setPendingAction('reschedule');
        try {
            await actions.rescheduleAppointment(liveAppointment.id, {
                startTime: dateKeyAndTimeToIso(
                    rescheduleDate,
                    rescheduleTime,
                    salon.timezone
                ),
                staffId: rescheduleStaffId || liveAppointment.staffId,
            });
            toast.success('Cita reprogramada');
        } catch (error) {
            toast.error('No se pudo reprogramar', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        } finally {
            setPendingAction(null);
        }
    };

    const handleDelete = async () => {
        if (
            !window.confirm(
                '¿Eliminar definitivamente esta cita del historial? Esta acción no se puede deshacer.'
            )
        ) {
            return;
        }

        setPendingAction('delete');
        try {
            await actions.deleteAppointment(liveAppointment.id);
            toast.success('Cita eliminada');
            onOpenChange(false);
        } catch (error) {
            toast.error('No se pudo eliminar la cita', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        } finally {
            setPendingAction(null);
        }
    };

    return (
        <Sheet open onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
                <SheetHeader className="border-b">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                            {getInitials(liveAppointment.clientName)}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                            <SheetTitle className="truncate">
                                {liveAppointment.clientName}
                            </SheetTitle>
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge status={liveAppointment.status} />
                                <span className="text-[11px] text-muted-foreground">
                                    {liveAppointment.source === 'MANUAL'
                                        ? 'Creada en recepción'
                                        : 'Reserva en línea'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <SheetDescription className="sr-only">
                        Detalle y acciones de la cita
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                    <section className="space-y-2.5 rounded-xl border bg-muted/20 p-3.5">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Scissors className="h-4 w-4 text-muted-foreground" />
                            {liveAppointment.serviceName}
                            <span className="ml-auto font-semibold">
                                {formatCurrency(liveAppointment.price, salon.currency)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            <span className="first-letter:uppercase">
                                {formatDateKey(
                                    getSalonDateKey(
                                        liveAppointment.startTime,
                                        salon.timezone
                                    ),
                                    salon.timezone,
                                    "EEEE d 'de' MMMM"
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {formatSalonDateTime(
                                liveAppointment.startTime,
                                salon.timezone,
                                'h:mm a'
                            )}{' '}
                            –{' '}
                            {formatSalonDateTime(
                                liveAppointment.endTime,
                                salon.timezone,
                                'h:mm a'
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <StaffAvatar staff={staff} size="xs" />
                            {liveAppointment.staffName}
                        </div>
                    </section>

                    <section className="grid gap-2 text-xs">
                        <a
                            href={`tel:${liveAppointment.clientPhone}`}
                            className="flex items-center gap-2 rounded-lg border px-3 py-2 font-medium transition-colors hover:bg-muted"
                        >
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {liveAppointment.clientPhone}
                        </a>
                        {liveAppointment.clientEmail && (
                            <a
                                href={`mailto:${liveAppointment.clientEmail}`}
                                className="flex items-center gap-2 rounded-lg border px-3 py-2 font-medium transition-colors hover:bg-muted"
                            >
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                {liveAppointment.clientEmail}
                            </a>
                        )}
                    </section>

                    {liveAppointment.notes && (
                        <section className="space-y-1">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Notas internas
                            </h3>
                            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
                                {liveAppointment.notes}
                            </p>
                        </section>
                    )}

                    {canOperate && (
                        <section className="space-y-2 border-t pt-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Acciones rápidas
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-auto flex-col gap-1 py-2 text-[11px] text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => handleStatus('COMPLETED', 'completed')}
                                    disabled={Boolean(pendingAction)}
                                >
                                    {pendingAction === 'completed' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4" />
                                    )}
                                    Atendida
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-auto flex-col gap-1 py-2 text-[11px] text-rose-700 hover:bg-rose-50"
                                    onClick={() => handleStatus('NO_SHOW', 'no-show')}
                                    disabled={Boolean(pendingAction)}
                                >
                                    {pendingAction === 'no-show' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <UserX className="h-4 w-4" />
                                    )}
                                    No asistió
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-auto flex-col gap-1 py-2 text-[11px] text-zinc-600 hover:bg-zinc-50"
                                    onClick={() => handleStatus('CANCELLED', 'cancel')}
                                    disabled={Boolean(pendingAction)}
                                >
                                    {pendingAction === 'cancel' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    Cancelar
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                También puedes arrastrar la cita en la agenda para
                                reprogramarla.
                            </p>
                        </section>
                    )}

                    <section className="space-y-3 border-t pt-4">
                        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reprogramar
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <FormField label="Nueva fecha" htmlFor="reschedule-date">
                                <Input
                                    id="reschedule-date"
                                    type="date"
                                    value={rescheduleDate}
                                    onChange={(event) =>
                                        setRescheduleDate(event.target.value)
                                    }
                                    disabled={!canOperate || Boolean(pendingAction)}
                                />
                            </FormField>
                            <FormField label="Nueva hora" htmlFor="reschedule-time">
                                <Input
                                    id="reschedule-time"
                                    type="time"
                                    step={300}
                                    value={rescheduleTime}
                                    onChange={(event) =>
                                        setRescheduleTime(event.target.value)
                                    }
                                    disabled={!canOperate || Boolean(pendingAction)}
                                />
                            </FormField>
                        </div>
                        <FormField label="Especialista" htmlFor="reschedule-staff">
                            <Select
                                id="reschedule-staff"
                                value={rescheduleStaffId}
                                onChange={(event) =>
                                    setRescheduleStaffId(event.target.value)
                                }
                                disabled={!canOperate || Boolean(pendingAction)}
                            >
                                {eligibleStaff.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                        <Button
                            type="button"
                            className="w-full"
                            onClick={handleReschedule}
                            disabled={!canOperate || Boolean(pendingAction)}
                        >
                            {pendingAction === 'reschedule' ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Reprogramando…
                                </>
                            ) : (
                                'Guardar nueva fecha'
                            )}
                        </Button>
                    </section>
                </div>

                <SheetFooter className="border-t bg-muted/20">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full text-destructive hover:bg-destructive/10"
                        onClick={handleDelete}
                        disabled={Boolean(pendingAction)}
                    >
                        {pendingAction === 'delete' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Eliminar cita
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
