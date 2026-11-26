'use client';

import { useMemo, useState } from 'react';
import {
    Clock,
    DollarSign,
    Layers,
    Pencil,
    Plus,
    Scissors,
    Search,
    Trash2,
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
} from '@/components/business/shared';
import { ServiceFormSheet } from '@/components/business/ServiceFormSheet';
import { formatCurrency } from '@/lib/timezone';
import { cn } from '@/lib/utils';
import { ServiceItem } from '@/types/booking.contracts';

export function ServicesView() {
    const { data, isLoading, isError, refetch, actions } = useBusiness();
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [formOpen, setFormOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);

    const categories = useMemo(
        () =>
            Array.from(
                new Set((data?.salon.services ?? []).map((service) => service.category))
            ),
        [data?.salon.services]
    );

    const filteredServices = useMemo(() => {
        const term = search.trim().toLowerCase();
        return (data?.salon.services ?? []).filter((service) => {
            const matchesCategory =
                categoryFilter === 'ALL' || service.category === categoryFilter;
            const matchesSearch =
                !term ||
                service.name.toLowerCase().includes(term) ||
                service.category.toLowerCase().includes(term) ||
                (service.description ?? '').toLowerCase().includes(term);
            return matchesCategory && matchesSearch;
        });
    }, [data?.salon.services, search, categoryFilter]);

    const grouped = useMemo(() => {
        const map = new Map<string, ServiceItem[]>();
        filteredServices.forEach((service) => {
            const list = map.get(service.category) ?? [];
            list.push(service);
            map.set(service.category, list);
        });
        return Array.from(map.entries());
    }, [filteredServices]);

    const stats = useMemo(() => {
        const services = data?.salon.services ?? [];
        const averageDuration = services.length
            ? Math.round(
                  services.reduce(
                      (total, service) => total + service.durationMinutes,
                      0
                  ) / services.length
              )
            : 0;
        const averagePrice = services.length
            ? services.reduce((total, service) => total + service.price, 0) /
              services.length
            : 0;
        return {
            total: services.length,
            categories: categories.length,
            averageDuration,
            averagePrice,
        };
    }, [data?.salon.services, categories.length]);

    const handleDelete = async (service: ServiceItem) => {
        if (
            !window.confirm(
                `¿Eliminar el servicio "${service.name}"? Esta acción no se puede deshacer.`
            )
        ) {
            return;
        }

        try {
            await actions.deleteService(service.id);
            toast.success('Servicio eliminado');
        } catch (error) {
            toast.error('No se pudo eliminar el servicio', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        }
    };

    if (isLoading) {
        return <LoadingPanel label="Cargando catálogo de servicios…" />;
    }

    if (isError || !data) {
        return <ErrorPanel onRetry={() => refetch()} />;
    }

    const { salon } = data;
    const staff = salon.staff;

    const openNew = () => {
        setEditingService(null);
        setFormOpen(true);
    };

    const openEdit = (service: ServiceItem) => {
        setEditingService(service);
        setFormOpen(true);
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Servicios"
                description="Gestiona el catálogo, las tarifas, las duraciones y los especialistas habilitados para cada servicio."
            >
                <Button type="button" onClick={openNew}>
                    <Plus className="h-4 w-4" />
                    Nuevo servicio
                </Button>
            </PageHeader>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Servicios activos"
                    value={stats.total}
                    helper={`${stats.categories} categorías`}
                    icon={Scissors}
                />
                <StatCard
                    label="Duración promedio"
                    value={`${stats.averageDuration} min`}
                    helper="Tiempo medio por servicio"
                    icon={Clock}
                    tone="violet"
                />
                <StatCard
                    label="Tarifa promedio"
                    value={formatCurrency(stats.averagePrice, salon.currency)}
                    helper="Precio medio del catálogo"
                    icon={DollarSign}
                    tone="emerald"
                />
                <StatCard
                    label="Categorías"
                    value={stats.categories}
                    helper="Agrupaciones visibles al cliente"
                    icon={Layers}
                    tone="sky"
                />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por nombre o categoría…"
                        className="pl-8"
                    />
                </div>

                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => setCategoryFilter('ALL')}
                        className={cn(
                            'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                            categoryFilter === 'ALL'
                                ? 'border-zinc-900 bg-zinc-900 text-white'
                                : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                        )}
                    >
                        Todas
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setCategoryFilter(category)}
                            className={cn(
                                'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                                categoryFilter === category
                                    ? 'border-zinc-900 bg-zinc-900 text-white'
                                    : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {grouped.length === 0 ? (
                <EmptyState
                    icon={Scissors}
                    title="No encontramos servicios"
                    description="Ajusta la búsqueda o crea un nuevo servicio para comenzar."
                    action={
                        <Button type="button" size="sm" onClick={openNew}>
                            <Plus className="h-4 w-4" />
                            Nuevo servicio
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-5">
                    {grouped.map(([category, services]) => (
                        <section key={category} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-semibold">{category}</h2>
                                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {services.length}
                                </span>
                            </div>

                            <div className="divide-y overflow-hidden rounded-xl border bg-card">
                                {services.map((service) => {
                                    const eligibleStaff = staff.filter((member) =>
                                        service.staffIds.includes(member.id)
                                    );

                                    return (
                                        <div
                                            key={service.id}
                                            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                                        >
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-semibold">
                                                        {service.name}
                                                    </h3>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                        <Clock className="h-2.5 w-2.5" />
                                                        {service.durationMinutes} min
                                                    </span>
                                                </div>
                                                {service.description && (
                                                    <p className="max-w-2xl text-xs text-muted-foreground">
                                                        {service.description}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Especialistas:
                                                    </span>
                                                    {eligibleStaff.length === 0 ? (
                                                        <span className="text-[10px] font-medium text-rose-600">
                                                            Sin asignar
                                                        </span>
                                                    ) : (
                                                        eligibleStaff.map((member) => (
                                                            <span
                                                                key={member.id}
                                                                className="inline-flex items-center gap-1 rounded-full bg-muted/60 py-0.5 pl-0.5 pr-2 text-[10px] font-medium text-muted-foreground"
                                                            >
                                                                <StaffAvatar
                                                                    staff={member}
                                                                    size="xs"
                                                                />
                                                                {member.name.split(' ')[0]}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
                                                <p className="text-base font-semibold">
                                                    {formatCurrency(
                                                        service.price,
                                                        salon.currency
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {service.durationMinutes} minutos
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1 sm:ml-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => openEdit(service)}
                                                    aria-label={`Editar ${service.name}`}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleDelete(service)}
                                                    aria-label={`Eliminar ${service.name}`}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            <ServiceFormSheet
                open={formOpen}
                onOpenChange={setFormOpen}
                service={editingService}
            />
        </div>
    );
}
