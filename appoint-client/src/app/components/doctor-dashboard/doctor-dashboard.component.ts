import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatDialogModule,
    FullCalendarModule
  ],
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {
  userName: string = '';
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
    private apiService: ApiService,
    private dialog: MatDialog
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
          title: avail.isBooked 
            ? `Booked: ${avail.startTime} - ${avail.endTime}` 
            : `Available: ${avail.startTime} - ${avail.endTime}`,
          start: avail.availableDate,
          backgroundColor: avail.isBooked ? '#9e9e9e' : '#4caf50',
          borderColor: avail.isBooked ? '#757575' : '#388e3c',
          extendedProps: { type: 'availability', data: avail }
        }));

        // Load confirmed appointments
        this.apiService.getDoctorAppointments().subscribe({
          next: (appointments) => {
            const appointmentEvents = appointments.map(apt => ({
              id: `appointment-${apt.id}`,
              title: `Patient Appointment: ${apt.startTime} - ${apt.endTime}`,
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

    // Open dialog to set availability time
    const dialogRef = this.dialog.open(AvailabilityDialog, {
      width: '400px',
      data: { date: arg.dateStr }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const availability: DoctorAvailability = {
          availableDate: arg.dateStr,
          startTime: result.startTime,
          endTime: result.endTime
        };

        this.apiService.addAvailability(availability).subscribe({
          next: () => {
            alert('Availability added successfully!');
            this.loadCalendarData();
          },
          error: (err) => {
            alert('Failed to add availability: ' + err.message);
          }
        });
      }
    });
  }

  handleEventClick(arg: EventClickArg): void {
    const eventType = arg.event.extendedProps['type'];
    const eventData = arg.event.extendedProps['data'];

    if (eventType === 'availability') {
      if (eventData.isBooked) {
        alert(`This slot is booked and cannot be deleted.\nTime: ${eventData.startTime} - ${eventData.endTime}`);
      } else {
        if (confirm(`Delete this availability?\nTime: ${eventData.startTime} - ${eventData.endTime}`)) {
          this.apiService.deleteAvailability(eventData.id).subscribe({
            next: () => {
              alert('Availability deleted successfully!');
              this.loadCalendarData();
            },
            error: (err) => {
              alert('Failed to delete: ' + err.error.message);
            }
          });
        }
      }
    } else if (eventType === 'appointment') {
      alert(`Confirmed Appointment\nTime: ${eventData.startTime} - ${eventData.endTime}\nStatus: ${eventData.status}`);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}

// Availability Dialog Component
@Component({
  selector: 'availability-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Set Availability</h2>
    <mat-dialog-content>
      <p><strong>Date:</strong> {{ data.date }}</p>
      
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Start Time</mat-label>
        <input matInput type="time" [(ngModel)]="startTime" required>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>End Time</mat-label>
        <input matInput type="time" [(ngModel)]="endTime" required>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!startTime || !endTime" (click)="submit()">
        Add Availability
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
  `]
})
export class AvailabilityDialog {
  startTime: string = '';
  endTime: string = '';

  constructor(
    public dialogRef: MatDialogRef<AvailabilityDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  submit(): void {
    if (this.startTime && this.endTime) {
      this.dialogRef.close({
        startTime: this.startTime,
        endTime: this.endTime
      });
    }
  }
}