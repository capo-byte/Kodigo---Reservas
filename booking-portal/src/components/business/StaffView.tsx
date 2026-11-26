'use client';

import { useMemo, useState } from 'react';
import {
    CalendarClock,
    Mail,
    Pencil,
    Phone,
    Plus,
    Scissors,
    Search,
    Trash2,
    UserCheck,
    UserX,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBusiness } from '@/components/business/BusinessProvider';
import {
    EmptyState,
    ErrorPanel,
    LoadingPanel,
    PageHeader,
    StaffAvatar,
    StatCard,
    useNow,
} from '@/components/business/shared';
import { StaffFormSheet } from '@/components/business/StaffFormSheet';
import { cn } from '@/lib/utils';
import { StaffMember } from '@/types/booking.contracts';

const DAY_LABELS: Record<number, string> = {
    0: 'Dom',
    1: 'Lun',
    2: 'Mar',
    3: 'Mié',
    4: 'Jue',
    5: 'Vie',
    6: 'Sáb',
};

export function StaffView() {
    const { data, isLoading, isError, refetch, actions } = useBusiness();
    const now = useNow();
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

    const filteredStaff = useMemo(() => {
        const term = search.trim().toLowerCase();
        return (data?.salon.staff ?? []).filter(
            (member) =>
                !term ||
                member.name.toLowerCase().includes(term) ||
                member.role.toLowerCase().includes(term)
        );
    }, [data?.salon.staff, search]);

    const stats = useMemo(() => {
        const staff = data?.salon.staff ?? [];
        const active = staff.filter((member) => member.isActive !== false);
        const upcoming = (data?.appointments ?? []).filter(
            (appointment) =>
                ['CONFIRMED', 'PENDING_PAYMENT'].includes(appointment.status) &&
                new Date(appointment.startTime).getTime() >= now
        );
        return {
            total: staff.length,
            active: active.length,
            inactive: staff.length - active.length,
            upcoming: upcoming.length,
        };
    }, [data?.salon.staff, data?.appointments, now]);

    const handleToggleActive = async (member: StaffMember) => {
        try {
            await actions.updateStaffMember(member.id, {
                isActive: member.isActive === false,
            });
            toast.success(
                member.isActive === false
                    ? 'Especialista activado'
                    : 'Especialista desactivado'
            );
        } catch (error) {
            toast.error('No se pudo actualizar el estado', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        }
    };

    const handleDelete = async (member: StaffMember) => {
        if (
            !window.confirm(
                `¿Eliminar a ${member.name} del equipo? Esta acción no se puede deshacer.`
            )
        ) {
            return;
        }

        try {
            await actions.deleteStaffMember(member.id);
            toast.success('Especialista eliminado');
        } catch (error) {
            toast.error('No se pudo eliminar al especialista', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        }
    };

    if (isLoading) {
        return <LoadingPanel label="Cargando equipo…" />;
    }

    if (isError || !data) {
        return <ErrorPanel onRetry={() => refetch()} />;
    }

    const { salon, appointments } = data;

    const openNew = () => {
        setEditingMember(null);
        setFormOpen(true);
    };

    const openEdit = (member: StaffMember) => {
        setEditingMember(member);
        setFormOpen(true);
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Personal"
                description="Administra el equipo, sus datos de contacto, días de trabajo y visibilidad en las reservas."
            >
                <Button type="button" onClick={openNew}>
                    <Plus className="h-4 w-4" />
                    Nuevo especialista
                </Button>
            </PageHeader>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Equipo"
                    value={stats.total}
                    helper="Personas registradas"
                    icon={Users}
                />
                <StatCard
                    label="Activos"
                    value={stats.active}
                    helper="Disponibles para reservar"
                    icon={UserCheck}
                    tone="emerald"
                />
                <StatCard
                    label="Inactivos"
                    value={stats.inactive}
                    helper="Ocultos en reservas nuevas"
                    icon={UserX}
                    tone="rose"
                />
                <StatCard
                    label="Citas próximas"
                    value={stats.upcoming}
                    helper="Agendadas con el equipo"
                    icon={CalendarClock}
                    tone="sky"
                />
            </div>

            <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre o rol…"
                    className="pl-8"
                />
            </div>

            {filteredStaff.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No encontramos especialistas"
                    description="Prueba con otra búsqueda o agrega un nuevo miembro al equipo."
                    action={
                        <Button type="button" size="sm" onClick={openNew}>
                            <Plus className="h-4 w-4" />
                            Nuevo especialista
                        </Button>
                    }
                />
            ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredStaff.map((member) => {
                        const isActive = member.isActive !== false;
                        const memberServices = salon.services.filter((service) =>
                            service.staffIds.includes(member.id)
                        );
                        const upcomingCount = appointments.filter(
                            (appointment) =>
                                appointment.staffId === member.id &&
                                ['CONFIRMED', 'PENDING_PAYMENT'].includes(
                                    appointment.status
                                ) &&
                                new Date(appointment.startTime).getTime() >=
                                    now
                        ).length;

                        return (
                            <div
                                key={member.id}
                                className={cn(
                                    'flex flex-col rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm',
                                    !isActive && 'opacity-70'
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <StaffAvatar staff={member} size="lg" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="truncate text-sm font-semibold">
                                                {member.name}
                                            </h3>
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                                    isActive
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'h-1.5 w-1.5 rounded-full',
                                                        isActive
                                                            ? 'bg-emerald-500'
                                                            : 'bg-zinc-400'
                                                    )}
                                                />
                                                {isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {member.role}
                                        </p>
                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                            {[1, 2, 3, 4, 5, 6, 0]
                                                .filter((day) =>
                                                    (member.workDays ?? []).includes(day)
                                                )
                                                .map((day) => (
                                                    <span
                                                        key={day}
                                                        className="rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground"
                                                    >
                                                        {DAY_LABELS[day]}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                                    {member.phone && (
                                        <p className="flex items-center gap-1.5">
                                            <Phone className="h-3 w-3" />
                                            {member.phone}
                                        </p>
                                    )}
                                    {member.email && (
                                        <p className="flex items-center gap-1.5">
                                            <Mail className="h-3 w-3" />
                                            <span className="truncate">{member.email}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3 text-center">
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {memberServices.length}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Servicios
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {upcomingCount}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Próximas citas
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center gap-1 border-t pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => openEdit(member)}
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Editar
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => handleToggleActive(member)}
                                    >
                                        {isActive ? (
                                            <>
                                                <UserX className="h-3.5 w-3.5" />
                                                Desactivar
                                            </>
                                        ) : (
                                            <>
                                                <UserCheck className="h-3.5 w-3.5" />
                                                Activar
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => handleDelete(member)}
                                        aria-label={`Eliminar a ${member.name}`}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex items-start gap-2 rounded-xl border bg-muted/30 px-3 py-2.5 text-[11px] text-muted-foreground">
                <Scissors className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                    Para que un especialista aparezca en una reserva, debe estar activo y
                    asociado al menos a un servicio. Configura esas relaciones desde el
                    módulo de Servicios.
                </p>
            </div>

            <StaffFormSheet
                open={formOpen}
                onOpenChange={setFormOpen}
                member={editingMember}
            />
        </div>
    );
}
