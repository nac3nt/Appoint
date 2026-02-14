export enum AppointmentStatus {
  Pending = 0,
  Approved = 1,
  Scheduled = 2,
  Completed = 3,
  Cancelled = 4
}

export function getStatusName(status: number | string): string {
  if (typeof status === 'string') {
    return status;
  }
  
  switch (status) {
    case AppointmentStatus.Pending:
      return 'Pending';
    case AppointmentStatus.Approved:
      return 'Approved';
    case AppointmentStatus.Scheduled:
      return 'Scheduled';
    case AppointmentStatus.Completed:
      return 'Completed';
    case AppointmentStatus.Cancelled:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

export function getStatusColor(status: number | string): string {
  const statusNum = typeof status === 'string' ? parseInt(status) : status;
  
  switch (statusNum) {
    case AppointmentStatus.Pending:
      return '#ff9800'; // Orange
    case AppointmentStatus.Approved:
      return '#4caf50'; // Green
    case AppointmentStatus.Scheduled:
      return '#2196f3'; // Blue
    case AppointmentStatus.Completed:
      return '#9e9e9e'; // Gray
    case AppointmentStatus.Cancelled:
      return '#f44336'; // Red
    default:
      return '#757575'; // Default gray
  }
}