import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import {
    CreateBookingPayload,
    CreateBookingResponse,
    SalonProfile,
    TimeSlot,
} from '@/types/booking.contracts';

export const MOCK_SALON: SalonProfile = {
    id: 'salon-001',
    slug: 'barberia-studio-sv',
    name: 'Studio 503 Barber & Hair',
    logoUrl: 'https://placehold.co/120x120/18181b/ffffff?text=S503',
    address: 'Paseo General Escalón #4520, San Salvador',
    googleMapsUrl: 'https://maps.google.com/?q=Paseo+General+Escalon+San+Salvador',
    currency: 'USD',
    timezone: 'America/El_Salvador',
    paymentPolicy: 'DEPOSIT',
    depositPercentage: 25,
    staff: [
        {
            id: 'staff-1',
            name: 'Carlos Mendoza',
            role: 'Master Barber',
            avatarUrl: 'https://placehold.co/100x100/27272a/ffffff?text=CM',
        },
        {
            id: 'staff-2',
            name: 'Valeria Gómez',
            role: 'Estilista & Colorista',
            avatarUrl: 'https://placehold.co/100x100/3f3f46/ffffff?text=VG',
        },
        {
            id: 'staff-3',
            name: 'Diego Rivas',
            role: 'Barbero Senior',
            avatarUrl: 'https://placehold.co/100x100/52525b/ffffff?text=DR',
        },
    ],
    services: [
        {
            id: 'srv-1',
            category: 'Cabello & Barbería',
            name: 'Corte Clásico / Fade',
            description: 'Incluye lavado express, asesoría de visagismo y peinado con productos mate.',
            durationMinutes: 45,
            price: 15.0,
            staffIds: ['staff-1', 'staff-3'],
        },
        {
            id: 'srv-2',
            category: 'Cabello & Barbería',
            name: 'Corte + Perfilado de Barba',
            description: 'Ritual completo con toalla caliente, aceites esenciales y navaja.',
            durationMinutes: 60,
            price: 22.0,
            staffIds: ['staff-1', 'staff-3'],
        },
        {
            id: 'srv-3',
            category: 'Estilismo & Color',
            name: 'Corte Dama + Secado',
            description: 'Corte estilizado según textura del cabello y finalizado con brushing.',
            durationMinutes: 60,
            price: 25.0,
            staffIds: ['staff-2'],
        },
        {
            id: 'srv-4',
            category: 'Tratamientos',
            name: 'Hidratación Profunda Capilar',
            description: 'Recuperación de fibra capilar con keratina y masaje craneal.',
            durationMinutes: 30,
            price: 18.0,
            staffIds: ['staff-1', 'staff-2', 'staff-3'],
        },
    ],
};

// Simula latencia de red real (ej. 350ms)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockGetSalonProfile(slug: string): Promise<SalonProfile> {
    await sleep(300);
    // Devuelve el mock con el slug solicitado para facilitar pruebas en cualquier URL
    return {
        ...MOCK_SALON,
        slug,
    };
}

export async function mockGetAvailableSlots(params: {
    date: string; // YYYY-MM-DD
    serviceId: string;
    staffId: string | 'ANY';
}): Promise<TimeSlot[]> {
    await sleep(400);

    const service = MOCK_SALON.services.find((s) => s.id === params.serviceId);
    if (!service) return [];

    const [year, month, day] = params.date.split('-').map(Number);
    // Nota: El Salvador es UTC-6 todo el año (sin horario de verano)
    const baseDate = startOfDay(new Date(year, month - 1, day));

    // Generamos bloques horarios de 9:00 AM a 5:00 PM hora local (UTC-6 -> 15:00 a 23:00 UTC)
    const hours = [9, 10, 11, 13, 14, 15, 16, 17];
    const slots: TimeSlot[] = [];

    for (const hour of hours) {
        // Simulamos que algunos horarios ya están ocupados para probar la UI
        if (hour === 11 || hour === 15) continue;

        // Convertimos hora local SV (UTC-6) a UTC sumando 6 horas
        const startUtc = setMinutes(setHours(baseDate, hour + 6), 0);
        const endUtc = new Date(startUtc.getTime() + service.durationMinutes * 60000);

        const eligibleStaff =
            params.staffId === 'ANY'
                ? service.staffIds
                : service.staffIds.filter((id) => id === params.staffId);

        if (eligibleStaff.length > 0) {
            slots.push({
                startTime: startUtc.toISOString(),
                endTime: endUtc.toISOString(),
                availableStaffIds: eligibleStaff,
            });
        }
    }

    return slots;
}

export async function mockCreateBooking(
    payload: CreateBookingPayload
): Promise<CreateBookingResponse> {
    await sleep(600);

    return {
        bookingId: `bk_${Math.random().toString(36).substring(2, 9)}`,
        manageToken: `tok_${crypto.randomUUID()}`,
        // Si el salón cobra anticipo, devolvemos PENDING_PAYMENT para probar el slot de Stripe
        status: MOCK_SALON.paymentPolicy === 'FREE' ? 'CONFIRMED' : 'PENDING_PAYMENT',
        stripeClientSecret:
            MOCK_SALON.paymentPolicy === 'FREE'
                ? undefined
                : 'pi_mock_secret_123456789',
    };
}