using System.ComponentModel.DataAnnotations;

namespace Appoint.DTOs
{
    public class RegisterDto
    {
        [EmailAddress]
        public required string Email { get; set; }

        [MinLength(3)]
        public required string Password { get; set; }

        public required string Name { get; set; }

        public required string Role { get; set; }
    }
}
