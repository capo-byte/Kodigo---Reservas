'use client';

import { useMemo, useState } from 'react';
import {
    Ban,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Info,
    Plus,
    UserCheck,
    UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useBusiness } from '@/components/business/BusinessProvider';
import { AgendaCalendar } from '@/components/business/AgendaCalendar';
import { AppointmentDetailsSheet } from '@/components/business/AppointmentDetailsSheet';
import { AppointmentFormSheet } from '@/components/business/AppointmentFormSheet';
import { BlockTimeSheet } from '@/components/business/BlockTimeSheet';
import {
    ErrorPanel,
    LoadingPanel,
    PageHeader,
    APPOINTMENT_STATUS_META,
} from '@/components/business/shared';
import {
    addDaysToDateKey,
    dateKeyAndTimeToIso,
    formatCurrency,
    formatDateKey,
    getSalonDateKey,
    getTodayDateKey,
    getWeekDateKeys,
} from '@/lib/timezone';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types/booking.contracts';

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function AgendaView() {
    const { data, isLoading, isError, refetch, actions } = useBusiness();
    const timezone = data?.salon.timezone ?? 'America/El_Salvador';

    const [view, setView] = useState<'day' | 'week'>('day');
    const [date, setDate] = useState(() => getTodayDateKey(timezone));
    const [staffFilter, setStaffFilter] = useState<string | 'ALL'>('ALL');
    const [showCancelled, setShowCancelled] = useState(false);
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [formDate, setFormDate] = useState<string | undefined>(undefined);
    const [formTime, setFormTime] = useState<string | undefined>(undefined);
    const [formStaffId, setFormStaffId] = useState<string | undefined>(undefined);
    const [blockOpen, setBlockOpen] = useState(false);

    const rangeDates = useMemo(
        () => (view === 'week' ? getWeekDateKeys(date, 1) : [date]),
        [view, date]
    );

    const rangeAppointments = useMemo(() => {
        if (!data) return [];
        return data.appointments.filter((appointment) =>
            rangeDates.includes(
                getSalonDateKey(appointment.startTime, data.salon.timezone)
            )
        );
    }, [data, rangeDates]);

    const visibleForStats = useMemo(
        () =>
            rangeAppointments.filter(
                (appointment) =>
                    (staffFilter === 'ALL' ||
                        appointment.staffId === staffFilter) &&
                    (showCancelled || appointment.status !== 'CANCELLED')
            ),
        [rangeAppointments, staffFilter, showCancelled]
    );

    const stats = useMemo(() => {
        const active = visibleForStats.filter(
            (appointment) =>
                appointment.status === 'CONFIRMED' ||
                appointment.status === 'PENDING_PAYMENT'
        );
        const completed = visibleForStats.filter(
            (appointment) => appointment.status === 'COMPLETED'
        );
        const noShows = visibleForStats.filter(
            (appointment) => appointment.status === 'NO_SHOW'
        );
        const revenue = visibleForStats
            .filter((appointment) => appointment.status !== 'CANCELLED')
            .reduce((total, appointment) => total + appointment.price, 0);

        return {
            total: visibleForStats.length,
            active: active.length,
            completed: completed.length,
            noShows: noShows.length,
            revenue,
        };
    }, [visibleForStats]);

    const title = useMemo(() => {
        if (view === 'day') {
            return capitalize(
                formatDateKey(date, timezone, "EEEE d 'de' MMMM 'de' yyyy")
            );
        }

        const week = getWeekDateKeys(date, 1);
        const start = week[0];
        const end = week[6];
        const sameMonth =
            formatDateKey(start, timezone, 'MM') ===
            formatDateKey(end, timezone, 'MM');

        return sameMonth
            ? `${capitalize(formatDateKey(start, timezone, 'd'))} – ${capitalize(
                  formatDateKey(end, timezone, "d 'de' MMMM 'de' yyyy")
              )}`
            : `${capitalize(formatDateKey(start, timezone, "d MMM"))} – ${capitalize(
                  formatDateKey(end, timezone, "d MMM 'de' yyyy")
              )}`;
    }, [view, date, timezone]);

    if (isLoading) {
        return <LoadingPanel label="Cargando agenda…" />;
    }

    if (isError || !data) {
        return <ErrorPanel onRetry={() => refetch()} />;
    }

    const { salon, appointments, timeBlocks, businessHours } = data;
    const staff = salon.staff;

    const moveDate = (direction: -1 | 1) => {
        const days = view === 'week' ? 7 : 1;
        setDate((current) => addDaysToDateKey(current, direction * days));
    };

    const handleReschedule = async (
        appointmentId: string,
        targetDate: string,
        time: string,
        targetStaffId?: string
    ) => {
        try {
            await actions.rescheduleAppointment(appointmentId, {
                startTime: dateKeyAndTimeToIso(targetDate, time, salon.timezone),
                staffId: targetStaffId,
            });
            toast.success('Cita reprogramada', {
                description: `${capitalize(
                    formatDateKey(targetDate, salon.timezone, "EEEE d 'de' MMMM")
                )} · ${time}`,
            });
        } catch (error) {
            toast.error('No se pudo reprogramar la cita', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        }
    };

    const handleDeleteBlock = async (blockId: string) => {
        try {
            await actions.deleteTimeBlock(blockId);
            toast.success('Bloqueo eliminado');
        } catch (error) {
            toast.error('No se pudo quitar el bloqueo', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        }
    };

    const openNewAppointment = (
        initialDate?: string,
        initialTime?: string,
        initialStaffId?: string
    ) => {
        setFormDate(initialDate ?? date);
        setFormTime(initialTime);
        setFormStaffId(initialStaffId);
        setFormOpen(true);
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Agenda"
                description="Vista diaria y semanal de todas las citas. Arrastra una tarjeta para reprogramar o haz clic en un espacio libre para crear una cita manual."
            >
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBlockOpen(true)}
                >
                    <Ban className="h-4 w-4" />
                    Bloquear horario
                </Button>
                <Button type="button" onClick={() => openNewAppointment()}>
                    <Plus className="h-4 w-4" />
                    Nueva cita
                </Button>
            </PageHeader>

            <div className="grid gap-2 sm:grid-cols-4">
                <div className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        <CalendarDays className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="text-[11px] text-muted-foreground">Citas</p>
                        <p className="text-lg font-semibold leading-tight">
                            {stats.total}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <UserCheck className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="text-[11px] text-muted-foreground">Activas</p>
                        <p className="text-lg font-semibold leading-tight">
                            {stats.active}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                        <UserX className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="text-[11px] text-muted-foreground">Inasistencias</p>
                        <p className="text-lg font-semibold leading-tight">
                            {stats.noShows}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                        <CircleDollarSign className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="text-[11px] text-muted-foreground">Ingresos</p>
                        <p className="text-lg font-semibold leading-tight">
                            {formatCurrency(stats.revenue, salon.currency)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-card">
                <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border bg-background">
                            <button
                                type="button"
                                onClick={() => moveDate(-1)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Periodo anterior"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setDate(getTodayDateKey(timezone))}
                                className="border-x px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                            >
                                Hoy
                            </button>
                            <button
                                type="button"
                                onClick={() => moveDate(1)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Periodo siguiente"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-sm font-semibold">{title}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Select
                            value={staffFilter}
                            onChange={(event) => setStaffFilter(event.target.value)}
                            className="h-8 w-auto min-w-40 text-xs"
                            aria-label="Filtrar por especialista"
                        >
                            <option value="ALL">Todos los especialistas</option>
                            {staff
                                .filter((member) => member.isActive !== false)
                                .map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                        </Select>

                        <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium text-muted-foreground">
                            <input
                                type="checkbox"
                                checked={showCancelled}
                                onChange={(event) =>
                                    setShowCancelled(event.target.checked)
                                }
                                className="h-3.5 w-3.5 accent-zinc-900"
                            />
                            Canceladas
                        </label>

                        <div className="inline-flex rounded-lg border bg-background p-0.5">
                            <button
                                type="button"
                                onClick={() => setView('day')}
                                className={cn(
                                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                    view === 'day'
                                        ? 'bg-zinc-900 text-white'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                Día
                            </button>
                            <button
                                type="button"
                                onClick={() => setView('week')}
                                className={cn(
                                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                    view === 'week'
                                        ? 'bg-zinc-900 text-white'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                Semana
                            </button>
                        </div>
                    </div>
                </div>

                <AgendaCalendar
                    view={view}
                    date={date}
                    staffFilter={staffFilter}
                    appointments={
                        showCancelled
                            ? appointments
                            : appointments.filter(
                                  (appointment) =>
                                      appointment.status !== 'CANCELLED'
                              )
                    }
                    staff={staff}
                    timeBlocks={timeBlocks}
                    businessHours={businessHours}
                    timezone={salon.timezone}
                    onSelectAppointment={(appointment) => {
                        setSelectedAppointment(appointment);
                        setDetailsOpen(true);
                    }}
                    onSlotClick={(slotDate, time, staffId) =>
                        openNewAppointment(slotDate, time, staffId)
                    }
                    onReschedule={handleReschedule}
                    onDeleteBlock={handleDeleteBlock}
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-3">
                    {(
                        [
                            'CONFIRMED',
                            'PENDING_PAYMENT',
                            'COMPLETED',
                            'NO_SHOW',
                            'CANCELLED',
                        ] as const
                    ).map((status) => (
                        <span key={status} className="inline-flex items-center gap-1.5">
                            <span
                                className={cn(
                                    'h-2 w-2 rounded-full',
                                    APPOINTMENT_STATUS_META[status].dot
                                )}
                            />
                            {APPOINTMENT_STATUS_META[status].label}
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Zona horaria del salón: {salon.timezone.replace('_', ' ')}
                </div>
            </div>

            <AppointmentFormSheet
                open={formOpen}
                onOpenChange={setFormOpen}
                initialDate={formDate}
                initialTime={formTime}
                initialStaffId={formStaffId}
            />

            <BlockTimeSheet
                open={blockOpen}
                onOpenChange={setBlockOpen}
                initialDate={date}
                initialStaffId={staffFilter === 'ALL' ? undefined : staffFilter}
            />

            <AppointmentDetailsSheet
                appointment={selectedAppointment}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}
