import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
            <header className="mb-6 flex items-center gap-4 border-b pb-4">
                {salon.logoUrl && (
                    <img
                        src={salon.logoUrl}
                        alt={salon.name}
                        className="h-14 w-14 rounded-xl object-cover border"
                    />
                )}
                <div>
                    <h1 className="text-xl font-bold tracking-tight">{salon.name}</h1>
                    <p className="text-sm text-muted-foreground">{salon.address}</p>
                </div>
            </header>

            <BookingWizard salon={salon} />
        </main>
    );
}