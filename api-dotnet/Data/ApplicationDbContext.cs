using Microsoft.EntityFrameworkCore;
using ApartmentApi.Models;

namespace ApartmentApi.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<PendingUser> PendingUsers { get; set; }
        public DbSet<MaintenanceSetup> MaintenanceSetups { get; set; }
        public DbSet<AdditionalCharge> AdditionalCharges { get; set; }
        public DbSet<Bill> Bills { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<MaintenancePayment> MaintenancePayments { get; set; }
        public DbSet<MaintenanceTask> MaintenanceTasks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Email).IsUnique();
            });
        }
    }
}
