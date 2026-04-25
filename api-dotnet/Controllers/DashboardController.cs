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
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboardStats([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var query = _context.Transactions.AsQueryable();

            if (from.HasValue)
                query = query.Where(t => t.TransactionDate >= from.Value);
            if (to.HasValue)
                query = query.Where(t => t.TransactionDate <= to.Value);

            var totalCollected = await query.Where(t => t.Type == "Credit").SumAsync(t => t.Amount);
            var totalExpenses = await query.Where(t => t.Type == "Debit").SumAsync(t => t.Amount);
            var totalUsers = await _context.Users.CountAsync();
            
            // Total Pending
            var currentMonth = DateTime.UtcNow.ToString("yyyy-MM");
            var paidUserIds = await _context.MaintenancePayments
                .Where(p => p.Month == currentMonth && p.Status == "Paid")
                .Select(p => p.UserId)
                .ToListAsync();
            
            var setup = await _context.MaintenanceSetups.OrderByDescending(s => s.CreatedAt).FirstOrDefaultAsync();
            var monthlyAmount = setup?.MonthlyAmount ?? 3000;
            var totalPending = (totalUsers - paidUserIds.Count) * monthlyAmount;

            var categoryBreakdown = await query
                .Where(t => t.Type == "Debit")
                .GroupBy(t => t.Category)
                .Select(g => new { category = g.Key, amount = g.Sum(t => t.Amount) })
                .ToListAsync();

            return Ok(new
            {
                totalUsers,
                totalCollected,
                totalExpenses,
                totalPending,
                balance = totalCollected - totalExpenses,
                expenseBreakdown = categoryBreakdown
            });
        }

        [HttpGet("charts")]
        public async Task<IActionResult> GetChartData([FromQuery] int year = 2026)
        {
            string[] monthNames = { "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };

            // 1. Monthly Revenue (Line Chart)
            var rawMonthlyRevenue = await _context.Transactions
                .Where(t => t.Type == "Credit" && t.TransactionDate.Year == year)
                .GroupBy(t => t.TransactionDate.Month)
                .Select(g => new { monthNum = g.Key, amount = g.Sum(t => t.Amount) })
                .OrderBy(g => g.monthNum)
                .ToListAsync();

            var monthlyRevenue = rawMonthlyRevenue.Select(r => new {
                month = monthNames[r.monthNum],
                amount = r.amount
            });

            // 2. Expense Categories (Pie Chart) - Current Year
            var expenseBreakdown = await _context.Transactions
                .Where(t => t.Type == "Debit" && t.TransactionDate.Year == year)
                .GroupBy(t => t.Category)
                .Select(g => new { category = g.Key, amount = g.Sum(t => t.Amount) })
                .ToListAsync();

            // 3. Maintenance Efficiency (Bar Chart) - Pending vs Completed Tasks
            var maintenanceStats = await _context.MaintenanceTasks
                .GroupBy(t => t.Status)
                .Select(g => new { status = g.Key, count = g.Count() })
                .ToListAsync();

            return Ok(new
            {
                monthlyRevenue,
                expenseBreakdown,
                maintenanceStats
            });
        }
    }
}
