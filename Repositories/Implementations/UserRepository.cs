using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Appoint.Data;
using Appoint.Models;
using Appoint.Repositories.Interfaces;

namespace Appoint.Repositories.Implementations
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _dbSet.FirstOrDefaultAsync<User>(u => u.Email == email);
        }

        public async Task<User?> AuthenticateAsync(string email, string password)
        {
            var user = await _dbSet.FirstOrDefaultAsync<User>(u => u.Email == email);

            if (user == null)
                return null;

            // Verify password using BCrypt
            if (!user.VerifyPassword(password))
                return null;

            return user;
        }
    }
}
