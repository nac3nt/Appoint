import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AppointmentRequest, Notification } from '../../models/models';
import { AlertModalComponent } from '../alert-modal/alert-modal.component';
import { TimeFormatPipe } from '../../pipes/time-format.pipe';
import { AppointmentStatus, getStatusName } from '../../models/enums';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    AlertModalComponent,
    TimeFormatPipe
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
  
  // Notification properties
  notifications: Notification[] = [];
  notificationCount: number = 0;
  showNotifications: boolean = false;
  selectedNotification: Notification | null = null;

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
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    displayEventTime: false,
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this),
    dayCellClassNames: this.getDayCellClass.bind(this),
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
    this.loadNotifications();
    this.loadCalendarData();
  }

  getDayCellClass(arg: any): string[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const cellDate = new Date(arg.date);
    cellDate.setHours(0, 0, 0, 0);
    
    if (cellDate <= today) {
      return ['past-date'];
    }
    return [];
  }

  loadNotifications(): void {
    this.apiService.getMyNotifications().subscribe({
      next: (notifs) => {
        this.notifications = notifs;
        this.notificationCount = notifs.length;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
      }
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  openNotificationModal(notification: Notification): void {
    this.selectedNotification = notification;
    this.showNotifications = false;
  }

  dismissNotification(): void {
    if (!this.selectedNotification) return;

    this.apiService.deleteNotification(this.selectedNotification.id).subscribe({
      next: () => {
        this.selectedNotification = null;
        this.loadNotifications();
      },
      error: (err) => {
        const errorMessage = err.error?.error || 'Failed to dismiss notification';
        this.showAlertModal('Error', errorMessage, 'error');
      }
    });
  }

  closeNotificationModal(): void {
    this.selectedNotification = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-wrapper')) {
      this.showNotifications = false;
    }
  }

  loadCalendarData(): void {
    this.apiService.getMyRequests().subscribe({
      next: (requests) => {
        const requestEvents = requests.map(req => {
          const startTime = this.formatTime(req.startTime);
          const endTime = this.formatTime(req.endTime);
          const statusName = getStatusName(req.status);

          return {
            id: `request-${req.id}`,
            title: `Request: ${startTime} - ${endTime}`,
            start: req.requestDate,
            backgroundColor: req.status === AppointmentStatus.Pending ? '#ff9800' : '#4caf50',
            borderColor: req.status === AppointmentStatus.Pending ? '#f57c00' : '#388e3c',
            extendedProps: { type: 'request', data: req }
          };
        });

        this.apiService.getMyAppointments().subscribe({
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

  handleDateClick(arg: DateClickArg): void {
    const clickedDate = new Date(arg.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate <= today) {
      this.showAlertModal(
        'Invalid Date',
        'Cannot request appointments for past dates or today. Please select a future date.',
        'error'
      );
      return;
    }

    this.showTimeModal = true;
    this.selectedDate = arg.dateStr;
    this.startTime = '';
    this.endTime = '';
  }

  handleEventClick(arg: EventClickArg): void {
    const eventType = arg.event.extendedProps['type'];
    const eventData = arg.event.extendedProps['data'];

    if (eventType === 'request') {
      const statusName = getStatusName(eventData.status);
      const startTime = this.formatTime(eventData.startTime);
      const endTime = this.formatTime(eventData.endTime);

      this.showAlertModal(
        'Request Status',
        `Status: ${statusName}\nTime: ${startTime} - ${endTime}`,
        'info'
      );
    } else if (eventType === 'appointment') {
      const statusName = getStatusName(eventData.status);
      const startTime = this.formatTime(eventData.startTime);
      const endTime = this.formatTime(eventData.endTime);

      this.showAlertModal(
        'Confirmed Appointment',
        `Time: ${startTime} - ${endTime}\nStatus: ${statusName}`,
        'success'
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

  submitRequest(): void {
    if (!this.startTime || !this.endTime) return;

    const request: AppointmentRequest = {
      requestDate: this.selectedDate,
      startTime: this.startTime,
      endTime: this.endTime,
      status: AppointmentStatus.Pending
    };

    this.apiService.createAppointmentRequest(request).subscribe({
      next: () => {
        this.closeModal();
        this.loadCalendarData();
        this.showAlertModal(
          'Success',
          'Appointment request submitted successfully!',
          'success'
        );
      },
      error: (err) => {
        const errorMessage = err.error?.error || 'Failed to submit request';
        this.showAlertModal('Error', errorMessage, 'error');
      }
    });
  }

  closeModal(): void {
    this.showTimeModal = false;
    this.selectedDate = '';
    this.startTime = '';
    this.endTime = '';
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
}