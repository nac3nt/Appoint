using Appoint.Exceptions;
using Appoint.Models;
using Appoint.Repositories.Interfaces;
using Appoint.Services.Interfaces;

namespace Appoint.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly IRepository<Notification> _notificationRepository;
        private readonly IRepository<Appointment> _appointmentRepository;
        private readonly IRepository<User> _userRepository;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            IRepository<Notification> notificationRepository,
            IRepository<Appointment> appointmentRepository,
            IRepository<User> userRepository,
            ILogger<NotificationService> logger)
        {
            _notificationRepository = notificationRepository;
            _appointmentRepository = appointmentRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task CreateAppointmentConfirmedNotificationsAsync(int appointmentId)
        {
            try
            {
                var appointment = await _appointmentRepository.GetByIdAsync(appointmentId);
                if (appointment == null)
                {
                    throw new NotFoundException("Appointment not found");
                }

                var patient = await _userRepository.GetByIdAsync(appointment.PatientId);
                var doctor = await _userRepository.GetByIdAsync(appointment.DoctorId);

                if (patient == null || doctor == null)
                {
                    throw new NotFoundException("Patient or Doctor not found");
                }

                // Create notification for patient
                var patientNotification = new Notification
                {
                    UserId = appointment.PatientId,
                    Title = "Appointment Confirmed",
                    Message = "Your appointment has been confirmed!",
                    DoctorName = doctor.Name,
                    PatientName = null,
                    AppointmentDate = appointment.AppointmentDate,
                    AppointmentStartTime = appointment.StartTime,
                    AppointmentEndTime = appointment.EndTime,
                    RelatedAppointmentId = appointmentId
                };

                await _notificationRepository.AddAsync(patientNotification);

                // Create notification for doctor
                var doctorNotification = new Notification
                {
                    UserId = appointment.DoctorId,
                    Title = "New Appointment",
                    Message = "You have a new appointment!",
                    DoctorName = null,
                    PatientName = patient.Name,
                    AppointmentDate = appointment.AppointmentDate,
                    AppointmentStartTime = appointment.StartTime,
                    AppointmentEndTime = appointment.EndTime,
                    RelatedAppointmentId = appointmentId
                };

                await _notificationRepository.AddAsync(doctorNotification);

                _logger.LogInformation("Created notifications for appointment {AppointmentId}", appointmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notifications for appointment {AppointmentId}", appointmentId);
                throw;
            }
        }

        public async Task<IEnumerable<Notification>> GetMyNotificationsAsync(int userId)
        {
            try
            {
                var notifications = await _notificationRepository.FindAsync(n => n.UserId == userId);
                return notifications.OrderByDescending(n => n.CreatedAt);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications for user {UserId}", userId);
                throw new BusinessException("Failed to retrieve notifications");
            }
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            try
            {
                var notifications = await _notificationRepository.FindAsync(n => n.UserId == userId);
                return notifications.Count();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification count for user {UserId}", userId);
                throw new BusinessException("Failed to get notification count");
            }
        }

        public async Task DeleteNotificationAsync(int notificationId, int userId)
        {
            try
            {
                var notification = await _notificationRepository.GetByIdAsync(notificationId);

                if (notification == null)
                {
                    throw new NotFoundException("Notification not found");
                }

                if (notification.UserId != userId)
                {
                    throw new UnauthorizedException("You are not authorized to delete this notification");
                }

                var deleted = await _notificationRepository.DeleteAsync(notificationId);

                if (!deleted)
                {
                    throw new BusinessException("Failed to delete notification");
                }

                _logger.LogInformation("Deleted notification {NotificationId} for user {UserId}", notificationId, userId);
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (UnauthorizedException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification {NotificationId}", notificationId);
                throw new BusinessException("Failed to delete notification");
            }
        }
    }
}
