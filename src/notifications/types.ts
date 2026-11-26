export type NotificationKind = 'confirmation' | 'reminder';

export interface NotificationJob {
  businessId: string;
  branchId: string;
  appointmentId: string;
  kind: NotificationKind;
}

export interface NotificationProvider {
  send(job: NotificationJob): Promise<void>;
}

export interface NotificationQueue {
  enqueue(job: NotificationJob): void;
}
