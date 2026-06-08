using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SocialMedia.Application.Identity.Dtos;
using SocialMedia.Domain.Entities.Identity;
using System.ComponentModel.Design;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SocialMedia.Application.Identity
{
	public class JwtService : IJwtService
	{
		//to read Jwt configuration from appsettings.json
		private readonly IConfiguration configuration;
		// size of key must be greater than 256 bites
		private readonly string key;

		public JwtService(IConfiguration config)
		{
			configuration = config;
			key = configuration["Jwt:Key"];
		}

		public AuthenticationResponse CreateJwtToken(ApplicationUser user)
		{
			DateTime expiration = DateTime.UtcNow.AddHours(Convert.ToDouble(configuration["Jwt:EXPIRATION_HOURS"]));

			Claim[] claims = new Claim[]
				{
					new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
					new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
					new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.Now.ToUnixTimeSeconds().ToString()),
					new Claim(ClaimTypes.NameIdentifier, user.Email),
					new Claim(ClaimTypes.Name, user.UserName),
					new Claim(ClaimTypes.Email, user.Email),
					new Claim("universityEmailVerified", user.UniversityEmailVerified.ToString().ToLower())
				};

			SymmetricSecurityKey securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

			SigningCredentials signingCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

			JwtSecurityToken tokenGenerator = new JwtSecurityToken(
				configuration["JWT:Issuer"],
				configuration["JWT:Audience"],
				claims,
				expires: expiration,
				signingCredentials: signingCredentials
				);

			JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();

			//possible error here if key size is less than 256 bytes 
			string token = tokenHandler.WriteToken(tokenGenerator);

			return new AuthenticationResponse()
			{
				Token = token,
				Email = user.Email,
				UserName = user.UserName,
				Expiration = expiration,
				RefreshToken = GenerateRefreshToken(),
				//*here I changed Utc to UtcNow
				RefreshTokenExpirationDateTime = DateTime.UtcNow.AddHours(Convert.ToInt32(configuration["Jwt:EXPIRATION_HOURS"]))
			};
		}

		//Creates a refresh token (base 64 string of random numbers)
		private string GenerateRefreshToken()
		{
			byte[] bytes = new byte[64];
			var randomNumberGenerator = RandomNumberGenerator.Create();
			randomNumberGenerator.GetBytes(bytes);
			return Convert.ToBase64String(bytes);
		}

		public ClaimsPrincipal? GetPrincipalFromJwtToken(string? token)
		{
			var tokenValidationParameters = new TokenValidationParameters()
			{
				ValidateActor = true,
				ValidAudience = configuration["Jwt:Audience"],
				ValidateIssuer = true,
				ValidIssuer = configuration["Jwt:Issuer"],

				ValidateIssuerSigningKey = true,
				IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"])),

				//method called when token is expired
				ValidateLifetime = false,
			};

			JwtSecurityTokenHandler jwtSecurityTokenHandler = new JwtSecurityTokenHandler();

			ClaimsPrincipal principal = null;

			try
			{
				principal = jwtSecurityTokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

				if (securityToken is not JwtSecurityToken jwtSecurityToken ||
				!jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
				{
					throw new SecurityTokenException("Invalid token");
				}
			}
			catch (Exception exc)
			{
				Console.WriteLine(exc.Message);
				throw;
			}

			return principal;
		}

		public string CreateEmailVerificationToken(Guid userId)
		{
			DateTime expiration = DateTime.UtcNow.AddHours(24);

			Claim[] claims = new Claim[]
			{
				new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
				new Claim("purpose", "email-verification"),
				new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
			};

			SymmetricSecurityKey securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
			SigningCredentials signingCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

			JwtSecurityToken tokenGenerator = new JwtSecurityToken(
				configuration["JWT:Issuer"],
				configuration["JWT:Audience"],
				claims,
				expires: expiration,
				signingCredentials: signingCredentials
			);

			JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
			return tokenHandler.WriteToken(tokenGenerator);
		}

		public Guid? ValidateEmailVerificationToken(string token)
		{
			return ValidateTokenWithPurpose(token, "email-verification");
		}

		public string CreateEmailDeactivationToken(Guid userId)
		{
			DateTime expiration = DateTime.UtcNow.AddDays(30);

			Claim[] claims = new Claim[]
			{
				new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
				new Claim("purpose", "email-deactivation"),
				new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
			};

			SymmetricSecurityKey securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
			SigningCredentials signingCredentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

			JwtSecurityToken tokenGenerator = new JwtSecurityToken(
				configuration["JWT:Issuer"],
				configuration["JWT:Audience"],
				claims,
				expires: expiration,
				signingCredentials: signingCredentials
			);

			JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
			return tokenHandler.WriteToken(tokenGenerator);
		}

		public Guid? ValidateEmailDeactivationToken(string token)
		{
			return ValidateTokenWithPurpose(token, "email-deactivation");
		}

		private Guid? ValidateTokenWithPurpose(string token, string expectedPurpose)
		{
			try
			{
				var tokenValidationParameters = new TokenValidationParameters()
				{
					ValidateActor = true,
					ValidAudience = configuration["Jwt:Audience"],
					ValidateIssuer = true,
					ValidIssuer = configuration["Jwt:Issuer"],
					ValidateIssuerSigningKey = true,
					IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"])),
					ValidateLifetime = true,
				};

				JwtSecurityTokenHandler jwtSecurityTokenHandler = new JwtSecurityTokenHandler();
				ClaimsPrincipal principal = jwtSecurityTokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

				if (securityToken is not JwtSecurityToken jwtSecurityToken ||
					!jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
				{
					return null;
				}

				var purposeClaim = principal.FindFirst("purpose")?.Value;
				if (purposeClaim != expectedPurpose)
				{
					return null;
				}

				var userIdClaim = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
					?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				
				if (Guid.TryParse(userIdClaim, out var userId))
				{
					return userId;
				}

				return null;
			}
			catch
			{
				return null;
			}
		}
	}
}