import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AppointmentRequest, AvailableDoctor } from '../../models/models';
import { AlertModalComponent } from '../alert-modal/alert-modal.component';
import { TimeFormatPipe } from '../../pipes/time-format.pipe';
import { getStatusName } from '../../models/enums';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FullCalendarModule,
    AlertModalComponent,
    TimeFormatPipe
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

  // Alert modal properties
  showAlert = false;
  alertTitle = '';
  alertMessage = '';
  alertType: 'success' | 'error' | 'info' = 'info';
  
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
    displayEventTime: false,
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
    this.apiService.getPendingRequests().subscribe({
      next: (requests) => {
        const requestEvents = requests.map(req => {
          const startTime = this.formatTime(req.startTime);
          const endTime = this.formatTime(req.endTime);

          return {
            id: `request-${req.id}`,
            title: `Patient Request: ${startTime} - ${endTime}`,
            start: req.requestDate,
            backgroundColor: '#ff9800',
            borderColor: '#f57c00',
            extendedProps: { type: 'request', data: req }
          };
        });

        this.apiService.getAllAppointments().subscribe({
          next: (appointments) => {
            const appointmentEvents = appointments.map(apt => {
              const startTime = this.formatTime(apt.startTime);
              const endTime = this.formatTime(apt.endTime);

              return {
                id: `appointment-${apt.id}`,
                title: `Appointment: ${startTime} - ${endTime}`,
                start: apt.appointmentDate,
                backgroundColor: '#2196f3',
                borderColor: '#1976d2',
                extendedProps: { type: 'appointment', data: apt }
              };
            });

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
      this.showAssignDialog = true;
      this.currentRequest = eventData;
      this.availableDoctors = [];
      this.searched = false;
      this.loading = false;
    } else if (eventType === 'appointment') {
      const statusName = getStatusName(eventData.status);
      const startTime = this.formatTime(eventData.startTime);
      const endTime = this.formatTime(eventData.endTime);

      this.showAlertModal(
        'Confirmed Appointment',
        `Time: ${startTime} - ${endTime}`,
        'info'
      );
    }
  }

  private formatTime(time: string): string {
    const pipe = new TimeFormatPipe();
    return pipe.transform(time);
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
        this.loading = false;
        this.searched = true;
        const errorMessage = err.error?.error || 'Failed to find doctors';
        this.showAlertModal('Error', errorMessage, 'error');
      }
    });
  }

  assignDoctor(doctor: AvailableDoctor): void {
    if (!this.currentRequest) return;
    if (!this.currentRequest.id) return;
    
    const assignment = {
      requestId: this.currentRequest.id,
      doctorId: doctor.doctorId,
      availabilityId: doctor.id
    };

    this.apiService.assignAppointment(assignment).subscribe({
      next: () => {
        this.closeModal();
        this.loadCalendarData();
        this.showAlertModal(
          'Success',
          `Appointment assigned to ${doctor.doctorName} successfully!`,
          'success'
        );
      },
      error: (err) => {
        const errorMessage = err.error?.error || 'Failed to assign appointment';
        this.showAlertModal('Error', errorMessage, 'error');
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

  showAlertModal(title: string, message: string, type: 'success' | 'error' | 'info'): void {
    this.alertTitle = title;
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
  }

  closeAlert(): void {
    this.showAlert = false;
  }

  getStatusName(status: any): string {
    return getStatusName(status);
  }
}