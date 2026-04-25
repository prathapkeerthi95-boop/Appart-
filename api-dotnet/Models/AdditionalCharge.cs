using System;
using System.ComponentModel.DataAnnotations;

namespace ApartmentApi.Models
{
    public class AdditionalCharge
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string ChargeName { get; set; } = string.Empty;

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public string ChargeType { get; set; } = "Fine"; // Fine, Additional, etc.

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
