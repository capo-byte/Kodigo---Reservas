'use client';

import { useState } from 'react';
import { CreditCard, Store, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface PaymentSectionProps {
    salonName: string;
    amountLabel: string;
    clientSecret?: string;
    bookingId: string;
    onSimulatedSuccess: () => void;
}

type PaymentMethodOption = 'CARD' | 'LOCAL';

/**
 * Componente unificado para el procesamiento de pagos.
 * Permite alternar entre pago en local vs. depósito / tarjeta simulada (Stripe)
 * con estados visuales claros, campos interactivos y mensajes de validación.
 */
export function PaymentSection({
    salonName,
    amountLabel,
    clientSecret,
    bookingId,
    onSimulatedSuccess,
}: PaymentSectionProps) {
    const [method, setMethod] = useState<PaymentMethodOption>('CARD');
    const [cardHolder, setCardHolder] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const handleCardPay = () => {
        if (!cardHolder.trim() || cardNumber.length < 16 || expiry.length < 4 || cvc.length < 3) {
            setFormError('Por favor completa todos los datos de la tarjeta para simular el cobro.');
            return;
        }
        setFormError(null);
        onSimulatedSuccess();
    };

    return (
        <Card className="border-primary/40 shadow-sm animate-in fade-in duration-200">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Método de pago en {salonName}
                    </span>
                    <span className="text-xs font-semibold rounded-full bg-primary/10 text-primary px-2.5 py-0.5">
                        {amountLabel}
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
                {/* Selector de métodos de pago */}
                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={() => {
                            setMethod('CARD');
                            setFormError(null);
                        }}
                        className={cn(
                            'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all active:scale-[0.98]',
                            method === 'CARD'
                                ? 'border-primary bg-primary/[0.03] ring-2 ring-primary/20'
                                : 'hover:border-foreground/30 bg-card'
                        )}
                    >
                        <div className="flex w-full items-center justify-between">
                            <CreditCard className="h-4 w-4 text-primary" />
                            {method === 'CARD' && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            )}
                        </div>
                        <span className="text-xs font-semibold text-foreground mt-1">
                            Pagar con Tarjeta
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            Depósito seguro en línea
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setMethod('LOCAL');
                            setFormError(null);
                        }}
                        className={cn(
                            'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all active:scale-[0.98]',
                            method === 'LOCAL'
                                ? 'border-primary bg-primary/[0.03] ring-2 ring-primary/20'
                                : 'hover:border-foreground/30 bg-card'
                        )}
                    >
                        <div className="flex w-full items-center justify-between">
                            <Store className="h-4 w-4 text-primary" />
                            {method === 'LOCAL' && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            )}
                        </div>
                        <span className="text-xs font-semibold text-foreground mt-1">
                            Pagar en el local
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            Efectivo o tarjeta al llegar
                        </span>
                    </button>
                </div>

                {/* Opción A: Tarjeta / Stripe */}
                {method === 'CARD' && (
                    <div className="space-y-3.5 rounded-xl border p-4 bg-muted/20 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-xs pb-1 border-b">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                                Pasarela Stripe segura
                            </span>
                            <span className="text-muted-foreground font-mono text-[11px]">
                                Cita: {bookingId}
                            </span>
                        </div>

                        {clientSecret && (
                            <p className="text-[11px] text-muted-foreground">
                                Token Stripe activo:{' '}
                                <code className="font-mono text-foreground">{clientSecret}</code>
                            </p>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="card-name" className="text-xs">
                                Nombre del titular
                            </Label>
                            <Input
                                id="card-name"
                                placeholder="Ej. Carlos Mendoza"
                                value={cardHolder}
                                onChange={(e) => setCardHolder(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="card-num" className="text-xs">
                                Número de tarjeta
                            </Label>
                            <Input
                                id="card-num"
                                placeholder="4242 4242 4242 4242"
                                maxLength={19}
                                value={cardNumber}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                                    setCardNumber(v);
                                }}
                                className="h-9 text-xs font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1.5">
                                <Label htmlFor="card-exp" className="text-xs">
                                    Vencimiento (MM/AA)
                                </Label>
                                <Input
                                    id="card-exp"
                                    placeholder="12/28"
                                    maxLength={5}
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    className="h-9 text-xs font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="card-cvc" className="text-xs">
                                    CVC
                                </Label>
                                <Input
                                    id="card-cvc"
                                    placeholder="123"
                                    maxLength={4}
                                    value={cvc}
                                    onChange={(e) => setCvc(e.target.value)}
                                    className="h-9 text-xs font-mono"
                                />
                            </div>
                        </div>

                        {formError && (
                            <p className="text-xs text-destructive font-medium">{formError}</p>
                        )}

                        <Button
                            type="button"
                            className="w-full mt-2 gap-2"
                            size="lg"
                            onClick={handleCardPay}
                        >
                            <Lock className="h-4 w-4" />
                            Pagar {amountLabel} y confirmar
                        </Button>
                    </div>
                )}

                {/* Opción B: Pago en el local */}
                {method === 'LOCAL' && (
                    <div className="space-y-4 rounded-xl border p-4 bg-muted/20 animate-in fade-in duration-150">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                                <Store className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-foreground">
                                    Pagas directamente en el establecimiento
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Tu cita quedará reservada de inmediato. Al llegar a {salonName}{' '}
                                    podrás abonar los <strong className="text-foreground">{amountLabel}</strong> en
                                    efectivo o con tarjeta en el mostrador.
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            className="w-full gap-2"
                            size="lg"
                            onClick={onSimulatedSuccess}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Confirmar reserva (pago en local)
                        </Button>
                    </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1 border-t">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Transacción cifrada y protegida por los protocolos de seguridad.</span>
                </div>
            </CardContent>
        </Card>
    );
}
