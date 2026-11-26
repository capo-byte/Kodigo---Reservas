import { apiClient } from '@/lib/api-client';
import {
    BookingDetails,
    CancelBookingResponse,
    CreateBookingPayload,
    CreateBookingResponse,
    PaymentIntentResponse,
    SalonProfile,
    TimeSlot,
} from '@/types/booking.contracts';
import {
    mockCancelBooking,
    mockConfirmBookingPayment,
    mockGetBookingByToken,
    mockGetBookingHistory,
    mockGetSalonProfile,
} from './mocks/salon.mock';

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

function generateIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `web_${crypto.randomUUID().replace(/-/g, '')}`;
    }
    return `web_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
}

export const bookingService = {
    usesMocks: USE_MOCKS,

    async getSalonProfile(slug: string): Promise<SalonProfile> {
        if (USE_MOCKS) {
            return mockGetSalonProfile(slug);
        }
        return apiClient<SalonProfile>(`/salons/${slug}`);
    },

    async getAvailableSlots(params: {
        slug: string;
        branchId: string;
        date: string;
        serviceId: string;
    }): Promise<{ slots: Array<{ startsAt: string }> } | TimeSlot[]> {
        const query = new URLSearchParams({
            date: params.date,
            serviceId: params.serviceId,
        });
        return apiClient<{ slots: Array<{ startsAt: string }> }>(
            `/negocios/${params.slug}/sucursales/${params.branchId}/disponibilidad?${query}`
        );
    },

    async createBooking(
        payload: CreateBookingPayload
    ): Promise<CreateBookingResponse> {
        const { slug, branchId, firstName, lastName, serviceId, startsAt, paymentMode } = payload;

        return apiClient<CreateBookingResponse>(
            `/negocios/${slug}/sucursales/${branchId}/reservas`,
            {
                method: 'POST',
                headers: {
                    'idempotency-key': generateIdempotencyKey(),
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    serviceId,
                    startsAt,
                    ...(paymentMode ? { paymentMode } : {}),
                }),
            }
        );
    },

    async createPaymentIntent(
        slug: string,
        branchId: string,
        appointmentId: string
    ): Promise<PaymentIntentResponse> {
        return apiClient<PaymentIntentResponse>(
            `/negocios/${slug}/sucursales/${branchId}/pagos/intent`,
            {
                method: 'POST',
                body: JSON.stringify({ appointmentId }),
            }
        );
    },

    async getBookingHistory(salonSlug?: string): Promise<BookingDetails[]> {
        if (USE_MOCKS) {
            return mockGetBookingHistory(salonSlug);
        }
        return [];
    },

    async confirmMockPayment(
        manageToken: string,
        paymentMethod: 'LOCAL' | 'CARD'
    ): Promise<BookingDetails> {
        if (!USE_MOCKS) {
            throw new Error('La confirmación simulada solo está disponible con los mocks activos.');
        }
        return mockConfirmBookingPayment(manageToken, paymentMethod);
    },

    async getBookingByToken(token: string): Promise<BookingDetails> {
        if (USE_MOCKS) {
            return mockGetBookingByToken(token);
        }
        return apiClient<BookingDetails>(`/bookings/manage/${token}`);
    },

    async cancelBooking(
        token: string,
        reason?: string
    ): Promise<CancelBookingResponse> {
        if (USE_MOCKS) {
            return mockCancelBooking({ manageToken: token, reason });
        }
        return apiClient<CancelBookingResponse>(`/bookings/manage/${token}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    },
};
