'use client';

import { useState } from 'react';
import { z } from 'zod';
import {
    Calendar,
    Clock,
    CreditCard,
    MapPin,
    ShieldCheck,
    User,
    AlertTriangle,
} from 'lucide-react';
import {
    CreateBookingResponse,
    SalonProfile,
    ServiceItem,
    TimeSlot,
} from '@/types/booking.contracts';
import { formatDatePill, formatSlotTime } from '@/lib/timezone';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentSection } from './PaymentSection';

export interface CustomerFormData {
    name: string;
    phone: string;
    email: string;
}

const customerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Ingresa tu nombre o nombre y apellido')
        .max(80, 'El nombre es demasiado largo'),
    phone: z
        .string()
        .trim()
        .min(7, 'Ingresa un número válido para confirmaciones y recordatorios')
        .max(20, 'Número demasiado largo')
        .regex(/^[+\d\s()-]+$/, 'Usa solo dígitos y símbolos telefónicos válidos'),
    email: z
        .string()
        .trim()
        .email('Ingresa un correo electrónico válido'),
});

interface StepCustomerConfirmProps {
    salon: SalonProfile;
    service: ServiceItem;
    staffLabel: string;
    date: string;
    slot: TimeSlot;
    customer: CustomerFormData;
    onChangeCustomer: (data: CustomerFormData) => void;
    onSubmitBooking: (validData: CustomerFormData) => Promise<void>;
    isSubmitting: boolean;
    conflictError: string | null;
    pendingPayment: CreateBookingResponse | null;
    onPaymentComplete: (method: 'LOCAL' | 'CARD') => void;
}

export function StepCustomerConfirm({
    salon,
    service,
    staffLabel,
    date,
    slot,
    customer,
    onChangeCustomer,
    onSubmitBooking,
    isSubmitting,
    conflictError,
    pendingPayment,
    onPaymentComplete,
}: StepCustomerConfirmProps) {
    const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat('es-SV', {
            style: 'currency',
            currency: salon.currency,
            minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        }).format(amount);

    const upfrontAmount = (() => {
        if (salon.paymentPolicy === 'FULL_PREPAYMENT') return service.price;
        if (salon.paymentPolicy === 'DEPOSIT') {
            const pct = salon.depositPercentage ?? 25;
            return Number(((service.price * pct) / 100).toFixed(2));
        }
        return 0;
    })();

    const handleFieldChange = (field: keyof CustomerFormData, value: string) => {
        onChangeCustomer({ ...customer, [field]: value });
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = customerSchema.safeParse(customer);

        if (!parsed.success) {
            const fieldErrors: Partial<Record<keyof CustomerFormData, string>> = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as keyof CustomerFormData;
                if (!fieldErrors[key]) fieldErrors[key] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        await onSubmitBooking(parsed.data);
    };

    // Si el backend creó la reserva en estado PENDING_PAYMENT, mostramos el slot unificado de pago
    if (pendingPayment?.status === 'PENDING_PAYMENT') {
        return (
            <PaymentSection
                salonName={salon.name}
                amountLabel={formatMoney(upfrontAmount)}
                clientSecret={pendingPayment.stripeClientSecret}
                bookingId={pendingPayment.bookingId}
                onSimulatedSuccess={onPaymentComplete}
            />
        );
    }

    const dateInfo = formatDatePill(date, salon.timezone);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold tracking-tight">
                    Confirma tus datos
                </h2>
                <p className="text-sm text-muted-foreground">
                    No necesitas crear cuenta. Te enviaremos la confirmación al instante.
                </p>
            </div>

            {/* Alerta si otro usuario tomó el horario justo antes */}
            {conflictError && (
                <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-amber-500/50 bg-amber-500/10 p-3.5 text-xs text-amber-950 dark:text-amber-200"
                >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div className="space-y-0.5">
                        <p className="font-semibold">Horario no disponible</p>
                        <p>{conflictError}</p>
                    </div>
                </div>
            )}

            {/* Resumen de la cita */}
            <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Resumen de tu cita</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between font-medium">
                        <span>{service.name}</span>
                        <span>{formatMoney(service.price)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span>{staffLabel}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="capitalize">{dateInfo.fullLabel}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>
                            {formatSlotTime(slot.startTime, salon.timezone)} ({service.durationMinutes} min)
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{salon.address}</span>
                    </div>

                    {upfrontAmount > 0 && (
                        <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-foreground">
                                <CreditCard className="h-3.5 w-3.5" />
                                {salon.paymentPolicy === 'DEPOSIT'
                                    ? `Anticipo hoy (${salon.depositPercentage ?? 25}%)`
                                    : 'Pago anticipado hoy'}
                            </span>
                            <span>{formatMoney(upfrontAmount)}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Formulario mínimo de contacto */}
            <form id="booking-customer-form" onSubmit={handleFormSubmit} noValidate className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="customer-name">Nombre completo</Label>
                    <Input
                        id="customer-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Ej. Diego Morales"
                        value={customer.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        disabled={isSubmitting}
                    />
                    {errors.name && (
                        <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="customer-phone">Teléfono (WhatsApp / SMS)</Label>
                    <Input
                        id="customer-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="Ej. +503 7000 0000"
                        value={customer.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        disabled={isSubmitting}
                    />
                    {errors.phone && (
                        <p className="text-xs text-destructive">{errors.phone}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="customer-email">Correo electrónico</Label>
                    <Input
                        id="customer-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="diego@correo.com"
                        value={customer.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        disabled={isSubmitting}
                    />
                    {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Tus datos solo se usan para gestionar tu cita y enviarte recordatorios.</span>
                </div>
            </form>
        </div>
    );
}