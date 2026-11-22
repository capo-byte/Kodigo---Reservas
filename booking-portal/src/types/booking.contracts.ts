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
    logoUrl?: string;
    address: string;
    googleMapsUrl?: string;
    currency: string; // ej. "USD"
    timezone: string; // Formato IANA, ej. "America/El_Salvador"
    paymentPolicy: PaymentPolicy;
    depositPercentage?: number; // ej. 20 (si paymentPolicy === 'DEPOSIT')
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
    staffId: string | 'ANY';
    startTime: string; // ISO 8601 UTC
    customer: {
        name: string;
        phone: string;
        email: string;
    };
}

export interface CreateBookingResponse {
    bookingId: string;
    manageToken: string; // Token único para cancelar/reprogramar sin cuenta
    status: 'CONFIRMED' | 'PENDING_PAYMENT';
    stripeClientSecret?: string; // Solo presente si status === 'PENDING_PAYMENT'
}