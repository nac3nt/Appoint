import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
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
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatDialogModule,
    FullCalendarModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
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
    selectable: false,
    dayMaxEvents: true,
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
      // Open dialog to assign doctor
      const dialogRef = this.dialog.open(AssignDoctorDialog, {
        width: '500px',
        data: { request: eventData }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadCalendarData(); // Refresh calendar
        }
      });
    } else if (eventType === 'appointment') {
      alert(`Confirmed Appointment\nTime: ${eventData.startTime} - ${eventData.endTime}\nStatus: ${eventData.status}`);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}

// Assign Doctor Dialog Component
@Component({
  selector: 'assign-doctor-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatListModule, 
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>Assign Doctor to Request</h2>
    <mat-dialog-content>
      <div class="request-details">
        <p><strong>Date:</strong> {{ data.request.requestDate }}</p>
        <p><strong>Time:</strong> {{ data.request.startTime }} - {{ data.request.endTime }}</p>
        <p><strong>Status:</strong> {{ data.request.status }}</p>
      </div>

      <mat-divider></mat-divider>

      <div class="actions-section">
        <button mat-raised-button color="primary" (click)="findDoctors()" [disabled]="loading">
          {{ loading ? 'Searching...' : 'Find Available Doctors' }}
        </button>
      </div>

      <div *ngIf="searched && availableDoctors.length === 0" class="no-doctors">
        <mat-icon color="warn">warning</mat-icon>
        <p>No doctors available for this time slot</p>
      </div>

      <mat-list *ngIf="availableDoctors.length > 0">
        <h3 mat-subheader>Available Doctors</h3>
        <mat-list-item *ngFor="let doctor of availableDoctors">
          <mat-icon matListItemIcon>person</mat-icon>
          <div matListItemTitle>{{ doctor.doctorName }}</div>
          <button mat-raised-button color="accent" (click)="assignDoctor(doctor)">
            Assign
          </button>
        </mat-list-item>
      </mat-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .request-details {
      margin-bottom: 20px;
    }
    .request-details p {
      margin: 8px 0;
    }
    .actions-section {
      margin: 20px 0;
    }
    .no-doctors {
      text-align: center;
      padding: 20px;
      color: #f44336;
    }
    .no-doctors mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    mat-list-item {
      margin-bottom: 10px;
    }
  `]
})
export class AssignDoctorDialog {
  availableDoctors: AvailableDoctor[] = [];
  searched = false;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<AssignDoctorDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService
  ) {}

  findDoctors(): void {
    this.loading = true;
    this.searched = false;

    this.apiService.getAvailableDoctors(
      this.data.request.requestDate,
      this.data.request.startTime,
      this.data.request.endTime
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
    const assignment = {
      requestId: this.data.request.id,
      doctorId: doctor.doctorId,
      availabilityId: doctor.id
    };

    this.apiService.assignAppointment(assignment).subscribe({
      next: () => {
        alert(`Appointment assigned to ${doctor.doctorName} successfully!`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        alert('Error assigning appointment: ' + err.error.message);
      }
    });
  }
}