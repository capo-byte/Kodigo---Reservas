import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

export function getBrowserTimeZone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
}

export function isForeignTimeZone(salonTimeZone: string): boolean {
    const browserTz = getBrowserTimeZone();
    return browserTz !== salonTimeZone;
}

/**
 * Formatea un timestamp ISO UTC (ej. "2026-11-25T15:00:00Z") en la zona horaria indicada.
 */
export function formatSlotTime(isoUtc: string, timeZone: string): string {
    return formatInTimeZone(isoUtc, timeZone, 'h:mm a', { locale: es });
}

/**
 * Devuelve la etiqueta corta del offset o zona (ej. "CST" o "America/El_Salvador").
 */
export function getTimeZoneShortLabel(isoUtc: string, timeZone: string): string {
    const shortOffset = formatInTimeZone(isoUtc, timeZone, 'xxx', { locale: es });
    return `${timeZone.split('/').pop()?.replace('_', ' ') ?? timeZone} (${shortOffset})`;
}

/**
 * Genera los próximos N días en formato YYYY-MM-DD evaluados en la zona del salón.
 */
export function getUpcomingDatesInSalonTz(salonTimeZone: string, daysCount = 14): string[] {
    const nowInSalon = toZonedTime(new Date(), salonTimeZone);
    const dates: string[] = [];

    for (let i = 0; i < daysCount; i++) {
        const target = new Date(nowInSalon);
        target.setDate(nowInSalon.getDate() + i);
        const yyyy = target.getFullYear();
        const mm = String(target.getMonth() + 1).padStart(2, '0');
        const dd = String(target.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
    }

    return dates;
}

/**
 * Formatea un string "YYYY-MM-DD" para mostrar día de semana y día del mes en español.
 */
export function formatDatePill(dateStr: string, salonTimeZone: string): {
    weekday: string;
    dayNumber: string;
    monthShort: string;
    fullLabel: string;
} {
    // Anclamos al mediodía UTC para evitar desplazamientos de día al formatear en cualquier zona
    const anchorIso = `${dateStr}T12:00:00Z`;
    const weekday = formatInTimeZone(anchorIso, salonTimeZone, 'EEE', { locale: es }).replace('.', '');
    const dayNumber = formatInTimeZone(anchorIso, salonTimeZone, 'd', { locale: es });
    const monthShort = formatInTimeZone(anchorIso, salonTimeZone, 'MMM', { locale: es }).replace('.', '');
    const fullLabel = formatInTimeZone(anchorIso, salonTimeZone, "EEEE d 'de' MMMM", { locale: es });

    return { weekday, dayNumber, monthShort, fullLabel };
}

/* -------------------------------------------------------------------------- */
/*                   Utilidades para el panel de negocio                       */
/* -------------------------------------------------------------------------- */

/** Devuelve la fecha (YYYY-MM-DD) de un instante ISO en la zona horaria del salón. */
export function getSalonDateKey(isoUtc: string, salonTimeZone: string): string {
    return formatInTimeZone(isoUtc, salonTimeZone, 'yyyy-MM-dd');
}

/** Devuelve los minutos desde medianoche de un instante ISO en la zona del salón. */
export function getSalonMinutes(isoUtc: string, salonTimeZone: string): number {
    const hours = Number(formatInTimeZone(isoUtc, salonTimeZone, 'HH'));
    const minutes = Number(formatInTimeZone(isoUtc, salonTimeZone, 'mm'));
    return hours * 60 + minutes;
}

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria del salón. */
export function getTodayDateKey(salonTimeZone: string): string {
    return formatInTimeZone(new Date(), salonTimeZone, 'yyyy-MM-dd');
}

/** Suma días a una fecha YYYY-MM-DD sin verse afectado por zonas horarias. */
export function addDaysToDateKey(dateKey: string, days: number): string {
    const [year, month, day] = dateKey.split('-').map(Number);
    const anchor = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
    const yyyy = anchor.getUTCFullYear();
    const mm = String(anchor.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(anchor.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/** Día de la semana de una fecha YYYY-MM-DD (0 = domingo). */
export function getDayOfWeek(dateKey: string): number {
    return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

/** Semana (lunes por defecto) que contiene la fecha indicada. */
export function getWeekDateKeys(dateKey: string, weekStartsOn: 0 | 1 = 1): string[] {
    const day = getDayOfWeek(dateKey);
    const diff = (day - weekStartsOn + 7) % 7;
    const start = addDaysToDateKey(dateKey, -diff);
    return Array.from({ length: 7 }, (_, index) => addDaysToDateKey(start, index));
}

/** Convierte una fecha y hora local del salón a un instante ISO UTC. */
export function dateKeyAndTimeToIso(
    dateKey: string,
    time: string,
    salonTimeZone: string
): string {
    return fromZonedTime(`${dateKey}T${time}:00`, salonTimeZone).toISOString();
}

/** Formatea una fecha YYYY-MM-DD usando la zona horaria del salón. */
export function formatDateKey(
    dateKey: string,
    salonTimeZone: string,
    pattern: string
): string {
    return formatInTimeZone(`${dateKey}T12:00:00Z`, salonTimeZone, pattern, { locale: es });
}

/** Formatea un instante ISO con un patrón date-fns en la zona del salón. */
export function formatSalonDateTime(
    isoUtc: string,
    salonTimeZone: string,
    pattern: string
): string {
    return formatInTimeZone(isoUtc, salonTimeZone, pattern, { locale: es });
}

/** Hora en formato HH:mm para inputs de tipo time. */
export function getSalonTimeInputValue(isoUtc: string, salonTimeZone: string): string {
    return formatInTimeZone(isoUtc, salonTimeZone, 'HH:mm');
}

/** Suma minutos a un instante ISO y devuelve otro ISO. */
export function addMinutesToIso(isoUtc: string, minutes: number): string {
    return new Date(new Date(isoUtc).getTime() + minutes * 60_000).toISOString();
}

/** Convierte minutos desde medianoche a etiqueta HH:mm. */
export function minutesToTimeLabel(minutes: number): string {
    const safe = Math.max(0, Math.min(minutes, 24 * 60 - 1));
    const hours = Math.floor(safe / 60);
    const mins = safe % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/** Convierte una etiqueta HH:mm a minutos desde medianoche. */
export function timeLabelToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/** Indica si dos rangos de tiempo se solapan. */
export function rangesOverlap(
    aStart: string,
    aEnd: string,
    bStart: string,
    bEnd: string
): boolean {
    return (
        new Date(aStart).getTime() < new Date(bEnd).getTime() &&
        new Date(bStart).getTime() < new Date(aEnd).getTime()
    );
}

/** Formato de moneda consistente en todo el panel. */
export function formatCurrency(
    amount: number,
    currency: string,
    locale = 'es-SV'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
}
