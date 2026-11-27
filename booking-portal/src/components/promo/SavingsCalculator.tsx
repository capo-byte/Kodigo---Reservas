'use client';

import { useMemo, useState } from 'react';
import { Check, Info, Layers, Server, ShieldAlert, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EffortBlock {
    id: string;
    title: string;
    detail: string;
    upfrontCost: number;
    monthlyCost: number;
    weeks: number;
    icon: typeof Layers;
}

export function SavingsCalculator() {
    const [branches, setBranches] = useState<number>(1);
    const [onlinePayments, setOnlinePayments] = useState<boolean>(true);
    const [needsEmbedWidget, setNeedsEmbedWidget] = useState<boolean>(true);
    const [needsAdminDashboard, setNeedsAdminDashboard] = useState<boolean>(true);

    const breakdown = useMemo(() => {
        const blocks: EffortBlock[] = [
            {
                id: 'core-api',
                title: 'Motor de disponibilidad y base PostgreSQL',
                detail:
                    'Bloqueos transaccionales anti-doble-reserva, manejo estricto de zona horaria, retenciones de 15 min e idempotencia.',
                upfrontCost: 1400 + (branches - 1) * 350,
                monthlyCost: 45 + (branches - 1) * 10,
                weeks: 3,
                icon: Server,
            },
        ];

        if (needsEmbedWidget) {
            blocks.push({
                id: 'widget',
                title: 'Portal cliente + Widget embebible (iframe + postMessage)',
                detail:
                    'Script cargador sin dependencias, auto-ajuste de altura sin doble scroll, flujo mobile-first y autogestión por token.',
                upfrontCost: 1200,
                monthlyCost: 25,
                weeks: 3,
                icon: Layers,
            });
        }

        if (needsAdminDashboard) {
            blocks.push({
                id: 'dashboard',
                title: 'Dashboard de recepción (Agenda, Servicios, Personal, Clientes)',
                detail:
                    'Vista día y semana con drag & drop, bloqueos de horario, catálogo, control de inasistencias y permisos por rol.',
                upfrontCost: 1850 + (branches - 1) * 250,
                monthlyCost: 35,
                weeks: 4,
                icon: Wrench,
            });
        }

        if (onlinePayments) {
            blocks.push({
                id: 'payments',
                title: 'Pasarela Stripe, webhooks idempotentes y reembolsos',
                detail:
                    'PaymentIntents, validación criptográfica de firma, revisión de pagos tardíos/duplicados y flujo de autorización.',
                upfrontCost: 950,
                monthlyCost: 20,
                weeks: 2,
                icon: ShieldAlert,
            });
        }

        const totalUpfront = blocks.reduce((sum, b) => sum + b.upfrontCost, 0);
        const totalMonthly = blocks.reduce((sum, b) => sum + b.monthlyCost, 0);
        const totalWeeks = blocks.reduce((sum, b) => sum + b.weeks, 0);

        return {
            blocks,
            totalUpfront,
            totalMonthly,
            totalWeeks,
            firstYearOwnCost: totalUpfront + totalMonthly * 12,
        };
    }, [branches, onlinePayments, needsEmbedWidget, needsAdminDashboard]);

    return (
        <div className="relative overflow-hidden rounded-[28px] border border-stone-900/10 bg-white/80 p-6 shadow-[0_20px_60px_-28px_rgba(20,20,23,0.18)] backdrop-blur-xl sm:p-8">
            <div className="grid gap-8 lg:grid-cols-12">
                {/* Controles de configuración del negocio */}
                <div className="space-y-6 lg:col-span-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
                            Estimador transparente
                        </p>
                        <h3 className="mt-1 text-xl font-semibold tracking-tight text-stone-950">
                            ¿Cuánto te costaría armarlo por tu cuenta?
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-stone-600">
                            Ajusta lo que necesita tu barbería o salón para ver el esfuerzo técnico
                            que absorbe nuestra plataforma desde el primer día.
                        </p>
                    </div>

                    {/* Sucursales */}
                    <div className="space-y-2.5 rounded-2xl border border-stone-200/90 bg-stone-50/80 p-4">
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="branches-range"
                                className="text-sm font-medium text-stone-900"
                            >
                                Sucursales activas
                            </label>
                            <span className="rounded-lg bg-stone-900 px-2.5 py-0.5 font-mono text-xs font-semibold text-white tabular-nums">
                                {branches} {branches === 1 ? 'sucursal' : 'sucursales'}
                            </span>
                        </div>
                        <input
                            id="branches-range"
                            type="range"
                            min={1}
                            max={5}
                            value={branches}
                            onChange={(e) => setBranches(Number(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-200 accent-stone-900"
                        />
                        <div className="flex justify-between text-[11px] text-stone-500">
                            <span>1 local</span>
                            <span>3 locales</span>
                            <span>5 locales</span>
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2.5">
                        {[
                            {
                                id: 'toggle-widget',
                                label: 'Widget embebible en tu web + portal público',
                                sub: 'Incluye auto-redimensionamiento y autogestión sin cuenta',
                                checked: needsEmbedWidget,
                                onChange: () => setNeedsEmbedWidget((v) => !v),
                            },
                            {
                                id: 'toggle-dashboard',
                                label: 'Dashboard operativo para recepción y equipo',
                                sub: 'Agenda visual, bloqueos, servicios, personal y clientes',
                                checked: needsAdminDashboard,
                                onChange: () => setNeedsAdminDashboard((v) => !v),
                            },
                            {
                                id: 'toggle-payments',
                                label: 'Cobro en línea con tarjeta (Stripe + reembolsos)',
                                sub: 'Retenciones de 15 min, webhooks y auditoría de pagos',
                                checked: onlinePayments,
                                onChange: () => setOnlinePayments((v) => !v),
                            },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                role="switch"
                                aria-checked={item.checked}
                                onClick={item.onChange}
                                className={cn(
                                    'flex w-full items-start justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all',
                                    item.checked
                                        ? 'border-stone-900/20 bg-white shadow-xs'
                                        : 'border-stone-200/80 bg-stone-50/50 opacity-75'
                                )}
                            >
                                <div>
                                    <p className="text-sm font-medium text-stone-900">{item.label}</p>
                                    <p className="mt-0.5 text-xs text-stone-500">{item.sub}</p>
                                </div>
                                <span
                                    className={cn(
                                        'mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors',
                                        item.checked ? 'bg-stone-900' : 'bg-stone-300'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'h-4 w-4 rounded-full bg-white shadow-xs transition-transform',
                                            item.checked ? 'translate-x-4' : 'translate-x-0'
                                        )}
                                    />
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desglose de costos evitados */}
                <div className="flex flex-col justify-between gap-6 lg:col-span-7">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-medium text-stone-500">
                            <span>Módulos que tendrías que construir y mantener</span>
                            <span>Estimación de desarrollo a medida</span>
                        </div>

                        <div className="space-y-2.5">
                            {breakdown.blocks.map((block) => {
                                const Icon = block.icon;
                                return (
                                    <div
                                        key={block.id}
                                        className="flex flex-col justify-between gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 sm:flex-row sm:items-center"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800">
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-stone-900">
                                                    {block.title}
                                                </p>
                                                <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
                                                    {block.detail}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-left sm:text-right">
                                            <p className="font-mono text-sm font-semibold tabular-nums text-stone-900">
                                                ~${block.upfrontCost.toLocaleString('en-US')}
                                            </p>
                                            <p className="text-[11px] text-stone-500 tabular-nums">
                                                +{block.weeks} sem · ${block.monthlyCost}/mes infra
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resumen comparativo */}
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-stone-200 bg-stone-100/80 p-4">
                            <p className="text-xs font-medium text-stone-600">
                                Desarrollarlo por tu cuenta (1er año)
                            </p>
                            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-stone-900">
                                ~${breakdown.firstYearOwnCost.toLocaleString('en-US')} USD
                            </p>
                            <p className="mt-1 text-xs text-stone-600">
                                {breakdown.totalWeeks} semanas de ingeniería + ${breakdown.totalMonthly}/mes
                                en servidores, respaldos y parches.
                            </p>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-stone-900 bg-stone-950 p-4 text-white">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-500/30 blur-2xl"
                            />
                            <p className="text-xs font-medium text-rose-300">
                                Con Kodigo Reservas
                            </p>
                            <p className="mt-1 text-2xl font-bold tracking-tight">
                                $0 de desarrollo inicial
                            </p>
                            <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                                <li className="flex items-center gap-1.5">
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    Listo hoy mismo en tu web y en recepción
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    Base de datos, seguridad y mejoras ya resueltas
                                </li>
                            </ul>
                        </div>
                    </div>

                    <p className="flex items-start gap-2 text-[11px] leading-relaxed text-stone-500">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Cifras referenciales calculadas según tarifas estándar de desarrollo freelance/agencia
                        (frontend, backend transaccional, QA e infraestructura cloud en año 1).
                    </p>
                </div>
            </div>
        </div>
    );
}
