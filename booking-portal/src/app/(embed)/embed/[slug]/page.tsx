import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { bookingService } from '@/services/booking.service';

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
        <main className="mx-auto min-h-screen max-w-xl p-4">
            <header className="mb-4 flex items-center gap-3 border-b pb-3">
                {salon.logoUrl && (
                    <img
                        src={salon.logoUrl}
                        alt={salon.name}
                        className="h-10 w-10 rounded-lg object-cover border"
                    />
                )}
                <div>
                    <h1 className="text-lg font-bold tracking-tight">{salon.name}</h1>
                    <p className="text-xs text-muted-foreground">{salon.address}</p>
                </div>
            </header>

            <section className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                Widget de reserva integrado para <strong className="text-foreground">{salon.slug}</strong> ({salon.services.length} servicios disponibles).
            </section>
        </main>
    );
}
