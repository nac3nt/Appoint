export interface User {
  id: number;
  email: string;
  role: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: string;
}

export interface AppointmentRequest {
  id?: number;
  patientId?: number;
  requestDate: string;
  startTime: string;
  endTime: string;
  status?: string;
  createdAt?: string;
}

export interface DoctorAvailability {
  id?: number;
  doctorId?: number;
  availableDate: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
}

export interface Appointment {
  id?: number;
  requestId: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status?: string;
  createdAt?: string;
}

export interface AvailableDoctor {
  id: number;
  doctorId: number;
  doctorName: string;
}

export interface AssignAppointmentRequest {
  requestId: number;
  doctorId: number;
  availabilityId: number;
}

// Calendar Event Interface
export interface CalendarEvent {
  id?: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: any;
}