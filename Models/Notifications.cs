using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Appoint.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        public required int UserId { get; set; }

        public required string Title { get; set; }

        public required string Message { get; set; }

        public string? DoctorName { get; set; } // For patient notifications

        public string? PatientName { get; set; } // For doctor notifications

        public required DateTime AppointmentDate { get; set; }

        public required TimeSpan AppointmentStartTime { get; set; }

        public required TimeSpan AppointmentEndTime { get; set; }

        public required int RelatedAppointmentId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [ForeignKey("RelatedAppointmentId")]
        public Appointment? Appointment { get; set; }
    }
}
