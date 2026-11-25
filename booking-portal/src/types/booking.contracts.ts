export type PaymentPolicy = 'FREE' | 'DEPOSIT' | 'FULL_PREPAYMENT';

export interface StaffMember {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
}

export interface ServiceItem {
    id: string;
    category: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price: number; // En centavos o unidad decimal acordada (ej. 15.00)
    staffIds: string[]; // IDs de empleados habilitados para este servicio
}

export interface SalonProfile {
    id: string;
    slug: string;
    name: string;
    tagline?: string;         // Ej. "Cortes de precisión, barbería clásica y cuidado capilar"
    logoUrl?: string;
    coverImageUrl?: string;   // Banner superior del salón
    address: string;
    googleMapsUrl?: string;
    phone?: string;           // Contacto rápido del salón
    currency: string;
    timezone: string;
    paymentPolicy: PaymentPolicy;
    depositPercentage?: number;
    services: ServiceItem[];
    staff: StaffMember[];
}

export interface TimeSlot {
    startTime: string; // ISO 8601 UTC, ej. "2026-11-25T15:00:00Z"
    endTime: string;
    availableStaffIds: string[];
}

export interface CreateBookingPayload {
    salonSlug: string;
    serviceId: string;
    additionalServiceIds?: string[];
    staffId: string | 'ANY';
    startTime: string; // ISO 8601 UTC
    customer: {
        name: string;
        phone: string;
        email: string;
    };
    paymentMethod?: 'LOCAL' | 'CARD';
}

export interface CreateBookingResponse {
    bookingId: string;
    manageToken: string; // Token único para cancelar/reprogramar sin cuenta
    status: 'CONFIRMED' | 'PENDING_PAYMENT';
    stripeClientSecret?: string; // Solo presente si status === 'PENDING_PAYMENT'
}

export type BookingStatus = 'CONFIRMED' | 'PENDING_PAYMENT' | 'CANCELLED';

export interface BookingDetails {
    id: string;
    manageToken: string;
    status: BookingStatus;
    paymentMethod?: 'LOCAL' | 'CARD';
    createdAt: string;
    startTime: string; // ISO 8601 UTC
    endTime: string;   // ISO 8601 UTC
    salon: {
        id: string;
        name: string;
        slug: string;
        address: string;
        timezone: string;
        googleMapsUrl?: string;
        logoUrl?: string;
        currency: string;
    };
    service: {
        id: string;
        name: string;
        durationMinutes: number;
        price: number;
        currency: string;
    };
    additionalServices?: Array<{
        id: string;
        name: string;
        durationMinutes: number;
        price: number;
        currency: string;
    }>;
    staff: {
        id: string;
        name: string;
        role: string;
        avatarUrl?: string;
    };
    customer: {
        name: string;
        phone: string;
        email: string;
    };
    paymentPolicy: PaymentPolicy;
    depositAmount?: number;
    cancelledAt?: string;
    cancellationReason?: string;
}

export interface CancelBookingPayload {
    manageToken: string;
    reason?: string;
}

export interface CancelBookingResponse {
    success: boolean;
    message: string;
    booking: BookingDetails;
}
