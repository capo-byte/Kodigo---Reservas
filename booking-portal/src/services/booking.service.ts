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
    mockCreateBooking,
    mockGetAvailableSlots,
    mockGetBookingByToken,
    mockGetSalonProfile,
} from './mocks/salon.mock';

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export const bookingService = {
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
        if (USE_MOCKS) {
            return mockCreateBooking(payload);
        }
        return apiClient<CreateBookingResponse>('/bookings', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
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