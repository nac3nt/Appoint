using Appoint.Models;

namespace Appoint.Repositories.Interfaces
{
    public interface IDoctorAvailabilityRepository : IRepository<DoctorAvailability>
    {
        Task<IEnumerable<DoctorAvailability>> GetByDoctorIdAsync(int doctorId);
        Task<IEnumerable<DoctorAvailability>> GetAvailableDoctorsAsync(DateTime date, TimeSpan startTime, TimeSpan endTime);
    }
}
