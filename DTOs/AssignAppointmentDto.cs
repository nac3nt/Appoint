using System.ComponentModel.DataAnnotations;

namespace Appoint.DTOs
{
    public class AssignAppointmentDto
    {
        [Required]
        public required int RequestId { get; set; }

        [Required]
        public required int DoctorId { get; set; }

        [Required]
        public required int AvailabilityId { get; set; }
    }
}
