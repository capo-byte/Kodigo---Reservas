'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    CalendarClock,
    Clock,
    Loader2,
    Plus,
    UserPlus,
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
import { Textarea } from '@/components/ui/textarea';
import { useBusiness } from '@/components/business/BusinessProvider';
import { FormField } from '@/components/business/shared';
import {
    addMinutesToIso,
    dateKeyAndTimeToIso,
    formatCurrency,
    formatSalonDateTime,
    getTodayDateKey,
} from '@/lib/timezone';
import { cn } from '@/lib/utils';

interface AppointmentFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialDate?: string;
    initialTime?: string;
    initialStaffId?: string;
    initialClientId?: string;
}

export function AppointmentFormSheet({
    open,
    onOpenChange,
    initialDate,
    initialTime,
    initialStaffId,
    initialClientId,
}: AppointmentFormSheetProps) {
    const { data, actions } = useBusiness();
    const initializedRef = useRef(false);

    const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
    const [clientId, setClientId] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [staffId, setStaffId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('10:00');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const salon = data?.salon;
    const activeStaff = useMemo(
        () => (salon?.staff ?? []).filter((member) => member.isActive !== false),
        [salon]
    );
    const selectedService = useMemo(
        () => salon?.services.find((service) => service.id === serviceId) ?? null,
        [salon, serviceId]
    );
    const eligibleStaff = useMemo(() => {
        if (!selectedService) return activeStaff;
        return activeStaff.filter((member) =>
            selectedService.staffIds.includes(member.id)
        );
    }, [activeStaff, selectedService]);

    useEffect(() => {
        if (!open) {
            initializedRef.current = false;
            return;
        }
        if (!data || initializedRef.current) return;

        const firstService = data.salon.services[0];
        const firstEligible =
            firstService?.staffIds
                .map((id) => activeStaff.find((member) => member.id === id))
                .find(Boolean) ?? activeStaff[0];

        setServiceId(firstService?.id ?? '');
        setStaffId(initialStaffId ?? firstEligible?.id ?? '');
        setDate(initialDate ?? getTodayDateKey(data.salon.timezone));
        setTime(initialTime ?? '10:00');
        setClientMode(
            initialClientId || data.clients.length > 0 ? 'existing' : 'new'
        );
        setClientId(initialClientId ?? data.clients[0]?.id ?? '');
        setClientName('');
        setClientPhone('');
        setClientEmail('');
        setNotes('');
        setError(null);
        initializedRef.current = true;
    }, [open, data, activeStaff, initialDate, initialTime, initialStaffId, initialClientId]);

    const handleServiceChange = (nextServiceId: string) => {
        setServiceId(nextServiceId);
        const nextService = salon?.services.find(
            (service) => service.id === nextServiceId
        );
        const nextEligible = activeStaff.filter((member) =>
            nextService?.staffIds.includes(member.id)
        );
        if (!nextEligible.some((member) => member.id === staffId)) {
            setStaffId(nextEligible[0]?.id ?? activeStaff[0]?.id ?? '');
        }
    };

    const endTimePreview = useMemo(() => {
        if (!salon || !selectedService || !date || !time) return null;
        try {
            const start = dateKeyAndTimeToIso(date, time, salon.timezone);
            const end = addMinutesToIso(start, selectedService.durationMinutes);
            return formatSalonDateTime(end, salon.timezone, 'h:mm a');
        } catch {
            return null;
        }
    }, [salon, selectedService, date, time]);

    const handleSubmit = async () => {
        if (!salon) return;
        setError(null);

        if (!selectedService) {
            setError('Selecciona un servicio.');
            return;
        }
        if (!staffId) {
            setError('Selecciona un especialista.');
            return;
        }
        if (!date || !time) {
            setError('Selecciona la fecha y la hora de la cita.');
            return;
        }
        if (clientMode === 'existing' && !clientId) {
            setError('Selecciona un cliente o crea uno nuevo.');
            return;
        }
        if (clientMode === 'new' && (!clientName.trim() || !clientPhone.trim())) {
            setError('Ingresa al menos el nombre y el teléfono del cliente.');
            return;
        }

        setSaving(true);
        try {
            await actions.createManualAppointment({
                clientId: clientMode === 'existing' ? clientId : undefined,
                clientName: clientMode === 'new' ? clientName.trim() : undefined,
                clientPhone: clientMode === 'new' ? clientPhone.trim() : undefined,
                clientEmail:
                    clientMode === 'new' ? clientEmail.trim() || undefined : undefined,
                serviceId: selectedService.id,
                staffId,
                startTime: dateKeyAndTimeToIso(date, time, salon.timezone),
                notes: notes.trim() || undefined,
            });
            toast.success('Cita creada correctamente');
            onOpenChange(false);
        } catch (submitError) {
            const message =
                submitError instanceof Error
                    ? submitError.message
                    : 'No pudimos crear la cita.';
            setError(message);
            toast.error('No se pudo crear la cita', { description: message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
                <SheetHeader className="border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
                            <Plus className="h-3.5 w-3.5" />
                        </span>
                        Nueva cita manual
                    </SheetTitle>
                    <SheetDescription>
                        Registra una reserva tomada por teléfono, WhatsApp o en recepción.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                    {error && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                            {error}
                        </div>
                    )}

                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Cliente
                            </h3>
                            <div className="flex rounded-lg border p-0.5 text-[11px] font-medium">
                                <button
                                    type="button"
                                    onClick={() => setClientMode('existing')}
                                    className={cn(
                                        'rounded-md px-2 py-1 transition-colors',
                                        clientMode === 'existing'
                                            ? 'bg-zinc-900 text-white'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    Existente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setClientMode('new')}
                                    className={cn(
                                        'rounded-md px-2 py-1 transition-colors',
                                        clientMode === 'new'
                                            ? 'bg-zinc-900 text-white'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    Nuevo
                                </button>
                            </div>
                        </div>

                        {clientMode === 'existing' ? (
                            <FormField label="Cliente" htmlFor="appt-client">
                                <Select
                                    id="appt-client"
                                    value={clientId}
                                    onChange={(event) => setClientId(event.target.value)}
                                >
                                    <option value="">Selecciona un cliente</option>
                                    {(data?.clients ?? [])
                                        .slice()
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map((client) => (
                                            <option key={client.id} value={client.id}>
                                                {client.name} · {client.phone}
                                            </option>
                                        ))}
                                </Select>
                            </FormField>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField label="Nombre" htmlFor="appt-client-name">
                                    <Input
                                        id="appt-client-name"
                                        value={clientName}
                                        onChange={(event) => setClientName(event.target.value)}
                                        placeholder="Nombre completo"
                                    />
                                </FormField>
                                <FormField label="Teléfono" htmlFor="appt-client-phone">
                                    <Input
                                        id="appt-client-phone"
                                        value={clientPhone}
                                        onChange={(event) => setClientPhone(event.target.value)}
                                        placeholder="+503 0000 0000"
                                    />
                                </FormField>
                                <FormField
                                    label="Correo (opcional)"
                                    htmlFor="appt-client-email"
                                    className="sm:col-span-2"
                                >
                                    <Input
                                        id="appt-client-email"
                                        type="email"
                                        value={clientEmail}
                                        onChange={(event) => setClientEmail(event.target.value)}
                                        placeholder="cliente@correo.com"
                                    />
                                </FormField>
                            </div>
                        )}
                    </section>

                    <section className="space-y-3 border-t pt-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Servicio y especialista
                        </h3>
                        <FormField label="Servicio" htmlFor="appt-service">
                            <Select
                                id="appt-service"
                                value={serviceId}
                                onChange={(event) => handleServiceChange(event.target.value)}
                            >
                                <option value="">Selecciona un servicio</option>
                                {(salon?.services ?? []).map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {service.name} · {service.durationMinutes} min
                                    </option>
                                ))}
                            </Select>
                        </FormField>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField label="Especialista" htmlFor="appt-staff">
                                <Select
                                    id="appt-staff"
                                    value={staffId}
                                    onChange={(event) => setStaffId(event.target.value)}
                                >
                                    <option value="">Selecciona</option>
                                    {eligibleStaff.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormField>
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                    Resumen
                                </p>
                                <div className="flex h-9 items-center gap-2 rounded-lg border bg-muted/40 px-2.5 text-xs text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    {selectedService
                                        ? `${selectedService.durationMinutes} min`
                                        : 'Sin servicio'}
                                    {selectedService && (
                                        <span className="ml-auto font-medium text-foreground">
                                            {formatCurrency(selectedService.price, salon?.currency ?? 'USD')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3 border-t pt-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Fecha y hora
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField label="Fecha" htmlFor="appt-date">
                                <Input
                                    id="appt-date"
                                    type="date"
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                />
                            </FormField>
                            <FormField
                                label="Hora de inicio"
                                htmlFor="appt-time"
                                hint={
                                    endTimePreview
                                        ? `Termina aproximadamente a las ${endTimePreview}`
                                        : undefined
                                }
                            >
                                <Input
                                    id="appt-time"
                                    type="time"
                                    step={300}
                                    value={time}
                                    onChange={(event) => setTime(event.target.value)}
                                />
                            </FormField>
                        </div>

                        <FormField
                            label="Notas internas (opcional)"
                            htmlFor="appt-notes"
                            hint="Visible solo para el equipo del salón."
                        >
                            <Textarea
                                id="appt-notes"
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                placeholder="Ej. llega 10 minutos antes, prefiere café sin azúcar…"
                            />
                        </FormField>
                    </section>

                    <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-[11px] text-muted-foreground">
                        <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <p>
                            La cita se registra en la zona horaria del salón
                            {salon ? ` (${salon.timezone.replace('_', ' ')})` : ''}. Se validará
                            que el especialista no tenga otra cita en ese horario.
                        </p>
                    </div>
                </div>

                <SheetFooter className="border-t bg-muted/20">
                    <div className="flex w-full gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={saving || !salon}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Guardando…
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4" />
                                    Crear cita
                                </>
                            )}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
