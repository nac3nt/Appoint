import { Component, OnInit, ViewChild, Inject } from '@angular/core';
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
import { CalendarEvent, AppointmentRequest, Appointment } from '../../models/models';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatDialogModule,
    FullCalendarModule
  ],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
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

    // Open dialog to select time
    const dialogRef = this.dialog.open(TimeSelectionDialog, {
      width: '400px',
      data: { date: arg.dateStr }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const request: AppointmentRequest = {
          requestDate: arg.dateStr,
          startTime: result.startTime,
          endTime: result.endTime
        };

        this.apiService.createAppointmentRequest(request).subscribe({
          next: () => {
            alert('Appointment request submitted successfully!');
            this.loadCalendarData();
          },
          error: (err) => {
            alert('Failed to submit request: ' + err.message);
          }
        });
      }
    });
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
}

// Time Selection Dialog Component
@Component({
  selector: 'time-selection-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Select Appointment Time</h2>
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
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!startTime || !endTime" (click)="submit()">
        Submit Request
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
export class TimeSelectionDialog {
  startTime: string = '';
  endTime: string = '';

  constructor(
    public dialogRef: MatDialogRef<TimeSelectionDialog>,
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