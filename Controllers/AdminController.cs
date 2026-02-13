using Appoint.DTOs;
using Appoint.Models;
using Appoint.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Appoint.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAppointmentRequestRepository _requestRepository;
        private readonly IDoctorAvailabilityRepository _availabilityRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUserRepository _userRepository;

        public AdminController(
            IAppointmentRequestRepository requestRepository,
            IDoctorAvailabilityRepository availabilityRepository,
            IAppointmentRepository appointmentRepository,
            IUserRepository userRepository)
        {
            _requestRepository = requestRepository;
            _availabilityRepository = availabilityRepository;
            _appointmentRepository = appointmentRepository;
            _userRepository = userRepository;
        }

        [HttpGet("pending-requests")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var requests = await _requestRepository.GetPendingRequestsAsync();
            return Ok(requests);
        }

        [HttpGet("available-doctors")]
        public async Task<IActionResult> GetAvailableDoctors([FromQuery] DateTime date, [FromQuery] string startTime, [FromQuery] string endTime)
        {
            var start = TimeSpan.Parse(startTime);
            var end = TimeSpan.Parse(endTime);

            // Get all doctors who have availability on this date
            var availableSlots = await _availabilityRepository.GetAvailableDoctorsAsync(date, start, end);

            var result = new List<object>();

            foreach (var slot in availableSlots)
            {
                // Check if this doctor has any conflicting appointments on this date/time
                var doctorAppointments = await _appointmentRepository.GetByDoctorIdAsync(slot.DoctorId);

                var hasConflict = doctorAppointments.Any(apt =>
                    apt.AppointmentDate == date &&
                    ((start >= apt.StartTime && start < apt.EndTime) ||  // Request starts during existing appointment
                     (end > apt.StartTime && end <= apt.EndTime) ||      // Request ends during existing appointment
                     (start <= apt.StartTime && end >= apt.EndTime))     // Request completely overlaps existing appointment
                );

                if (!hasConflict)
                {
                    var doctor = await _userRepository.GetByIdAsync(slot.DoctorId);
                    result.Add(new
                    {
                        slot.Id,
                        slot.DoctorId,
                        DoctorName = doctor?.Name
                    });
                }
            }

            return Ok(result);
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignAppointment([FromBody] AssignAppointmentDto dto)
        {
            var request = await _requestRepository.GetByIdAsync(dto.RequestId);
            if (request == null)
                return NotFound(new { message = "Request not found" });

            var availability = await _availabilityRepository.GetByIdAsync(dto.AvailabilityId);
            if (availability == null)
                return NotFound(new { message = "Availability slot not found" });

            // Check if the doctor has any conflicting appointments
            var doctorAppointments = await _appointmentRepository.GetByDoctorIdAsync(dto.DoctorId);

            var hasConflict = doctorAppointments.Any(apt =>
                apt.AppointmentDate == request.RequestDate &&
                ((request.StartTime >= apt.StartTime && request.StartTime < apt.EndTime) ||
                 (request.EndTime > apt.StartTime && request.EndTime <= apt.EndTime) ||
                 (request.StartTime <= apt.StartTime && request.EndTime >= apt.EndTime))
            );

            if (hasConflict)
                return BadRequest(new { message = "Doctor already has an appointment at this time" });

            // Create appointment
            var appointment = new Appointment
            {
                RequestId = dto.RequestId,
                PatientId = request.PatientId,
                DoctorId = dto.DoctorId,
                AppointmentDate = request.RequestDate,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Status = "Scheduled"
            };

            await _appointmentRepository.AddAsync(appointment);

            // Update request status
            request.Status = "Approved";
            await _requestRepository.UpdateAsync(request);

            // DO NOT mark availability as booked - it can handle multiple appointments
            // availability.IsBooked = true;  // REMOVE THIS LINE

            return Ok(appointment);
        }

        [HttpGet("all-appointments")]
        public async Task<IActionResult> GetAllAppointments()
        {
            var appointments = await _appointmentRepository.GetAllAsync();
            return Ok(appointments);
        }

        [HttpGet("all-users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userRepository.GetAllAsync();
            return Ok(users.Select(u => new { u.Id, u.Email, u.Name, u.Role }));
        }
    }
}
