'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Ban,
    CalendarDays,
    CalendarPlus,
    CircleDollarSign,
    Clock,
    Gauge,
    Plus,
    Scissors,
    UserPlus,
    UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBusiness } from '@/components/business/BusinessProvider';
import { AppointmentDetailsSheet } from '@/components/business/AppointmentDetailsSheet';
import { AppointmentFormSheet } from '@/components/business/AppointmentFormSheet';
import { BlockTimeSheet } from '@/components/business/BlockTimeSheet';
import {
    EmptyState,
    ErrorPanel,
    LoadingPanel,
    PageHeader,
    StaffAvatar,
    StatusBadge,
    StatCard,
    useNow,
} from '@/components/business/shared';
import {
    addDaysToDateKey,
    formatCurrency,
    formatDateKey,
    formatSalonDateTime,
    getDayOfWeek,
    getSalonDateKey,
    getTodayDateKey,
    timeLabelToMinutes,
} from '@/lib/timezone';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types/booking.contracts';

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function OverviewView() {
    const { data, isLoading, isError, refetch } = useBusiness();
    const now = useNow();
    const timezone = data?.salon.timezone ?? 'America/El_Salvador';

    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [blockOpen, setBlockOpen] = useState(false);

    const todayKey = useMemo(() => getTodayDateKey(timezone), [timezone]);

    const dashboard = useMemo(() => {
        if (!data) {
            return null;
        }

        const { salon, appointments, businessHours } = data;
        const activeStaff = salon.staff.filter(
            (member) => member.isActive !== false
        );

        const todayAppointments = appointments
            .filter(
                (appointment) =>
                    getSalonDateKey(appointment.startTime, salon.timezone) ===
                    todayKey
            )
            .sort(
                (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime()
            );

        const todayActive = todayAppointments.filter((appointment) =>
            ['CONFIRMED', 'PENDING_PAYMENT'].includes(appointment.status)
        );
        const todayBooked = todayAppointments.filter(
            (appointment) => appointment.status !== 'CANCELLED'
        );
        const todayNoShows = todayAppointments.filter(
            (appointment) => appointment.status === 'NO_SHOW'
        );
        const todayRevenue = todayBooked.reduce(
            (total, appointment) => total + appointment.price,
            0
        );

        const schedule = businessHours.days.find(
            (day) => day.dayOfWeek === getDayOfWeek(todayKey)
        );
        const availableMinutes =
            schedule?.isOpen && activeStaff.length > 0
                ? (timeLabelToMinutes(schedule.closeTime) -
                      timeLabelToMinutes(schedule.openTime)) *
                  activeStaff.length
                : 0;
        const bookedMinutes = todayBooked.reduce((total, appointment) => {
            const duration =
                (new Date(appointment.endTime).getTime() -
                    new Date(appointment.startTime).getTime()) /
                60_000;
            return total + duration;
        }, 0);
        const occupancy =
            availableMinutes > 0
                ? Math.min(100, Math.round((bookedMinutes / availableMinutes) * 100))
                : 0;

        const weekStart = addDaysToDateKey(todayKey, -6);
        const noShowsThisWeek = appointments.filter(
            (appointment) =>
                appointment.status === 'NO_SHOW' &&
                getSalonDateKey(appointment.startTime, salon.timezone) >=
                    weekStart &&
                getSalonDateKey(appointment.startTime, salon.timezone) <=
                    todayKey
        ).length;

        const upcoming = appointments
            .filter(
                (appointment) =>
                    ['CONFIRMED', 'PENDING_PAYMENT'].includes(
                        appointment.status
                    ) &&
                    new Date(appointment.startTime).getTime() >= now
            )
            .sort(
                (a, b) =>
                    new Date(a.startTime).getTime() -
                    new Date(b.startTime).getTime()
            )
            .slice(0, 6);

        const revenueSeries = Array.from({ length: 7 }, (_, index) => {
            const dateKey = addDaysToDateKey(todayKey, index - 6);
            const total = appointments
                .filter(
                    (appointment) =>
                        getSalonDateKey(
                            appointment.startTime,
                            salon.timezone
                        ) === dateKey &&
                        appointment.status !== 'CANCELLED'
                )
                .reduce((sum, appointment) => sum + appointment.price, 0);
            return {
                dateKey,
                total,
                label: capitalize(
                    formatDateKey(dateKey, salon.timezone, 'EEE').replace('.', '')
                ),
                isToday: dateKey === todayKey,
            };
        });
        const maxRevenue = Math.max(...revenueSeries.map((item) => item.total), 1);
        const weekRevenue = revenueSeries.reduce(
            (total, item) => total + item.total,
            0
        );

        const teamToday = activeStaff.map((member) => {
            const memberToday = todayAppointments
                .filter(
                    (appointment) =>
                        appointment.staffId === member.id &&
                        appointment.status !== 'CANCELLED'
                )
                .sort(
                    (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime()
                );
            const next = memberToday.find(
                (appointment) =>
                    new Date(appointment.startTime).getTime() >= now
            );

            return {
                member,
                count: memberToday.length,
                next,
            };
        });

        return {
            todayAppointments,
            todayActive,
            todayBooked,
            todayNoShows,
            todayRevenue,
            occupancy,
            noShowsThisWeek,
            upcoming,
            revenueSeries,
            maxRevenue,
            weekRevenue,
            teamToday,
        };
    }, [data, todayKey, now]);

    if (isLoading) {
        return <LoadingPanel label="Cargando resumen del negocio…" />;
    }

    if (isError || !data || !dashboard) {
        return <ErrorPanel onRetry={() => refetch()} />;
    }

    const { salon } = data;
    const base = `/negocio/${salon.slug}`;
    const todayLabel = capitalize(
        formatDateKey(todayKey, salon.timezone, "EEEE d 'de' MMMM")
    );
    const hour = Number(
        formatSalonDateTime(new Date(now).toISOString(), salon.timezone, 'H')
    );
    const greeting =
        hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

    return (
        <div className="space-y-5">
            <PageHeader
                title={`${greeting}, Carlos`}
                description={`${todayLabel} · Esto es lo que está pasando en ${salon.name}.`}
            >
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBlockOpen(true)}
                >
                    <Ban className="h-4 w-4" />
                    Bloquear horario
                </Button>
                <Button type="button" onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Nueva cita
                </Button>
            </PageHeader>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Citas de hoy"
                    value={dashboard.todayAppointments.length}
                    helper={`${dashboard.todayActive.length} activas por atender`}
                    icon={CalendarDays}
                    tone="violet"
                />
                <StatCard
                    label="Ingresos estimados"
                    value={formatCurrency(dashboard.todayRevenue, salon.currency)}
                    helper="Citas de hoy no canceladas"
                    icon={CircleDollarSign}
                    tone="emerald"
                />
                <StatCard
                    label="Ocupación de hoy"
                    value={`${dashboard.occupancy}%`}
                    helper="Tiempo reservado del equipo"
                    icon={Gauge}
                    tone="sky"
                />
                <StatCard
                    label="Inasistencias"
                    value={dashboard.noShowsThisWeek}
                    helper="Últimos 7 días"
                    icon={UserX}
                    tone="rose"
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <div className="space-y-4 xl:col-span-2">
                    <section className="overflow-hidden rounded-xl border bg-card">
                        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                            <div>
                                <h2 className="text-sm font-semibold">Agenda de hoy</h2>
                                <p className="text-[11px] text-muted-foreground">
                                    {dashboard.todayAppointments.length} citas agendadas
                                </p>
                            </div>
                            <Link
                                href={`${base}/agenda`}
                                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                                Ver agenda
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        {dashboard.todayAppointments.length === 0 ? (
                            <div className="p-4">
                                <EmptyState
                                    icon={CalendarPlus}
                                    title="Sin citas para hoy"
                                    description="Crea una cita manual o comparte tu página de reservas."
                                    action={
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setFormOpen(true)}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Nueva cita
                                        </Button>
                                    }
                                />
                            </div>
                        ) : (
                            <div className="max-h-[28rem] divide-y overflow-y-auto">
                                {dashboard.todayAppointments.map((appointment) => {
                                    const member = salon.staff.find(
                                        (item) => item.id === appointment.staffId
                                    );

                                    return (
                                        <button
                                            key={appointment.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedAppointment(appointment);
                                                setDetailsOpen(true);
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/40"
                                        >
                                            <div className="w-14 shrink-0 text-[11px] font-semibold">
                                                {formatSalonDateTime(
                                                    appointment.startTime,
                                                    salon.timezone,
                                                    'h:mm a'
                                                )}
                                            </div>
                                            <StaffAvatar staff={member} size="sm" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-medium">
                                                    {appointment.clientName}
                                                </p>
                                                <p className="truncate text-[10px] text-muted-foreground">
                                                    {appointment.serviceName} ·{' '}
                                                    {appointment.staffName}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                status={appointment.status}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-xl border bg-card">
                        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                            <div>
                                <h2 className="text-sm font-semibold">
                                    Ingresos · últimos 7 días
                                </h2>
                                <p className="text-[11px] text-muted-foreground">
                                    Total {formatCurrency(dashboard.weekRevenue, salon.currency)}
                                </p>
                            </div>
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex h-40 items-end gap-2 px-4 pb-3 pt-5">
                            {dashboard.revenueSeries.map((item) => (
                                <div
                                    key={item.dateKey}
                                    className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                                >
                                    <div
                                        className="flex w-full flex-1 items-end"
                                        title={`${item.label}: ${formatCurrency(
                                            item.total,
                                            salon.currency
                                        )}`}
                                    >
                                        <div
                                            className={cn(
                                                'w-full rounded-t-md transition-all',
                                                item.isToday
                                                    ? 'bg-rose-500'
                                                    : 'bg-zinc-200 dark:bg-zinc-700'
                                            )}
                                            style={{
                                                height: `${Math.max(
                                                    4,
                                                    (item.total /
                                                        dashboard.maxRevenue) *
                                                        100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                    <span
                                        className={cn(
                                            'text-[10px] font-medium',
                                            item.isToday
                                                ? 'text-rose-600 dark:text-rose-300'
                                                : 'text-muted-foreground'
                                        )}
                                    >
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="space-y-4">
                    <section className="overflow-hidden rounded-xl border bg-card">
                        <div className="border-b px-4 py-3">
                            <h2 className="text-sm font-semibold">Acciones rápidas</h2>
                            <p className="text-[11px] text-muted-foreground">
                                Atajos para la operación diaria
                            </p>
                        </div>
                        <div className="divide-y">
                            <button
                                type="button"
                                onClick={() => setFormOpen(true)}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-muted/40"
                            >
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                                    <CalendarPlus className="h-3.5 w-3.5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-medium">
                                        Nueva cita manual
                                    </span>
                                    <span className="block text-[10px] text-muted-foreground">
                                        Teléfono, WhatsApp o recepción
                                    </span>
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setBlockOpen(true)}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-muted/40"
                            >
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                    <Ban className="h-3.5 w-3.5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-medium">
                                        Bloquear horario
                                    </span>
                                    <span className="block text-[10px] text-muted-foreground">
                                        Descansos y tareas internas
                                    </span>
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <Link
                                href={`${base}/servicios`}
                                className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted/40"
                            >
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                                    <Scissors className="h-3.5 w-3.5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-medium">
                                        Administrar servicios
                                    </span>
                                    <span className="block text-[10px] text-muted-foreground">
                                        Tarifas, duraciones y equipo
                                    </span>
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </Link>
                            <Link
                                href={`${base}/clientes`}
                                className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-muted/40"
                            >
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                                    <UserPlus className="h-3.5 w-3.5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-medium">
                                        Registrar cliente
                                    </span>
                                    <span className="block text-[10px] text-muted-foreground">
                                        Historial y preferencias
                                    </span>
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </Link>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-xl border bg-card">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <h2 className="text-sm font-semibold">Próximas citas</h2>
                            <Link
                                href={`${base}/agenda`}
                                className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                            >
                                Ver todas
                            </Link>
                        </div>
                        {dashboard.upcoming.length === 0 ? (
                            <p className="px-4 py-6 text-center text-[11px] text-muted-foreground">
                                No hay citas próximas.
                            </p>
                        ) : (
                            <div className="divide-y">
                                {dashboard.upcoming.slice(0, 4).map((appointment) => (
                                    <button
                                        key={appointment.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedAppointment(appointment);
                                            setDetailsOpen(true);
                                        }}
                                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-muted/40"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-medium">
                                                {appointment.clientName}
                                            </p>
                                            <p className="truncate text-[10px] capitalize text-muted-foreground">
                                                {formatDateKey(
                                                    getSalonDateKey(
                                                        appointment.startTime,
                                                        salon.timezone
                                                    ),
                                                    salon.timezone,
                                                    'EEE d MMM'
                                                )}{' '}
                                                ·{' '}
                                                {formatSalonDateTime(
                                                    appointment.startTime,
                                                    salon.timezone,
                                                    'h:mm a'
                                                )}
                                            </p>
                                        </div>
                                        <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-xl border bg-card">
                        <div className="border-b px-4 py-3">
                            <h2 className="text-sm font-semibold">Equipo hoy</h2>
                            <p className="text-[11px] text-muted-foreground">
                                Carga de trabajo por especialista
                            </p>
                        </div>
                        <div className="divide-y">
                            {dashboard.teamToday.map(({ member, count, next }) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-2.5 px-4 py-2.5"
                                >
                                    <StaffAvatar staff={member} size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium">
                                            {member.name}
                                        </p>
                                        <p className="truncate text-[10px] text-muted-foreground">
                                            {next
                                                ? `Próxima ${formatSalonDateTime(
                                                      next.startTime,
                                                      salon.timezone,
                                                      'h:mm a'
                                                  )}`
                                                : 'Sin más citas hoy'}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                        {count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <AppointmentFormSheet open={formOpen} onOpenChange={setFormOpen} />
            <BlockTimeSheet
                open={blockOpen}
                onOpenChange={setBlockOpen}
                initialDate={todayKey}
            />
            <AppointmentDetailsSheet
                appointment={selectedAppointment}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />
        </div>
    );
}
