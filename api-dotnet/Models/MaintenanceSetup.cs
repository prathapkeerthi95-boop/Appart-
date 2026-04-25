using System;
using System.ComponentModel.DataAnnotations;

namespace ApartmentApi.Models
{
    public class MaintenanceSetup
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public decimal MonthlyAmount { get; set; }

        [Required]
        public int DueDate { get; set; } = 10; // Default due on 10th of every month

        public string Description { get; set; } = string.Empty;

        public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
