// Kept apart from queries.ts so the appointments queries can invalidate these without importing a module that
// imports them back.
export const appointmentJobKeys = {
  all: ['appointmentJobs'] as const,
  range: (from: string, to: string) => ['appointmentJobs', from, to] as const,
}

export const appointmentBookingKeys = {
  all: ['appointmentServiceBayBookings'] as const,
  range: (from: string, to: string) => ['appointmentServiceBayBookings', from, to] as const,
}
