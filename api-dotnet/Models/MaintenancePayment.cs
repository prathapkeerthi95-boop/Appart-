using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApartmentApi.Models
{
    public class MaintenancePayment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public string Month { get; set; } = string.Empty; // Format: YYYY-MM (e.g., 2026-02)

        public DateTime PaidDate { get; set; } = DateTime.UtcNow;

        [Required]
        public string Status { get; set; } = "Paid"; // Paid, Pending, Overdue

        public decimal LateFee { get; set; } = 0;

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
