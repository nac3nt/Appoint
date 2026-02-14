using Appoint.DTOs;
using Appoint.Enums;
using Appoint.Exceptions;
using Appoint.Models;
using Appoint.Repositories.Interfaces;
using Appoint.Services.Interfaces;

namespace Appoint.Services.Implementations
{
    public class AdminService : IAdminService
    {
        private readonly IRepository<AppointmentRequest> _requestRepository;
        private readonly IRepository<DoctorAvailability> _availabilityRepository;
        private readonly IRepository<Appointment> _appointmentRepository;
        private readonly IRepository<User> _userRepository;
        private readonly ILogger<AdminService> _logger;

        public AdminService(
            IRepository<AppointmentRequest> requestRepository,
            IRepository<DoctorAvailability> availabilityRepository,
            IRepository<Appointment> appointmentRepository,
            IRepository<User> userRepository,
            ILogger<AdminService> logger)
        {
            _requestRepository = requestRepository;
            _availabilityRepository = availabilityRepository;
            _appointmentRepository = appointmentRepository;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<IEnumerable<AppointmentRequest>> GetPendingRequestsAsync()
        {
            try
            {
                return await _requestRepository.FindAsync(
                    r => r.Status == AppointmentStatus.Pending
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending requests");
                throw new BusinessException("Failed to retrieve pending requests");
            }
        }

        public async Task<IEnumerable<AvailableDoctorDto>> GetAvailableDoctorsAsync(DateTime date, TimeSpan startTime, TimeSpan endTime)
        {
            try
            {
                // Get all availability slots for the requested date
                var allAvailabilitySlots = await _availabilityRepository.FindAsync(
                    a => a.AvailableDate == date
                );

                // Group slots by doctor
                var slotsByDoctor = allAvailabilitySlots.GroupBy(a => a.DoctorId);

                var availableDoctors = new List<AvailableDoctorDto>();

                foreach (var doctorSlots in slotsByDoctor)
                {
                    var doctorId = doctorSlots.Key;

                    // Merge adjacent/overlapping slots for this doctor
                    var mergedSlots = MergeAdjacentSlots(doctorSlots.ToList());

                    // Check if request fits within any merged slot
                    var fitsInAnySlot = mergedSlots.Any(slot =>
                        slot.StartTime <= startTime && slot.EndTime >= endTime
                    );

                    if (!fitsInAnySlot)
                        continue;

                    // Check if this doctor has conflicting appointments
                    var doctorAppointments = await _appointmentRepository.FindAsync(
                        apt => apt.DoctorId == doctorId && apt.AppointmentDate == date
                    );

                    var hasConflict = doctorAppointments.Any(apt =>
                        (startTime >= apt.StartTime && startTime < apt.EndTime) ||
                        (endTime > apt.StartTime && endTime <= apt.EndTime) ||
                        (startTime <= apt.StartTime && endTime >= apt.EndTime)
                    );

                    if (hasConflict)
                        continue;

                    // Get doctor details
                    var doctor = await _userRepository.GetByIdAsync(doctorId);
                    if (doctor != null)
                    {
                        // Use the first slot that covers the time (for availabilityId)
                        var coveringSlot = doctorSlots.FirstOrDefault(s =>
                            s.StartTime <= startTime && s.EndTime >= endTime
                        ) ?? doctorSlots.First();

                        availableDoctors.Add(new AvailableDoctorDto
                        {
                            Id = coveringSlot.Id,
                            DoctorId = doctorId,
                            DoctorName = doctor.Name
                        });
                    }
                }

                return availableDoctors;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available doctors for date: {Date}, time: {Start}-{End}", date, startTime, endTime);
                throw new BusinessException("Failed to retrieve available doctors");
            }
        }

        // Helper method to merge adjacent/overlapping slots
        private List<DoctorAvailability> MergeAdjacentSlots(List<DoctorAvailability> slots)
        {
            if (slots.Count == 0)
                return slots;

            // Sort slots by start time
            var sortedSlots = slots.OrderBy(s => s.StartTime).ToList();

            var mergedSlots = new List<DoctorAvailability>();
            var currentSlot = sortedSlots[0];

            for (int i = 1; i < sortedSlots.Count; i++)
            {
                var nextSlot = sortedSlots[i];

                // Check if slots are adjacent or overlapping
                // Adjacent: current.EndTime == next.StartTime
                // Overlapping: current.EndTime > next.StartTime
                if (currentSlot.EndTime >= nextSlot.StartTime)
                {
                    // Merge: extend current slot to cover next slot
                    currentSlot = new DoctorAvailability
                    {
                        Id = currentSlot.Id, // Keep first slot's ID
                        DoctorId = currentSlot.DoctorId,
                        AvailableDate = currentSlot.AvailableDate,
                        StartTime = currentSlot.StartTime,
                        EndTime = nextSlot.EndTime > currentSlot.EndTime ? nextSlot.EndTime : currentSlot.EndTime,
                        CreatedAt = currentSlot.CreatedAt
                    };
                }
                else
                {
                    // No overlap/adjacency - add current to merged list and move to next
                    mergedSlots.Add(currentSlot);
                    currentSlot = nextSlot;
                }
            }

            // Add the last slot
            mergedSlots.Add(currentSlot);

            return mergedSlots;
        }

        public async Task<Appointment> AssignAppointmentAsync(AssignAppointmentDto dto)
        {
            try
            {
                var request = await _requestRepository.GetByIdAsync(dto.RequestId);
                if (request == null)
                {
                    throw new NotFoundException("Appointment request not found");
                }

                var availability = await _availabilityRepository.GetByIdAsync(dto.AvailabilityId);
                if (availability == null)
                {
                    throw new NotFoundException("Availability slot not found");
                }

                // Check if the doctor has any conflicting appointments
                var doctorAppointments = await _appointmentRepository.FindAsync(
                    apt => apt.DoctorId == dto.DoctorId && apt.AppointmentDate == request.RequestDate
                );

                var hasConflict = doctorAppointments.Any(apt =>
                    (request.StartTime >= apt.StartTime && request.StartTime < apt.EndTime) ||
                    (request.EndTime > apt.StartTime && request.EndTime <= apt.EndTime) ||
                    (request.StartTime <= apt.StartTime && request.EndTime >= apt.EndTime)
                );

                if (hasConflict)
                {
                    throw new ConflictException("Doctor already has an appointment at this time");
                }

                var appointment = new Appointment
                {
                    RequestId = dto.RequestId,
                    PatientId = request.PatientId,
                    DoctorId = dto.DoctorId,
                    AppointmentDate = request.RequestDate,
                    StartTime = request.StartTime,
                    EndTime = request.EndTime,
                    Status = AppointmentStatus.Scheduled
                };

                var created = await _appointmentRepository.AddAsync(appointment);

                request.Status = AppointmentStatus.Approved;
                await _requestRepository.UpdateAsync(request);

                return created;
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (ConflictException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning appointment for request: {RequestId}", dto.RequestId);
                throw new BusinessException("Failed to assign appointment");
            }
        }

        public async Task<IEnumerable<Appointment>> GetAllAppointmentsAsync()
        {
            try
            {
                return await _appointmentRepository.GetAllAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all appointments");
                throw new BusinessException("Failed to retrieve appointments");
            }
        }
    }
}
