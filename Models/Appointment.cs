using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Appoint.Enums;

namespace Appoint.Models
{
    public class Appointment
    {
        [Key]
        public int Id { get; set; }

        public required int RequestId { get; set; }

        public required int PatientId { get; set; }

        public required int DoctorId { get; set; }

        public required DateTime AppointmentDate { get; set; }

        public required TimeSpan StartTime { get; set; }

        public required TimeSpan EndTime { get; set; }

        public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [ForeignKey("RequestId")]
        public AppointmentRequest? Request { get; set; }

        [ForeignKey("PatientId")]
        public User? Patient { get; set; }

        [ForeignKey("DoctorId")]
        public User? Doctor { get; set; }
    }
}
