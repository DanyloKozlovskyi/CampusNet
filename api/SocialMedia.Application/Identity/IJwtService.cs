using SocialMedia.Application.Identity.Dtos;
using SocialMedia.Domain.Entities.Identity;
using System.Security.Claims;

namespace SocialMedia.Application.Identity;
public interface IJwtService
{
	AuthenticationResponse CreateJwtToken(ApplicationUser user);
	ClaimsPrincipal? GetPrincipalFromJwtToken(string? token);
	string CreateEmailVerificationToken(Guid userId);
	Guid? ValidateEmailVerificationToken(string token);
	string CreateEmailDeactivationToken(Guid userId);
	Guid? ValidateEmailDeactivationToken(string token);
}
