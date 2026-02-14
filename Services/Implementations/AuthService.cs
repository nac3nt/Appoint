using Appoint.DTOs;
using Appoint.Exceptions;
using Appoint.Helpers;
using Appoint.Models;
using Appoint.Repositories.Interfaces;
using Appoint.Services.Interfaces;

namespace Appoint.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly IRepository<User> _userRepository;
        private readonly JwtHelper _jwtHelper;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IRepository<User> userRepository,
            JwtHelper jwtHelper,
            ILogger<AuthService> logger)
        {
            _userRepository = userRepository;
            _jwtHelper = jwtHelper;
            _logger = logger;
        }

        public async Task<LoginResponseDto> LoginAsync(LoginDto dto)
        {
            try
            {
                var user = await _userRepository.FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (user == null)
                {
                    throw new UnauthorizedException("Invalid email or password");
                }

                if (!user.VerifyPassword(dto.Password))
                {
                    throw new UnauthorizedException("Invalid email or password");
                }

                var token = _jwtHelper.GenerateToken(user);

                return new LoginResponseDto
                {
                    Token = token,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Email = user.Email,
                        Name = user.Name,
                        Role = user.Role
                    }
                };
            }
            catch (UnauthorizedException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for email: {Email}", dto.Email);
                throw new BusinessException("An error occurred during login");
            }
        }

        public async Task<User> RegisterAsync(RegisterDto dto)
        {
            try
            {
                var existingUser = await _userRepository.FirstOrDefaultAsync(u => u.Email == dto.Email);
                if (existingUser != null)
                {
                    throw new ConflictException("Email already exists");
                }

                var validRoles = new[] { "Patient", "Doctor", "Admin" };
                if (!validRoles.Contains(dto.Role))
                {
                    throw new ValidationException("Invalid role. Must be Patient, Doctor, or Admin");
                }

                var user = new User
                {
                    Email = dto.Email,
                    Name = dto.Name,
                    Role = dto.Role,
                    PasswordHash = ""
                };
                user.SetPassword(dto.Password);

                var created = await _userRepository.AddAsync(user);

                return created;
            }
            catch (ConflictException)
            {
                throw;
            }
            catch (ValidationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for email: {Email}", dto.Email);
                throw new BusinessException("An error occurred during registration");
            }
        }
    }
}
