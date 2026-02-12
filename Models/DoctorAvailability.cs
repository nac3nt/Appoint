using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Appoint.Models
{
    public class DoctorAvailability
    {
        [Key]
        public int Id { get; set; }

        public required int DoctorId { get; set; }

        public required DateTime AvailableDate { get; set; }

        public required TimeSpan StartTime { get; set; }

        public required TimeSpan EndTime { get; set; }

        public bool IsBooked { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation property - nullable because EF may not load it
        [ForeignKey("DoctorId")]
        public User? Doctor { get; set; }
    }
}
