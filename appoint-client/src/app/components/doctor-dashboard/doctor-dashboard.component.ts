import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { DoctorAvailability } from '../../models/models';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule
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
    this.apiService.getDoctorAvailability().subscribe({
      next: (availabilities) => {
        const availabilityEvents = availabilities.map(avail => ({
          id: `availability-${avail.id}`,
          title: `Available: ${avail.startTime} - ${avail.endTime}`,
          start: avail.availableDate,
          backgroundColor: '#4caf50',
          borderColor: '#388e3c',
          extendedProps: { type: 'availability', data: avail }
        }));

        this.apiService.getDoctorAppointments().subscribe({
          next: (appointments) => {
            const appointmentEvents = appointments.map(apt => ({
              id: `appointment-${apt.id}`,
              title: `Appointment: ${apt.startTime} - ${apt.endTime}`,
              start: apt.appointmentDate,
              backgroundColor: '#2196f3',
              borderColor: '#1976d2',
              extendedProps: { type: 'appointment', data: apt }
            }));

            this.calendarOptions.events = [...availabilityEvents, ...appointmentEvents];
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
      alert('Cannot set availability for past dates');
      return;
    }

    // Open modal to set availability time
    this.showAvailabilityModal = true;
    this.selectedDate = arg.dateStr;
    this.startTime = '';
    this.endTime = '';
  }

  handleEventClick(arg: EventClickArg): void {
    const eventType = arg.event.extendedProps['type'];
    const eventData = arg.event.extendedProps['data'];

    if (eventType === 'availability') {
      if (confirm(`Delete this availability?\nTime: ${eventData.startTime} - ${eventData.endTime}`)) {
        this.apiService.deleteAvailability(eventData.id).subscribe({
          next: () => {
            alert('Availability deleted successfully!');
            this.loadCalendarData();
          },
          error: (err) => {
            alert('Failed to delete: ' + (err.error?.message || 'This slot may have appointments'));
          }
        });
      }
    } else if (eventType === 'appointment') {
      alert(`Confirmed Appointment\nTime: ${eventData.startTime} - ${eventData.endTime}\nStatus: ${eventData.status}`);
    }
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
        alert('Availability added successfully!');
        this.closeModal();
        this.loadCalendarData();
      },
      error: (err) => {
        // This will now show the overlap error message
        const errorMessage = err.error?.message || 'Failed to add availability';
        alert(errorMessage);
      }
    });
  }

  closeModal(): void {
    this.showAvailabilityModal = false;
    this.selectedDate = '';
    this.startTime = '';
    this.endTime = '';
  }
}