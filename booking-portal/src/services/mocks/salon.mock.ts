import { setHours, setMinutes, startOfDay } from 'date-fns';
import {
    BookingDetails,
    CancelBookingPayload,
    CancelBookingResponse,
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

// Almacenamiento en memoria para pruebas de gestión y cancelación con manageToken
const BOOKINGS_STORE = new Map<string, BookingDetails>();
const STORAGE_KEY = 'kodigo_bookings_store';

function getStoredBookings(): Record<string, BookingDetails> {
    if (typeof window !== 'undefined') {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (error) {
            console.error('[MockStore] No se pudo leer el historial de reservas:', error);
            throw new Error('No se pudo leer el historial de reservas del navegador.', {
                cause: error,
            });
        }
    }
    return {};
}

function saveStoredBooking(token: string, booking: BookingDetails) {
    BOOKINGS_STORE.set(token, booking);
    if (typeof window !== 'undefined') {
        try {
            const store = getStoredBookings();
            store[token] = booking;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        } catch (e) {
            console.error('[MockStore] Error al guardar en localStorage:', e);
        }
    }
}

export async function mockCreateBooking(
    payload: CreateBookingPayload
): Promise<CreateBookingResponse> {
    await sleep(600);

    const bookingId = `bk_${Math.random().toString(36).substring(2, 9)}`;
    const manageToken = `tok_${crypto.randomUUID()}`;
    const status = MOCK_SALON.paymentPolicy === 'FREE' ? 'CONFIRMED' : 'PENDING_PAYMENT';

    const service = MOCK_SALON.services.find((s) => s.id === payload.serviceId) ?? MOCK_SALON.services[0];
    const additionalServices = (payload.additionalServiceIds ?? [])
        .map((id) => MOCK_SALON.services.find((s) => s.id === id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s));

    const totalDuration =
        service.durationMinutes +
        additionalServices.reduce((acc, s) => acc + s.durationMinutes, 0);

    const totalPrice =
        service.price + additionalServices.reduce((acc, s) => acc + s.price, 0);

    const staff =
        MOCK_SALON.staff.find((m) => m.id === payload.staffId) ??
        MOCK_SALON.staff[0];

    const startTime = new Date(payload.startTime);
    const endTime = new Date(startTime.getTime() + totalDuration * 60000);

    const booking: BookingDetails = {
        id: bookingId,
        manageToken,
        status,
        createdAt: new Date().toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        salon: {
            id: MOCK_SALON.id,
            name: MOCK_SALON.name,
            slug: MOCK_SALON.slug,
            address: MOCK_SALON.address,
            timezone: MOCK_SALON.timezone,
            googleMapsUrl: MOCK_SALON.googleMapsUrl,
            logoUrl: MOCK_SALON.logoUrl,
            currency: MOCK_SALON.currency,
        },
        service: {
            id: service.id,
            name: service.name,
            durationMinutes: service.durationMinutes,
            price: service.price,
            currency: MOCK_SALON.currency,
        },
        additionalServices: additionalServices.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            price: s.price,
            currency: MOCK_SALON.currency,
        })),
        staff: {
            id: staff.id,
            name: staff.name,
            role: staff.role,
            avatarUrl: staff.avatarUrl,
        },
        customer: payload.customer,
        paymentPolicy: MOCK_SALON.paymentPolicy,
        depositAmount:
            MOCK_SALON.paymentPolicy === 'DEPOSIT'
                ? Number(((totalPrice * (MOCK_SALON.depositPercentage ?? 25)) / 100).toFixed(2))
                : undefined,
    };

    saveStoredBooking(manageToken, booking);

    return {
        bookingId,
        manageToken,
        status,
        stripeClientSecret:
            MOCK_SALON.paymentPolicy === 'FREE'
                ? undefined
                : 'pi_mock_secret_123456789',
    };
}

export async function mockGetBookingHistory(salonSlug?: string): Promise<BookingDetails[]> {
    await sleep(250);

    return Object.values(getStoredBookings())
        .filter((booking) => !salonSlug || booking.salon.slug === salonSlug)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function mockConfirmBookingPayment(
    manageToken: string,
    paymentMethod: 'LOCAL' | 'CARD'
): Promise<BookingDetails> {
    await sleep(250);

    const booking = await mockGetBookingByToken(manageToken);
    booking.status = 'CONFIRMED';
    booking.paymentMethod = paymentMethod;
    saveStoredBooking(manageToken, booking);

    return booking;
}

export async function mockGetBookingByToken(token: string): Promise<BookingDetails> {
    await sleep(350);

    // 1. Comprobar primero en localStorage si estamos en entorno navegador
    if (typeof window !== 'undefined') {
        const stored = getStoredBookings();
        if (stored[token]) {
            BOOKINGS_STORE.set(token, stored[token]);
            return stored[token];
        }
    }

    // 2. Comprobar en memoria
    const existing = BOOKINGS_STORE.get(token);
    if (existing) {
        return existing;
    }

    // Si se accede con un token de prueba que no está en el store temporal,
    // generamos un mock coherente para garantizar que la pantalla siempre sea testeable.
    const service = MOCK_SALON.services[0];
    const staff = MOCK_SALON.staff[0];
    const now = new Date();
    const scheduledTime = new Date(now.getTime() + 86400000 * 2); // 2 días después
    scheduledTime.setHours(14, 0, 0, 0);

    const fallbackBooking: BookingDetails = {
        id: `bk_${token.slice(0, 8)}`,
        manageToken: token,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        startTime: scheduledTime.toISOString(),
        endTime: new Date(scheduledTime.getTime() + service.durationMinutes * 60000).toISOString(),
        salon: {
            id: MOCK_SALON.id,
            name: MOCK_SALON.name,
            slug: MOCK_SALON.slug,
            address: MOCK_SALON.address,
            timezone: MOCK_SALON.timezone,
            googleMapsUrl: MOCK_SALON.googleMapsUrl,
            logoUrl: MOCK_SALON.logoUrl,
            currency: MOCK_SALON.currency,
        },
        service: {
            id: service.id,
            name: service.name,
            durationMinutes: service.durationMinutes,
            price: service.price,
            currency: MOCK_SALON.currency,
        },
        staff: {
            id: staff.id,
            name: staff.name,
            role: staff.role,
            avatarUrl: staff.avatarUrl,
        },
        customer: {
            name: 'Cliente Invitado',
            phone: '+503 7123 4567',
            email: 'cliente@ejemplo.com',
        },
        paymentPolicy: MOCK_SALON.paymentPolicy,
        depositAmount: 3.75,
    };

    saveStoredBooking(token, fallbackBooking);
    return fallbackBooking;
}

export async function mockCancelBooking(
    payload: CancelBookingPayload
): Promise<CancelBookingResponse> {
    await sleep(400);

    const booking = await mockGetBookingByToken(payload.manageToken);
    booking.status = 'CANCELLED';
    booking.cancelledAt = new Date().toISOString();
    booking.cancellationReason = payload.reason || 'Cancelado por el cliente';

    saveStoredBooking(payload.manageToken, booking);

    return {
        success: true,
        message: 'Tu cita ha sido cancelada exitosamente.',
        booking,
    };
}