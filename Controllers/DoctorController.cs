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
    [Authorize(Roles = "Doctor")]
    public class DoctorController : ControllerBase
    {
        private readonly IDoctorService _doctorService;

        public DoctorController(IDoctorService doctorService)
        {
            _doctorService = doctorService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpPost("availability")]
        [ProducesResponseType(typeof(DoctorAvailability), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<DoctorAvailability>> AddAvailability([FromBody] CreateAvailabilityDto dto)
        {
            var userId = GetCurrentUserId();
            var result = await _doctorService.AddAvailabilityAsync(userId, dto);
            return CreatedAtAction(nameof(GetAvailability), new { id = result.Id }, result);
        }

        [HttpGet("availability/{id}")]
        [ProducesResponseType(typeof(DoctorAvailability), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<DoctorAvailability>> GetAvailability(int id)
        {
            var availability = await _doctorService.GetAvailabilityByIdAsync(id);

            if (availability == null)
                return NotFound();

            return availability;
        }

        [HttpGet("availability")]
        [ProducesResponseType(typeof(IEnumerable<DoctorAvailability>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<DoctorAvailability>>> GetMyAvailability()
        {
            var userId = GetCurrentUserId();
            var slots = await _doctorService.GetMyAvailabilityAsync(userId);
            return Ok(slots);
        }

        [HttpGet("my-appointments")]
        [ProducesResponseType(typeof(IEnumerable<Appointment>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetMyAppointments()
        {
            var userId = GetCurrentUserId();
            var appointments = await _doctorService.GetMyAppointmentsAsync(userId);
            return Ok(appointments);
        }

        [HttpDelete("availability/{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> DeleteAvailability(int id)
        {
            var userId = GetCurrentUserId();
            await _doctorService.DeleteAvailabilityAsync(userId, id);
            return NoContent();
        }
    }
}
