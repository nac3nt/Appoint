using Appoint.DTOs;
using Appoint.Enums;
using Appoint.Exceptions;
using Appoint.Models;
using Appoint.Repositories.Interfaces;
using Appoint.Services.Interfaces;

namespace Appoint.Services.Implementations
{
    public class PatientService : IPatientService
    {
        private readonly IRepository<AppointmentRequest> _requestRepository;
        private readonly IRepository<Appointment> _appointmentRepository;
        private readonly ILogger<PatientService> _logger;

        public PatientService(
            IRepository<AppointmentRequest> requestRepository,
            IRepository<Appointment> appointmentRepository,
            ILogger<PatientService> logger)
        {
            _requestRepository = requestRepository;
            _appointmentRepository = appointmentRepository;
            _logger = logger;
        }

        public async Task<AppointmentRequest> CreateRequestAsync(int patientId, CreateAppointmentRequestDto dto)
        {
            try
            {
                var request = new AppointmentRequest
                {
                    PatientId = patientId,
                    RequestDate = dto.RequestDate,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    Status = AppointmentStatus.Pending
                };

                return await _requestRepository.AddAsync(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating appointment request for patient: {PatientId}", patientId);
                throw new BusinessException("Failed to create appointment request");
            }
        }

        public async Task<IEnumerable<AppointmentRequest>> GetMyRequestsAsync(int patientId)
        {
            try
            {
                return await _requestRepository.FindAsync(r => r.PatientId == patientId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting requests for patient: {PatientId}", patientId);
                throw new BusinessException("Failed to retrieve appointment requests");
            }
        }

        public async Task<IEnumerable<Appointment>> GetMyAppointmentsAsync(int patientId)
        {
            try
            {
                return await _appointmentRepository.FindAsync(a => a.PatientId == patientId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointments for patient: {PatientId}", patientId);
                throw new BusinessException("Failed to retrieve appointments");
            }
        }
    }
}
