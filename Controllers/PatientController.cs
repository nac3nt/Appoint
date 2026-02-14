using Appoint.DTOs;
using Appoint.Models;
using Appoint.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Appoint.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Patient")]
    public class PatientController : ControllerBase
    {
        private readonly IPatientService _patientService;

        public PatientController(IPatientService patientService)
        {
            _patientService = patientService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpPost("request")]
        [ProducesResponseType(typeof(AppointmentRequest), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AppointmentRequest>> CreateRequest([FromBody] CreateAppointmentRequestDto dto)
        {
            var userId = GetCurrentUserId();
            var result = await _patientService.CreateRequestAsync(userId, dto);
            return CreatedAtAction(nameof(GetMyRequests), new { id = result.Id }, result);
        }

        [HttpGet("my-requests")]
        [ProducesResponseType(typeof(IEnumerable<AppointmentRequest>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AppointmentRequest>>> GetMyRequests()
        {
            var userId = GetCurrentUserId();
            var requests = await _patientService.GetMyRequestsAsync(userId);
            return Ok(requests);
        }

        [HttpGet("my-appointments")]
        [ProducesResponseType(typeof(IEnumerable<Appointment>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetMyAppointments()
        {
            var userId = GetCurrentUserId();
            var appointments = await _patientService.GetMyAppointmentsAsync(userId);
            return Ok(appointments);
        }
    }
}
