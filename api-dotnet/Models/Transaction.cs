using System;
using System.ComponentModel.DataAnnotations;

namespace ApartmentApi.Models
{
    public class Transaction
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Type { get; set; } = "Credit"; // Credit (Maintenance collected), Debit (Expense)

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public string Category { get; set; } = string.Empty; // Maintenance, Electricity, Water, Repair, Fine, etc.

        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    }
}
