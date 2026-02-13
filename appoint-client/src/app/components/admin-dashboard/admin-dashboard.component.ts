import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AppointmentRequest, AvailableDoctor } from '../../models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  userName: string = '';
  showAssignDialog = false;
  currentRequest: AppointmentRequest | null = null;
  availableDoctors: AvailableDoctor[] = [];
  searched = false;
  loading = false;
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth'
    },
    editable: false,
    selectable: false,
    dayMaxEvents: true,
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
    const events: any[] = [];

    // Load pending patient requests (Orange)
    this.apiService.getPendingRequests().subscribe({
      next: (requests) => {
        const requestEvents = requests.map(req => ({
          id: `request-${req.id}`,
          title: `Patient Request: ${req.startTime} - ${req.endTime}`,
          start: req.requestDate,
          backgroundColor: '#ff9800',
          borderColor: '#f57c00',
          extendedProps: { type: 'request', data: req }
        }));

        // Load all appointments (Blue)
        this.apiService.getAllAppointments().subscribe({
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

  handleEventClick(arg: EventClickArg): void {
    const eventType = arg.event.extendedProps['type'];
    const eventData = arg.event.extendedProps['data'];

    if (eventType === 'request') {
      // Open modal to assign doctor
      this.showAssignDialog = true;
      this.currentRequest = eventData;
      this.availableDoctors = [];
      this.searched = false;
      this.loading = false;
    } else if (eventType === 'appointment') {
      alert(`Confirmed Appointment\nTime: ${eventData.startTime} - ${eventData.endTime}\nStatus: ${eventData.status}`);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  findDoctors(): void {
    if (!this.currentRequest) return;
    this.loading = true;
    this.searched = false;

    this.apiService.getAvailableDoctors(
      this.currentRequest.requestDate,
      this.currentRequest.startTime,
      this.currentRequest.endTime
    ).subscribe({
      next: (doctors) => {
        this.availableDoctors = doctors;
        this.searched = true;
        this.loading = false;
      },
      error: (err) => {
        alert('Error finding doctors: ' + err.message);
        this.loading = false;
        this.searched = true;
      }
    });
  }

  assignDoctor(doctor: AvailableDoctor): void {
    if (!this.currentRequest) return;
    if (!this.currentRequest.id) return; // Fix TypeScript error by ensuring currentRequest is defined before accessing id
    const assignment = {
      requestId: this.currentRequest.id,
      doctorId: doctor.doctorId,
      availabilityId: doctor.id
    };

    this.apiService.assignAppointment(assignment).subscribe({
      next: () => {
        alert(`Appointment assigned to ${doctor.doctorName} successfully!`);
        this.closeModal();
        this.loadCalendarData(); // Refresh calendar
      },
      error: (err) => {
        alert('Error assigning appointment: ' + err.error.message);
      }
    });
  }

  closeModal(): void {
    this.showAssignDialog = false;
    this.currentRequest = null;
    this.availableDoctors = [];
    this.searched = false;
    this.loading = false;
  }
}