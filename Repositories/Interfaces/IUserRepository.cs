using Appoint.Models;

namespace Appoint.Repositories.Interfaces
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> AuthenticateAsync(string email, string password);
    }
}
