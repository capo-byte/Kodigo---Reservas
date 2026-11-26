'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CreateBookingResponse,
    SalonProfile,
    TimeSlot,
} from '@/types/booking.contracts';
import { bookingService } from '@/services/booking.service';
import { ApiError } from '@/lib/api-client';
import { formatSlotTime } from '@/lib/timezone';
import { StepServiceStaff } from './StepServiceStaff';
import { StepDateTime } from './StepDateTime';
import { StepCustomerConfirm, CustomerFormData } from './StepCustomerConfirm';
import { BookingSuccess } from './BookingSuccess';
import { StickyFooter } from '@/components/layout/StickyFooter';
import { toast } from 'sonner';

interface BookingWizardProps {
    salon: SalonProfile;
    embedded?: boolean;
}

export type BookingStep = 1 | 2 | 3;

const INITIAL_CUSTOMER: CustomerFormData = {
    name: '',
    phone: '',
    email: '',
};

export function BookingWizard({ salon, embedded = false }: BookingWizardProps) {
    const queryClient = useQueryClient();

    const [step, setStep] = useState<BookingStep>(1);
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string | 'ANY'>('ANY');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [customer, setCustomer] = useState<CustomerFormData>(INITIAL_CUSTOMER);

    const [conflictError, setConflictError] = useState<string | null>(null);
    const [bookingResult, setBookingResult] = useState<CreateBookingResponse | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const selectedServices = useMemo(
        () => salon.services.filter((s) => selectedServiceIds.includes(s.id)),
        [salon.services, selectedServiceIds]
    );

    const primaryService = selectedServices[0] ?? null;
    const additionalServices = selectedServices.slice(1);

    const totalDurationMinutes = useMemo(
        () => selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0),
        [selectedServices]
    );

    const totalPrice = useMemo(
        () => selectedServices.reduce((sum, s) => sum + s.price, 0),
        [selectedServices]
    );

    const selectedService = useMemo(() => {
        if (!primaryService) return null;
        return {
            ...primaryService,
            name: selectedServices.map((s) => s.name).join(' + '),
            durationMinutes: totalDurationMinutes,
            price: totalPrice,
        };
    }, [primaryService, selectedServices, totalDurationMinutes, totalPrice]);

    const selectedStaffLabel = useMemo(() => {
        if (selectedStaffId === 'ANY') return 'Cualquier profesional';
        return salon.staff.find((m) => m.id === selectedStaffId)?.name ?? 'Profesional';
    }, [salon.staff, selectedStaffId]);

    const handleToggleService = (serviceId: string) => {
        setSelectedServiceIds((prev) => {
            if (prev.includes(serviceId)) {
                return prev.filter((id) => id !== serviceId);
            }
            return [...prev, serviceId];
        });
        setSelectedStaffId('ANY');
        setSelectedSlot(null);
        setConflictError(null);
    };

    const handleSelectStaff = (staffId: string | 'ANY') => {
        setSelectedStaffId(staffId);
        setSelectedSlot(null);
        setConflictError(null);
    };

    const bookingMutation = useMutation({
        mutationFn: (validCustomer: CustomerFormData) => {
            if (!primaryService || !selectedSlot) {
                throw new Error('Faltan datos de la reserva');
            }
            const resolvedStaffId =
                selectedStaffId === 'ANY'
                    ? selectedSlot.availableStaffIds[0] ?? 'ANY'
                    : selectedStaffId;

            return bookingService.createBooking({
                salonSlug: salon.slug,
                serviceId: primaryService.id,
                additionalServiceIds: additionalServices.map((s) => s.id),
                staffId: resolvedStaffId,
                startTime: selectedSlot.startTime,
                customer: validCustomer,
            });
        },
        onSuccess: (data) => {
            setConflictError(null);
            setBookingResult(data);
            if (data.status === 'CONFIRMED') {
                setIsConfirmed(true);
            }
        },
        onError: async (error) => {
            if (error instanceof ApiError && error.status === 409) {
                setConflictError(
                    'Alguien acaba de reservar ese bloque horario. Actualizamos la disponibilidad para que elijas otra hora.'
                );
                setSelectedSlot(null);
                await queryClient.invalidateQueries({
                    queryKey: ['availability', salon.slug, selectedDate],
                });
                setStep(2);
                return;
            }

            toast.error('No se pudo procesar la reserva', {
                description:
                    error instanceof Error ? error.message : 'Intenta nuevamente en unos segundos.',
            });
        },
    });

    const handleSubmitBooking = async (validData: CustomerFormData) => {
        await bookingMutation.mutateAsync(validData);
    };

    const handlePaymentComplete = async (paymentMethod: 'LOCAL' | 'CARD') => {
        if (bookingResult && bookingService.usesMocks) {
            try {
                await bookingService.confirmMockPayment(
                    bookingResult.manageToken,
                    paymentMethod
                );
            } catch (error) {
                toast.error('No se pudo actualizar el estado de la reserva', {
                    description:
                        error instanceof Error ? error.message : 'Intenta nuevamente en unos segundos.',
                });
                return;
            }
        }
        setIsConfirmed(true);
    };

    const handleBookAnother = () => {
        setStep(1);
        setSelectedServiceIds([]);
        setSelectedStaffId('ANY');
        setSelectedSlot(null);
        setCustomer(INITIAL_CUSTOMER);
        setBookingResult(null);
        setIsConfirmed(false);
        setConflictError(null);
    };

    if (isConfirmed && bookingResult && selectedService && selectedSlot) {
        return (
            <BookingSuccess
                salon={salon}
                service={selectedService}
                staffLabel={selectedStaffLabel}
                date={selectedDate}
                slot={selectedSlot}
                customerName={customer.name}
                bookingResult={bookingResult}
                onBookAnother={handleBookAnother}
            />
        );
    }

    return (
        <div className="space-y-6">
            <nav aria-label="Progreso de reserva" className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Paso {step} de 3</span>
                    <span>
                        {step === 1 && 'Servicio y profesional'}
                        {step === 2 && 'Fecha y hora'}
                        {step === 3 && 'Tus datos y confirmación'}
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map((num) => (
                        <div
                            key={num}
                            className={`h-1.5 rounded-full transition-colors ${num <= step ? 'bg-primary' : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>
            </nav>

            {step === 1 && (
                <>
                    <StepServiceStaff
                        services={salon.services}
                        staff={salon.staff}
                        currency={salon.currency}
                        selectedServiceIds={selectedServiceIds}
                        selectedStaffId={selectedStaffId}
                        onToggleService={handleToggleService}
                        onSelectStaff={handleSelectStaff}
                    />

                    <StickyFooter
                        embedded={embedded}
                        summaryLabel={selectedService?.name}
                        summarySublabel={
                            selectedService
                                ? `${selectedService.durationMinutes} min · $${selectedService.price} · ${selectedStaffLabel}`
                                : undefined
                        }
                        actionLabel="Continuar"
                        disabled={!selectedService}
                        onAction={() => setStep(2)}
                    />
                </>
            )}

            {step === 2 && selectedService && (
                <>
                    <StepDateTime
                        salonSlug={salon.slug}
                        salonTimeZone={salon.timezone}
                        service={selectedService}
                        staffId={selectedStaffId}
                        selectedDate={selectedDate}
                        selectedSlot={selectedSlot}
                        onSelectDate={(d) => {
                            setSelectedDate(d);
                            setConflictError(null);
                        }}
                        onSelectSlot={(s) => {
                            setSelectedSlot(s);
                            setConflictError(null);
                        }}
                    />

                    <StickyFooter
                        embedded={embedded}
                        summaryLabel={
                            selectedSlot
                                ? `${formatSlotTime(selectedSlot.startTime, salon.timezone)} · ${selectedDate}`
                                : selectedService.name
                        }
                        summarySublabel={
                            selectedSlot
                                ? `${selectedService.name} (${selectedStaffLabel})`
                                : 'Selecciona un horario para continuar'
                        }
                        actionLabel="Continuar"
                        disabled={!selectedSlot}
                        onBack={() => setStep(1)}
                        onAction={() => setStep(3)}
                    />
                </>
            )}

            {step === 3 && selectedService && selectedSlot && (
                <>
                    <StepCustomerConfirm
                        salon={salon}
                        service={selectedService}
                        staffLabel={selectedStaffLabel}
                        date={selectedDate}
                        slot={selectedSlot}
                        customer={customer}
                        onChangeCustomer={setCustomer}
                        onSubmitBooking={handleSubmitBooking}
                        isSubmitting={bookingMutation.isPending}
                        conflictError={conflictError}
                        pendingPayment={bookingResult}
                        onPaymentComplete={handlePaymentComplete}
                    />

                    {bookingResult?.status !== 'PENDING_PAYMENT' && (
                        <StickyFooter
                            embedded={embedded}
                            summaryLabel={selectedService.name}
                            summarySublabel={`${formatSlotTime(selectedSlot.startTime, salon.timezone)} · ${selectedDate}`}
                            actionLabel="Confirmar reserva"
                            loading={bookingMutation.isPending}
                            onBack={() => setStep(2)}
                            onAction={() => {
                                const form = document.getElementById(
                                    'booking-customer-form'
                                ) as HTMLFormElement | null;
                                form?.requestSubmit();
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
}