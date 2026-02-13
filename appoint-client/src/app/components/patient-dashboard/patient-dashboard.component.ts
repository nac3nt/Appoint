import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AppointmentRequest } from '../../models/models';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule
  ],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  userName: string = '';
  showTimeModal = false;
  selectedDate = '';
  startTime = '';
  endTime = '';
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth'
    },
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this),
    events: []
  };

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {
    const user = this.authService.getCurrentUser();
    this.userName = user?.name || '';
  }

  ngOnInit(): void {
    this.loadCalendarData();
  }

  loadCalendarData(): void {
    // Load patient's requests (pending - orange)
    this.apiService.getMyRequests().subscribe({
      next: (requests) => {
        const requestEvents = requests.map(req => ({
          id: `request-${req.id}`,
          title: `Request: ${req.startTime} - ${req.endTime}`,
          start: req.requestDate,
          backgroundColor: req.status === 'Pending' ? '#ff9800' : '#4caf50',
          borderColor: req.status === 'Pending' ? '#f57c00' : '#388e3c',
          extendedProps: { type: 'request', data: req }
        }));

        // Load patient's confirmed appointments (green)
        this.apiService.getMyAppointments().subscribe({
          next: (appointments) => {
            const appointmentEvents = appointments.map(apt => ({
              id: `appointment-${apt.id}`,
              title: `Appointment: ${apt.startTime} - ${apt.endTime}`,
              start: apt.appointmentDate,
              backgroundColor: '#2196f3',
              borderColor: '#1976d2',
              extendedProps: { type: 'appointment', data: apt }
            }));

            this.calendarOptions.events = [...requestEvents, ...appointmentEvents];
          }
        });
      }
    });
  }

  handleDateClick(arg: DateClickArg): void {
    const clickedDate = new Date(arg.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate < today) {
      alert('Cannot request appointments for past dates');
      return;
    }

    // Open modal to select time
    this.showTimeModal = true;
    this.selectedDate = arg.dateStr;
    this.startTime = '';
    this.endTime = '';
  }

  handleEventClick(arg: EventClickArg): void {
    const eventType = arg.event.extendedProps['type'];
    const eventData = arg.event.extendedProps['data'];

    if (eventType === 'request') {
      alert(`Request Status: ${eventData.status}\nTime: ${eventData.startTime} - ${eventData.endTime}`);
    } else if (eventType === 'appointment') {
      alert(`Confirmed Appointment\nTime: ${eventData.startTime} - ${eventData.endTime}\nStatus: ${eventData.status}`);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  submitRequest(): void {
    if (!this.startTime || !this.endTime) return;

    const request: AppointmentRequest = {
      requestDate: this.selectedDate,
      startTime: this.startTime,
      endTime: this.endTime
    };

    this.apiService.createAppointmentRequest(request).subscribe({
      next: () => {
        alert('Appointment request submitted successfully!');
        this.closeModal();
        this.loadCalendarData();
      },
      error: (err) => {
        alert('Failed to submit request: ' + err.message);
      }
    });
  }

  closeModal(): void {
    this.showTimeModal = false;
    this.selectedDate = '';
    this.startTime = '';
    this.endTime = '';
  }
}