using System;
using System.ComponentModel.DataAnnotations;

namespace ApartmentApi.Models
{
    public class Bill
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string BillType { get; set; } = string.Empty; // Electricity, Water, Repair, etc.

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public string VendorName { get; set; } = string.Empty;

        [Required]
        public DateTime BillDate { get; set; }

        public string Description { get; set; } = string.Empty;

        public string FileName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
