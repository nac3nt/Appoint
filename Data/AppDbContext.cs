using Appoint.Models;
using Microsoft.EntityFrameworkCore;

namespace Appoint.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<DoctorAvailability> DoctorAvailability { get; set; }
        public DbSet<AppointmentRequest> AppointmentRequests { get; set; }
        public DbSet<Appointment> Appointments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Configuration
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // DoctorAvailability Configuration
            modelBuilder.Entity<DoctorAvailability>()
                .HasOne(d => d.Doctor)
                .WithMany()
                .HasForeignKey(d => d.DoctorId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

            modelBuilder.Entity<DoctorAvailability>()
                .HasIndex(d => d.DoctorId);

            modelBuilder.Entity<DoctorAvailability>()
                .HasIndex(d => d.AvailableDate);

            // AppointmentRequest Configuration
            modelBuilder.Entity<AppointmentRequest>()
                .HasOne(a => a.Patient)
                .WithMany()
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

            modelBuilder.Entity<AppointmentRequest>()
                .HasIndex(a => a.PatientId);

            modelBuilder.Entity<AppointmentRequest>()
                .HasIndex(a => a.Status);

            // Appointment Configuration
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Request)
                .WithMany()
                .HasForeignKey(a => a.RequestId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany()
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Doctor)
                .WithMany()
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

            modelBuilder.Entity<Appointment>()
                .HasIndex(a => a.PatientId);

            modelBuilder.Entity<Appointment>()
                .HasIndex(a => a.DoctorId);
        }
    }
}
