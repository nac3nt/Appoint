using Appoint.DTOs;
using Appoint.Models;
using Appoint.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Appoint.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            return Ok(result);
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(User), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<ActionResult<User>> Register([FromBody] RegisterDto dto)
        {
            var user = await _authService.RegisterAsync(dto);
            return CreatedAtAction(nameof(Register), new { id = user.Id }, new { message = "User registered successfully" });
        }
    }
}
