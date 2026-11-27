import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarCheck } from 'lucide-react';
import { bookingService } from '@/services/booking.service';
import { BookingWizard } from '@/components/booking/BookingWizard';

interface PortalPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PortalPageProps): Promise<Metadata> {
    const { slug } = await params;

    try {
        const salon = await bookingService.getSalonProfile(slug);
        return {
            title: `${salon.name} — Reservar Cita`,
            description: `Agenda en ${salon.name} (${salon.address}) en menos de 3 pasos.`,
        };
    } catch {
        return {
            title: 'Salón no encontrado',
        };
    }
}

export default async function SalonPortalPage({ params }: PortalPageProps) {
    const { slug } = await params;

    let salon;
    try {
        salon = await bookingService.getSalonProfile(slug);
    } catch {
        notFound();
    }

    return (
        <main className="mx-auto min-h-screen max-w-2xl px-4 py-6 pb-28">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div className="flex min-w-0 items-center gap-4">
                    {salon.logoUrl && (
                        <img
                            src={salon.logoUrl}
                            alt={salon.name}
                            className="h-14 w-14 shrink-0 rounded-xl border object-cover"
                        />
                    )}
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-bold tracking-tight">{salon.name}</h1>
                        <p className="truncate text-sm text-muted-foreground">{salon.address}</p>
                    </div>
                </div>
                <Link
                    href={`/booking/history?salon=${encodeURIComponent(salon.slug)}`}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-foreground/25 hover:bg-accent active:scale-[0.98]"
                >
                    <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Ver mis citas</span>
                </Link>
            </header>

            <BookingWizard salon={salon} />
        </main>
    );
}