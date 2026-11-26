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
import { addMinutesToIso, rangesOverlap } from '@/lib/timezone';
import { createBusinessSnapshot } from './mocks/business.mock';

const db = new Map<string, BusinessSnapshot>();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function clone<T>(value: T): T {
    return typeof structuredClone === 'function'
        ? structuredClone(value)
        : (JSON.parse(JSON.stringify(value)) as T);
}

function makeId(prefix: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
    }
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getDb(slug: string): BusinessSnapshot {
    let snapshot = db.get(slug);
    if (!snapshot) {
        snapshot = createBusinessSnapshot(slug);
        db.set(slug, snapshot);
    }
    return snapshot;
}

function isActiveStatus(status: AppointmentStatus): boolean {
    return status === 'CONFIRMED' || status === 'PENDING_PAYMENT';
}

function assertNoAppointmentConflict(
    snapshot: BusinessSnapshot,
    params: {
        startTime: string;
        endTime: string;
        staffId: string;
        excludeAppointmentId?: string;
    }
) {
    const conflict = snapshot.appointments.find(
        (appointment) =>
            appointment.id !== params.excludeAppointmentId &&
            appointment.staffId === params.staffId &&
            isActiveStatus(appointment.status) &&
            rangesOverlap(
                params.startTime,
                params.endTime,
                appointment.startTime,
                appointment.endTime
            )
    );

    if (conflict) {
        throw new Error(
            `El especialista ya tiene una cita de ${conflict.clientName} en ese horario.`
        );
    }

    const block = snapshot.timeBlocks.find(
        (item) =>
            (item.staffId === params.staffId || item.staffId === 'ALL') &&
            rangesOverlap(
                params.startTime,
                params.endTime,
                item.startTime,
                item.endTime
            )
    );

    if (block) {
        throw new Error(`Ese horario está bloqueado: ${block.reason}.`);
    }
}

function findService(snapshot: BusinessSnapshot, serviceId: string): ServiceItem {
    const service = snapshot.salon.services.find((item) => item.id === serviceId);
    if (!service) throw new Error('El servicio seleccionado ya no existe.');
    return service;
}

function findStaff(snapshot: BusinessSnapshot, staffId: string): StaffMember {
    const staff = snapshot.salon.staff.find((item) => item.id === staffId);
    if (!staff) throw new Error('El especialista seleccionado ya no existe.');
    return staff;
}

export const businessService = {
    async getBusinessSnapshot(slug: string): Promise<BusinessSnapshot> {
        await sleep(220);
        return clone(getDb(slug));
    },

    async createManualAppointment(
        slug: string,
        payload: CreateManualAppointmentPayload
    ): Promise<Appointment> {
        await sleep(250);
        const snapshot = getDb(slug);
        const service = findService(snapshot, payload.serviceId);
        const staff = findStaff(snapshot, payload.staffId);
        const startTime = payload.startTime;
        const endTime = addMinutesToIso(startTime, service.durationMinutes);

        assertNoAppointmentConflict(snapshot, {
            startTime,
            endTime,
            staffId: staff.id,
        });

        let client: BusinessClient | undefined;

        if (payload.clientId) {
            client = snapshot.clients.find((item) => item.id === payload.clientId);
            if (!client) throw new Error('El cliente seleccionado ya no existe.');
        } else {
            const name = payload.clientName?.trim();
            const phone = payload.clientPhone?.trim();
            if (!name || !phone) {
                throw new Error('Ingresa el nombre y teléfono del cliente.');
            }

            client = snapshot.clients.find((item) => item.phone === phone);

            if (!client) {
                client = {
                    id: makeId('client'),
                    name,
                    phone,
                    email: payload.clientEmail?.trim() || undefined,
                    createdAt: new Date().toISOString(),
                };
                snapshot.clients.push(client);
            }
        }

        if (!client) {
            throw new Error('No pudimos identificar al cliente de la cita.');
        }

        const appointment: Appointment = {
            id: makeId('appt'),
            salonSlug: slug,
            clientId: client.id,
            clientName: client.name,
            clientPhone: client.phone,
            clientEmail: client.email,
            serviceId: service.id,
            serviceName: service.name,
            staffId: staff.id,
            staffName: staff.name,
            startTime,
            endTime,
            status: 'CONFIRMED',
            price: service.price,
            source: 'MANUAL',
            notes: payload.notes?.trim() || undefined,
            createdAt: new Date().toISOString(),
        };

        snapshot.appointments.push(appointment);
        snapshot.appointments.sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

        return clone(appointment);
    },

    async rescheduleAppointment(
        slug: string,
        appointmentId: string,
        payload: RescheduleAppointmentPayload
    ): Promise<Appointment> {
        await sleep(180);
        const snapshot = getDb(slug);
        const appointment = snapshot.appointments.find(
            (item) => item.id === appointmentId
        );
        if (!appointment) throw new Error('La cita ya no existe.');

        const service = snapshot.salon.services.find(
            (item) => item.id === appointment.serviceId
        );
        const durationMinutes = service?.durationMinutes ?? 45;
        const staffId = payload.staffId ?? appointment.staffId;
        const staff = findStaff(snapshot, staffId);
        const startTime = payload.startTime;
        const endTime = addMinutesToIso(startTime, durationMinutes);

        assertNoAppointmentConflict(snapshot, {
            startTime,
            endTime,
            staffId,
            excludeAppointmentId: appointment.id,
        });

        appointment.startTime = startTime;
        appointment.endTime = endTime;
        appointment.staffId = staff.id;
        appointment.staffName = staff.name;

        return clone(appointment);
    },

    async updateAppointmentStatus(
        slug: string,
        appointmentId: string,
        status: AppointmentStatus
    ): Promise<Appointment> {
        await sleep(120);
        const snapshot = getDb(slug);
        const appointment = snapshot.appointments.find(
            (item) => item.id === appointmentId
        );
        if (!appointment) throw new Error('La cita ya no existe.');

        appointment.status = status;
        return clone(appointment);
    },

    async deleteAppointment(slug: string, appointmentId: string): Promise<void> {
        await sleep(120);
        const snapshot = getDb(slug);
        snapshot.appointments = snapshot.appointments.filter(
            (item) => item.id !== appointmentId
        );
    },

    async createTimeBlock(
        slug: string,
        payload: { staffId: string | 'ALL'; startTime: string; endTime: string; reason: string }
    ): Promise<TimeBlock> {
        await sleep(180);
        const snapshot = getDb(slug);
        if (new Date(payload.endTime).getTime() <= new Date(payload.startTime).getTime()) {
            throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
        }

        const conflictingAppointment = snapshot.appointments.find(
            (appointment) =>
                isActiveStatus(appointment.status) &&
                (payload.staffId === 'ALL' || appointment.staffId === payload.staffId) &&
                rangesOverlap(
                    payload.startTime,
                    payload.endTime,
                    appointment.startTime,
                    appointment.endTime
                )
        );

        if (conflictingAppointment) {
            throw new Error(
                `Hay una cita activa en ese rango (${conflictingAppointment.clientName}). Reprograma o cancela primero.`
            );
        }

        const block: TimeBlock = {
            id: makeId('block'),
            staffId: payload.staffId,
            startTime: payload.startTime,
            endTime: payload.endTime,
            reason: payload.reason.trim() || 'Horario bloqueado',
        };

        snapshot.timeBlocks.push(block);
        return clone(block);
    },

    async deleteTimeBlock(slug: string, blockId: string): Promise<void> {
        await sleep(120);
        const snapshot = getDb(slug);
        snapshot.timeBlocks = snapshot.timeBlocks.filter(
            (item) => item.id !== blockId
        );
    },

    async createService(
        slug: string,
        input: Omit<ServiceItem, 'id'>
    ): Promise<ServiceItem> {
        await sleep(180);
        const snapshot = getDb(slug);
        const service: ServiceItem = { ...input, id: makeId('srv') };
        snapshot.salon.services.push(service);
        return clone(service);
    },

    async updateService(
        slug: string,
        serviceId: string,
        input: Partial<Omit<ServiceItem, 'id'>>
    ): Promise<ServiceItem> {
        await sleep(180);
        const snapshot = getDb(slug);
        const service = snapshot.salon.services.find((item) => item.id === serviceId);
        if (!service) throw new Error('El servicio ya no existe.');

        Object.assign(service, input);
        snapshot.appointments.forEach((appointment) => {
            if (appointment.serviceId === serviceId) {
                appointment.serviceName = service.name;
                appointment.price = service.price;
            }
        });

        return clone(service);
    },

    async deleteService(slug: string, serviceId: string): Promise<void> {
        await sleep(180);
        const snapshot = getDb(slug);
        const hasUpcoming = snapshot.appointments.some(
            (appointment) =>
                appointment.serviceId === serviceId &&
                isActiveStatus(appointment.status) &&
                new Date(appointment.startTime).getTime() > Date.now()
        );
        if (hasUpcoming) {
            throw new Error(
                'No puedes eliminar un servicio con citas futuras activas. Cancélalas o espera a que pasen.'
            );
        }

        snapshot.salon.services = snapshot.salon.services.filter(
            (item) => item.id !== serviceId
        );
    },

    async createStaffMember(
        slug: string,
        input: Omit<StaffMember, 'id'>
    ): Promise<StaffMember> {
        await sleep(180);
        const snapshot = getDb(slug);
        const member: StaffMember = {
            ...input,
            id: makeId('staff'),
            isActive: input.isActive ?? true,
        };
        snapshot.salon.staff.push(member);
        return clone(member);
    },

    async updateStaffMember(
        slug: string,
        staffId: string,
        input: Partial<Omit<StaffMember, 'id'>>
    ): Promise<StaffMember> {
        await sleep(180);
        const snapshot = getDb(slug);
        const member = snapshot.salon.staff.find((item) => item.id === staffId);
        if (!member) throw new Error('El especialista ya no existe.');

        Object.assign(member, input);
        snapshot.appointments.forEach((appointment) => {
            if (appointment.staffId === staffId) {
                appointment.staffName = member.name;
            }
        });

        return clone(member);
    },

    async deleteStaffMember(slug: string, staffId: string): Promise<void> {
        await sleep(180);
        const snapshot = getDb(slug);
        const hasUpcoming = snapshot.appointments.some(
            (appointment) =>
                appointment.staffId === staffId &&
                isActiveStatus(appointment.status) &&
                new Date(appointment.startTime).getTime() > Date.now()
        );
        if (hasUpcoming) {
            throw new Error(
                'No puedes eliminar a un especialista con citas futuras activas. Reasígnalas o desactívalo.'
            );
        }

        snapshot.salon.staff = snapshot.salon.staff.filter(
            (item) => item.id !== staffId
        );
        snapshot.salon.services.forEach((service) => {
            service.staffIds = service.staffIds.filter((id) => id !== staffId);
        });
        snapshot.timeBlocks = snapshot.timeBlocks.filter(
            (item) => item.staffId !== staffId
        );
    },

    async createClient(
        slug: string,
        input: Omit<BusinessClient, 'id' | 'createdAt'>
    ): Promise<BusinessClient> {
        await sleep(160);
        const snapshot = getDb(slug);
        if (snapshot.clients.some((item) => item.phone === input.phone)) {
            throw new Error('Ya existe un cliente registrado con ese teléfono.');
        }

        const client: BusinessClient = {
            ...input,
            id: makeId('client'),
            createdAt: new Date().toISOString(),
        };
        snapshot.clients.push(client);
        return clone(client);
    },

    async updateClient(
        slug: string,
        clientId: string,
        input: Partial<Omit<BusinessClient, 'id' | 'createdAt'>>
    ): Promise<BusinessClient> {
        await sleep(160);
        const snapshot = getDb(slug);
        const client = snapshot.clients.find((item) => item.id === clientId);
        if (!client) throw new Error('El cliente ya no existe.');

        Object.assign(client, input);
        snapshot.appointments.forEach((appointment) => {
            if (appointment.clientId === clientId) {
                appointment.clientName = client.name;
                appointment.clientPhone = client.phone;
                appointment.clientEmail = client.email;
            }
        });

        return clone(client);
    },

    async deleteClient(slug: string, clientId: string): Promise<void> {
        await sleep(160);
        const snapshot = getDb(slug);
        const hasUpcoming = snapshot.appointments.some(
            (appointment) =>
                appointment.clientId === clientId &&
                isActiveStatus(appointment.status) &&
                new Date(appointment.startTime).getTime() > Date.now()
        );
        if (hasUpcoming) {
            throw new Error(
                'No puedes eliminar un cliente con citas futuras activas. Cancélalas primero.'
            );
        }

        snapshot.clients = snapshot.clients.filter((item) => item.id !== clientId);
    },

    async updateBusinessHours(
        slug: string,
        hours: BusinessHours
    ): Promise<BusinessHours> {
        await sleep(180);
        const snapshot = getDb(slug);
        snapshot.businessHours = clone(hours);
        return clone(snapshot.businessHours);
    },

    async updateCancellationPolicy(
        slug: string,
        policy: CancellationPolicy
    ): Promise<CancellationPolicy> {
        await sleep(180);
        const snapshot = getDb(slug);
        snapshot.cancellationPolicy = clone(policy);
        return clone(snapshot.cancellationPolicy);
    },

    async updateSalonProfile(
        slug: string,
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
    ): Promise<SalonProfile> {
        await sleep(180);
        const snapshot = getDb(slug);
        Object.assign(snapshot.salon, input);
        return clone(snapshot.salon);
    },
};
