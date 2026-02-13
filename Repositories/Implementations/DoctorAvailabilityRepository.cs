using Appoint.Data;
using Appoint.Models;
using Appoint.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Appoint.Repositories.Implementations
{
    public class DoctorAvailabilityRepository : Repository<DoctorAvailability>, IDoctorAvailabilityRepository
    {
        public DoctorAvailabilityRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<DoctorAvailability>> GetByDoctorIdAsync(int doctorId)
        {
            return await _dbSet
                .Where(a => a.DoctorId == doctorId)
                .OrderBy(a => a.AvailableDate)
                .ThenBy(a => a.StartTime)
                .ToListAsync<DoctorAvailability>();
        }

        public async Task<IEnumerable<DoctorAvailability>> GetAvailableDoctorsAsync(DateTime date, TimeSpan startTime, TimeSpan endTime)
        {
            return await _dbSet
                .Where(a => a.AvailableDate == date &&
                            a.StartTime <= startTime &&
                            a.EndTime >= endTime &&
                            !a.IsBooked)
                .ToListAsync<DoctorAvailability>();
        }
    }
}
