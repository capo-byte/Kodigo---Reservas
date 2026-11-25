'use client';

import { useMemo } from 'react';
import { Clock, Check, Users } from 'lucide-react';
import { ServiceItem, StaffMember } from '@/types/booking.contracts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StepServiceStaffProps {
    services: ServiceItem[];
    staff: StaffMember[];
    currency: string;
    selectedServiceIds: string[];
    selectedStaffId: string | 'ANY';
    onToggleService: (serviceId: string) => void;
    onSelectStaff: (staffId: string | 'ANY') => void;
}

export function StepServiceStaff({
    services,
    staff,
    currency,
    selectedServiceIds,
    selectedStaffId,
    onToggleService,
    onSelectStaff,
}: StepServiceStaffProps) {
    const groupedServices = useMemo(() => {
        const map = new Map<string, ServiceItem[]>();
        for (const service of services) {
            const list = map.get(service.category) ?? [];
            list.push(service);
            map.set(service.category, list);
        }
        return Array.from(map.entries());
    }, [services]);

    const selectedServices = useMemo(
        () => services.filter((s) => selectedServiceIds.includes(s.id)),
        [services, selectedServiceIds]
    );

    // Solo mostramos especialistas habilitados para los servicios seleccionados
    const eligibleStaff = useMemo(() => {
        if (selectedServices.length === 0) return [];
        // Especialistas que pueden realizar el servicio principal (o todos si hay intersección)
        const primaryService = selectedServices[0];
        const sharedStaff = staff.filter((member) =>
            selectedServices.every((s) => s.staffIds.includes(member.id))
        );
        return sharedStaff.length > 0
            ? sharedStaff
            : staff.filter((member) => primaryService.staffIds.includes(member.id));
    }, [selectedServices, staff]);

    const formatPrice = (amount: number) =>
        new Intl.NumberFormat('es-SV', {
            style: 'currency',
            currency,
            minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        }).format(amount);

    return (
        <div className="space-y-8">
            {/* Selección de servicio (múltiple o individual) */}
            <section aria-labelledby="services-heading" className="space-y-5">
                <div>
                    <h2 id="services-heading" className="text-lg font-semibold tracking-tight">
                        1. Elige uno o varios servicios
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Toca los servicios que deseas realizarte hoy para añadirlos a tu cita.
                    </p>
                </div>

                <div className="space-y-6">
                    {groupedServices.map(([category, categoryServices]) => (
                        <div key={category} className="space-y-2.5">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {category}
                            </h3>

                            <div className="grid gap-2.5">
                                {categoryServices.map((service) => {
                                    const isSelected = selectedServiceIds.includes(service.id);

                                    return (
                                        <Card
                                            key={service.id}
                                            role="button"
                                            tabIndex={0}
                                            aria-pressed={isSelected}
                                            onClick={() => onToggleService(service.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onToggleService(service.id);
                                                }
                                            }}
                                            className={cn(
                                                'cursor-pointer transition-all active:scale-[0.99]',
                                                isSelected
                                                    ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]'
                                                    : 'hover:border-foreground/30'
                                            )}
                                        >
                                            <CardContent className="flex items-start justify-between gap-4 p-4">
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium leading-snug">
                                                            {service.name}
                                                        </span>
                                                        {isSelected && (
                                                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                                <Check className="h-3 w-3" />
                                                            </span>
                                                        )}
                                                    </div>

                                                    {service.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {service.description}
                                                        </p>
                                                    )}

                                                    <div className="pt-1 flex items-center gap-2">
                                                        <Badge variant="secondary" className="gap-1 font-normal text-xs">
                                                            <Clock className="h-3 w-3" />
                                                            {service.durationMinutes} min
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 text-right font-semibold text-base">
                                                    {formatPrice(service.price)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Selección de profesional (aparece al elegir al menos un servicio) */}
            {selectedServices.length > 0 && (
                <section
                    aria-labelledby="staff-heading"
                    className="space-y-3 border-t pt-6 animate-in fade-in duration-200"
                >
                    <div>
                        <h2 id="staff-heading" className="text-lg font-semibold tracking-tight">
                            2. ¿Con quién prefieres atenderte?
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Por defecto asignamos la primera disponibilidad.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Opción por defecto: Cualquier profesional */}
                        <button
                            type="button"
                            onClick={() => onSelectStaff('ANY')}
                            className={cn(
                                'flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all active:scale-[0.99]',
                                selectedStaffId === 'ANY'
                                    ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]'
                                    : 'hover:border-foreground/30'
                            )}
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
                                <Users className="h-5 w-5 text-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                    Cualquier profesional disponible
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Mayor disponibilidad horaria
                                </p>
                            </div>
                            {selectedStaffId === 'ANY' && (
                                <Check className="h-4 w-4 shrink-0 text-primary" />
                            )}
                        </button>

                        {/* Especialistas habilitados */}
                        {eligibleStaff.map((member) => {
                            const isSelected = selectedStaffId === member.id;

                            return (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => onSelectStaff(member.id)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all active:scale-[0.99]',
                                        isSelected
                                            ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]'
                                            : 'hover:border-foreground/30'
                                    )}
                                >
                                    {member.avatarUrl ? (
                                        <img
                                            src={member.avatarUrl}
                                            alt={member.name}
                                            className="h-11 w-11 shrink-0 rounded-full object-cover border"
                                        />
                                    ) : (
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                            {member.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium truncate">{member.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {member.role}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <Check className="h-4 w-4 shrink-0 text-primary" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
