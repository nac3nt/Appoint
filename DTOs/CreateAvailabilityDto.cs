using System.ComponentModel.DataAnnotations;

namespace Appoint.DTOs
{
    public class CreateAvailabilityDto
    {
        [Required]
        public required DateTime AvailableDate { get; set; }

        [Required]
        public required TimeSpan StartTime { get; set; }

        [Required]
        public required TimeSpan EndTime { get; set; }
    }
}
