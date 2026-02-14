using Appoint.DTOs;
using Appoint.Exceptions;
using Appoint.Models;
using Appoint.Repositories.Interfaces;
using Appoint.Services.Interfaces;

namespace Appoint.Services.Implementations
{
    public class DoctorService : IDoctorService
    {
        private readonly IRepository<DoctorAvailability> _availabilityRepository;
        private readonly IRepository<Appointment> _appointmentRepository;
        private readonly ILogger<DoctorService> _logger;

        public DoctorService(
            IRepository<DoctorAvailability> availabilityRepository,
            IRepository<Appointment> appointmentRepository,
            ILogger<DoctorService> logger)
        {
            _availabilityRepository = availabilityRepository;
            _appointmentRepository = appointmentRepository;
            _logger = logger;
        }

        public async Task<DoctorAvailability> AddAvailabilityAsync(int doctorId, CreateAvailabilityDto dto)
        {
            try
            {
                // Check for overlapping availability
                var existingAvailability = await _availabilityRepository.FindAsync(
                    a => a.DoctorId == doctorId && a.AvailableDate == dto.AvailableDate
                );

                var hasOverlap = existingAvailability.Any(avail =>
                    dto.StartTime < avail.EndTime && dto.EndTime > avail.StartTime
                );

                if (hasOverlap)
                {
                    throw new ConflictException("This time overlaps with your existing availability. Please choose a different time or delete the overlapping slot first.");
                }

                var availability = new DoctorAvailability
                {
                    DoctorId = doctorId,
                    AvailableDate = dto.AvailableDate,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime
                };

                return await _availabilityRepository.AddAsync(availability);
            }
            catch (ConflictException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding availability for doctor: {DoctorId}", doctorId);
                throw new BusinessException("Failed to add availability");
            }
        }

        public async Task<DoctorAvailability?> GetAvailabilityByIdAsync(int availabilityId)
        {
            try
            {
                return await _availabilityRepository.GetByIdAsync(availabilityId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting availability: {AvailabilityId}", availabilityId);
                throw new BusinessException("Failed to retrieve availability");
            }
        }

        public async Task<IEnumerable<DoctorAvailability>> GetMyAvailabilityAsync(int doctorId)
        {
            try
            {
                return await _availabilityRepository.FindAsync(a => a.DoctorId == doctorId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting availability for doctor: {DoctorId}", doctorId);
                throw new BusinessException("Failed to retrieve availability");
            }
        }

        public async Task<IEnumerable<Appointment>> GetMyAppointmentsAsync(int doctorId)
        {
            try
            {
                return await _appointmentRepository.FindAsync(a => a.DoctorId == doctorId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointments for doctor: {DoctorId}", doctorId);
                throw new BusinessException("Failed to retrieve appointments");
            }
        }

        public async Task DeleteAvailabilityAsync(int doctorId, int availabilityId)
        {
            try
            {
                var availability = await _availabilityRepository.GetByIdAsync(availabilityId);

                if (availability == null)
                {
                    throw new NotFoundException("Availability slot not found");
                }

                if (availability.DoctorId != doctorId)
                {
                    throw new UnauthorizedException("You are not authorized to delete this availability");
                }

                var appointments = await _appointmentRepository.FindAsync(
                    apt => apt.DoctorId == doctorId &&
                    apt.AppointmentDate == availability.AvailableDate &&
                    apt.StartTime < availability.EndTime &&
                    apt.EndTime > availability.StartTime
                );

                if (appointments.Any())
                {
                    throw new ConflictException("Cannot delete availability slot with existing appointments");
                }

                var deleted = await _availabilityRepository.DeleteAsync(availabilityId);

                if (!deleted)
                {
                    throw new BusinessException("Failed to delete availability");
                }
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (UnauthorizedException)
            {
                throw;
            }
            catch (ConflictException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting availability {AvailabilityId} for doctor: {DoctorId}", availabilityId, doctorId);
                throw new BusinessException("An error occurred while deleting availability");
            }
        }
    }
}
