import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { DoctorAvailability, Notification } from '../../models/models';
import { AlertModalComponent } from '../alert-modal/alert-modal.component';
import { TimeFormatPipe } from '../../pipes/time-format.pipe';
import { getStatusName } from '../../models/enums';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    AlertModalComponent,
    TimeFormatPipe
  ],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {
  userName: string = '';
  showAvailabilityModal = false;
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

  // Confirmation modal properties
  showConfirmModal = false;
  confirmMessage = '';
  confirmCallback: (() => void) | null = null;

  private allAppointments: any[] = [];
  
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
    this.apiService.getDoctorAvailability().subscribe({
      next: (availabilities) => {
        this.apiService.getDoctorAppointments().subscribe({
          next: (appointments) => {
            this.allAppointments = appointments;
            const availabilityEvents = availabilities
              .filter(avail => !this.hasOverlappingAppointment(avail))
              .map(avail => {
                const startTime = this.formatTime(avail.startTime);
                const endTime = this.formatTime(avail.endTime);

                return {
                  id: `availability-${avail.id}`,
                  title: `Available: ${startTime} - ${endTime}`,
                  start: avail.availableDate,
                  backgroundColor: '#4caf50',
                  borderColor: '#388e3c',
                  extendedProps: { type: 'availability', data: avail }
                };
              });

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

            this.calendarOptions.events = [...availabilityEvents, ...appointmentEvents];
          }
        });
      }
    });
  }

  private hasOverlappingAppointment(availability: any): boolean {
    return this.allAppointments.some(apt => {
      if (apt.appointmentDate !== availability.availableDate) {
        return false;
      }

      const availStart = this.parseTimeSpan(availability.startTime);
      const availEnd = this.parseTimeSpan(availability.endTime);
      const aptStart = this.parseTimeSpan(apt.startTime);
      const aptEnd = this.parseTimeSpan(apt.endTime);

      return aptStart < availEnd && aptEnd > availStart;
    });
  }

  private parseTimeSpan(time: string): number {
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
  }

  handleDateClick(arg: DateClickArg): void {
    const clickedDate = new Date(arg.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate <= today) {
      this.showAlertModal(
        'Invalid Date',
        'Cannot set availability for past dates or today. Please select a future date.',
        'error'
      );
      return;
    }

    this.showAvailabilityModal = true;
    this.selectedDate = arg.dateStr;
    this.startTime = '';
    this.endTime = '';
  }

  handleEventClick(arg: EventClickArg): void {
    const eventType = arg.event.extendedProps['type'];
    const eventData = arg.event.extendedProps['data'];

    if (eventType === 'availability') {
      const startTime = this.formatTime(eventData.startTime);
      const endTime = this.formatTime(eventData.endTime);

      this.showConfirmation(
        `Delete this availability?\nTime: ${startTime} - ${endTime}`,
        () => {
          this.apiService.deleteAvailability(eventData.id).subscribe({
            next: () => {
              this.loadCalendarData();
              this.showAlertModal('Success', 'Availability deleted successfully!', 'success');
            },
            error: (err) => {
              const errorMessage = err.error?.error || 'This slot may have appointments';
              this.showAlertModal('Error', 'Failed to delete: ' + errorMessage, 'error');
            }
          });
        }
      );
    } else if (eventType === 'appointment') {
      const statusName = getStatusName(eventData.status);
      const startTime = this.formatTime(eventData.startTime);
      const endTime = this.formatTime(eventData.endTime);

      this.showAlertModal(
        'Confirmed Appointment',
        `Time: ${startTime} - ${endTime}`,
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

  submitAvailability(): void {
    if (!this.startTime || !this.endTime) return;

    const availability: DoctorAvailability = {
      availableDate: this.selectedDate,
      startTime: this.startTime,
      endTime: this.endTime
    };

    this.apiService.addAvailability(availability).subscribe({
      next: () => {
        this.closeModal();
        this.loadCalendarData();
        this.showAlertModal('Success', 'Availability added successfully!', 'success');
      },
      error: (err) => {
        const errorMessage = err.error?.error || 'Failed to add availability';
        this.showAlertModal('Error', errorMessage, 'error');
      }
    });
  }

  closeModal(): void {
    this.showAvailabilityModal = false;
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

  showConfirmation(message: string, callback: () => void): void {
    this.confirmMessage = message;
    this.confirmCallback = callback;
    this.showConfirmModal = true;
  }

  confirmAction(): void {
    if (this.confirmCallback) {
      this.confirmCallback();
    }
    this.closeConfirmation();
  }

  closeConfirmation(): void {
    this.showConfirmModal = false;
    this.confirmMessage = '';
    this.confirmCallback = null;
  }
}