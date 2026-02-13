using System.ComponentModel.DataAnnotations;

namespace Appoint.DTOs
{
    public class CreateAppointmentRequestDto
    {
        [Required]
        public required DateTime RequestDate { get; set; }

        [Required]
        public required TimeSpan StartTime { get; set; }

        [Required]
        public required TimeSpan EndTime { get; set; }
    }
}
