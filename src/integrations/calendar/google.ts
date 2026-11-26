import type { CalendarConnection, CalendarConnector, CalendarEvent } from './types.js';

/** Esqueleto: OAuth, almacenamiento de credenciales y sincronización están pendientes. */
export class GoogleCalendarConnector implements CalendarConnector {
  async listBusy(_connection: CalendarConnection, _startsAt: Date, _endsAt: Date): Promise<CalendarEvent[]> {
    void _connection; void _startsAt; void _endsAt;
    throw new Error('Google Calendar todavía no está configurado');
  }

  async upsertAppointment(_connection: CalendarConnection, _appointmentId: string, _event: CalendarEvent): Promise<string> {
    void _connection; void _appointmentId; void _event;
    throw new Error('Google Calendar todavía no está configurado');
  }

  async deleteAppointment(_connection: CalendarConnection, _externalId: string): Promise<void> {
    void _connection; void _externalId;
    throw new Error('Google Calendar todavía no está configurado');
  }
}
