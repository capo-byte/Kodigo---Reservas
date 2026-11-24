'use client';

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { businessService } from '@/services/business.service';
import {
    Appointment,
    AppointmentStatus,
    BusinessClient,
    BusinessHours,
    BusinessSnapshot,
    CancellationPolicy,
    CreateManualAppointmentPayload,
    RescheduleAppointmentPayload,
    SalonProfile,
    ServiceItem,
    StaffMember,
    TimeBlock,
} from '@/types/booking.contracts';

interface BusinessActions {
    createManualAppointment: (
        payload: CreateManualAppointmentPayload
    ) => Promise<Appointment>;
    rescheduleAppointment: (
        appointmentId: string,
        payload: RescheduleAppointmentPayload
    ) => Promise<Appointment>;
    updateAppointmentStatus: (
        appointmentId: string,
        status: AppointmentStatus
    ) => Promise<Appointment>;
    deleteAppointment: (appointmentId: string) => Promise<void>;
    createTimeBlock: (payload: {
        staffId: string | 'ALL';
        startTime: string;
        endTime: string;
        reason: string;
    }) => Promise<TimeBlock>;
    deleteTimeBlock: (blockId: string) => Promise<void>;
    createService: (input: Omit<ServiceItem, 'id'>) => Promise<ServiceItem>;
    updateService: (
        serviceId: string,
        input: Partial<Omit<ServiceItem, 'id'>>
    ) => Promise<ServiceItem>;
    deleteService: (serviceId: string) => Promise<void>;
    createStaffMember: (input: Omit<StaffMember, 'id'>) => Promise<StaffMember>;
    updateStaffMember: (
        staffId: string,
        input: Partial<Omit<StaffMember, 'id'>>
    ) => Promise<StaffMember>;
    deleteStaffMember: (staffId: string) => Promise<void>;
    createClient: (
        input: Omit<BusinessClient, 'id' | 'createdAt'>
    ) => Promise<BusinessClient>;
    updateClient: (
        clientId: string,
        input: Partial<Omit<BusinessClient, 'id' | 'createdAt'>>
    ) => Promise<BusinessClient>;
    deleteClient: (clientId: string) => Promise<void>;
    updateBusinessHours: (hours: BusinessHours) => Promise<BusinessHours>;
    updateCancellationPolicy: (
        policy: CancellationPolicy
    ) => Promise<CancellationPolicy>;
    updateSalonProfile: (
        input: Partial<
            Pick<
                SalonProfile,
                | 'name'
                | 'logoUrl'
                | 'address'
                | 'googleMapsUrl'
                | 'currency'
                | 'timezone'
                | 'paymentPolicy'
                | 'depositPercentage'
            >
        >
    ) => Promise<SalonProfile>;
}

interface BusinessContextValue {
    slug: string;
    data: BusinessSnapshot | null;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    refetch: () => Promise<unknown>;
    actions: BusinessActions;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

interface BusinessProviderProps {
    slug: string;
    children: ReactNode;
}

export function BusinessProvider({ slug, children }: BusinessProviderProps) {
    const queryClient = useQueryClient();
    const queryKey = useMemo(() => ['business', slug] as const, [slug]);

    const query = useQuery({
        queryKey,
        queryFn: () => businessService.getBusinessSnapshot(slug),
    });

    const run = useCallback(
        async <T,>(operation: () => Promise<T>): Promise<T> => {
            const result = await operation();
            await queryClient.invalidateQueries({ queryKey });
            return result;
        },
        [queryClient, queryKey]
    );

    const actions = useMemo<BusinessActions>(
        () => ({
            createManualAppointment: (payload) =>
                run(() => businessService.createManualAppointment(slug, payload)),
            rescheduleAppointment: (appointmentId, payload) =>
                run(() =>
                    businessService.rescheduleAppointment(slug, appointmentId, payload)
                ),
            updateAppointmentStatus: (appointmentId, status) =>
                run(() =>
                    businessService.updateAppointmentStatus(slug, appointmentId, status)
                ),
            deleteAppointment: (appointmentId) =>
                run(() => businessService.deleteAppointment(slug, appointmentId)),
            createTimeBlock: (payload) =>
                run(() => businessService.createTimeBlock(slug, payload)),
            deleteTimeBlock: (blockId) =>
                run(() => businessService.deleteTimeBlock(slug, blockId)),
            createService: (input) =>
                run(() => businessService.createService(slug, input)),
            updateService: (serviceId, input) =>
                run(() => businessService.updateService(slug, serviceId, input)),
            deleteService: (serviceId) =>
                run(() => businessService.deleteService(slug, serviceId)),
            createStaffMember: (input) =>
                run(() => businessService.createStaffMember(slug, input)),
            updateStaffMember: (staffId, input) =>
                run(() => businessService.updateStaffMember(slug, staffId, input)),
            deleteStaffMember: (staffId) =>
                run(() => businessService.deleteStaffMember(slug, staffId)),
            createClient: (input) =>
                run(() => businessService.createClient(slug, input)),
            updateClient: (clientId, input) =>
                run(() => businessService.updateClient(slug, clientId, input)),
            deleteClient: (clientId) =>
                run(() => businessService.deleteClient(slug, clientId)),
            updateBusinessHours: (hours) =>
                run(() => businessService.updateBusinessHours(slug, hours)),
            updateCancellationPolicy: (policy) =>
                run(() => businessService.updateCancellationPolicy(slug, policy)),
            updateSalonProfile: (input) =>
                run(() => businessService.updateSalonProfile(slug, input)),
        }),
        [run, slug]
    );

    const value = useMemo<BusinessContextValue>(
        () => ({
            slug,
            data: query.data ?? null,
            isLoading: query.isLoading,
            isFetching: query.isFetching,
            isError: query.isError,
            refetch: query.refetch,
            actions,
        }),
        [slug, query.data, query.isLoading, query.isFetching, query.isError, query.refetch, actions]
    );

    return (
        <BusinessContext.Provider value={value}>
            {children}
        </BusinessContext.Provider>
    );
}

export function useBusiness(): BusinessContextValue {
    const context = useContext(BusinessContext);
    if (!context) {
        throw new Error('useBusiness debe usarse dentro de BusinessProvider');
    }
    return context;
}
