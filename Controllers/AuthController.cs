using Appoint.DTOs;
using Appoint.Helpers;
using Appoint.Models;
using Appoint.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace Appoint.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly JwtHelper _jwtHelper;

        public AuthController(IUserRepository userRepository, JwtHelper jwtHelper)
        {
            _userRepository = userRepository;
            _jwtHelper = jwtHelper;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _userRepository.AuthenticateAsync(dto.Email, dto.Password);

            if (user == null)
                return Unauthorized(new { message = "Invalid email or password" });

            var token = _jwtHelper.GenerateToken(user);

            return Ok(new
            {
                Token = token,
                User = new
                {
                    user.Id,
                    user.Email,
                    user.Role,
                    user.Name
                }
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
            if (existingUser != null)
                return BadRequest(new { message = "Email already exists" });

            var validRoles = new[] { "Patient", "Doctor", "Admin" };
            if (!validRoles.Contains(dto.Role))
                return BadRequest(new { message = "Invalid role. Must be Patient, Doctor, or Admin" });

            var user = new User
            {
                Email = dto.Email,
                Name = dto.Name,
                Role = dto.Role,
                PasswordHash = "" // Temporary, will be set below
            };
            user.SetPassword(dto.Password);

            await _userRepository.AddAsync(user);

            return Ok(new { message = "User registered successfully" });
        }
    }
}
