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
        public DbSet<Notification> Notifications { get; set; }

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
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DoctorAvailability>()
                .HasIndex(d => d.DoctorId);

            modelBuilder.Entity<DoctorAvailability>()
                .HasIndex(d => d.AvailableDate);

            // AppointmentRequest Configuration
            modelBuilder.Entity<AppointmentRequest>()
                .HasOne(a => a.Patient)
                .WithMany()
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AppointmentRequest>()
                .HasIndex(a => a.PatientId);

            modelBuilder.Entity<AppointmentRequest>()
                .HasIndex(a => a.Status);

            // Appointment Configuration
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Request)
                .WithMany()
                .HasForeignKey(a => a.RequestId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany()
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Doctor)
                .WithMany()
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasIndex(a => a.PatientId);

            modelBuilder.Entity<Appointment>()
                .HasIndex(a => a.DoctorId);

            // Notification Configuration
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Appointment)
                .WithMany()
                .HasForeignKey(n => n.RelatedAppointmentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.UserId);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => n.CreatedAt);
        }
    }
}
