# 🏥 Doctor-Patient Appointment Scheduling System

A full-stack web application for managing doctor-patient appointments with role-based access control, built with .NET Core 8 and Angular 18.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## 🎯 Overview

This application provides a comprehensive appointment scheduling system with three distinct user roles:

- **Patients**: Request appointments for specific dates and times
- **Doctors**: Manage availability schedules and view assigned appointments
- **Admins**: Assign pending requests to available doctors

The system features real-time notifications, conflict detection, and an intuitive calendar-based interface.

---

## ✨ Features

### Patient Features
- ✅ Create appointment requests for future dates
- ✅ View request status (Pending/Approved/Scheduled)
- ✅ Receive notifications when appointments are confirmed
- ✅ Interactive calendar view of requests and appointments
- ✅ Prevent booking on past dates or today

### Doctor Features
- ✅ Set availability schedules with flexible time slots
- ✅ View assigned appointments on calendar
- ✅ Manage multiple availability slots per day
- ✅ Receive notifications for new appointments
- ✅ Delete availability slots (only if no appointments exist)
- ✅ Automatic conflict detection for overlapping appointments

### Admin Features
- ✅ View all pending appointment requests
- ✅ Search for available doctors based on requested time
- ✅ Assign appointments to doctors
- ✅ Advanced availability matching with merged time slots
- ✅ View all scheduled appointments across the system

### Technical Features
- ✅ JWT-based authentication
- ✅ Role-based authorization (Patient/Doctor/Admin)
- ✅ Real-time notification system
- ✅ Conflict detection for appointments and availability
- ✅ Adjacent availability slot merging
- ✅ Custom exception handling with proper HTTP status codes
- ✅ Responsive UI with FullCalendar integration
- ✅ Clean 3-layer architecture (Controller → Service → Repository)

---

## 🛠️ Technology Stack

### Backend
- **Framework**: .NET Core 8.0
- **ORM**: Entity Framework Core (Code-First)
- **Database**: SQL Server
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: BCrypt
- **Architecture**: Clean Architecture with Repository Pattern

### Frontend
- **Framework**: Angular 18
- **Language**: TypeScript
- **UI Components**: Standalone Components
- **Calendar**: FullCalendar
- **Styling**: Custom CSS (No Material UI)
- **HTTP Client**: Angular HttpClient with Interceptors

### Development Tools
- **IDE**: Visual Studio 2022 / Visual Studio Code
- **API Testing**: Postman / Swagger
- **Version Control**: Git

---

## 🏗️ Architecture

### Backend Architecture

```
┌─────────────────────────────────────────────────┐
│              Presentation Layer                 │
│  (Controllers - HTTP Request/Response)          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│              Business Logic Layer               │
│  (Services - Validation, Business Rules)        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│              Data Access Layer                  │
│  (Repositories - Database Operations)           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│              Database (SQL Server)              │
└─────────────────────────────────────────────────┘
```

### Key Design Patterns
- **Repository Pattern**: Generic repository for all entities
- **Dependency Injection**: Built-in .NET Core DI container
- **Custom Exceptions**: Typed exceptions for business logic errors
- **Middleware**: Global exception handling
- **ActionResult<T>**: Strongly-typed API responses

### Frontend Architecture
- **Standalone Components**: Modern Angular architecture
- **Services**: Centralized API communication
- **Guards**: Route protection based on roles
- **Interceptors**: JWT token injection
- **Pipes**: Custom time formatting

---

## 🚀 Getting Started

### Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Angular CLI](https://angular.io/cli) (v18)
- [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (2019 or higher)
- [Git](https://git-scm.com/)

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/appointment-scheduling-system.git
cd appointment-scheduling-system
```

#### 2. Backend Setup

##### Configure Database Connection
Open `appsettings.json` and update the connection string:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=AppointmentDB;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

##### Run Migrations
```bash
cd Backend/AppointmentAPI
dotnet ef database update
```

##### Run the Backend
```bash
dotnet run
```

The API will be available at: `https://localhost:7001`

#### 3. Frontend Setup

```bash
cd Frontend/appointment-app
npm install
ng serve
```

The application will be available at: `http://localhost:4200`

### Default Login Credentials

After running migrations, you can register users or use seed data:

**Admin**
- Email: `admin@test.com`
- Password: `Admin@123`

**Doctor**
- Email: `doctor@test.com`
- Password: `Doctor@123`

**Patient**
- Email: `patient@test.com`
- Password: `Patient@123`

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
                    ┌──────────────────────────┐
                    │        Users             │
                    ├──────────────────────────┤
                    │ PK  Id                   │
                    │     Email (UNIQUE)       │
                    │     PasswordHash         │
                    │     Name                 │
                    │     Role                 │
                    └──────────────────────────┘
                              │
                              │ 1
          ┌───────────────────┼────────────────────┐
          │                   │                    │
          │ Many              │ Many               │ Many
          ▼                   ▼                    ▼
┌────────────────────┐  ┌───────────────────┐  ┌──────────────────┐
│ AppointmentRequests│  │DoctorAvailabilities│  │  Notifications   │
├────────────────────┤  ├───────────────────┤  ├──────────────────┤
│ PK  Id             │  │ PK  Id            │  │ PK  Id           │
│ FK  PatientId      │  │ FK  DoctorId      │  │ FK  UserId       │
│     RequestDate    │  │     AvailableDate │  │ FK  ApptId       │
│     StartTime      │  │     StartTime     │  │     Title        │
│     EndTime        │  │     EndTime       │  │     Message      │
│     Status         │  └───────────────────┘  └──────────────────┘
└────────────────────┘
         │ 1:1
         ▼
┌────────────────────┐
│    Appointments    │
├────────────────────┤
│ PK  Id             │
│ FK  RequestId      │
│ FK  PatientId      │
│ FK  DoctorId       │
│     ApptDate       │
│     StartTime      │
│     EndTime        │
│     Status         │
└────────────────────┘
```

For detailed schema documentation, see [DATABASE_ERD.txt](./DATABASE_ERD.txt)

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password@123",
  "name": "John Doe",
  "role": "Patient"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password@123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Patient"
  }
}
```

### Patient Endpoints

#### Create Appointment Request
```http
POST /api/patient/request
Authorization: Bearer {token}
Content-Type: application/json

{
  "requestDate": "2026-02-15",
  "startTime": "10:30:00",
  "endTime": "12:00:00"
}
```

#### Get My Requests
```http
GET /api/patient/my-requests
Authorization: Bearer {token}
```

#### Get My Appointments
```http
GET /api/patient/my-appointments
Authorization: Bearer {token}
```

### Doctor Endpoints

#### Add Availability
```http
POST /api/doctor/availability
Authorization: Bearer {token}
Content-Type: application/json

{
  "availableDate": "2026-02-15",
  "startTime": "10:00:00",
  "endTime": "14:00:00"
}
```

#### Get My Availability
```http
GET /api/doctor/my-availability
Authorization: Bearer {token}
```

#### Delete Availability
```http
DELETE /api/doctor/availability/{id}
Authorization: Bearer {token}
```

#### Get My Appointments
```http
GET /api/doctor/my-appointments
Authorization: Bearer {token}
```

### Admin Endpoints

#### Get Pending Requests
```http
GET /api/admin/pending-requests
Authorization: Bearer {token}
```

#### Get Available Doctors
```http
GET /api/admin/available-doctors?date=2026-02-15&startTime=10:30:00&endTime=12:00:00
Authorization: Bearer {token}
```

#### Assign Appointment
```http
POST /api/admin/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "requestId": 1,
  "doctorId": 3,
  "availabilityId": 5
}
```

#### Get All Appointments
```http
GET /api/admin/appointments
Authorization: Bearer {token}
```

### Notification Endpoints

#### Get My Notifications
```http
GET /api/notification
Authorization: Bearer {token}
```

#### Get Notification Count
```http
GET /api/notification/count
Authorization: Bearer {token}
```

#### Delete Notification
```http
DELETE /api/notification/{id}
Authorization: Bearer {token}
```

---

## 📁 Project Structure

```
appointment-scheduling-system/
│
├── Backend/
│   └── AppointmentAPI/
│       ├── Controllers/          # API Controllers
│       │   ├── AuthController.cs
│       │   ├── PatientController.cs
│       │   ├── DoctorController.cs
│       │   ├── AdminController.cs
│       │   └── NotificationController.cs
│       │
│       ├── Services/             # Business Logic Layer
│       │   ├── Interfaces/
│       │   └── Implementations/
│       │       ├── AuthService.cs
│       │       ├── PatientService.cs
│       │       ├── DoctorService.cs
│       │       ├── AdminService.cs
│       │       └── NotificationService.cs
│       │
│       ├── Repositories/         # Data Access Layer
│       │   ├── Interfaces/
│       │   │   └── IRepository.cs
│       │   └── Implementations/
│       │       └── Repository.cs
│       │
│       ├── Models/               # Domain Models
│       │   ├── User.cs
│       │   ├── AppointmentRequest.cs
│       │   ├── DoctorAvailability.cs
│       │   ├── Appointment.cs
│       │   └── Notification.cs
│       │
│       ├── DTOs/                 # Data Transfer Objects
│       │   ├── LoginDto.cs
│       │   ├── RegisterDto.cs
│       │   ├── CreateAvailabilityDto.cs
│       │   └── AssignAppointmentDto.cs
│       │
│       ├── Exceptions/           # Custom Exceptions
│       │   └── BusinessException.cs
│       │
│       ├── Middleware/           # Exception Handling
│       │   └── ExceptionHandlingMiddleware.cs
│       │
│       ├── Data/                 # Database Context
│       │   └── AppDbContext.cs
│       │
│       ├── Helpers/              # Utility Classes
│       │   └── JwtHelper.cs
│       │
│       └── Program.cs            # Application Entry Point
│
├── Frontend/
│   └── appointment-app/
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/
│       │   │   │   ├── login/
│       │   │   │   ├── register/
│       │   │   │   ├── patient-dashboard/
│       │   │   │   ├── doctor-dashboard/
│       │   │   │   ├── admin-dashboard/
│       │   │   │   └── alert-modal/
│       │   │   │
│       │   │   ├── services/
│       │   │   │   ├── auth.service.ts
│       │   │   │   └── api.service.ts
│       │   │   │
│       │   │   ├── guards/
│       │   │   │   └── auth.guard.ts
│       │   │   │
│       │   │   ├── interceptors/
│       │   │   │   └── auth.interceptor.ts
│       │   │   │
│       │   │   ├── models/
│       │   │   │   ├── models.ts
│       │   │   │   └── enums.ts
│       │   │   │
│       │   │   ├── pipes/
│       │   │   │   └── time-format.pipe.ts
│       │   │   │
│       │   │   └── app.routes.ts
│       │   │
│       │   └── index.html
│       │
│       └── angular.json
│
├── DATABASE_ERD.txt              # Database schema diagram
└── README.md                     # This file
```

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **BCrypt Password Hashing**: Industry-standard password encryption
- **Role-Based Authorization**: Endpoint protection by user role
- **HTTP-Only Approach**: Tokens stored securely in localStorage
- **CORS Configuration**: Cross-origin requests properly configured
- **SQL Injection Prevention**: Entity Framework parameterized queries
- **Input Validation**: Both client-side and server-side validation

---

## 🚀 Deployment

### Backend Deployment (Azure App Service)

1. Publish the application:
```bash
dotnet publish -c Release
```

2. Update connection string in Azure portal
3. Deploy published files to App Service

### Frontend Deployment (Azure Static Web Apps / Netlify)

1. Build for production:
```bash
ng build --configuration production
```

2. Deploy the `dist/` folder to your hosting provider

### Environment Variables

**Backend (`appsettings.json`)**:
```json
{
  "Jwt": {
    "Key": "your-secret-key-here",
    "Issuer": "AppointmentAPI",
    "Audience": "AppointmentClient"
  },
  "ConnectionStrings": {
    "DefaultConnection": "your-connection-string"
  }
}
```

**Frontend (`environment.ts`)**:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-url.com/api'
};
```

---

## 🎨 UI/UX Highlights

- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Calendar**: FullCalendar integration for intuitive scheduling
- **Color-Coded Events**: Easy visual distinction between request types
- **Real-Time Notifications**: Bell icon with badge count
- **Modal Dialogs**: Clean, user-friendly forms and confirmations
- **Error Handling**: User-friendly error messages
- **Past Date Prevention**: Grayed-out dates that cannot be selected
- **Time Formatting**: 12-hour format (10:30 AM) for readability

---

## 🔧 Configuration

### Backend Configuration

**JWT Settings** (`appsettings.json`):
```json
{
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "AppointmentAPI",
    "Audience": "AppointmentClient",
    "ExpireMinutes": 1440
  }
}
```

**CORS Settings** (`Program.cs`):
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

### Frontend Configuration

**API Endpoint** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7001/api'
};
```

---

## 📊 Performance Optimizations

- **Database Indexing**: Indexes on frequently queried columns
- **Composite Indexes**: On (DoctorId, AppointmentDate) for fast lookups
- **Lazy Loading**: Angular modules loaded on demand
- **HTTP Caching**: Strategic caching of static data
- **Connection Pooling**: Efficient database connection management
- **Async/Await**: Non-blocking operations throughout

---

## 🐛 Known Issues & Limitations

1. **Availability Display**: When a doctor has an appointment within an availability slot, the entire availability is hidden (not split into free segments)
2. **No Email Notifications**: Currently uses in-app notifications only
3. **No Appointment Cancellation**: Once created, appointments cannot be cancelled
4. **Single Time Zone**: Does not handle multiple time zones
5. **No Recurring Availability**: Doctors must set availability for each day individually

---

## 🔮 Future Enhancements

### Planned Features

- [ ] **Email Notifications**: Send email confirmations for appointments
- [ ] **SMS Notifications**: Text message reminders
- [ ] **Appointment Cancellation**: Allow patients/doctors to cancel
- [ ] **Recurring Availability**: Set weekly/monthly recurring schedules
- [ ] **Split Availability Display**: Show free time segments when partially booked
- [ ] **Doctor Specializations**: Filter doctors by specialty
- [ ] **Patient Medical History**: Link medical records to patients
- [ ] **Prescription Management**: Attach prescriptions to appointments
- [ ] **Rating System**: Patients rate doctors after appointments
- [ ] **Payment Integration**: Online payment for appointments
- [ ] **Video Consultations**: Integrate telemedicine
- [ ] **Multi-Language Support**: Internationalization (i18n)
- [ ] **Dark Mode**: UI theme toggle
- [ ] **Export Calendar**: Sync with Google Calendar, Outlook
- [ ] **Analytics Dashboard**: Admin view of system statistics

### Technical Improvements

- [ ] Unit Tests: Comprehensive test coverage
- [ ] Integration Tests: End-to-end testing
- [ ] API Versioning: Support multiple API versions
- [ ] GraphQL: Alternative to REST API
- [ ] SignalR: Real-time notifications without refresh
- [ ] Redis Caching: Improve performance
- [ ] Docker: Containerization for easy deployment
- [ ] CI/CD Pipeline: Automated testing and deployment

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Prince Mishra**
- GitHub: [@nac3nt](https://github.com/nac3nt)
- Email: iamnacent@gmail.com

---

**Built with ❤️ using .NET Core 8 and Angular 18**
