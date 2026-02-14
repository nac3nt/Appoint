using Appoint.DTOs;
using Appoint.Models;

namespace Appoint.Services.Interfaces
{
    public interface IAdminService
    {
        Task<IEnumerable<AppointmentRequest>> GetPendingRequestsAsync();
        Task<IEnumerable<AvailableDoctorDto>> GetAvailableDoctorsAsync(DateTime date, TimeSpan startTime, TimeSpan endTime);
        Task<Appointment> AssignAppointmentAsync(AssignAppointmentDto dto);
        Task<IEnumerable<Appointment>> GetAllAppointmentsAsync();
    }
}
