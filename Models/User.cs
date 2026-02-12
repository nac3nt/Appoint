using System.ComponentModel.DataAnnotations;

namespace Appoint.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [EmailAddress]
        [MaxLength(100)]
        public required string Email { get; set; }

        [MaxLength(255)]
        public required string PasswordHash { get; set; }

        [MaxLength(20)]
        public required string Role { get; set; }

        [MaxLength(100)]
        public required string Name { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public void SetPassword(string password)
        {
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool VerifyPassword(string password)
        {
            return BCrypt.Net.BCrypt.Verify(password, PasswordHash);
        }
    }
}
