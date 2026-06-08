using Microsoft.AspNetCore.Identity;
using SocialMedia.Domain.Entities.Identity;
using System.Security.Claims;

namespace SocialMedia.WebApi.Middleware;

public class BannedUserMiddleware
{
	private readonly RequestDelegate _next;

	public BannedUserMiddleware(RequestDelegate next)
	{
		_next = next;
	}

	public async Task InvokeAsync(HttpContext context, UserManager<ApplicationUser> userManager)
	{
		if (context.User.Identity?.IsAuthenticated == true)
		{
			var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
			
			if (Guid.TryParse(userIdClaim, out var userId))
			{
				var user = await userManager.FindByIdAsync(userId.ToString());
				
				if (user != null && user.IsBanned)
				{
					context.Response.StatusCode = StatusCodes.Status403Forbidden;
					context.Response.ContentType = "application/problem+json";
					
					var problemDetails = new
					{
						type = "https://tools.ietf.org/html/rfc9110#section-15.5.4",
						title = "Account Banned",
						status = 403,
						detail = user.BanReason ?? "Your account has been banned",
						errors = new Dictionary<string, string[]>
						{
							{ "UserBanned", new[] { user.BanReason ?? "Your account has been banned" } }
						}
					};
					
					await context.Response.WriteAsJsonAsync(problemDetails);
					return;
				}
			}
		}

		await _next(context);
	}
}

public static class BannedUserMiddlewareExtensions
{
	public static IApplicationBuilder UseBannedUserCheck(this IApplicationBuilder builder)
	{
		return builder.UseMiddleware<BannedUserMiddleware>();
	}
}
