using Appoint.DTOs;
using Appoint.Models;

namespace Appoint.Services.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginDto dto);
        Task<User> RegisterAsync(RegisterDto dto);
    }
}
