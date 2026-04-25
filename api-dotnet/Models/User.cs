using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ApartmentApi.Models
{
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string? Password { get; set; }

        [Required]
        public string Role { get; set; } = "user";

        public string? FlatNumber { get; set; }
        public string? ContactNumber { get; set; }
        public string? ResidentType { get; set; } = "Owner"; // Owner, Tenant, Committee, etc.

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
