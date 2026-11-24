'use client';

import { useEffect, useRef, useState } from 'react';
import {
    CalendarRange,
    Clock,
    CreditCard,
    Loader2,
    Save,
    ShieldCheck,
    Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useBusiness } from '@/components/business/BusinessProvider';
import {
    ErrorPanel,
    FormField,
    LoadingPanel,
    PageHeader,
} from '@/components/business/shared';
import { cn } from '@/lib/utils';
import {
    CancellationPolicy,
    DaySchedule,
    PaymentPolicy,
} from '@/types/booking.contracts';

const DAY_LABELS: Record<number, string> = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    0: 'Domingo',
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const CURRENCIES = ['USD', 'EUR', 'MXN', 'GTQ', 'CRC', 'COP'];

const TIMEZONES = [
    'America/El_Salvador',
    'America/Guatemala',
    'America/Mexico_City',
    'America/Bogota',
    'America/Costa_Rica',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/Madrid',
    'UTC',
];

const PAYMENT_POLICIES: Array<{ value: PaymentPolicy; label: string }> = [
    { value: 'FREE', label: 'Sin pago anticipado' },
    { value: 'DEPOSIT', label: 'Anticipo parcial' },
    { value: 'FULL_PREPAYMENT', label: 'Pago completo anticipado' },
];

interface ProfileFormState {
    name: string;
    address: string;
    logoUrl: string;
    googleMapsUrl: string;
    currency: string;
    timezone: string;
    paymentPolicy: PaymentPolicy;
    depositPercentage: string;
}

interface PolicyFormState {
    freeCancellationHours: string;
    lateCancellationFeePercent: string;
    noShowFeePercent: string;
    allowRescheduleHours: string;
    notes: string;
}

export function SettingsView() {
    const { data, isLoading, isError, refetch, actions } = useBusiness();

    const initializedRef = useRef(false);
    const [profile, setProfile] = useState<ProfileFormState>({
        name: '',
        address: '',
        logoUrl: '',
        googleMapsUrl: '',
        currency: 'USD',
        timezone: 'America/El_Salvador',
        paymentPolicy: 'FREE',
        depositPercentage: '20',
    });
    const [hours, setHours] = useState<DaySchedule[]>([]);
    const [slotInterval, setSlotInterval] = useState('30');
    const [policy, setPolicy] = useState<PolicyFormState>({
        freeCancellationHours: '24',
        lateCancellationFeePercent: '50',
        noShowFeePercent: '100',
        allowRescheduleHours: '12',
        notes: '',
    });

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingHours, setSavingHours] = useState(false);
    const [savingPolicy, setSavingPolicy] = useState(false);

    useEffect(() => {
        if (!data || initializedRef.current) return;

        setProfile({
            name: data.salon.name,
            address: data.salon.address,
            logoUrl: data.salon.logoUrl ?? '',
            googleMapsUrl: data.salon.googleMapsUrl ?? '',
            currency: data.salon.currency,
            timezone: data.salon.timezone,
            paymentPolicy: data.salon.paymentPolicy,
            depositPercentage: String(data.salon.depositPercentage ?? 20),
        });
        setHours(
            DAY_ORDER.map((dayOfWeek) => {
                const day = data.businessHours.days.find(
                    (item) => item.dayOfWeek === dayOfWeek
                );
                return (
                    day ?? {
                        dayOfWeek,
                        isOpen: false,
                        openTime: '09:00',
                        closeTime: '19:00',
                    }
                );
            })
        );
        setSlotInterval(String(data.businessHours.slotIntervalMinutes));
        setPolicy({
            freeCancellationHours: String(
                data.cancellationPolicy.freeCancellationHours
            ),
            lateCancellationFeePercent: String(
                data.cancellationPolicy.lateCancellationFeePercent
            ),
            noShowFeePercent: String(data.cancellationPolicy.noShowFeePercent),
            allowRescheduleHours: String(
                data.cancellationPolicy.allowRescheduleHours
            ),
            notes: data.cancellationPolicy.notes ?? '',
        });
        initializedRef.current = true;
    }, [data]);

    if (isLoading) {
        return <LoadingPanel label="Cargando configuración…" />;
    }

    if (isError || !data) {
        return <ErrorPanel onRetry={() => refetch()} />;
    }

    const updateDay = (
        dayOfWeek: number,
        patch: Partial<DaySchedule>
    ) => {
        setHours((current) =>
            current.map((day) =>
                day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day
            )
        );
    };

    const handleSaveProfile = async () => {
        if (!profile.name.trim() || !profile.address.trim()) {
            toast.error('El nombre y la dirección del salón son obligatorios.');
            return;
        }

        const deposit = Number(profile.depositPercentage);
        if (
            profile.paymentPolicy === 'DEPOSIT' &&
            (!Number.isFinite(deposit) || deposit <= 0 || deposit > 100)
        ) {
            toast.error('El porcentaje de anticipo debe estar entre 1 y 100.');
            return;
        }

        setSavingProfile(true);
        try {
            await actions.updateSalonProfile({
                name: profile.name.trim(),
                address: profile.address.trim(),
                logoUrl: profile.logoUrl.trim() || undefined,
                googleMapsUrl: profile.googleMapsUrl.trim() || undefined,
                currency: profile.currency,
                timezone: profile.timezone,
                paymentPolicy: profile.paymentPolicy,
                depositPercentage:
                    profile.paymentPolicy === 'DEPOSIT'
                        ? Number(profile.depositPercentage)
                        : undefined,
            });
            toast.success('Perfil del salón actualizado');
        } catch (error) {
            toast.error('No se pudo guardar el perfil', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleSaveHours = async () => {
        const invalidDay = hours.find(
            (day) =>
                day.isOpen &&
                (!day.openTime ||
                    !day.closeTime ||
                    day.openTime >= day.closeTime)
        );
        if (invalidDay) {
            toast.error(
                `Revisa el horario del ${DAY_LABELS[invalidDay.dayOfWeek].toLowerCase()}: la apertura debe ser antes del cierre.`
            );
            return;
        }

        setSavingHours(true);
        try {
            await actions.updateBusinessHours({
                days: hours,
                slotIntervalMinutes: Number(slotInterval),
            });
            toast.success('Horario de atención actualizado');
        } catch (error) {
            toast.error('No se pudo guardar el horario', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        } finally {
            setSavingHours(false);
        }
    };

    const handleSavePolicy = async () => {
        const lateFee = Number(policy.lateCancellationFeePercent);
        const noShowFee = Number(policy.noShowFeePercent);
        const freeHours = Number(policy.freeCancellationHours);
        const rescheduleHours = Number(policy.allowRescheduleHours);

        if (
            !Number.isFinite(lateFee) ||
            lateFee < 0 ||
            lateFee > 100 ||
            !Number.isFinite(noShowFee) ||
            noShowFee < 0 ||
            noShowFee > 100
        ) {
            toast.error('Los porcentajes de penalización deben estar entre 0 y 100.');
            return;
        }
        if (
            !Number.isFinite(freeHours) ||
            freeHours < 0 ||
            !Number.isFinite(rescheduleHours) ||
            rescheduleHours < 0
        ) {
            toast.error('Las horas de anticipación deben ser valores positivos.');
            return;
        }

        const nextPolicy: CancellationPolicy = {
            freeCancellationHours: Math.round(freeHours),
            lateCancellationFeePercent: lateFee,
            noShowFeePercent: noShowFee,
            allowRescheduleHours: Math.round(rescheduleHours),
            notes: policy.notes.trim() || undefined,
        };

        setSavingPolicy(true);
        try {
            await actions.updateCancellationPolicy(nextPolicy);
            toast.success('Política de cancelación actualizada');
        } catch (error) {
            toast.error('No se pudo guardar la política', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente.',
            });
        } finally {
            setSavingPolicy(false);
        }
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Configuración"
                description="Ajusta la información pública del salón, los horarios de atención y las políticas de cancelación."
            />

            <section className="overflow-hidden rounded-xl border bg-card">
                <div className="flex items-start gap-3 border-b px-4 py-3.5">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        <Store className="h-4 w-4" />
                    </span>
                    <div>
                        <h2 className="text-sm font-semibold">Perfil del salón</h2>
                        <p className="text-[11px] text-muted-foreground">
                            Datos que verán los clientes en la página pública de reservas.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2">
                    <FormField label="Nombre del salón" htmlFor="settings-name">
                        <Input
                            id="settings-name"
                            value={profile.name}
                            onChange={(event) =>
                                setProfile((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                        />
                    </FormField>
                    <FormField label="Dirección" htmlFor="settings-address">
                        <Input
                            id="settings-address"
                            value={profile.address}
                            onChange={(event) =>
                                setProfile((current) => ({
                                    ...current,
                                    address: event.target.value,
                                }))
                            }
                        />
                    </FormField>
                    <FormField label="Logo (URL)" htmlFor="settings-logo">
                        <Input
                            id="settings-logo"
                            value={profile.logoUrl}
                            onChange={(event) =>
                                setProfile((current) => ({
                                    ...current,
                                    logoUrl: event.target.value,
                                }))
                            }
                            placeholder="https://…"
                        />
                    </FormField>
                    <FormField
                        label="Google Maps (URL)"
                        htmlFor="settings-maps"
                    >
                        <Input
                            id="settings-maps"
                            value={profile.googleMapsUrl}
                            onChange={(event) =>
                                setProfile((current) => ({
                                    ...current,
                                    googleMapsUrl: event.target.value,
                                }))
                            }
                            placeholder="https://maps.google.com/…"
                        />
                    </FormField>
                    <FormField label="Moneda" htmlFor="settings-currency">
                        <Select
                            id="settings-currency"
                            value={profile.currency}
                            onChange={(event) =>
                                setProfile((current) => ({
                                    ...current,
                                    currency: event.target.value,
                                }))
                            }
                        >
                            {CURRENCIES.map((currency) => (
                                <option key={currency} value={currency}>
                                    {currency}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <FormField
                        label="Zona horaria"
                        htmlFor="settings-timezone"
                        hint="Se usa para mostrar todas las citas de la agenda."
                    >
                        <Select
                            id="settings-timezone"
                            value={profile.timezone}
                            onChange={(event) =>
                                setProfile((current) => ({
                                    ...current,
                                    timezone: event.target.value,
                                }))
                            }
                        >
                            {!TIMEZONES.includes(profile.timezone) && (
                                <option value={profile.timezone}>
                                    {profile.timezone}
                                </option>
                            )}
                            {TIMEZONES.map((timezone) => (
                                <option key={timezone} value={timezone}>
                                    {timezone.replace('_', ' ')}
                                </option>
                            ))}
                        </Select>
                    </FormField>
                </div>

                <div className="space-y-3 border-t px-4 py-3.5">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        Política de pago
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField label="Modalidad" htmlFor="settings-payment">
                            <Select
                                id="settings-payment"
                                value={profile.paymentPolicy}
                                onChange={(event) =>
                                    setProfile((current) => ({
                                        ...current,
                                        paymentPolicy: event.target
                                            .value as PaymentPolicy,
                                    }))
                                }
                            >
                                {PAYMENT_POLICIES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                        {profile.paymentPolicy === 'DEPOSIT' && (
                            <FormField
                                label="Anticipo (%)"
                                htmlFor="settings-deposit"
                                hint="Porcentaje del servicio que se cobra al reservar."
                            >
                                <Input
                                    id="settings-deposit"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={profile.depositPercentage}
                                    onChange={(event) =>
                                        setProfile((current) => ({
                                            ...current,
                                            depositPercentage: event.target.value,
                                        }))
                                    }
                                />
                            </FormField>
                        )}
                    </div>
                </div>

                <div className="flex justify-end border-t bg-muted/20 px-4 py-3">
                    <Button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                    >
                        {savingProfile ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {savingProfile ? 'Guardando…' : 'Guardar perfil'}
                    </Button>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-card">
                <div className="flex items-start gap-3 border-b px-4 py-3.5">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                        <Clock className="h-4 w-4" />
                    </span>
                    <div>
                        <h2 className="text-sm font-semibold">Horario de atención</h2>
                        <p className="text-[11px] text-muted-foreground">
                            Define los días y horas en que el salón acepta reservas.
                        </p>
                    </div>
                </div>

                <div className="divide-y">
                    {hours.map((day) => (
                        <div
                            key={day.dayOfWeek}
                            className="flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4"
                        >
                            <div className="flex w-40 items-center gap-2">
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={day.isOpen}
                                    onClick={() =>
                                        updateDay(day.dayOfWeek, {
                                            isOpen: !day.isOpen,
                                        })
                                    }
                                    className={cn(
                                        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
                                        day.isOpen
                                            ? 'bg-emerald-500'
                                            : 'bg-zinc-300 dark:bg-zinc-600'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                                            day.isOpen && 'translate-x-4'
                                        )}
                                    />
                                </button>
                                <span
                                    className={cn(
                                        'text-xs font-medium',
                                        !day.isOpen && 'text-muted-foreground'
                                    )}
                                >
                                    {DAY_LABELS[day.dayOfWeek]}
                                </span>
                            </div>

                            {day.isOpen ? (
                                <div className="flex flex-1 items-center gap-2">
                                    <Input
                                        type="time"
                                        step={900}
                                        value={day.openTime}
                                        onChange={(event) =>
                                            updateDay(day.dayOfWeek, {
                                                openTime: event.target.value,
                                            })
                                        }
                                        className="h-8 w-28 text-xs"
                                        aria-label={`Hora de apertura del ${DAY_LABELS[day.dayOfWeek]}`}
                                    />
                                    <span className="text-[11px] text-muted-foreground">
                                        a
                                    </span>
                                    <Input
                                        type="time"
                                        step={900}
                                        value={day.closeTime}
                                        onChange={(event) =>
                                            updateDay(day.dayOfWeek, {
                                                closeTime: event.target.value,
                                            })
                                        }
                                        className="h-8 w-28 text-xs"
                                        aria-label={`Hora de cierre del ${DAY_LABELS[day.dayOfWeek]}`}
                                    />
                                </div>
                            ) : (
                                <p className="text-[11px] text-muted-foreground">
                                    Cerrado
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 border-t px-4 py-3.5 sm:flex-row sm:items-end sm:justify-between">
                    <FormField
                        label="Intervalo de slots"
                        htmlFor="settings-slot-interval"
                        className="w-full sm:max-w-48"
                    >
                        <Select
                            id="settings-slot-interval"
                            value={slotInterval}
                            onChange={(event) => setSlotInterval(event.target.value)}
                        >
                            {[15, 20, 30, 45, 60].map((interval) => (
                                <option key={interval} value={interval}>
                                    Cada {interval} minutos
                                </option>
                            ))}
                        </Select>
                    </FormField>
                    <Button
                        type="button"
                        onClick={handleSaveHours}
                        disabled={savingHours}
                    >
                        {savingHours ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {savingHours ? 'Guardando…' : 'Guardar horario'}
                    </Button>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl border bg-card">
                <div className="flex items-start gap-3 border-b px-4 py-3.5">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                        <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                        <h2 className="text-sm font-semibold">
                            Política de cancelación
                        </h2>
                        <p className="text-[11px] text-muted-foreground">
                            Reglas que se muestran al cliente antes de confirmar una cita.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2">
                    <FormField
                        label="Cancelación gratuita (horas antes)"
                        htmlFor="policy-free-hours"
                        hint="Tiempo mínimo para cancelar sin penalidad."
                    >
                        <Input
                            id="policy-free-hours"
                            type="number"
                            min={0}
                            value={policy.freeCancellationHours}
                            onChange={(event) =>
                                setPolicy((current) => ({
                                    ...current,
                                    freeCancellationHours: event.target.value,
                                }))
                            }
                        />
                    </FormField>
                    <FormField
                        label="Reprogramación permitida (horas antes)"
                        htmlFor="policy-reschedule"
                    >
                        <Input
                            id="policy-reschedule"
                            type="number"
                            min={0}
                            value={policy.allowRescheduleHours}
                            onChange={(event) =>
                                setPolicy((current) => ({
                                    ...current,
                                    allowRescheduleHours: event.target.value,
                                }))
                            }
                        />
                    </FormField>
                    <FormField
                        label="Penalidad por cancelación tardía (%)"
                        htmlFor="policy-late-fee"
                    >
                        <Input
                            id="policy-late-fee"
                            type="number"
                            min={0}
                            max={100}
                            value={policy.lateCancellationFeePercent}
                            onChange={(event) =>
                                setPolicy((current) => ({
                                    ...current,
                                    lateCancellationFeePercent: event.target.value,
                                }))
                            }
                        />
                    </FormField>
                    <FormField
                        label="Cargo por inasistencia (%)"
                        htmlFor="policy-no-show"
                    >
                        <Input
                            id="policy-no-show"
                            type="number"
                            min={0}
                            max={100}
                            value={policy.noShowFeePercent}
                            onChange={(event) =>
                                setPolicy((current) => ({
                                    ...current,
                                    noShowFeePercent: event.target.value,
                                }))
                            }
                        />
                    </FormField>
                    <FormField
                        label="Texto visible para el cliente"
                        htmlFor="policy-notes"
                        className="sm:col-span-2"
                    >
                        <Textarea
                            id="policy-notes"
                            value={policy.notes}
                            onChange={(event) =>
                                setPolicy((current) => ({
                                    ...current,
                                    notes: event.target.value,
                                }))
                            }
                            placeholder="Ej. las cancelaciones con menos de 24 horas…"
                        />
                    </FormField>
                </div>

                <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3">
                    <div className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
                        <CalendarRange className="h-3.5 w-3.5" />
                        Se aplica a nuevas reservas
                    </div>
                    <Button
                        type="button"
                        onClick={handleSavePolicy}
                        disabled={savingPolicy}
                        className="ml-auto"
                    >
                        {savingPolicy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {savingPolicy ? 'Guardando…' : 'Guardar política'}
                    </Button>
                </div>
            </section>
        </div>
    );
}
