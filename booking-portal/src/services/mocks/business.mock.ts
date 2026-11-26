import {
    Appointment,
    AppointmentSource,
    AppointmentStatus,
    BusinessClient,
    BusinessHours,
    BusinessSnapshot,
    CancellationPolicy,
    TimeBlock,
} from '@/types/booking.contracts';
import {
    addDaysToDateKey,
    dateKeyAndTimeToIso,
    getDayOfWeek,
    getTodayDateKey,
} from '@/lib/timezone';
import { MOCK_SALON } from './salon.mock';

const SALON_TIMEZONE = MOCK_SALON.timezone;

const CLIENT_CREATED_AT_SEEDS: Array<{ daysAgo: number; time: string }> = [
    { daysAgo: 420, time: '10:00' },
    { daysAgo: 360, time: '16:30' },
    { daysAgo: 310, time: '11:10' },
    { daysAgo: 250, time: '15:45' },
    { daysAgo: 190, time: '09:20' },
    { daysAgo: 140, time: '17:05' },
    { daysAgo: 95, time: '12:00' },
    { daysAgo: 48, time: '14:30' },
    { daysAgo: 0, time: '09:15' },
    { daysAgo: 0, time: '11:40' },
];

/** Fechas de alta relativas a hoy para que las métricas del panel sean realistas. */
function buildSeedClients(): BusinessClient[] {
    const todayKey = getTodayDateKey(SALON_TIMEZONE);

    return MOCK_CLIENTS.map((client, index) => {
        const seed = CLIENT_CREATED_AT_SEEDS[index] ?? {
            daysAgo: 365,
            time: '10:00',
        };

        return {
            ...client,
            createdAt: dateKeyAndTimeToIso(
                addDaysToDateKey(todayKey, -seed.daysAgo),
                seed.time,
                SALON_TIMEZONE
            ),
        };
    });
}

export const MOCK_CLIENTS: BusinessClient[] = [
    {
        id: 'client-1',
        name: 'Sofía Ramírez',
        phone: '+503 7012 4589',
        email: 'sofia.ramirez@example.com',
        notes: 'Prefiere productos sin sulfatos. Alergia leve a la keratina.',
        createdAt: '2025-02-14T16:00:00Z',
    },
    {
        id: 'client-2',
        name: 'Alejandro Torres',
        phone: '+503 7745 1120',
        email: 'alejandro.torres@example.com',
        notes: 'Cliente recurrente. Siempre reserva con Carlos.',
        createdAt: '2025-03-02T18:30:00Z',
    },
    {
        id: 'client-3',
        name: 'Gabriela Flores',
        phone: '+503 7890 6621',
        email: 'gabriela.flores@example.com',
        createdAt: '2025-04-18T21:10:00Z',
    },
    {
        id: 'client-4',
        name: 'Mauricio Argueta',
        phone: '+503 7123 9087',
        email: 'mauricio.argueta@example.com',
        notes: 'Paga con tarjeta. Le gusta el degradado bajo.',
        createdAt: '2025-05-09T15:45:00Z',
    },
    {
        id: 'client-5',
        name: 'Daniela Hernández',
        phone: '+503 7654 3321',
        email: 'daniela.hernandez@example.com',
        createdAt: '2025-06-21T19:20:00Z',
    },
    {
        id: 'client-6',
        name: 'Jorge Castillo',
        phone: '+503 7234 1189',
        email: 'jorge.castillo@example.com',
        notes: 'Tiene sensibilidad en el cuero cabelludo.',
        createdAt: '2025-07-30T17:05:00Z',
    },
    {
        id: 'client-7',
        name: 'Karla Méndez',
        phone: '+503 7789 4456',
        email: 'karla.mendez@example.com',
        createdAt: '2025-09-12T20:00:00Z',
    },
    {
        id: 'client-8',
        name: 'Luis Portillo',
        phone: '+503 7098 7712',
        email: 'luis.portillo@example.com',
        createdAt: '2025-10-04T14:30:00Z',
    },
    {
        id: 'client-9',
        name: 'Andrea Molina',
        phone: '+503 7356 8890',
        email: 'andrea.molina@example.com',
        notes: 'Primera visita agendada desde Instagram.',
        createdAt: '2025-11-10T16:15:00Z',
    },
    {
        id: 'client-10',
        name: 'Roberto Vega',
        phone: '+503 7467 2213',
        email: 'roberto.vega@example.com',
        createdAt: '2025-11-18T18:40:00Z',
    },
];

export const MOCK_BUSINESS_HOURS: BusinessHours = {
    slotIntervalMinutes: 30,
    days: [
        { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '19:00' },
        { dayOfWeek: 6, isOpen: true, openTime: '09:00', closeTime: '17:00' },
        { dayOfWeek: 0, isOpen: false, openTime: '10:00', closeTime: '14:00' },
    ],
};

export const MOCK_CANCELLATION_POLICY: CancellationPolicy = {
    freeCancellationHours: 24,
    lateCancellationFeePercent: 50,
    noShowFeePercent: 100,
    allowRescheduleHours: 12,
    notes:
        'Las cancelaciones con menos de 24 horas de anticipación generan un cargo del 50% del servicio. La inasistencia sin aviso se cobra al 100%.',
};

interface AppointmentSeed {
    offset: number;
    time: string;
    serviceId: string;
    staffId: string;
    clientId: string;
    status: AppointmentStatus;
    source?: AppointmentSource;
    notes?: string;
}

const APPOINTMENT_SEEDS: AppointmentSeed[] = [
    // Hoy
    { offset: 0, time: '09:00', serviceId: 'srv-1', staffId: 'staff-1', clientId: 'client-1', status: 'CONFIRMED' },
    { offset: 0, time: '09:30', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-2', status: 'CONFIRMED' },
    { offset: 0, time: '10:00', serviceId: 'srv-2', staffId: 'staff-3', clientId: 'client-3', status: 'CONFIRMED' },
    { offset: 0, time: '10:30', serviceId: 'srv-4', staffId: 'staff-2', clientId: 'client-4', status: 'CONFIRMED' },
    { offset: 0, time: '11:00', serviceId: 'srv-4', staffId: 'staff-1', clientId: 'client-5', status: 'CONFIRMED', source: 'MANUAL' },
    { offset: 0, time: '12:00', serviceId: 'srv-1', staffId: 'staff-3', clientId: 'client-6', status: 'CONFIRMED' },
    { offset: 0, time: '13:00', serviceId: 'srv-1', staffId: 'staff-3', clientId: 'client-7', status: 'CONFIRMED' },
    { offset: 0, time: '14:00', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-8', status: 'CONFIRMED' },
    { offset: 0, time: '15:30', serviceId: 'srv-2', staffId: 'staff-1', clientId: 'client-9', status: 'PENDING_PAYMENT' },
    { offset: 0, time: '16:00', serviceId: 'srv-1', staffId: 'staff-3', clientId: 'client-10', status: 'CONFIRMED' },
    { offset: 0, time: '17:00', serviceId: 'srv-4', staffId: 'staff-3', clientId: 'client-2', status: 'CONFIRMED' },

    // Ayer
    { offset: -1, time: '09:00', serviceId: 'srv-1', staffId: 'staff-1', clientId: 'client-1', status: 'COMPLETED' },
    { offset: -1, time: '10:00', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-2', status: 'COMPLETED' },
    { offset: -1, time: '11:30', serviceId: 'srv-2', staffId: 'staff-3', clientId: 'client-3', status: 'COMPLETED' },
    { offset: -1, time: '14:00', serviceId: 'srv-4', staffId: 'staff-2', clientId: 'client-4', status: 'NO_SHOW', notes: 'No se presentó ni respondió llamadas.' },
    { offset: -1, time: '16:00', serviceId: 'srv-1', staffId: 'staff-1', clientId: 'client-5', status: 'COMPLETED' },

    // Hace 2 días
    { offset: -2, time: '10:00', serviceId: 'srv-2', staffId: 'staff-1', clientId: 'client-6', status: 'COMPLETED' },
    { offset: -2, time: '12:00', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-7', status: 'COMPLETED' },
    { offset: -2, time: '15:00', serviceId: 'srv-1', staffId: 'staff-3', clientId: 'client-8', status: 'COMPLETED' },

    // Hace 3 días
    { offset: -3, time: '09:30', serviceId: 'srv-4', staffId: 'staff-3', clientId: 'client-9', status: 'COMPLETED' },
    { offset: -3, time: '11:00', serviceId: 'srv-1', staffId: 'staff-1', clientId: 'client-10', status: 'COMPLETED' },
    { offset: -3, time: '13:30', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-1', status: 'CANCELLED' },

    // Hace 4, 5 y 6 días
    { offset: -4, time: '10:30', serviceId: 'srv-1', staffId: 'staff-1', clientId: 'client-3', status: 'COMPLETED' },
    { offset: -4, time: '14:00', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-8', status: 'COMPLETED' },
    { offset: -5, time: '11:00', serviceId: 'srv-2', staffId: 'staff-3', clientId: 'client-6', status: 'COMPLETED' },
    { offset: -5, time: '16:00', serviceId: 'srv-4', staffId: 'staff-2', clientId: 'client-9', status: 'COMPLETED' },
    { offset: -6, time: '09:30', serviceId: 'srv-1', staffId: 'staff-1', clientId: 'client-5', status: 'COMPLETED' },
    { offset: -6, time: '15:00', serviceId: 'srv-2', staffId: 'staff-3', clientId: 'client-2', status: 'CANCELLED' },

    // Hace una semana
    { offset: -7, time: '10:00', serviceId: 'srv-1', staffId: 'staff-1', clientId: 'client-2', status: 'COMPLETED' },
    { offset: -7, time: '11:00', serviceId: 'srv-2', staffId: 'staff-3', clientId: 'client-4', status: 'COMPLETED' },
    { offset: -7, time: '14:00', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-5', status: 'COMPLETED' },

    // Mañana
    { offset: 1, time: '09:00', serviceId: 'srv-2', staffId: 'staff-1', clientId: 'client-3', status: 'CONFIRMED' },
    { offset: 1, time: '10:00', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-5', status: 'PENDING_PAYMENT' },
    { offset: 1, time: '11:30', serviceId: 'srv-1', staffId: 'staff-3', clientId: 'client-7', status: 'CONFIRMED' },
    { offset: 1, time: '15:00', serviceId: 'srv-4', staffId: 'staff-2', clientId: 'client-9', status: 'CONFIRMED' },
    { offset: 1, time: '16:30', serviceId: 'srv-1', staffId: 'staff-1', clientId: 'client-10', status: 'CONFIRMED' },

    // Próximos días
    { offset: 2, time: '09:30', serviceId: 'srv-4', staffId: 'staff-2', clientId: 'client-1', status: 'CONFIRMED' },
    { offset: 2, time: '11:00', serviceId: 'srv-1', staffId: 'staff-3', clientId: 'client-6', status: 'CONFIRMED' },
    { offset: 2, time: '14:30', serviceId: 'srv-2', staffId: 'staff-1', clientId: 'client-8', status: 'PENDING_PAYMENT' },
    { offset: 3, time: '10:30', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-4', status: 'CONFIRMED' },
    { offset: 3, time: '13:00', serviceId: 'srv-1', staffId: 'staff-3', clientId: 'client-7', status: 'CONFIRMED' },
    { offset: 3, time: '16:00', serviceId: 'srv-4', staffId: 'staff-1', clientId: 'client-9', status: 'CONFIRMED' },
    { offset: 4, time: '09:00', serviceId: 'srv-2', staffId: 'staff-1', clientId: 'client-2', status: 'CONFIRMED' },
    { offset: 4, time: '12:00', serviceId: 'srv-1', staffId: 'staff-3', clientId: 'client-5', status: 'CONFIRMED' },
    { offset: 4, time: '15:30', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-10', status: 'CONFIRMED' },
    { offset: 5, time: '10:00', serviceId: 'srv-4', staffId: 'staff-3', clientId: 'client-1', status: 'CONFIRMED' },
    { offset: 5, time: '11:30', serviceId: 'srv-1', staffId: 'staff-1', clientId: 'client-3', status: 'CONFIRMED' },
    { offset: 5, time: '14:00', serviceId: 'srv-2', staffId: 'staff-2', clientId: 'client-6', status: 'CONFIRMED' },
    { offset: 6, time: '09:30', serviceId: 'srv-1', staffId: 'staff-1', clientId: 'client-8', status: 'CONFIRMED' },
    { offset: 6, time: '11:00', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-9', status: 'CONFIRMED' },
    { offset: 7, time: '10:00', serviceId: 'srv-2', staffId: 'staff-3', clientId: 'client-10', status: 'CONFIRMED' },
    { offset: 7, time: '13:00', serviceId: 'srv-4', staffId: 'staff-2', clientId: 'client-2', status: 'CONFIRMED' },
    { offset: 7, time: '16:00', serviceId: 'srv-1', staffId: 'staff-1', clientId: 'client-4', status: 'CONFIRMED' },
    { offset: 8, time: '09:00', serviceId: 'srv-1', staffId: 'staff-3', clientId: 'client-5', status: 'CONFIRMED' },
    { offset: 8, time: '11:30', serviceId: 'srv-3', staffId: 'staff-2', clientId: 'client-7', status: 'CONFIRMED' },
    { offset: 8, time: '14:00', serviceId: 'srv-4', staffId: 'staff-1', clientId: 'client-8', status: 'CONFIRMED' },
    { offset: 9, time: '10:30', serviceId: 'srv-2', staffId: 'staff-1', clientId: 'client-1', status: 'CONFIRMED' },
    { offset: 9, time: '15:00', serviceId: 'srv-1', staffId: 'staff-3', clientId: 'client-3', status: 'CONFIRMED' },
];

function buildSeedAppointments(slug: string): Appointment[] {
    const todayKey = getTodayDateKey(SALON_TIMEZONE);
    const now = Date.now();

    const appointments = APPOINTMENT_SEEDS.map((seed, index) => {
        const service = MOCK_SALON.services.find((item) => item.id === seed.serviceId);
        const staff = MOCK_SALON.staff.find((item) => item.id === seed.staffId);
        const client = MOCK_CLIENTS.find((item) => item.id === seed.clientId);
        const dateKey = addDaysToDateKey(todayKey, seed.offset);
        const startTime = dateKeyAndTimeToIso(dateKey, seed.time, SALON_TIMEZONE);
        const durationMinutes = service?.durationMinutes ?? 45;
        const endTime = new Date(
            new Date(startTime).getTime() + durationMinutes * 60_000
        ).toISOString();

        let status = seed.status;
        // Las citas de hoy que ya pasaron se muestran como atendidas,
        // salvo que el seed indique explícitamente otra cosa.
        if (
            seed.offset === 0 &&
            status === 'CONFIRMED' &&
            new Date(startTime).getTime() < now
        ) {
            status = 'COMPLETED';
        }

        return {
            id: `appt-${String(index + 1).padStart(3, '0')}`,
            salonSlug: slug,
            clientId: seed.clientId,
            clientName: client?.name ?? 'Cliente',
            clientPhone: client?.phone ?? '',
            clientEmail: client?.email,
            serviceId: seed.serviceId,
            serviceName: service?.name ?? 'Servicio',
            staffId: seed.staffId,
            staffName: staff?.name ?? 'Especialista',
            startTime,
            endTime,
            status,
            price: service?.price ?? 0,
            source: seed.source ?? 'ONLINE',
            notes: seed.notes,
            createdAt: new Date(
                new Date(startTime).getTime() - 1000 * 60 * 60 * 24 * 3
            ).toISOString(),
        } satisfies Appointment;
    });

    return appointments.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
}

function buildSeedTimeBlocks(): TimeBlock[] {
    const todayKey = getTodayDateKey(SALON_TIMEZONE);

    return [
        {
            id: 'block-1',
            staffId: 'staff-2',
            startTime: dateKeyAndTimeToIso(
                addDaysToDateKey(todayKey, 0),
                '12:30',
                SALON_TIMEZONE
            ),
            endTime: dateKeyAndTimeToIso(
                addDaysToDateKey(todayKey, 0),
                '13:30',
                SALON_TIMEZONE
            ),
            reason: 'Almuerzo',
        },
        {
            id: 'block-2',
            staffId: 'staff-1',
            startTime: dateKeyAndTimeToIso(
                addDaysToDateKey(todayKey, 0),
                '13:00',
                SALON_TIMEZONE
            ),
            endTime: dateKeyAndTimeToIso(
                addDaysToDateKey(todayKey, 0),
                '14:00',
                SALON_TIMEZONE
            ),
            reason: 'Almuerzo',
        },
        {
            id: 'block-3',
            staffId: 'staff-1',
            startTime: dateKeyAndTimeToIso(
                addDaysToDateKey(todayKey, 1),
                '15:00',
                SALON_TIMEZONE
            ),
            endTime: dateKeyAndTimeToIso(
                addDaysToDateKey(todayKey, 1),
                '16:00',
                SALON_TIMEZONE
            ),
            reason: 'Cita médica',
        },
        {
            id: 'block-4',
            staffId: 'staff-3',
            startTime: dateKeyAndTimeToIso(
                addDaysToDateKey(todayKey, 4),
                '09:00',
                SALON_TIMEZONE
            ),
            endTime: dateKeyAndTimeToIso(
                addDaysToDateKey(todayKey, 4),
                '11:00',
                SALON_TIMEZONE
            ),
            reason: 'Formación interna',
        },
    ];
}

export function createBusinessSnapshot(slug: string): BusinessSnapshot {
    const salon = {
        ...MOCK_SALON,
        slug,
        staff: MOCK_SALON.staff.map((member) => ({ ...member })),
        services: MOCK_SALON.services.map((service) => ({ ...service })),
    };

    return {
        salon,
        appointments: buildSeedAppointments(slug),
        clients: buildSeedClients(),
        businessHours: {
            slotIntervalMinutes: MOCK_BUSINESS_HOURS.slotIntervalMinutes,
            days: MOCK_BUSINESS_HOURS.days.map((day) => ({ ...day })),
        },
        cancellationPolicy: { ...MOCK_CANCELLATION_POLICY },
        timeBlocks: buildSeedTimeBlocks(),
    };
}

export const SALON_TIME_ZONE = SALON_TIMEZONE;
export const SALON_DAY_START = 8 * 60; // 08:00 en el calendario
export const SALON_DAY_END = 20 * 60; // 20:00 en el calendario

/** Indica si el salón atiende ese día según el horario configurado. */
export function isSalonOpenOn(dateKey: string, hours: BusinessHours): boolean {
    const day = hours.days.find((item) => item.dayOfWeek === getDayOfWeek(dateKey));
    return Boolean(day?.isOpen);
}
