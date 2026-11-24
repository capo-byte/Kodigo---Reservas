'use client';

import { useEffect, useRef, useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';
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
import { FormField } from '@/components/business/shared';
import { dateKeyAndTimeToIso, getTodayDateKey } from '@/lib/timezone';

interface BlockTimeSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialDate?: string;
    initialStaffId?: string;
}

const REASON_SUGGESTIONS = [
    'Almuerzo',
    'Descanso',
    'Cita médica',
    'Formación interna',
    'Mantenimiento',
];

export function BlockTimeSheet({
    open,
    onOpenChange,
    initialDate,
    initialStaffId,
}: BlockTimeSheetProps) {
    const { data, actions } = useBusiness();
    const initializedRef = useRef(false);

    const [staffId, setStaffId] = useState<string | 'ALL'>('ALL');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('13:00');
    const [endTime, setEndTime] = useState('14:00');
    const [reason, setReason] = useState('Almuerzo');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const salon = data?.salon;

    useEffect(() => {
        if (!open) {
            initializedRef.current = false;
            return;
        }
        if (!data || initializedRef.current) return;

        setStaffId(initialStaffId ?? 'ALL');
        setDate(initialDate ?? getTodayDateKey(data.salon.timezone));
        setStartTime('13:00');
        setEndTime('14:00');
        setReason('Almuerzo');
        setError(null);
        initializedRef.current = true;
    }, [open, data, initialDate, initialStaffId]);

    const handleSubmit = async () => {
        if (!salon) return;
        setError(null);

        if (!date || !startTime || !endTime) {
            setError('Completa la fecha y el rango de horas.');
            return;
        }

        const startTimeIso = dateKeyAndTimeToIso(date, startTime, salon.timezone);
        const endTimeIso = dateKeyAndTimeToIso(date, endTime, salon.timezone);

        if (new Date(endTimeIso).getTime() <= new Date(startTimeIso).getTime()) {
            setError('La hora de fin debe ser posterior a la hora de inicio.');
            return;
        }

        setSaving(true);
        try {
            await actions.createTimeBlock({
                staffId,
                startTime: startTimeIso,
                endTime: endTimeIso,
                reason: reason.trim() || 'Horario bloqueado',
            });
            toast.success('Horario bloqueado');
            onOpenChange(false);
        } catch (submitError) {
            const message =
                submitError instanceof Error
                    ? submitError.message
                    : 'No pudimos bloquear el horario.';
            setError(message);
            toast.error('No se pudo bloquear el horario', { description: message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
                <SheetHeader className="border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
                            <Ban className="h-3.5 w-3.5" />
                        </span>
                        Bloquear horario
                    </SheetTitle>
                    <SheetDescription>
                        Reserva tiempo para descansos, reuniones o tareas internas sin que
                        aparezca disponible en la agenda.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                    {error && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                            {error}
                        </div>
                    )}

                    <FormField label="Especialista" htmlFor="block-staff">
                        <Select
                            id="block-staff"
                            value={staffId}
                            onChange={(event) =>
                                setStaffId(event.target.value as string | 'ALL')
                            }
                        >
                            <option value="ALL">Todo el salón</option>
                            {(salon?.staff ?? [])
                                .filter((member) => member.isActive !== false)
                                .map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                        </Select>
                    </FormField>

                    <FormField label="Fecha" htmlFor="block-date">
                        <Input
                            id="block-date"
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                        />
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Desde" htmlFor="block-start">
                            <Input
                                id="block-start"
                                type="time"
                                step={300}
                                value={startTime}
                                onChange={(event) => setStartTime(event.target.value)}
                            />
                        </FormField>
                        <FormField label="Hasta" htmlFor="block-end">
                            <Input
                                id="block-end"
                                type="time"
                                step={300}
                                value={endTime}
                                onChange={(event) => setEndTime(event.target.value)}
                            />
                        </FormField>
                    </div>

                    <FormField label="Motivo" htmlFor="block-reason">
                        <Input
                            id="block-reason"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Ej. Almuerzo"
                            list="block-reason-suggestions"
                        />
                        <datalist id="block-reason-suggestions">
                            {REASON_SUGGESTIONS.map((suggestion) => (
                                <option key={suggestion} value={suggestion} />
                            ))}
                        </datalist>
                    </FormField>

                    <div className="flex flex-wrap gap-1.5">
                        {REASON_SUGGESTIONS.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => setReason(suggestion)}
                                className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                            >
                                {suggestion}
                            </button>
                        ))}
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
                                    <Ban className="h-4 w-4" />
                                    Bloquear
                                </>
                            )}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
