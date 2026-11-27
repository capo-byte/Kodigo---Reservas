'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    Clock,
    CreditCard,
    Globe,
    LayoutDashboard,
    Lock,
    Scissors,
    Sparkles,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PreviewTab = 'widget' | 'dashboard';

const MOCK_SLOTS = [
    { time: '09:00', available: true },
    { time: '09:30', available: true, selected: true },
    { time: '10:00', available: false },
    { time: '10:30', available: true },
    { time: '11:00', available: true },
    { time: '11:30', available: true },
];

const MOCK_AGENDA_ROWS = [
    {
        time: '09:00 – 09:45',
        client: 'Mateo Rivera',
        service: 'Corte Clásico / Fade',
        staff: 'Carlos M.',
        color: 'bg-rose-500',
        status: 'Atendida',
        badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/20',
    },
    {
        time: '10:00 – 10:30',
        client: 'Almuerzo / Pausa',
        service: 'Bloqueo operativo',
        staff: 'Todo el equipo',
        color: 'bg-zinc-400',
        status: 'Bloqueado',
        badge: 'bg-zinc-500/15 text-zinc-700 border-zinc-500/20',
    },
    {
        time: '11:00 – 11:45',
        client: 'Andrea López',
        service: 'Corte + Styling',
        staff: 'Valeria G.',
        color: 'bg-violet-500',
        status: 'Confirmada',
        badge: 'bg-amber-500/15 text-amber-800 border-amber-500/20',
    },
];

export function PromoHeroPreview() {
    const [tab, setTab] = useState<PreviewTab>('widget');

    return (
        <div className="relative">
            {/* Difuminados suaves de ambiente detrás del visor */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-8 -top-8 h-56 w-56 rounded-full bg-rose-400/25 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-10 -right-6 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl"
            />

            <div className="relative overflow-hidden rounded-[28px] border border-stone-900/10 bg-white/75 p-3 shadow-[0_24px_70px_-24px_rgba(20,20,23,0.22)] backdrop-blur-2xl sm:p-4">
                {/* Barra superior del visor */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-900/6 bg-stone-100/80 p-1.5 backdrop-blur-md">
                    <div className="flex items-center gap-1 rounded-xl bg-white/90 p-1 shadow-xs">
                        <button
                            type="button"
                            onClick={() => setTab('widget')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                                tab === 'widget'
                                    ? 'bg-stone-900 text-white shadow-xs'
                                    : 'text-stone-600 hover:text-stone-900'
                            )}
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Widget Cliente
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('dashboard')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                                tab === 'dashboard'
                                    ? 'bg-stone-900 text-white shadow-xs'
                                    : 'text-stone-600 hover:text-stone-900'
                            )}
                        >
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            Dashboard Negocio
                        </button>
                    </div>

                    <Link
                        href={tab === 'widget' ? '/embed/barberia-studio-sv' : '/negocio/barberia-studio-sv'}
                        className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-white hover:text-stone-950"
                    >
                        Abrir vista real
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {tab === 'widget' ? (
                    <div className="space-y-3 rounded-2xl border border-stone-900/8 bg-white/90 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-xs font-bold text-white">
                                    S503
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">
                                        Studio 503 Barber &amp; Hair
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                        Widget embebido · Auto-resize vía postMessage
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                                Paso 2 de 3
                            </span>
                        </div>

                        {/* Servicio seleccionado */}
                        <div className="flex items-center justify-between rounded-xl border border-stone-200/80 bg-stone-50/90 px-3.5 py-2.5">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                                    <Scissors className="h-4 w-4" />
                                </span>
                                <div>
                                    <p className="text-xs font-semibold text-stone-900">
                                        Corte Clásico / Fade + Barba
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                        45 min · Con Carlos Mendoza
                                    </p>
                                </div>
                            </div>
                            <span className="font-mono text-sm font-semibold tabular-nums text-stone-900">
                                $15.00
                            </span>
                        </div>

                        {/* Zona horaria y bloques */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-stone-500">
                                <span className="inline-flex items-center gap-1 font-medium text-stone-700">
                                    <Globe className="h-3.5 w-3.5 text-stone-500" />
                                    Horarios (America/El_Salvador · GMT-6)
                                </span>
                                <span>Bloques cada 30 min</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {MOCK_SLOTS.map((slot) => (
                                    <div
                                        key={slot.time}
                                        className={cn(
                                            'flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium tabular-nums',
                                            slot.selected
                                                ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                                                : slot.available
                                                  ? 'border-stone-200 bg-white text-stone-800'
                                                  : 'border-stone-100 bg-stone-100/70 text-stone-400 line-through'
                                        )}
                                    >
                                        <Clock className="h-3 w-3 opacity-70" />
                                        {slot.time}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cierre y autogestión */}
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200/80 bg-stone-50/70 px-3 py-2 text-[11px] text-stone-600">
                            <span className="inline-flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5 text-stone-500" />
                                Pago en local o en línea (Stripe)
                            </span>
                            <span className="inline-flex items-center gap-1 font-medium text-stone-800">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Sin crear cuenta
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 rounded-2xl border border-stone-900/8 bg-zinc-950 p-4 text-zinc-100 sm:p-5">
                        {/* Encabezado simulado del panel oscuro */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 text-xs font-bold text-white shadow-md shadow-rose-500/20">
                                    S503
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-white">
                                        Agenda &amp; Operación
                                    </p>
                                    <p className="text-[11px] text-zinc-400">
                                        /negocio/barberia-studio-sv
                                    </p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-300">
                                <Lock className="h-3 w-3 text-rose-400" />
                                RBAC por sucursal
                            </span>
                        </div>

                        {/* Métricas rápidas */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                                    Citas hoy
                                </p>
                                <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-white">
                                    14
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                                    Ocupación
                                </p>
                                <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-emerald-400">
                                    86%
                                </p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-400">
                                    Caja día
                                </p>
                                <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-white">
                                    $248
                                </p>
                            </div>
                        </div>

                        {/* Lista agenda */}
                        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                            {MOCK_AGENDA_ROWS.map((row) => (
                                <div
                                    key={row.time}
                                    className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-3 py-2"
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className={cn('h-6 w-1 shrink-0 rounded-full', row.color)} />
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-medium text-white">
                                                {row.client}
                                            </p>
                                            <p className="truncate text-[11px] text-zinc-400">
                                                {row.time} · {row.service}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                            row.badge
                                        )}
                                    >
                                        {row.status}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                            <span className="inline-flex items-center gap-1">
                                <CalendarClock className="h-3.5 w-3.5 text-rose-400" />
                                Arrastra citas para reprogramar
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 text-orange-300" />
                                Servicios, personal y clientes
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
