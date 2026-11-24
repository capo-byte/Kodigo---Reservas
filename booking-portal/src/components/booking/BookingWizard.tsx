'use client';

import { useMemo, useState } from 'react';
import { SalonProfile, TimeSlot } from '@/types/booking.contracts';
import { StepServiceStaff } from './StepServiceStaff';
import { StickyFooter } from '@/components/layout/StickyFooter';
import { StepDateTime } from './StepDateTime';
import { formatSlotTime } from '@/lib/timezone';

interface BookingWizardProps {
    salon: SalonProfile;
}

export type BookingStep = 1 | 2 | 3;

export function BookingWizard({ salon }: BookingWizardProps) {
    const [step, setStep] = useState<BookingStep>(1);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [selectedStaffId, setSelectedStaffId] = useState<string | 'ANY'>('ANY');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

    const selectedService = useMemo(
        () => salon.services.find((s) => s.id === selectedServiceId) ?? null,
        [salon.services, selectedServiceId]
    );

    const selectedStaffLabel = useMemo(() => {
        if (selectedStaffId === 'ANY') return 'Cualquier profesional';
        return salon.staff.find((m) => m.id === selectedStaffId)?.name ?? 'Profesional';
    }, [salon.staff, selectedStaffId]);

    const handleSelectService = (serviceId: string) => {
        setSelectedServiceId(serviceId);
        // Resetear a 'ANY' y limpiar fecha/hora previa si cambia el servicio
        setSelectedStaffId('ANY');
        setSelectedSlot(null);
    };

    const handleSelectStaff = (staffId: string | 'ANY') => {
        setSelectedStaffId(staffId);
        setSelectedSlot(null);
    };

    const handleNextFromStep1 = () => {
        if (!selectedService) return;
        setStep(2);
    };

    return (
        <div className="space-y-6">
            {/* Indicador de progreso de 3 pasos */}
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

            {/* Contenido según paso activo */}
            {step === 1 && (
                <>
                    <StepServiceStaff
                        services={salon.services}
                        staff={salon.staff}
                        currency={salon.currency}
                        selectedServiceId={selectedServiceId}
                        selectedStaffId={selectedStaffId}
                        onSelectService={handleSelectService}
                        onSelectStaff={handleSelectStaff}
                    />

                    <StickyFooter
                        summaryLabel={selectedService?.name}
                        summarySublabel={
                            selectedService
                                ? `${selectedService.durationMinutes} min · ${selectedStaffLabel}`
                                : undefined
                        }
                        actionLabel="Continuar"
                        disabled={!selectedService}
                        onAction={handleNextFromStep1}
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
                        onSelectDate={setSelectedDate}
                        onSelectSlot={setSelectedSlot}
                    />

                    <StickyFooter
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

            {step === 3 && (
                <div className="rounded-xl border border-dashed p-6 text-center">
                    <p className="text-sm font-medium">Paso 3 en preparación</p>
                </div>
            )}
        </div>
    );
}