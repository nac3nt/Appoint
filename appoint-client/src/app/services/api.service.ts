import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AppointmentRequest,
  DoctorAvailability,
  Appointment,
  AvailableDoctor,
  AssignAppointmentRequest,
  Notification
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://localhost:7174/api';

  constructor(private http: HttpClient) {}

  // Patient APIs
  createAppointmentRequest(request: AppointmentRequest): Observable<AppointmentRequest> {
    return this.http.post<AppointmentRequest>(`${this.apiUrl}/patient/request`, request);
  }

  getMyRequests(): Observable<AppointmentRequest[]> {
    return this.http.get<AppointmentRequest[]>(`${this.apiUrl}/patient/my-requests`);
  }

  getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient/my-appointments`);
  }

  // Doctor APIs
  addAvailability(availability: DoctorAvailability): Observable<DoctorAvailability> {
    return this.http.post<DoctorAvailability>(`${this.apiUrl}/doctor/availability`, availability);
  }

  getDoctorAvailability(): Observable<DoctorAvailability[]> {
    return this.http.get<DoctorAvailability[]>(`${this.apiUrl}/doctor/availability`);
  }

  getDoctorAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/my-appointments`);
  }

  deleteAvailability(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/doctor/availability/${id}`);
  }

  // Admin APIs
  getPendingRequests(): Observable<AppointmentRequest[]> {
    return this.http.get<AppointmentRequest[]>(`${this.apiUrl}/admin/pending-requests`);
  }

  getAvailableDoctors(date: string, startTime: string, endTime: string): Observable<AvailableDoctor[]> {
    const params = new HttpParams()
      .set('date', date)
      .set('startTime', startTime)
      .set('endTime', endTime);

    return this.http.get<AvailableDoctor[]>(`${this.apiUrl}/admin/available-doctors`, { params });
  }

  assignAppointment(request: AssignAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/admin/assign`, request);
  }

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/admin/all-appointments`);
  }

  // Notification APIs
  getMyNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notification`);
  }

  getNotificationCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/notification/count`);
  }

  deleteNotification(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notification/${id}`);
  }
}