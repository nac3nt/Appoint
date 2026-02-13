using Appoint.Data;
using Appoint.Models;
using Appoint.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Appoint.Repositories.Implementations
{
    public class AppointmentRequestRepository : Repository<AppointmentRequest>, IAppointmentRequestRepository
    {
        public AppointmentRequestRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<AppointmentRequest>> GetPendingRequestsAsync()
        {
            return await _dbSet
                .Where(r => r.Status == "Pending")
                .OrderBy(r => r.RequestDate)
                .ThenBy(r => r.StartTime)
                .ToListAsync<AppointmentRequest>();
        }

        public async Task<IEnumerable<AppointmentRequest>> GetByPatientIdAsync(int patientId)
        {
            return await _dbSet
                .Where(r => r.PatientId == patientId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync<AppointmentRequest>();
        }
    }
}
