'use client';

import { useState } from 'react';
import { Check, Loader2, UserPlus } from 'lucide-react';
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
import { useBusiness } from '@/components/business/BusinessProvider';
import { FormField } from '@/components/business/shared';
import { cn } from '@/lib/utils';
import { StaffMember } from '@/types/booking.contracts';

const COLOR_OPTIONS = [
    '#e11d48',
    '#db2777',
    '#7c3aed',
    '#4f46e5',
    '#0284c7',
    '#0d9488',
    '#059669',
    '#d97706',
    '#52525b',
];

const WEEK_DAYS = [
    { value: 1, short: 'L', label: 'Lunes' },
    { value: 2, short: 'M', label: 'Martes' },
    { value: 3, short: 'X', label: 'Miércoles' },
    { value: 4, short: 'J', label: 'Jueves' },
    { value: 5, short: 'V', label: 'Viernes' },
    { value: 6, short: 'S', label: 'Sábado' },
    { value: 0, short: 'D', label: 'Domingo' },
];

interface StaffFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    member?: StaffMember | null;
}

export function StaffFormSheet({
    open,
    onOpenChange,
    member,
}: StaffFormSheetProps) {
    if (!open) {
        return null;
    }

    return (
        <StaffForm
            key={member?.id ?? 'new-member'}
            member={member ?? null}
            onOpenChange={onOpenChange}
        />
    );
}

function StaffForm({
    member,
    onOpenChange,
}: {
    member: StaffMember | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { actions } = useBusiness();
    const [name, setName] = useState(member?.name ?? '');
    const [role, setRole] = useState(member?.role ?? '');
    const [phone, setPhone] = useState(member?.phone ?? '');
    const [email, setEmail] = useState(member?.email ?? '');
    const [color, setColor] = useState(member?.color ?? COLOR_OPTIONS[0]);
    const [workDays, setWorkDays] = useState<number[]>(
        member?.workDays ?? [1, 2, 3, 4, 5, 6]
    );
    const [isActive, setIsActive] = useState(member?.isActive ?? true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const toggleDay = (day: number) => {
        setWorkDays((current) =>
            current.includes(day)
                ? current.filter((item) => item !== day)
                : [...current, day].sort((a, b) => a - b)
        );
    };

    const handleSubmit = async () => {
        setError(null);

        if (!name.trim()) {
            setError('El nombre es obligatorio.');
            return;
        }
        if (!role.trim()) {
            setError('Indica el rol o especialidad del miembro del equipo.');
            return;
        }
        if (workDays.length === 0) {
            setError('Selecciona al menos un día de trabajo.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                role: role.trim(),
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
                color,
                workDays,
                isActive,
            };

            if (member) {
                await actions.updateStaffMember(member.id, payload);
                toast.success('Especialista actualizado');
            } else {
                await actions.createStaffMember(payload);
                toast.success('Especialista agregado al equipo');
            }
            onOpenChange(false);
        } catch (submitError) {
            const message =
                submitError instanceof Error
                    ? submitError.message
                    : 'No pudimos guardar al especialista.';
            setError(message);
            toast.error('No se pudo guardar al especialista', {
                description: message,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
                <SheetHeader className="border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
                            <UserPlus className="h-3.5 w-3.5" />
                        </span>
                        {member ? 'Editar especialista' : 'Nuevo especialista'}
                    </SheetTitle>
                    <SheetDescription>
                        Datos de contacto, color de agenda y días de trabajo del equipo.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                    {error && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField label="Nombre completo" htmlFor="staff-name">
                            <Input
                                id="staff-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Ej. Carlos Mendoza"
                            />
                        </FormField>
                        <FormField label="Rol / especialidad" htmlFor="staff-role">
                            <Input
                                id="staff-role"
                                value={role}
                                onChange={(event) => setRole(event.target.value)}
                                placeholder="Ej. Master Barber"
                            />
                        </FormField>
                        <FormField label="Teléfono" htmlFor="staff-phone">
                            <Input
                                id="staff-phone"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder="+503 0000 0000"
                            />
                        </FormField>
                        <FormField label="Correo" htmlFor="staff-email">
                            <Input
                                id="staff-email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="equipo@salon.com"
                            />
                        </FormField>
                    </div>

                    <FormField label="Color en la agenda">
                        <div className="flex flex-wrap items-center gap-2">
                            {COLOR_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setColor(option)}
                                    className={cn(
                                        'inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-offset-2 transition-all',
                                        color === option
                                            ? 'ring-zinc-900'
                                            : 'ring-transparent'
                                    )}
                                    style={{ backgroundColor: option }}
                                    aria-label={`Seleccionar color ${option}`}
                                >
                                    {color === option && (
                                        <Check className="h-3.5 w-3.5 text-white" />
                                    )}
                                </button>
                            ))}
                            <input
                                type="color"
                                value={color}
                                onChange={(event) => setColor(event.target.value)}
                                className="h-7 w-9 cursor-pointer rounded border bg-transparent"
                                aria-label="Color personalizado"
                            />
                        </div>
                    </FormField>

                    <FormField
                        label="Días de trabajo"
                        hint="Se usa para filtrar la agenda y sugerir horarios."
                    >
                        <div className="flex flex-wrap gap-1.5">
                            {WEEK_DAYS.map((day) => {
                                const selected = workDays.includes(day.value);
                                return (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        title={day.label}
                                        className={cn(
                                            'inline-flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors',
                                            selected
                                                ? 'border-zinc-900 bg-zinc-900 text-white'
                                                : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                                        )}
                                    >
                                        {day.short}
                                    </button>
                                );
                            })}
                        </div>
                    </FormField>

                    <label className="flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(event) => setIsActive(event.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 accent-zinc-900"
                        />
                        <span>
                            <span className="block text-xs font-medium">
                                Especialista activo
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                                Si lo desactivas, no aparecerá para nuevas reservas ni en
                                la agenda.
                            </span>
                        </span>
                    </label>
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
                            ) : member ? (
                                'Guardar cambios'
                            ) : (
                                'Agregar al equipo'
                            )}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
