namespace SocialMedia.Application.Email;

public interface IEmailService
{
	Task SendEmailAsync(string to, string subject, string htmlBody);
	Task SendUniversityVerificationEmailAsync(string to, string verificationUrl, string deactivationUrl, string universityName);
}
