using ApartmentApi.Data;
using ApartmentApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "ApartmentManagementSuperSecretKey12345!";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "ApartmentApi",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "ApartmentUser",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// Configure SQLite
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=../apartment_v3.db";
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(connectionString));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors("AllowAll");

// Order matters: Authentication must come before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "API is running", timestamp = DateTime.UtcNow }));

// Seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();

    // Ensure uploads directory exists
    var uploadPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads", "bills");
    if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

    var passwordHasher = new PasswordHasher<User>();

    // 1. Seed Initial Admin Users
    if (!context.Users.Any())
    {
        var adminUser1 = new User 
        { 
            Username = "SuperAdmin", 
            Email = "superadmin@123.com", 
            Role = "superadmin", 
            FlatNumber = "A-101", 
            ContactNumber = "9999999999", 
            ResidentType = "Committee" 
        };
        adminUser1.Password = passwordHasher.HashPassword(adminUser1, "Pass@123");

        var adminUser2 = new User 
        { 
            Username = "Admin User", 
            Email = "Admin@123.com", 
            Role = "admin", 
            FlatNumber = "A-102", 
            ContactNumber = "9876543210", 
            ResidentType = "Committee" 
        };
        adminUser2.Password = passwordHasher.HashPassword(adminUser2, "Pass@123");

        var resident1 = new User 
        { 
            Username = "John Doe", 
            Email = "john@example.com", 
            Role = "user", 
            FlatNumber = "B-201", 
            ContactNumber = "9888888888", 
            ResidentType = "Owner" 
        };
        resident1.Password = passwordHasher.HashPassword(resident1, "Pass@123");
        
        context.Users.AddRange(adminUser1, adminUser2, resident1);
        context.SaveChanges();
    }

    // 2. Seed Maintenance Setup
    if (!context.MaintenanceSetups.Any())
    {
        context.MaintenanceSetups.Add(new MaintenanceSetup {
            MonthlyAmount = 3000,
            DueDate = 10,
            CreatedAt = DateTime.UtcNow.AddMonths(-6),
            EffectiveFrom = DateTime.UtcNow.AddMonths(-6)
        });
        context.SaveChanges();
    }

    // 3. Seed Historical Transactions (Last 6 Months)
    if (!context.Transactions.Any())
    {
        var rnd = new Random();
        for (int i = 5; i >= 0; i--)
        {
            var date = DateTime.UtcNow.AddMonths(-i);
            
            // Credit: Maintenance Payments
            context.Transactions.Add(new Transaction {
                Type = "Credit",
                Amount = rnd.Next(25000, 35000),
                Category = "Maintenance",
                Description = $"Monthly Collection - {date:MMM yyyy}",
                TransactionDate = date.AddDays(-rnd.Next(1, 10))
            });

            // Debit: Bills
            context.Transactions.Add(new Transaction {
                Type = "Debit",
                Amount = rnd.Next(5000, 8000),
                Category = "Electricity",
                Description = $"BESCOM Bill - {date:MMM yyyy}",
                TransactionDate = date.AddDays(-15)
            });

            context.Transactions.Add(new Transaction {
                Type = "Debit",
                Amount = rnd.Next(2000, 4000),
                Category = "Water",
                Description = $"BWSSB Bill - {date:MMM yyyy}",
                TransactionDate = date.AddDays(-12)
            });
        }
        context.SaveChanges();
    }

    // 4. Seed Maintenance Tasks
    if (!context.MaintenanceTasks.Any())
    {
        context.MaintenanceTasks.AddRange(
            new MaintenanceTask { Title = "Lift Maintenance", Description = "Monthly lift servicing", Status = "Completed", Priority = "High", FlatNumber = "Common", CreatedAt = DateTime.UtcNow.AddDays(-20), CompletionDate = DateTime.UtcNow.AddDays(-18), FinalCost = 5000 },
            new MaintenanceTask { Title = "Water Leakage", Description = "Leakage in overhead tank", Status = "In Progress", Priority = "Urgent", FlatNumber = "Roof", CreatedAt = DateTime.UtcNow.AddDays(-2) },
            new MaintenanceTask { Title = "Clubhouse Painting", Description = "Touching up main hall", Status = "Pending", Priority = "Low", FlatNumber = "Common", CreatedAt = DateTime.UtcNow.AddDays(-5) }
        );
        context.SaveChanges();
    }
}

app.Run("http://localhost:5002");
