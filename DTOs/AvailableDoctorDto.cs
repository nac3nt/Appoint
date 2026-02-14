namespace Appoint.DTOs
{
    public class AvailableDoctorDto
    {
        public int Id { get; set; }
        public int DoctorId { get; set; }
        public required string DoctorName { get; set; }
    }
}
