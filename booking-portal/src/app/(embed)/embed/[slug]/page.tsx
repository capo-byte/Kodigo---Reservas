import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { bookingService } from '@/services/booking.service';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { EmbedIframeBridge } from '@/components/embed/EmbedIframeBridge';
import { CalendarCheck } from 'lucide-react';
import Link from 'next/link';

interface EmbedPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EmbedPageProps): Promise<Metadata> {
    const { slug } = await params;

    try {
        const salon = await bookingService.getSalonProfile(slug);
        return {
            title: `${salon.name} — Widget de Reserva`,
            description: `Agenda tu cita en ${salon.name}.`,
        };
    } catch {
        return {
            title: 'Salón no encontrado',
        };
    }
}

export default async function SalonEmbedPage({ params }: EmbedPageProps) {
    const { slug } = await params;

    let salon;
    try {
        salon = await bookingService.getSalonProfile(slug);
    } catch {
        notFound();
    }

    return (
        <main className="mx-auto w-full max-w-5xl space-y-4 p-4">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div className="flex min-w-0 items-center gap-3">
                    {salon.logoUrl && (
                        <img
                            src={salon.logoUrl}
                            alt={salon.name}
                            className="h-10 w-10 shrink-0 rounded-lg border object-cover"
                        />
                    )}
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-bold tracking-tight">{salon.name}</h1>
                        <p className="truncate text-xs text-muted-foreground">{salon.address}</p>
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

            <BookingWizard salon={salon} embedded />
            <EmbedIframeBridge slug={salon.slug} />
        </main>
    );
}
