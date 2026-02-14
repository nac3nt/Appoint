using Appoint.DTOs;
using Appoint.Models;
using Appoint.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Appoint.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("pending-requests")]
        [ProducesResponseType(typeof(IEnumerable<AppointmentRequest>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AppointmentRequest>>> GetPendingRequests()
        {
            var requests = await _adminService.GetPendingRequestsAsync();
            return Ok(requests);
        }

        [HttpGet("available-doctors")]
        [ProducesResponseType(typeof(IEnumerable<AvailableDoctorDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<IEnumerable<AvailableDoctorDto>>> GetAvailableDoctors(
            [FromQuery] DateTime date,
            [FromQuery] string startTime,
            [FromQuery] string endTime)
        {
            if (!TimeSpan.TryParse(startTime, out var start) || !TimeSpan.TryParse(endTime, out var end))
                return BadRequest(new { error = "Invalid time format" });

            var doctors = await _adminService.GetAvailableDoctorsAsync(date, start, end);
            return Ok(doctors);
        }

        [HttpPost("assign")]
        [ProducesResponseType(typeof(Appointment), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<Appointment>> AssignAppointment([FromBody] AssignAppointmentDto dto)
        {
            var appointment = await _adminService.AssignAppointmentAsync(dto);
            return CreatedAtAction(nameof(GetAllAppointments), new { id = appointment.Id }, appointment);
        }

        [HttpGet("all-appointments")]
        [ProducesResponseType(typeof(IEnumerable<Appointment>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAllAppointments()
        {
            var appointments = await _adminService.GetAllAppointmentsAsync();
            return Ok(appointments);
        }
    }
}
