'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    CalendarDays,
    ExternalLink,
    LayoutDashboard,
    Loader2,
    Menu,
    Scissors,
    Settings,
    UserRound,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from '@/components/ui/sheet';
import { useBusiness } from '@/components/business/BusinessProvider';
import { getInitials } from '@/components/business/shared';
import { cn } from '@/lib/utils';
import { SalonProfile } from '@/types/booking.contracts';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    exact?: boolean;
}

interface BusinessShellProps {
    salon: SalonProfile;
    children: ReactNode;
}

export function BusinessShell({ salon: initialSalon, children }: BusinessShellProps) {
    const pathname = usePathname();
    const { data, isFetching } = useBusiness();
    const salon = data?.salon ?? initialSalon;
    const [mobileOpen, setMobileOpen] = useState(false);

    const base = `/negocio/${salon.slug}`;
    const navItems: NavItem[] = [
        { label: 'Resumen', href: base, icon: LayoutDashboard, exact: true },
        { label: 'Agenda', href: `${base}/agenda`, icon: CalendarDays },
        { label: 'Servicios', href: `${base}/servicios`, icon: Scissors },
        { label: 'Personal', href: `${base}/personal`, icon: Users },
        { label: 'Clientes', href: `${base}/clientes`, icon: UserRound },
        { label: 'Configuración', href: `${base}/configuracion`, icon: Settings },
    ];

    const activeItem = [...navItems]
        .sort((a, b) => b.href.length - a.href.length)
        .find((item) =>
            item.exact ? pathname === item.href : pathname.startsWith(item.href)
        );

    const todayLabel = new Intl.DateTimeFormat('es-SV', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: salon.timezone,
    }).format(new Date());

    const sidebar = (
        <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
            <div className="flex items-center gap-3 px-5 pb-5 pt-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-400 text-sm font-bold text-white shadow-lg shadow-rose-500/20">
                    {getInitials(salon.name)}
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{salon.name}</p>
                    <p className="text-[11px] text-zinc-400">Panel de negocio</p>
                </div>
            </div>

            <div className="px-5 pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Operación diaria
                </p>
            </div>

            <nav className="flex-1 space-y-1 px-3" aria-label="Navegación del negocio">
                {navItems.map((item) => {
                    const isActive = activeItem?.href === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                            )}
                        >
                            {isActive && (
                                <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-rose-400" />
                            )}
                            <Icon
                                className={cn(
                                    'h-4 w-4 shrink-0',
                                    isActive ? 'text-rose-300' : 'text-zinc-500'
                                )}
                            />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="space-y-3 border-t border-white/10 px-4 py-4">
                <Link
                    href={`/${salon.slug}`}
                    target="_blank"
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                    Ver página pública
                    <ExternalLink className="h-3.5 w-3.5" />
                </Link>

                <div className="flex items-center gap-3 px-1">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200">
                        CM
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-medium">Carlos Mendoza</p>
                        <p className="text-[11px] text-zinc-500">Administrador</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-background">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
                {sidebar}
            </aside>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent
                    side="left"
                    className="w-72 border-0 bg-zinc-950 p-0 text-zinc-100"
                    showCloseButton={false}
                >
                    <SheetTitle className="sr-only">Navegación del negocio</SheetTitle>
                    <div className="absolute right-3 top-3 z-10">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-zinc-400 hover:bg-white/10 hover:text-white"
                            onClick={() => setMobileOpen(false)}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Cerrar menú</span>
                        </Button>
                    </div>
                    {sidebar}
                </SheetContent>
            </Sheet>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 border-b bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:bg-background/80">
                    <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                        <div className="flex min-w-0 items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                className="lg:hidden"
                                onClick={() => setMobileOpen(true)}
                            >
                                <Menu className="h-4 w-4" />
                                <span className="sr-only">Abrir menú</span>
                            </Button>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="truncate text-sm font-semibold">
                                        {activeItem?.label ?? 'Panel de negocio'}
                                    </h2>
                                    {isFetching && (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                                <p className="truncate text-[11px] first-letter:uppercase text-muted-foreground">
                                    {todayLabel} · {salon.timezone.replace('_', ' ')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href={`/negocio/${salon.slug}/agenda`}
                                className="hidden items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted sm:inline-flex"
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                Abrir agenda
                            </Link>
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
                                {getInitials(salon.name)}
                            </span>
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
