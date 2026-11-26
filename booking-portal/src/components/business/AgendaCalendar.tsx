'use client';

import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { Ban, X } from 'lucide-react';
import {
    APPOINTMENT_STATUS_META,
    StaffAvatar,
} from '@/components/business/shared';
import {
    formatDateKey,
    formatSalonDateTime,
    getDayOfWeek,
    getSalonDateKey,
    getSalonMinutes,
    getTodayDateKey,
    getWeekDateKeys,
    minutesToTimeLabel,
} from '@/lib/timezone';
import { cn } from '@/lib/utils';
import {
    Appointment,
    BusinessHours,
    StaffMember,
    TimeBlock,
} from '@/types/booking.contracts';

const CALENDAR_START_MINUTES = 8 * 60;
const CALENDAR_END_MINUTES = 20 * 60;
const PIXELS_PER_MINUTE = 1.2;
const SLOT_MINUTES = 30;
const SLOT_PIXELS = SLOT_MINUTES * PIXELS_PER_MINUTE;
const CALENDAR_HEIGHT =
    (CALENDAR_END_MINUTES - CALENDAR_START_MINUTES) * PIXELS_PER_MINUTE;

interface AgendaCalendarProps {
    view: 'day' | 'week';
    date: string;
    staffFilter: string | 'ALL';
    appointments: Appointment[];
    staff: StaffMember[];
    timeBlocks: TimeBlock[];
    businessHours: BusinessHours;
    timezone: string;
    onSelectAppointment: (appointment: Appointment) => void;
    onSlotClick: (dateKey: string, time: string, staffId?: string) => void;
    onReschedule: (
        appointmentId: string,
        dateKey: string,
        time: string,
        staffId?: string
    ) => Promise<void>;
    onDeleteBlock: (blockId: string) => Promise<void>;
}

interface CalendarColumn {
    key: string;
    dateKey: string;
    staff?: StaffMember;
}

function getGeometry(startTime: string, endTime: string, timezone: string) {
    const startMinutes = getSalonMinutes(startTime, timezone);
    const endMinutes = getSalonMinutes(endTime, timezone);
    const top = Math.max(
        0,
        (startMinutes - CALENDAR_START_MINUTES) * PIXELS_PER_MINUTE
    );
    const bottom = Math.min(
        CALENDAR_HEIGHT,
        (endMinutes - CALENDAR_START_MINUTES) * PIXELS_PER_MINUTE
    );
    const height = Math.max(28, bottom - top);
    return { top, height };
}

export function AgendaCalendar({
    view,
    date,
    staffFilter,
    appointments,
    staff,
    timeBlocks,
    businessHours,
    timezone,
    onSelectAppointment,
    onSlotClick,
    onReschedule,
    onDeleteBlock,
}: AgendaCalendarProps) {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverKey, setDragOverKey] = useState<string | null>(null);
    const [nowMinutes, setNowMinutes] = useState<number | null>(null);

    useEffect(() => {
        const updateNow = () =>
            setNowMinutes(getSalonMinutes(new Date().toISOString(), timezone));
        updateNow();
        const interval = window.setInterval(updateNow, 60_000);
        return () => window.clearInterval(interval);
    }, [timezone]);

    const todayKey = useMemo(() => getTodayDateKey(timezone), [timezone]);
    const weekDates = useMemo(() => getWeekDateKeys(date, 1), [date]);
    const activeStaff = useMemo(
        () => staff.filter((member) => member.isActive !== false),
        [staff]
    );

    const columns = useMemo<CalendarColumn[]>(() => {
        if (view === 'week') {
            return weekDates.map((dateKey) => ({
                key: dateKey,
                dateKey,
            }));
        }

        const selected =
            staffFilter === 'ALL'
                ? activeStaff
                : activeStaff.filter((member) => member.id === staffFilter);

        if (selected.length === 0) {
            return [{ key: 'empty', dateKey: date }];
        }

        return selected.map((member) => ({
            key: member.id,
            dateKey: date,
            staff: member,
        }));
    }, [view, weekDates, date, staffFilter, activeStaff]);

    const visibleAppointments = useMemo(
        () =>
            appointments.filter(
                (appointment) =>
                    (staffFilter === 'ALL' || appointment.staffId === staffFilter) &&
                    ['CONFIRMED', 'PENDING_PAYMENT', 'COMPLETED', 'NO_SHOW', 'CANCELLED'].includes(
                        appointment.status
                    )
            ),
        [appointments, staffFilter]
    );

    const visibleBlocks = useMemo(
        () =>
            timeBlocks.filter(
                (block) =>
                    block.staffId === 'ALL' ||
                    staffFilter === 'ALL' ||
                    block.staffId === staffFilter
            ),
        [timeBlocks, staffFilter]
    );

    const handleDrop = async (
        event: DragEvent,
        column: CalendarColumn,
        minutes: number
    ) => {
        event.preventDefault();
        const appointmentId =
            event.dataTransfer.getData('text/x-appointment-id') ||
            event.dataTransfer.getData('text/plain');
        setDragOverKey(null);
        setDraggingId(null);

        if (!appointmentId) return;
        const appointment = appointments.find((item) => item.id === appointmentId);
        if (!appointment) return;

        await onReschedule(
            appointmentId,
            column.dateKey,
            minutesToTimeLabel(minutes),
            column.staff?.id
        );
    };

    const gridTemplate = `64px repeat(${columns.length}, minmax(${
        view === 'week' ? '150px' : '190px'
    }, 1fr))`;

    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
                <div className="min-w-[720px]">
                    <div
                        className="grid border-b bg-muted/40"
                        style={{ gridTemplateColumns: gridTemplate }}
                    >
                        <div className="px-2 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Hora
                        </div>
                        {columns.map((column) => {
                            const isToday = column.dateKey === todayKey;
                            const isOpen = Boolean(
                                businessHours.days.find(
                                    (day) =>
                                        day.dayOfWeek === getDayOfWeek(column.dateKey)
                                )?.isOpen
                            );
                            const dayAppointments = visibleAppointments.filter(
                                (appointment) =>
                                    getSalonDateKey(appointment.startTime, timezone) ===
                                    column.dateKey
                            );

                            if (column.staff) {
                                return (
                                    <div
                                        key={column.key}
                                        className="flex items-center gap-2 border-l px-3 py-2.5"
                                    >
                                        <StaffAvatar staff={column.staff} size="sm" />
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold">
                                                {column.staff.name}
                                            </p>
                                            <p className="truncate text-[10px] text-muted-foreground">
                                                {column.staff.role}
                                            </p>
                                        </div>
                                        <span className="ml-auto rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border">
                                            {dayAppointments.length}
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={column.key}
                                    className={cn(
                                        'flex flex-col items-center gap-0.5 border-l px-2 py-2 text-center',
                                        isToday && 'bg-rose-50/70 dark:bg-rose-500/5'
                                    )}
                                >
                                    <span className="text-[10px] font-medium uppercase text-muted-foreground">
                                        {formatDateKey(
                                            column.dateKey,
                                            timezone,
                                            'EEE'
                                        ).replace('.', '')}
                                    </span>
                                    <span
                                        className={cn(
                                            'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm font-semibold',
                                            isToday && 'bg-rose-500 text-white'
                                        )}
                                    >
                                        {formatDateKey(column.dateKey, timezone, 'd')}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {isOpen
                                            ? `${dayAppointments.length} citas`
                                            : 'Cerrado'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div
                        className="grid"
                        style={{ gridTemplateColumns: gridTemplate }}
                    >
                        <div
                            className="relative bg-muted/20"
                            style={{ height: CALENDAR_HEIGHT }}
                        >
                            {Array.from({
                                length:
                                    (CALENDAR_END_MINUTES - CALENDAR_START_MINUTES) /
                                    60,
                            }).map((_, index) => {
                                const minutes =
                                    CALENDAR_START_MINUTES + index * 60;
                                return (
                                    <div
                                        key={minutes}
                                        className="absolute inset-x-0 -translate-y-1/2 pr-2 text-right text-[10px] font-medium text-muted-foreground"
                                        style={{
                                            top: Math.max(
                                                0,
                                                index * 60 * PIXELS_PER_MINUTE
                                            ),
                                        }}
                                    >
                                        {minutesToTimeLabel(minutes)}
                                    </div>
                                );
                            })}
                        </div>

                        {columns.map((column) => {
                            const columnDate = column.dateKey;
                            const columnAppointments = visibleAppointments.filter(
                                (appointment) =>
                                    getSalonDateKey(
                                        appointment.startTime,
                                        timezone
                                    ) === columnDate &&
                                    (!column.staff ||
                                        appointment.staffId === column.staff.id)
                            );
                            const columnBlocks = visibleBlocks.filter(
                                (block) =>
                                    getSalonDateKey(
                                        block.startTime,
                                        timezone
                                    ) === columnDate &&
                                    (!column.staff ||
                                        block.staffId === 'ALL' ||
                                        block.staffId === column.staff.id)
                            );
                            const isToday = columnDate === todayKey;
                            const showCurrentTime =
                                isToday &&
                                nowMinutes !== null &&
                                nowMinutes >= CALENDAR_START_MINUTES &&
                                nowMinutes <= CALENDAR_END_MINUTES;

                            return (
                                <div
                                    key={column.key}
                                    className={cn(
                                        'relative border-l',
                                        isToday && 'bg-rose-50/20 dark:bg-rose-500/[0.02]'
                                    )}
                                    style={{ height: CALENDAR_HEIGHT }}
                                >
                                    {Array.from({
                                        length:
                                            (CALENDAR_END_MINUTES -
                                                CALENDAR_START_MINUTES) /
                                            SLOT_MINUTES,
                                    }).map((_, index) => {
                                        const minutes =
                                            CALENDAR_START_MINUTES +
                                            index * SLOT_MINUTES;
                                        const slotKey = `${column.key}-${minutes}`;
                                        const isDragOver = dragOverKey === slotKey;

                                        return (
                                            <div
                                                key={slotKey}
                                                role="button"
                                                tabIndex={-1}
                                                aria-label={`Crear cita el ${columnDate} a las ${minutesToTimeLabel(
                                                    minutes
                                                )}`}
                                                className={cn(
                                                    'absolute inset-x-0 border-b border-dashed border-border/60 transition-colors',
                                                    isDragOver
                                                        ? 'bg-rose-100/80 dark:bg-rose-500/10'
                                                        : 'hover:bg-muted/50'
                                                )}
                                                style={{
                                                    top: index * SLOT_PIXELS,
                                                    height: SLOT_PIXELS,
                                                }}
                                                onClick={() =>
                                                    onSlotClick(
                                                        columnDate,
                                                        minutesToTimeLabel(minutes),
                                                        column.staff?.id
                                                    )
                                                }
                                                onDragOver={(event) => {
                                                    event.preventDefault();
                                                    event.dataTransfer.dropEffect = 'move';
                                                    if (dragOverKey !== slotKey) {
                                                        setDragOverKey(slotKey);
                                                    }
                                                }}
                                                onDragLeave={() =>
                                                    setDragOverKey((current) =>
                                                        current === slotKey ? null : current
                                                    )
                                                }
                                                onDrop={(event) =>
                                                    handleDrop(event, column, minutes)
                                                }
                                            />
                                        );
                                    })}

                                    {columnBlocks.map((block) => {
                                        const geometry = getGeometry(
                                            block.startTime,
                                            block.endTime,
                                            timezone
                                        );
                                        const blockStaff = staff.find(
                                            (member) => member.id === block.staffId
                                        );

                                        return (
                                            <div
                                                key={block.id}
                                                className="absolute inset-x-1 z-[5] overflow-hidden rounded-md border border-dashed border-zinc-300 px-1.5 py-0.5 dark:border-zinc-600"
                                                style={{
                                                    top: geometry.top,
                                                    height: geometry.height,
                                                    backgroundImage:
                                                        'repeating-linear-gradient(45deg, rgba(0,0,0,0.035), rgba(0,0,0,0.035) 6px, transparent 6px, transparent 12px)',
                                                }}
                                                title={`${block.reason}${
                                                    blockStaff
                                                        ? ` · ${blockStaff.name}`
                                                        : ' · Todo el salón'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-1">
                                                    <span className="truncate text-[10px] font-medium text-zinc-500">
                                                        {block.reason}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-white hover:text-zinc-700"
                                                        onClick={async (event) => {
                                                            event.stopPropagation();
                                                            if (
                                                                window.confirm(
                                                                    `¿Quitar el bloqueo "${block.reason}"?`
                                                                )
                                                            ) {
                                                                await onDeleteBlock(block.id);
                                                            }
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                        <span className="sr-only">
                                                            Quitar bloqueo
                                                        </span>
                                                    </button>
                                                </div>
                                                {geometry.height > 40 && (
                                                    <p className="mt-0.5 flex items-center gap-1 text-[9px] text-zinc-400">
                                                        <Ban className="h-2.5 w-2.5" />
                                                        Bloqueado
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {columnAppointments.map((appointment) => {
                                        const geometry = getGeometry(
                                            appointment.startTime,
                                            appointment.endTime,
                                            timezone
                                        );
                                        const member = staff.find(
                                            (item) => item.id === appointment.staffId
                                        );
                                        const color = member?.color ?? '#52525b';
                                        const isCancelled =
                                            appointment.status === 'CANCELLED';
                                        const isNoShow =
                                            appointment.status === 'NO_SHOW';

                                        return (
                                            <button
                                                key={appointment.id}
                                                type="button"
                                                draggable={!isCancelled}
                                                onDragStart={(event) => {
                                                    event.dataTransfer.setData(
                                                        'text/x-appointment-id',
                                                        appointment.id
                                                    );
                                                    event.dataTransfer.setData(
                                                        'text/plain',
                                                        appointment.id
                                                    );
                                                    event.dataTransfer.effectAllowed = 'move';
                                                    setDraggingId(appointment.id);
                                                }}
                                                onDragEnd={() => {
                                                    setDraggingId(null);
                                                    setDragOverKey(null);
                                                }}
                                                onClick={() =>
                                                    onSelectAppointment(appointment)
                                                }
                                                title={`${appointment.clientName} · ${
                                                    appointment.serviceName
                                                } · ${formatSalonDateTime(
                                                    appointment.startTime,
                                                    timezone,
                                                    'h:mm a'
                                                )}`}
                                                className={cn(
                                                    'absolute inset-x-1 z-10 overflow-hidden rounded-md border border-l-[3px] px-1.5 py-1 text-left shadow-sm transition-shadow hover:shadow-md',
                                                    draggingId === appointment.id &&
                                                        'opacity-50',
                                                    isCancelled &&
                                                        'opacity-50 grayscale',
                                                    isNoShow && 'border-dashed'
                                                )}
                                                style={{
                                                    top: geometry.top,
                                                    height: geometry.height,
                                                    borderLeftColor: color,
                                                    backgroundColor: `${color}14`,
                                                }}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span
                                                        className={cn(
                                                            'h-1.5 w-1.5 shrink-0 rounded-full',
                                                            APPOINTMENT_STATUS_META[
                                                                appointment.status
                                                            ].dot
                                                        )}
                                                    />
                                                    <p
                                                        className={cn(
                                                            'truncate text-[11px] font-semibold leading-tight',
                                                            isCancelled &&
                                                                'line-through'
                                                        )}
                                                    >
                                                        {appointment.clientName}
                                                    </p>
                                                    <span className="ml-auto text-[9px] font-medium text-muted-foreground">
                                                        {formatSalonDateTime(
                                                            appointment.startTime,
                                                            timezone,
                                                            'HH:mm'
                                                        )}
                                                    </span>
                                                </div>
                                                {geometry.height > 38 && (
                                                    <p className="truncate text-[10px] leading-tight text-muted-foreground">
                                                        {appointment.serviceName}
                                                    </p>
                                                )}
                                                {geometry.height > 60 && !column.staff && (
                                                    <p className="truncate text-[9px] leading-tight text-muted-foreground/80">
                                                        {appointment.staffName}
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    })}

                                    {showCurrentTime && nowMinutes !== null && (
                                        <div
                                            className="pointer-events-none absolute inset-x-0 z-20"
                                            style={{
                                                top:
                                                    (nowMinutes -
                                                        CALENDAR_START_MINUTES) *
                                                    PIXELS_PER_MINUTE,
                                            }}
                                        >
                                            <div className="relative border-t border-rose-500">
                                                <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-rose-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
