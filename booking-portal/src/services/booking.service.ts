import { apiClient } from '@/lib/api-client';
import {
    BookingDetails,
    CancelBookingResponse,
    CreateBookingPayload,
    CreateBookingResponse,
    SalonProfile,
    TimeSlot,
} from '@/types/booking.contracts';
import {
    mockCancelBooking,
    mockConfirmBookingPayment,
    mockCreateBooking,
    mockGetAvailableSlots,
    mockGetBookingByToken,
    mockGetBookingHistory,
    mockGetSalonProfile,
} from './mocks/salon.mock';

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
const BOOKING_TOKENS_STORAGE_KEY = 'kodigo_booking_tokens';

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
        date: string;
        serviceId: string;
        staffId: string | 'ANY';
    }): Promise<TimeSlot[]> {
        if (USE_MOCKS) {
            return mockGetAvailableSlots(params);
        }
        const query = new URLSearchParams({
            date: params.date,
            serviceId: params.serviceId,
            staffId: params.staffId,
        });
        return apiClient<TimeSlot[]>(`/salons/${params.slug}/availability?${query}`);
    },

    async createBooking(
        payload: CreateBookingPayload
    ): Promise<CreateBookingResponse> {
        const booking = USE_MOCKS
            ? await mockCreateBooking(payload)
            : await apiClient<CreateBookingResponse>('/bookings', {
                  method: 'POST',
                  body: JSON.stringify(payload),
              });

        if (typeof window !== 'undefined') {
            try {
                const rawTokens = localStorage.getItem(BOOKING_TOKENS_STORAGE_KEY);
                const tokens: string[] = rawTokens ? JSON.parse(rawTokens) : [];
                if (!tokens.includes(booking.manageToken)) {
                    localStorage.setItem(
                        BOOKING_TOKENS_STORAGE_KEY,
                        JSON.stringify([...tokens, booking.manageToken])
                    );
                }
            } catch (error) {
                console.error('[BookingHistory] No se pudo guardar el acceso a la cita:', error);
            }
        }

        return booking;
    },

    async getBookingHistory(salonSlug?: string): Promise<BookingDetails[]> {
        if (USE_MOCKS) {
            return mockGetBookingHistory(salonSlug);
        }
        if (typeof window === 'undefined') {
            return [];
        }

        const rawTokens = localStorage.getItem(BOOKING_TOKENS_STORAGE_KEY);
        const tokens: string[] = rawTokens ? JSON.parse(rawTokens) : [];
        const bookings = await Promise.all(tokens.map((token) => this.getBookingByToken(token)));

        return bookings
            .filter((booking) => !salonSlug || booking.salon.slug === salonSlug)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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