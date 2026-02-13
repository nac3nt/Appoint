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
    [Authorize(Roles = "Doctor")]
    public class DoctorController : ControllerBase
    {
        private readonly IDoctorAvailabilityRepository _availabilityRepository;
        private readonly IAppointmentRepository _appointmentRepository;

        public DoctorController(
            IDoctorAvailabilityRepository availabilityRepository,
            IAppointmentRepository appointmentRepository)
        {
            _availabilityRepository = availabilityRepository;
            _appointmentRepository = appointmentRepository;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpPost("availability")]
        public async Task<IActionResult> AddAvailability([FromBody] CreateAvailabilityDto dto)
        {
            var availability = new DoctorAvailability
            {
                DoctorId = GetCurrentUserId(),
                AvailableDate = dto.AvailableDate,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                IsBooked = false
            };

            var created = await _availabilityRepository.AddAsync(availability);
            return Ok(created);
        }

        [HttpGet("availability")]
        public async Task<IActionResult> GetMyAvailability()
        {
            var userId = GetCurrentUserId();
            var slots = await _availabilityRepository.GetByDoctorIdAsync(userId);
            return Ok(slots);
        }

        [HttpGet("my-appointments")]
        public async Task<IActionResult> GetMyAppointments()
        {
            var userId = GetCurrentUserId();
            var appointments = await _appointmentRepository.GetByDoctorIdAsync(userId);
            return Ok(appointments);
        }

        [HttpDelete("availability/{id}")]
        public async Task<IActionResult> DeleteAvailability(int id)
        {
            var availability = await _availabilityRepository.GetByIdAsync(id);
            if (availability == null)
                return NotFound();

            if (availability.DoctorId != GetCurrentUserId())
                return Forbid();

            if (availability.IsBooked)
                return BadRequest(new { message = "Cannot delete booked slot" });

            var deleted = await _availabilityRepository.DeleteAsync(id);
            return deleted ? Ok() : NotFound();
        }
    }
}
