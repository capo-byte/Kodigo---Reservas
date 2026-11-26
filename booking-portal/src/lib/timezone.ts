import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
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
