using Appoint.DTOs;
using Appoint.Models;

namespace Appoint.Services.Interfaces
{
    public interface IPatientService
    {
        Task<AppointmentRequest> CreateRequestAsync(int patientId, CreateAppointmentRequestDto dto);
        Task<IEnumerable<AppointmentRequest>> GetMyRequestsAsync(int patientId);
        Task<IEnumerable<Appointment>> GetMyAppointmentsAsync(int patientId);
    }
}
