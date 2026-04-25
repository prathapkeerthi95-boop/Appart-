using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentApi.Data;
using ApartmentApi.Models;
using Microsoft.AspNetCore.Authorization;

namespace ApartmentApi.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TransactionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactions()
        {
            var transactions = await _context.Transactions.OrderByDescending(t => t.TransactionDate).ToListAsync();
            return Ok(transactions);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var totalCollected = await _context.Transactions.Where(t => t.Type == "Credit").SumAsync(t => t.Amount);
            var totalExpenses = await _context.Transactions.Where(t => t.Type == "Debit").SumAsync(t => t.Amount);
            var transactions = await _context.Transactions.OrderByDescending(t => t.TransactionDate).Take(10).ToListAsync();
            
            return Ok(new
            {
                totalCollected,
                totalExpenses,
                balance = totalCollected - totalExpenses,
                recentTransactions = transactions
            });
        }
    }
}
