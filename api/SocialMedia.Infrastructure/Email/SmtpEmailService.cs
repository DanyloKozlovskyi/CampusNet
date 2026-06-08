using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using SocialMedia.Application.Email;

namespace SocialMedia.Infrastructure.Email;

public class SmtpEmailService : IEmailService
{
	private readonly SmtpSettings _settings;

	public SmtpEmailService(IOptions<SmtpSettings> settings)
	{
		_settings = settings.Value;
	}

	public async Task SendEmailAsync(string to, string subject, string htmlBody)
	{
		using var client = new SmtpClient(_settings.Host, _settings.Port)
		{
			Credentials = new NetworkCredential(_settings.Username, _settings.Password),
			EnableSsl = _settings.EnableSsl
		};

		var message = new MailMessage
		{
			From = new MailAddress(_settings.FromEmail, _settings.FromName),
			Subject = subject,
			Body = htmlBody,
			IsBodyHtml = true
		};
		message.To.Add(to);

		await client.SendMailAsync(message);
	}

	public async Task SendUniversityVerificationEmailAsync(string to, string verificationUrl, string deactivationUrl, string universityName)
	{
		var subject = $"Підтвердіть ваш університетський email - {universityName}";
		var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset=""utf-8"">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .logo {{ font-size: 24px; font-weight: bold; color: #6366f1; }}
        .content {{ background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px; }}
        .button {{ display: inline-block; background: #6366f1; color: white !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
        .button:hover {{ background: #4f46e5; }}
        .button-secondary {{ display: inline-block; background: #ef4444; color: white !important; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 500; font-size: 13px; }}
        .button-secondary:hover {{ background: #dc2626; }}
        .footer {{ text-align: center; color: #64748b; font-size: 14px; }}
        .university {{ color: #6366f1; font-weight: 600; }}
        .deactivation-section {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <div class=""logo"">
                <svg width=""28"" height=""28"" viewBox=""0 0 24 24"" fill=""currentColor"" style=""vertical-align: middle; margin-bottom: 4px; margin-right: 6px;""><path d=""M12 3 1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72l5 2.73 5-2.73v3.72z""/></svg>
                CampusNet
            </div>
        </div>
        <div class=""content"">
            <h2>Підтвердіть ваш університетський email</h2>
            <p>Ви зареєструвались як студент <span class=""university"">{universityName}</span>.</p>
            <p>Щоб отримати доступ до університетських чатів та функцій, підтвердіть ваш email:</p>
            <div style=""text-align: center;"">
                <a href=""{verificationUrl}"" class=""button"">Підтвердити email</a>
            </div>
            <p style=""color: #64748b; font-size: 14px;"">Посилання дійсне протягом 24 годин.</p>
            <p style=""color: #64748b; font-size: 14px;"">Якщо ви не реєструвались на нашій платформі, проігноруйте цей лист.</p>
            <div class=""deactivation-section"">
                <p style=""color: #64748b; font-size: 13px; margin-bottom: 10px;"">Підтвердили помилково? Ви можете скасувати верифікацію протягом 30 днів:</p>
                <div style=""text-align: center;"">
                    <a href=""{deactivationUrl}"" class=""button-secondary"">Скасувати верифікацію</a>
                </div>
            </div>
        </div>
        <div class=""footer"">
            <p>© {DateTime.UtcNow.Year} CampusNet. Всі права захищені.</p>
        </div>
    </div>
</body>
</html>";

		await SendEmailAsync(to, subject, htmlBody);
	}
}
