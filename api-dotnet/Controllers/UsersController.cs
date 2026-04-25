using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentApi.Data;
using ApartmentApi.Models;
using Microsoft.AspNetCore.Identity;

namespace ApartmentApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
            _passwordHasher = new PasswordHasher<User>();
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetUsers([FromQuery] string? search)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                search = search.ToLower();
                query = query.Where(u => 
                    u.Username.ToLower().Contains(search) || 
                    u.Email.ToLower().Contains(search) || 
                    u.ContactNumber.ToLower().Contains(search) || 
                    u.FlatNumber.ToLower().Contains(search));
            }

            var users = await query
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.Role,
                    u.FlatNumber,
                    u.ContactNumber,
                    u.ResidentType,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpPost]
        public async Task<ActionResult<User>> CreateUser([FromBody] User user)
        {
            user.Id = 0;
            user.CreatedAt = DateTime.UtcNow;
            
            // Hash password before saving
            if (!string.IsNullOrEmpty(user.Password))
            {
                user.Password = _passwordHasher.HashPassword(user, user.Password);
            }
            else
            {
                user.Password = ""; // No default password, must use OTP setup
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] User user)
        {
            if (id != user.Id) return BadRequest();

            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null) return NotFound();

            existingUser.Username = user.Username;
            existingUser.Email = user.Email;
            existingUser.Role = user.Role;
            existingUser.FlatNumber = user.FlatNumber;
            existingUser.ContactNumber = user.ContactNumber;
            existingUser.ResidentType = user.ResidentType;

            if (!string.IsNullOrEmpty(user.Password))
            {
                existingUser.Password = _passwordHasher.HashPassword(existingUser, user.Password);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
