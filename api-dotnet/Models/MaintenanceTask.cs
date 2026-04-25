using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApartmentApi.Models
{
    public class MaintenanceTask
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        public string FlatNumber { get; set; } = string.Empty;

        [Required]
        public string Priority { get; set; } = "Normal"; // Low, Normal, High, Urgent

        [Required]
        public string Status { get; set; } = "Pending"; // Pending, In Progress, Completed, Cancelled

        public string AssignedPerson { get; set; } = string.Empty;

        public DateTime? DueDate { get; set; }

        public DateTime? CompletionDate { get; set; }

        public decimal FinalCost { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
