export interface CalendarScope {
  businessId: string;
  branchId: string;
}

export interface CalendarConnection extends CalendarScope {
  calendarId: string;
  // Referencia a credenciales guardadas de forma segura, nunca el token en sí.
  credentialRef: string;
}

export interface CalendarEvent {
  externalId: string;
  startsAt: Date;
  endsAt: Date;
}

export interface CalendarConnector {
  listBusy(connection: CalendarConnection, startsAt: Date, endsAt: Date): Promise<CalendarEvent[]>;
  upsertAppointment(connection: CalendarConnection, appointmentId: string, event: CalendarEvent): Promise<string>;
  deleteAppointment(connection: CalendarConnection, externalId: string): Promise<void>;
}
