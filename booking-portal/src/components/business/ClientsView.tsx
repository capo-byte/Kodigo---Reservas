'use client';

import { useMemo, useState } from 'react';
import {
    CalendarClock,
    Eye,
    Plus,
    Repeat2,
    Search,
    UserCheck,
    UserPlus,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBusiness } from '@/components/business/BusinessProvider';
import {
    EmptyState,
    ErrorPanel,
    LoadingPanel,
    PageHeader,
    StatCard,
    getInitials,
    useNow,
} from '@/components/business/shared';
import { AppointmentFormSheet } from '@/components/business/AppointmentFormSheet';
import { ClientDetailsSheet } from '@/components/business/ClientDetailsSheet';
import { ClientFormSheet } from '@/components/business/ClientFormSheet';
import {
    formatDateKey,
    formatSalonDateTime,
    getSalonDateKey,
    getTodayDateKey,
} from '@/lib/timezone';
import { cn } from '@/lib/utils';
import { BusinessClient } from '@/types/booking.contracts';

type ClientFilter = 'ALL' | 'UPCOMING' | 'RECURRING' | 'NEW';

const FILTER_LABELS: Record<ClientFilter, string> = {
    ALL: 'Todos',
    UPCOMING: 'Con próxima cita',
    RECURRING: 'Recurrentes',
    NEW: 'Nuevos del mes',
};

export function ClientsView() {
    const { data, isLoading, isError, refetch } = useBusiness();
    const now = useNow();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<ClientFilter>('ALL');
    const [formOpen, setFormOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<BusinessClient | null>(null);
    const [selectedClient, setSelectedClient] = useState<BusinessClient | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [appointmentOpen, setAppointmentOpen] = useState(false);
    const [appointmentClientId, setAppointmentClientId] = useState<
        string | undefined
    >(undefined);

    const timezone = data?.salon.timezone ?? 'America/El_Salvador';
    const currentMonth = getTodayDateKey(timezone).slice(0, 7);

    const clientRows = useMemo(() => {
        if (!data) return [];

        return data.clients.map((client) => {
            const appointments = data.appointments.filter(
                (appointment) => appointment.clientId === client.id
            );
            const visits = appointments.filter(
                (appointment) => appointment.status === 'COMPLETED'
            );
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
                );
            const lastVisit = visits.reduce<string | undefined>(
                (latest, appointment) =>
                    !latest ||
                    new Date(appointment.startTime).getTime() >
                        new Date(latest).getTime()
                        ? appointment.startTime
                        : latest,
                undefined
            );

            return {
                client,
                visits: visits.length,
                lastVisit,
                upcoming,
                isRecurring: visits.length >= 2,
                isNew:
                    getSalonDateKey(client.createdAt, timezone).slice(0, 7) ===
                    currentMonth,
            };
        });
    }, [data, timezone, currentMonth, now]);

    const stats = useMemo(
        () => ({
            total: clientRows.length,
            upcoming: clientRows.filter((row) => row.upcoming.length > 0).length,
            recurring: clientRows.filter((row) => row.isRecurring).length,
            newThisMonth: clientRows.filter((row) => row.isNew).length,
        }),
        [clientRows]
    );

    const filteredRows = useMemo(() => {
        const term = search.trim().toLowerCase();

        return clientRows
            .filter((row) => {
                const matchesSearch =
                    !term ||
                    row.client.name.toLowerCase().includes(term) ||
                    row.client.phone.toLowerCase().includes(term) ||
                    (row.client.email ?? '').toLowerCase().includes(term);

                const matchesFilter =
                    filter === 'ALL' ||
                    (filter === 'UPCOMING' && row.upcoming.length > 0) ||
                    (filter === 'RECURRING' && row.isRecurring) ||
                    (filter === 'NEW' && row.isNew);

                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => a.client.name.localeCompare(b.client.name));
    }, [clientRows, search, filter]);

    if (isLoading) {
        return <LoadingPanel label="Cargando clientes…" />;
    }

    if (isError || !data) {
        return <ErrorPanel onRetry={() => refetch()} />;
    }

    const { salon } = data;

    const openNew = () => {
        setEditingClient(null);
        setFormOpen(true);
    };

    const openDetails = (client: BusinessClient) => {
        setSelectedClient(client);
        setDetailsOpen(true);
    };

    const openEdit = (client: BusinessClient) => {
        setDetailsOpen(false);
        setEditingClient(client);
        setFormOpen(true);
    };

    const openAppointment = (client: BusinessClient) => {
        setDetailsOpen(false);
        setAppointmentClientId(client.id);
        setAppointmentOpen(true);
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Clientes"
                description="Consulta el historial, las preferencias y las próximas citas de cada cliente del salón."
            >
                <Button type="button" onClick={openNew}>
                    <Plus className="h-4 w-4" />
                    Nuevo cliente
                </Button>
            </PageHeader>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Clientes"
                    value={stats.total}
                    helper="Registrados en el salón"
                    icon={Users}
                />
                <StatCard
                    label="Con próxima cita"
                    value={stats.upcoming}
                    helper="Agendados en el futuro"
                    icon={CalendarClock}
                    tone="sky"
                />
                <StatCard
                    label="Recurrentes"
                    value={stats.recurring}
                    helper="Dos visitas o más"
                    icon={Repeat2}
                    tone="violet"
                />
                <StatCard
                    label="Nuevos del mes"
                    value={stats.newThisMonth}
                    helper="Primera vez este mes"
                    icon={UserPlus}
                    tone="emerald"
                />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por nombre, teléfono o correo…"
                        className="pl-8"
                    />
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(FILTER_LABELS) as ClientFilter[]).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFilter(key)}
                            className={cn(
                                'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                                filter === key
                                    ? 'border-zinc-900 bg-zinc-900 text-white'
                                    : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                            )}
                        >
                            {FILTER_LABELS[key]}
                        </button>
                    ))}
                </div>
            </div>

            {filteredRows.length === 0 ? (
                <EmptyState
                    icon={UserCheck}
                    title="No encontramos clientes"
                    description="Ajusta los filtros o registra un nuevo cliente para comenzar."
                    action={
                        <Button type="button" size="sm" onClick={openNew}>
                            <Plus className="h-4 w-4" />
                            Nuevo cliente
                        </Button>
                    }
                />
            ) : (
                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_70px_120px_minmax(0,1.1fr)_70px] gap-3 border-b bg-muted/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                        <span>Cliente</span>
                        <span>Contacto</span>
                        <span className="text-center">Visitas</span>
                        <span>Última visita</span>
                        <span>Próxima cita</span>
                        <span />
                    </div>

                    <div className="divide-y">
                        {filteredRows.map((row) => {
                            const nextAppointment = row.upcoming[0];

                            return (
                                <div
                                    key={row.client.id}
                                    className="grid grid-cols-1 gap-2 px-4 py-3 text-xs transition-colors hover:bg-muted/30 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_70px_120px_minmax(0,1.1fr)_70px] lg:items-center lg:gap-3"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                            {getInitials(row.client.name)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {row.client.name}
                                            </p>
                                            <p className="truncate text-[10px] text-muted-foreground">
                                                {row.client.email ?? 'Sin correo'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="min-w-0 text-muted-foreground">
                                        <p className="truncate">{row.client.phone}</p>
                                    </div>

                                    <div className="flex items-center gap-2 lg:justify-center">
                                        <span className="text-[10px] text-muted-foreground lg:hidden">
                                            Visitas:
                                        </span>
                                        <span className="font-medium">{row.visits}</span>
                                    </div>

                                    <div className="text-[11px] text-muted-foreground">
                                        {row.lastVisit
                                            ? formatSalonDateTime(
                                                  row.lastVisit,
                                                  salon.timezone,
                                                  'd MMM yyyy'
                                              )
                                            : '—'}
                                    </div>

                                    <div className="text-[11px]">
                                        {nextAppointment ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                <span className="truncate">
                                                    {formatDateKey(
                                                        getSalonDateKey(
                                                            nextAppointment.startTime,
                                                            salon.timezone
                                                        ),
                                                        salon.timezone,
                                                        "EEE d MMM"
                                                    )}{' '}
                                                    ·{' '}
                                                    {formatSalonDateTime(
                                                        nextAppointment.startTime,
                                                        salon.timezone,
                                                        'h:mm a'
                                                    )}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="xs"
                                            onClick={() => openDetails(row.client)}
                                        >
                                            <Eye className="h-3 w-3" />
                                            Ver ficha
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <ClientFormSheet
                open={formOpen}
                onOpenChange={setFormOpen}
                client={editingClient}
            />

            <AppointmentFormSheet
                open={appointmentOpen}
                onOpenChange={setAppointmentOpen}
                initialClientId={appointmentClientId}
            />

            <ClientDetailsSheet
                client={selectedClient}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                onEdit={openEdit}
                onNewAppointment={openAppointment}
            />
        </div>
    );
}
