using Appoint.Models;

namespace Appoint.Services.Interfaces
{
    public interface INotificationService
    {
        Task CreateAppointmentConfirmedNotificationsAsync(int appointmentId);
        Task<IEnumerable<Notification>> GetMyNotificationsAsync(int userId);
        Task<int> GetUnreadCountAsync(int userId);
        Task DeleteNotificationAsync(int notificationId, int userId);
    }
}
