'use client';

import { useMemo, useState } from 'react';
import { Loader2, Scissors } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useBusiness } from '@/components/business/BusinessProvider';
import { FormField } from '@/components/business/shared';
import { cn } from '@/lib/utils';
import { ServiceItem } from '@/types/booking.contracts';

const DURATION_PRESETS = [15, 30, 45, 60, 75, 90, 120];

interface ServiceFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service?: ServiceItem | null;
}

export function ServiceFormSheet({
    open,
    onOpenChange,
    service,
}: ServiceFormSheetProps) {
    if (!open) {
        return null;
    }

    return (
        <ServiceForm
            key={service?.id ?? 'new-service'}
            service={service ?? null}
            onOpenChange={onOpenChange}
        />
    );
}

function ServiceForm({
    service,
    onOpenChange,
}: {
    service: ServiceItem | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, actions } = useBusiness();

    const categories = useMemo(
        () =>
            Array.from(
                new Set((data?.salon.services ?? []).map((item) => item.category))
            ),
        [data?.salon.services]
    );

    const activeStaff = useMemo(
        () =>
            (data?.salon.staff ?? []).filter(
                (member) => member.isActive !== false
            ),
        [data?.salon.staff]
    );

    const [name, setName] = useState(service?.name ?? '');
    const [category, setCategory] = useState(
        service?.category ?? categories[0] ?? ''
    );
    const [description, setDescription] = useState(service?.description ?? '');
    const [duration, setDuration] = useState(
        String(service?.durationMinutes ?? 45)
    );
    const [price, setPrice] = useState(String(service?.price ?? 0));
    const [staffIds, setStaffIds] = useState<string[]>(
        service?.staffIds ?? activeStaff.map((member) => member.id)
    );
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const toggleStaff = (staffId: string) => {
        setStaffIds((current) =>
            current.includes(staffId)
                ? current.filter((id) => id !== staffId)
                : [...current, staffId]
        );
    };

    const handleSubmit = async () => {
        setError(null);

        if (!name.trim()) {
            setError('El nombre del servicio es obligatorio.');
            return;
        }
        if (!category.trim()) {
            setError('Indica una categoría para agrupar el servicio.');
            return;
        }
        const durationNumber = Number(duration);
        if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
            setError('La duración debe ser mayor que cero.');
            return;
        }
        const priceNumber = Number(price);
        if (!Number.isFinite(priceNumber) || priceNumber < 0) {
            setError('El precio no puede ser negativo.');
            return;
        }
        if (staffIds.length === 0) {
            setError('Selecciona al menos un especialista habilitado.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                category: category.trim(),
                description: description.trim() || undefined,
                durationMinutes: Math.round(durationNumber),
                price: Math.round(priceNumber * 100) / 100,
                staffIds,
            };

            if (service) {
                await actions.updateService(service.id, payload);
                toast.success('Servicio actualizado');
            } else {
                await actions.createService(payload);
                toast.success('Servicio creado');
            }
            onOpenChange(false);
        } catch (submitError) {
            const message =
                submitError instanceof Error
                    ? submitError.message
                    : 'No pudimos guardar el servicio.';
            setError(message);
            toast.error('No se pudo guardar el servicio', { description: message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full gap-0 sm:max-w-lg">
                <SheetHeader className="border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
                            <Scissors className="h-3.5 w-3.5" />
                        </span>
                        {service ? 'Editar servicio' : 'Nuevo servicio'}
                    </SheetTitle>
                    <SheetDescription>
                        Define la tarifa, duración y especialistas habilitados para este
                        servicio.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                    {error && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                            {error}
                        </div>
                    )}

                    <FormField label="Nombre del servicio" htmlFor="service-name">
                        <Input
                            id="service-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Ej. Corte clásico / Fade"
                        />
                    </FormField>

                    <FormField
                        label="Categoría"
                        htmlFor="service-category"
                        hint="Agrupa servicios similares en el catálogo."
                    >
                        <Input
                            id="service-category"
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            placeholder="Ej. Cabello & Barbería"
                            list="service-category-options"
                        />
                        <datalist id="service-category-options">
                            {categories.map((item) => (
                                <option key={item} value={item} />
                            ))}
                        </datalist>
                    </FormField>

                    <FormField label="Descripción" htmlFor="service-description">
                        <Textarea
                            id="service-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Describe qué incluye el servicio."
                        />
                    </FormField>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField label="Duración (minutos)" htmlFor="service-duration">
                            <Input
                                id="service-duration"
                                type="number"
                                min={5}
                                step={5}
                                value={duration}
                                onChange={(event) => setDuration(event.target.value)}
                            />
                        </FormField>
                        <FormField
                            label={`Precio (${data?.salon.currency ?? 'USD'})`}
                            htmlFor="service-price"
                        >
                            <Input
                                id="service-price"
                                type="number"
                                min={0}
                                step={0.01}
                                value={price}
                                onChange={(event) => setPrice(event.target.value)}
                            />
                        </FormField>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {DURATION_PRESETS.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => setDuration(String(preset))}
                                className={cn(
                                    'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                                    Number(duration) === preset
                                        ? 'border-zinc-900 bg-zinc-900 text-white'
                                        : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                                )}
                            >
                                {preset} min
                            </button>
                        ))}
                    </div>

                    <FormField
                        label="Especialistas habilitados"
                        hint="Solo estos profesionales podrán ser asignados a este servicio."
                    >
                        <div className="grid gap-2 sm:grid-cols-2">
                            {activeStaff.map((member) => {
                                const checked = staffIds.includes(member.id);
                                return (
                                    <label
                                        key={member.id}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors',
                                            checked
                                                ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-200 dark:bg-zinc-800'
                                                : 'hover:border-foreground/30'
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleStaff(member.id)}
                                            className="h-3.5 w-3.5 accent-zinc-900"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium">
                                                {member.name}
                                            </span>
                                            <span className="block truncate text-[10px] text-muted-foreground">
                                                {member.role}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </FormField>
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
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Guardando…
                                </>
                            ) : service ? (
                                'Guardar cambios'
                            ) : (
                                'Crear servicio'
                            )}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
