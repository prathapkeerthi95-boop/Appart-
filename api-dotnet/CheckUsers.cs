using ApartmentApi.Data;
using ApartmentApi.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace Debug
{
    class Program
    {
        static void Main(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            optionsBuilder.UseSqlite("Data Source=apartment.db");

            using (var context = new ApplicationDbContext(optionsBuilder.Options))
            {
                var users = context.Users.ToList();
                Console.WriteLine("--- USERS ---");
                foreach (var u in users)
                {
                    Console.WriteLine($"ID: {u.Id}, Email: {u.Email}, Role: {u.Role}");
                }
            }
        }
    }
}
