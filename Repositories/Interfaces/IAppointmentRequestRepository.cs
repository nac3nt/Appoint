using Appoint.Models;

namespace Appoint.Repositories.Interfaces
{
    public interface IAppointmentRequestRepository : IRepository<AppointmentRequest>
    {
        Task<IEnumerable<AppointmentRequest>> GetPendingRequestsAsync();
        Task<IEnumerable<AppointmentRequest>> GetByPatientIdAsync(int patientId);
    }
}
