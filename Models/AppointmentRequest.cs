using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Appoint.Models
{
    public class AppointmentRequest
    {
        [Key]
        public int Id { get; set; }

        public required int PatientId { get; set; }

        public required DateTime RequestDate { get; set; }

        public required TimeSpan StartTime { get; set; }

        public required TimeSpan EndTime { get; set; }

        [MaxLength(20)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey("PatientId")]
        public User? Patient { get; set; }
    }
}
