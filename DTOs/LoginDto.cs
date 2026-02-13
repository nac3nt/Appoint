using System.ComponentModel.DataAnnotations;

namespace Appoint.DTOs
{
    public class LoginDto
    {
        [EmailAddress]
        public required string Email { get; set; }

        public required string Password { get; set; }
    }
}
