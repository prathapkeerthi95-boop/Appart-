using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentApi.Data;
using ApartmentApi.Models;
using Microsoft.AspNetCore.Authorization;
using System.Linq;

namespace ApartmentApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class BillsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BillsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetBills()
        {
            var bills = await _context.Bills.OrderByDescending(b => b.BillDate).ToListAsync();
            return Ok(bills);
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadBill([FromForm] string vendorName, [FromForm] decimal amount, [FromForm] string billType, [FromForm] DateTime billDate, [FromForm] string description, IFormFile? file)
        {
            string fileName = "";
            if (file != null && file.Length > 0)
            {
                fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "bills", fileName);
                
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
            }

            var model = new Bill
            {
                VendorName = vendorName,
                Amount = amount,
                BillType = billType,
                BillDate = billDate,
                Description = description,
                FileName = fileName,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bills.Add(model);
            
            // Log as expense in transactions
            var transaction = new Transaction
            {
                Type = "Debit",
                Amount = model.Amount,
                Description = $"Bill: {model.BillType} ({model.VendorName})",
                Category = model.BillType,
                TransactionDate = model.BillDate
            };
            _context.Transactions.Add(transaction);
            
            await _context.SaveChangesAsync();
            return Ok(model);
        }

        [HttpPost("ai-categorize")]
        public async Task<IActionResult> AiCategorize([FromBody] Bill model)
        {
            // Simple rule-based "AI" mock
            var suggestion = "Other";
            var vendorLower = model.VendorName.ToLower();
            
            if (vendorLower.Contains("bescom") || vendorLower.Contains("electric")) suggestion = "Electricity";
            else if (vendorLower.Contains("water") || vendorLower.Contains("bwssb")) suggestion = "Water";
            else if (vendorLower.Contains("salary") || vendorLower.Contains("staff")) suggestion = "Staff Salary";
            else if (vendorLower.Contains("security")) suggestion = "Security";
            else if (vendorLower.Contains("repair") || vendorLower.Contains("plumb") || vendorLower.Contains("fix")) suggestion = "Maintenance";

            // Check for potential duplicate this month
            var monthStart = new DateTime(model.BillDate.Year, model.BillDate.Month, 1);
            var monthEnd = monthStart.AddMonths(1);
            var duplicates = await _context.Bills.AnyAsync(b => 
                b.VendorName.ToLower() == vendorLower && 
                b.BillDate >= monthStart && b.BillDate < monthEnd);

            return Ok(new {
                suggestedCategory = suggestion,
                confidence = 0.95,
                isPotentialDuplicate = duplicates,
                insight = duplicates ? "⚠️ Alert: A bill from this vendor already exists for this month." : 
                          "✅ Insight: This vendor is consistent with previous months' spending."
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBill(int id, [FromBody] Bill model)
        {
            if (id != model.Id) return BadRequest();
            _context.Entry(model).State = EntityState.Modified;
            
            // Also update corresponding transaction if exists
            var searchDesc = $"Bill: {model.BillType}"; // Simple search
            var transaction = await _context.Transactions
                .FirstOrDefaultAsync(t => t.TransactionDate == model.BillDate && t.Amount == model.Amount); 
            
            if (transaction != null) {
                transaction.Amount = model.Amount;
                transaction.Category = model.BillType;
            }

            await _context.SaveChangesAsync();
            return Ok(model);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBill(int id)
        {
            var bill = await _context.Bills.FindAsync(id);
            if (bill == null) return NotFound();

            _context.Bills.Remove(bill);
            
            // Note: In real app, we might want to reverse the transaction too
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("check-duplicate")]
        public async Task<IActionResult> CheckDuplicate([FromBody] Bill model)
        {
            var monthStart = new DateTime(model.BillDate.Year, model.BillDate.Month, 1);
            var monthEnd = monthStart.AddMonths(1);

            var duplicate = await _context.Bills.FirstOrDefaultAsync(b => 
                b.VendorName.ToLower() == model.VendorName.ToLower() &&
                b.Amount == model.Amount &&
                b.BillDate >= monthStart && b.BillDate < monthEnd);

            return Ok(new { isDuplicate = duplicate != null, existingBill = duplicate });
        }
    }
}
