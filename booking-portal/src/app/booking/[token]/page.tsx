import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { bookingService } from '@/services/booking.service';
import { BookingManagementView } from '@/components/booking/BookingManagementView';

interface BookingManagePageProps {
    params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: BookingManagePageProps): Promise<Metadata> {
    const { token } = await params;

    try {
        const booking = await bookingService.getBookingByToken(token);
        return {
            title: `Cita en ${booking.salon.name} — Gestión de Reserva`,
            description: `Consulta o cancela tu cita para ${booking.service.name} en ${booking.salon.name}.`,
        };
    } catch {
        return {
            title: 'Reserva no encontrada',
        };
    }
}

export default async function BookingManagePage({ params }: BookingManagePageProps) {
    const { token } = await params;

    let booking;
    try {
        booking = await bookingService.getBookingByToken(token);
    } catch {
        notFound();
    }

    return (
        <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
            <BookingManagementView initialBooking={booking} />
        </main>
    );
}
