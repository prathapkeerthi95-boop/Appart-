using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentApi.Data;
using ApartmentApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ApartmentApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly PasswordHasher<User> _passwordHasher;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            _passwordHasher = new PasswordHasher<User>();
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            if (string.IsNullOrEmpty(model.Username) || string.IsNullOrEmpty(model.Email) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest(new { error = "All fields are required" });
            }

            var existingUser = await _context.Users.AnyAsync(u => u.Email == model.Email);
            if (existingUser)
            {
                return BadRequest(new { error = "Email already exists" });
            }

            // Generate OTP (6 digits)
            var otpCode = new Random().Next(100000, 999999).ToString();

            var pendingUser = new PendingUser
            {
                Name = model.Username,
                Email = model.Email,
                Phone = model.ContactNumber ?? "N/A",
                PasswordHash = _passwordHasher.HashPassword(new User(), model.Password),
                OtpCode = otpCode,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            };

            _context.PendingUsers.Add(pendingUser);
            await _context.SaveChangesAsync();

            // Simulate sending OTP
            Console.WriteLine($"[OTP SIMULATION] Sending OTP {otpCode} to {model.Email}");

            return Ok(new 
            { 
                message = "OTP sent to your email. Please verify to complete registration.", 
                email = model.Email
            });
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto model)
        {
            var pendingUser = await _context.PendingUsers
                .FirstOrDefaultAsync(u => u.Email == model.Email && u.OtpCode == model.OtpCode);

            if (pendingUser == null)
            {
                return BadRequest(new { error = "Invalid OTP or email" });
            }

            if (pendingUser.ExpiresAt < DateTime.UtcNow)
            {
                _context.PendingUsers.Remove(pendingUser);
                await _context.SaveChangesAsync();
                return BadRequest(new { error = "OTP has expired. Please sign up again." });
            }

            // Check if this is the first user to become Admin
            var userCount = await _context.Users.CountAsync();
            var role = userCount == 0 ? "admin" : "user";

            var user = new User
            {
                Username = pendingUser.Name,
                Email = pendingUser.Email,
                Password = pendingUser.PasswordHash,
                Role = role,
                ContactNumber = pendingUser.Phone,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            _context.PendingUsers.Remove(pendingUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Account verified and created successfully!", role = user.Role });
        }

        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp([FromBody] ResendOtpDto model)
        {
            var pendingUser = await _context.PendingUsers
                .FirstOrDefaultAsync(u => u.Email == model.Email);

            if (pendingUser == null)
            {
                return BadRequest(new { error = "No pending registration found for this email" });
            }

            var otpCode = new Random().Next(100000, 999999).ToString();
            pendingUser.OtpCode = otpCode;
            pendingUser.CreatedAt = DateTime.UtcNow;
            pendingUser.ExpiresAt = DateTime.UtcNow.AddMinutes(10);

            await _context.SaveChangesAsync();

            Console.WriteLine($"[OTP SIMULATION] Re-sending OTP {otpCode} to {model.Email}");

            return Ok(new { message = "New OTP sent." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            if (string.IsNullOrEmpty(model.Email) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest(new { error = "Email and password are required" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == model.Email.ToLower());
            if (user == null)
            {
                return Unauthorized(new { error = "Invalid credentials" });
            }

            var result = _passwordHasher.VerifyHashedPassword(user, user.Password, model.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new { error = "Invalid credentials" });
            }

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                message = "Login successful",
                token = token,
                user = new { user.Id, user.Username, user.Email, user.Role }
            });
        }

        [HttpPost("request-password-setup")]
        public async Task<IActionResult> RequestPasswordSetup([FromBody] PasswordSetupRequestDto model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (user == null)
            {
                return BadRequest(new { error = "User not found with this email" });
            }

            // Generate OTP
            var otpCode = new Random().Next(100000, 999999).ToString();

            // Store in PendingUser (reused for password setup)
            var existing = await _context.PendingUsers.Where(p => p.Email == model.Email).ToListAsync();
            _context.PendingUsers.RemoveRange(existing);

            var pendingSetup = new PendingUser
            {
                Name = user.Username,
                Email = model.Email,
                Phone = user.ContactNumber,
                PasswordHash = _passwordHasher.HashPassword(user, model.NewPassword),
                OtpCode = otpCode,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            };

            _context.PendingUsers.Add(pendingSetup);
            await _context.SaveChangesAsync();

            Console.WriteLine($"[PASSWORD SETUP OTP] Sending OTP {otpCode} to {model.Email}");

            return Ok(new { message = "OTP sent to your email for password setup." });
        }

        [HttpPost("verify-password-setup")]
        public async Task<IActionResult> VerifyPasswordSetup([FromBody] VerifyOtpDto model)
        {
            var pending = await _context.PendingUsers
                .FirstOrDefaultAsync(u => u.Email == model.Email && u.OtpCode == model.OtpCode);

            if (pending == null)
            {
                return BadRequest(new { error = "Invalid OTP or email" });
            }

            if (pending.ExpiresAt < DateTime.UtcNow)
            {
                _context.PendingUsers.Remove(pending);
                await _context.SaveChangesAsync();
                return BadRequest(new { error = "OTP has expired" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (user == null) return BadRequest(new { error = "User mismatch" });

            user.Password = pending.PasswordHash;
            _context.PendingUsers.Remove(pending);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password set successfully! You can now login." });
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"] ?? "ApartmentManagementSuperSecretKey12345!";
            var issuer = _configuration["Jwt:Issuer"] ?? "ApartmentApi";
            var audience = _configuration["Jwt:Audience"] ?? "ApartmentUser";

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Username),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("id", user.Id.ToString()),
                new Claim("role", user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.Now.AddHours(24),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Role { get; set; }
        public string? FlatNumber { get; set; }
        public string? ContactNumber { get; set; }
        public string? ResidentType { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class VerifyOtpDto
    {
        public string Email { get; set; } = string.Empty;
        public string OtpCode { get; set; } = string.Empty;
    }

    public class ResendOtpDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class PasswordSetupRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
