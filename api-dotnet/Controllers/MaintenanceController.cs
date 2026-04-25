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
    public class MaintenanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MaintenanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMaintenance()
        {
            var setup = await _context.MaintenanceSetups.OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync();
            var charges = await _context.AdditionalCharges.ToListAsync();
            return Ok(new { setup, charges });
        }

        [HttpPost]
        public async Task<IActionResult> SetMaintenance([FromBody] MaintenanceSetup model)
        {
            model.Id = 0; // Force new record
            model.CreatedAt = DateTime.UtcNow;
            model.EffectiveFrom = DateTime.UtcNow;
            
            _context.MaintenanceSetups.Add(model);
            await _context.SaveChangesAsync();
            return Ok(model);
        }

        [HttpGet("payments")]
        public async Task<IActionResult> GetPayments([FromQuery] string? month)
        {
            if (string.IsNullOrEmpty(month)) month = DateTime.UtcNow.ToString("yyyy-MM");
            
            var setup = await _context.MaintenanceSetups.OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync();
            var dueDateDay = setup?.DueDate ?? 10;
            var today = DateTime.UtcNow;
            
            var users = await _context.Users.ToListAsync();
            var payments = await _context.MaintenancePayments.Where(p => p.Month == month).ToListAsync();
            
            var results = users.Select(u => {
                var p = payments.FirstOrDefault(pay => pay.UserId == u.Id);
                var status = p?.Status ?? "Pending";
                var amount = p?.Amount ?? setup?.MonthlyAmount ?? 2500;
                var lateFee = p?.LateFee ?? 0;
                
                // Overdue logic
                if (status == "Pending") {
                    var isLate = false;
                    if (today.ToString("yyyy-MM") == month) {
                         if (today.Day > dueDateDay) isLate = true;
                    } else if (string.Compare(today.ToString("yyyy-MM"), month) > 0) {
                         isLate = true;
                    }

                    if (isLate) {
                        status = "Overdue";
                        lateFee = 200; // Fixed late fee
                        amount += lateFee;
                    }
                }

                return new {
                    u.Id,
                    u.Username,
                    u.FlatNumber,
                    u.ContactNumber,
                    u.Email,
                    Status = status,
                    Amount = amount,
                    LateFee = lateFee,
                    PaidDate = p?.PaidDate
                };
            });

            return Ok(results);
        }

        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetPaymentHistory(int userId)
        {
            var history = await _context.MaintenancePayments
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.Month)
                .ToListAsync();
            return Ok(history);
        }

        [HttpPost("record-payment")]
        public async Task<IActionResult> RecordPayment([FromBody] MaintenancePayment model)
        {
            var existing = await _context.MaintenancePayments
                .FirstOrDefaultAsync(p => p.UserId == model.UserId && p.Month == model.Month);
            
            if (existing != null) {
                existing.Amount = model.Amount;
                existing.LateFee = model.LateFee;
                existing.Status = "Paid";
                existing.PaidDate = DateTime.UtcNow;
            } else {
                model.Status = "Paid";
                model.PaidDate = DateTime.UtcNow;
                _context.MaintenancePayments.Add(model);
            }

            // Also log as transaction
            var user = await _context.Users.FindAsync(model.UserId);
            var transaction = new Transaction {
                Type = "Credit",
                Amount = model.Amount,
                Description = $"Maintenance: {user?.Username} ({model.Month})",
                Category = "Maintenance",
                TransactionDate = DateTime.UtcNow
            };
            _context.Transactions.Add(transaction);

            await _context.SaveChangesAsync();
            return Ok(model);
        }

        [HttpPost("charges")]
        public async Task<IActionResult> AddCharge([FromBody] AdditionalCharge model)
        {
            _context.AdditionalCharges.Add(model);
            await _context.SaveChangesAsync();
            return Ok(model);
        }

        // --- MAINTENANCE TASKS (KANBAN) ---

        [HttpGet("tasks")]
        public async Task<IActionResult> GetTasks([FromQuery] string? status, [FromQuery] string? priority, [FromQuery] string? search)
        {
            var query = _context.MaintenanceTasks.AsQueryable();

            if (!string.IsNullOrEmpty(status)) query = query.Where(t => t.Status == status);
            if (!string.IsNullOrEmpty(priority)) query = query.Where(t => t.Priority == priority);
            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(search) || t.FlatNumber.ToLower().Contains(search));
            }

            var tasks = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
            return Ok(tasks);
        }

        [HttpPost("tasks")]
        public async Task<IActionResult> CreateTask([FromBody] MaintenanceTask task)
        {
            task.Id = 0;
            task.CreatedAt = DateTime.UtcNow;
            if (task.Status == "Completed") task.CompletionDate = DateTime.UtcNow;
            
            _context.MaintenanceTasks.Add(task);
            await _context.SaveChangesAsync();
            return Ok(task);
        }

        [HttpPut("tasks/{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] MaintenanceTask task)
        {
            if (id != task.Id) return BadRequest();

            var existing = await _context.MaintenanceTasks.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Title = task.Title;
            existing.Description = task.Description;
            existing.Priority = task.Priority;
            existing.FlatNumber = task.FlatNumber;
            existing.AssignedPerson = task.AssignedPerson;
            existing.DueDate = task.DueDate;
            existing.FinalCost = task.FinalCost;

            if (existing.Status != "Completed" && task.Status == "Completed")
            {
                existing.CompletionDate = DateTime.UtcNow;
                
                // Automatically log transaction if final cost is set
                if (task.FinalCost > 0)
                {
                    _context.Transactions.Add(new Transaction {
                        Type = "Debit",
                        Amount = task.FinalCost,
                        Description = $"Maintenance Resolved: {task.Title} (Flat {task.FlatNumber})",
                        Category = "Repair",
                        TransactionDate = DateTime.UtcNow
                    });
                }
            }
            
            existing.Status = task.Status;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("tasks/{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.MaintenanceTasks.FindAsync(id);
            if (task == null) return NotFound();

            _context.MaintenanceTasks.Remove(task);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
