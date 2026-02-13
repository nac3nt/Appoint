using Appoint.DTOs;
using Appoint.Models;
using Appoint.Repositories.Interfaces;
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
        private readonly IAppointmentRequestRepository _requestRepository;
        private readonly IAppointmentRepository _appointmentRepository;

        public PatientController(
            IAppointmentRequestRepository requestRepository,
            IAppointmentRepository appointmentRepository)
        {
            _requestRepository = requestRepository;
            _appointmentRepository = appointmentRepository;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpPost("request")]
        public async Task<IActionResult> CreateRequest([FromBody] CreateAppointmentRequestDto dto)
        {
            var request = new AppointmentRequest
            {
                PatientId = GetCurrentUserId(),
                RequestDate = dto.RequestDate,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Status = "Pending"
            };

            var created = await _requestRepository.AddAsync(request);
            return Ok(created);
        }

        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRequests()
        {
            var userId = GetCurrentUserId();
            var requests = await _requestRepository.GetByPatientIdAsync(userId);
            return Ok(requests);
        }

        [HttpGet("my-appointments")]
        public async Task<IActionResult> GetMyAppointments()
        {
            var userId = GetCurrentUserId();
            var appointments = await _appointmentRepository.GetByPatientIdAsync(userId);
            return Ok(appointments);
        }
    }
}
