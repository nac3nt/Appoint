using Appoint.Exceptions;
using System.Net;
using System.Text.Json;

namespace Appoint.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var response = new
            {
                error = exception.Message,
                timestamp = DateTime.UtcNow
            };

            switch (exception)
            {
                case NotFoundException notFoundEx:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    _logger.LogWarning(notFoundEx, "Resource not found: {Message}", notFoundEx.Message);
                    break;

                case ConflictException conflictEx:
                    context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                    _logger.LogWarning(conflictEx, "Conflict: {Message}", conflictEx.Message);
                    break;

                case UnauthorizedException unauthorizedEx:
                    context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                    _logger.LogWarning(unauthorizedEx, "Unauthorized: {Message}", unauthorizedEx.Message);
                    break;

                case ValidationException validationEx:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    _logger.LogWarning(validationEx, "Validation error: {Message}", validationEx.Message);
                    break;

                case BusinessException businessEx:
                    context.Response.StatusCode = businessEx.StatusCode;
                    _logger.LogWarning(businessEx, "Business exception: {Message}", businessEx.Message);
                    break;

                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    _logger.LogError(exception, "Internal server error: {Message}", exception.Message);
                    response = new
                    {
                        error = "An unexpected error occurred. Please try again later.",
                        timestamp = DateTime.UtcNow
                    };
                    break;
            }

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
