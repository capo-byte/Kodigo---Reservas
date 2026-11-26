'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
    AlertCircle,
    Inbox,
    Loader2,
    RefreshCw,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AppointmentStatus, StaffMember } from '@/types/booking.contracts';

/**
 * Hora actual del cliente, refrescada periódicamente. El valor inicial se
 * calcula con un inicializador de estado para no ejecutar código impuro
 * durante el render.
 */
export function useNow(intervalMs = 60_000): number {
    const [now, setNow] = useState(0);

    useEffect(() => {
        const tick = () => setNow(Date.now());
        // El primer tick se difiere para no llamar setState sincrónicamente
        // dentro del efecto y mantener el render inicial libre de IO.
        const timeout = window.setTimeout(tick, 0);
        const timer = window.setInterval(tick, intervalMs);

        return () => {
            window.clearTimeout(timeout);
            window.clearInterval(timer);
        };
    }, [intervalMs]);

    return now;
}

export const APPOINTMENT_STATUS_META: Record<
    AppointmentStatus,
    { label: string; classes: string; dot: string }
> = {
    CONFIRMED: {
        label: 'Confirmada',
        classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
        dot: 'bg-emerald-500',
    },
    PENDING_PAYMENT: {
        label: 'Pago pendiente',
        classes: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
        dot: 'bg-amber-500',
    },
    COMPLETED: {
        label: 'Atendida',
        classes: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20',
        dot: 'bg-sky-500',
    },
    NO_SHOW: {
        label: 'No asistió',
        classes: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
        dot: 'bg-rose-500',
    },
    CANCELLED: {
        label: 'Cancelada',
        classes: 'bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-300 dark:ring-zinc-500/20',
        dot: 'bg-zinc-400',
    },
};

export function StatusBadge({
    status,
    className,
}: {
    status: AppointmentStatus;
    className?: string;
}) {
    const meta = APPOINTMENT_STATUS_META[status];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap',
                meta.classes,
                className
            )}
        >
            <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
            {meta.label}
        </span>
    );
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

export function StaffAvatar({
    staff,
    size = 'md',
    className,
}: {
    staff?: Pick<StaffMember, 'name' | 'color'> | null;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const color = staff?.color ?? '#52525b';
    const sizes = {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
    };

    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-black/5',
                sizes[size],
                className
            )}
            style={{
                backgroundColor: `${color}1f`,
                color,
            }}
            aria-hidden="true"
        >
            {getInitials(staff?.name ?? '?')}
        </span>
    );
}

export function PageHeader({
    title,
    description,
    children,
    className,
}: {
    title: string;
    description?: string;
    children?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
                className
            )}
        >
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {description && (
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex flex-wrap items-center gap-2">{children}</div>
            )}
        </div>
    );
}

const STAT_TONES = {
    default: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
} as const;

export function StatCard({
    label,
    value,
    helper,
    icon: Icon,
    tone = 'default',
}: {
    label: string;
    value: ReactNode;
    helper?: string;
    icon: LucideIcon;
    tone?: keyof typeof STAT_TONES;
}) {
    return (
        <Card className="gap-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-2xl font-semibold tracking-tight">{value}</p>
                </div>
                <span
                    className={cn(
                        'inline-flex h-9 w-9 items-center justify-center rounded-lg',
                        STAT_TONES[tone]
                    )}
                >
                    <Icon className="h-4 w-4" />
                </span>
            </div>
            {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
        </Card>
    );
}

export function FormField({
    label,
    htmlFor,
    hint,
    error,
    children,
    className,
}: {
    label: string;
    htmlFor?: string;
    hint?: string;
    error?: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor={htmlFor} className="text-xs font-medium">
                {label}
            </Label>
            {children}
            {error ? (
                <p className="text-xs text-destructive">{error}</p>
            ) : hint ? (
                <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}

export function EmptyState({
    title,
    description,
    icon: Icon = Inbox,
    action,
}: {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" />
            </span>
            <div className="space-y-1">
                <p className="text-sm font-medium">{title}</p>
                {description && (
                    <p className="max-w-sm text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

export function LoadingPanel({ label = 'Cargando información…' }: { label?: string }) {
    return (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border bg-card/50 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm">{label}</p>
        </div>
    );
}

export function ErrorPanel({
    message = 'No pudimos cargar la información del negocio.',
    onRetry,
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 text-center">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5" />
            </span>
            <p className="max-w-md text-sm text-muted-foreground">{message}</p>
            {onRetry && (
                <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reintentar
                </Button>
            )}
        </div>
    );
}

export function MetricPill({
    icon: Icon,
    children,
}: {
    icon: LucideIcon;
    children: ReactNode;
}) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2 py-1 text-[11px] font-medium text-muted-foreground">
            <Icon className="h-3 w-3" />
            {children}
        </span>
    );
}
