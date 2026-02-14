using Appoint.DTOs;
using Appoint.Models;

namespace Appoint.Services.Interfaces
{
    public interface IDoctorService
    {
        Task<DoctorAvailability> AddAvailabilityAsync(int doctorId, CreateAvailabilityDto dto);
        Task<DoctorAvailability?> GetAvailabilityByIdAsync(int availabilityId);
        Task<IEnumerable<DoctorAvailability>> GetMyAvailabilityAsync(int doctorId);
        Task<IEnumerable<Appointment>> GetMyAppointmentsAsync(int doctorId);
        Task DeleteAvailabilityAsync(int doctorId, int availabilityId);
    }
}
