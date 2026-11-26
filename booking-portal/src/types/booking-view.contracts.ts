import type { CreateBookingResponse } from './booking.contracts';
import type { MockCreateBookingResponse } from '@/services/mocks/salon.mock';

export type BookingViewResult =
    | ({ source: 'api' } & CreateBookingResponse)
    | ({ source: 'mock' } & MockCreateBookingResponse);
