using Microsoft.AspNetCore.Identity;

namespace SocialMedia.Domain.Entities.Identity;
public class ApplicationUser : IdentityUser<Guid>
{
	public string? Name { get; set; }
	public string? RefreshToken { get; set; }
	public DateTime RefreshTokenExpirationDateTime { get; set; }
	public ICollection<BlogPost>? Posts { get; set; }
	public virtual ICollection<Like>? Likes { get; set; }
	public string? Description { get; set; }

	public virtual ICollection<Message>? SentMessages { get; set; }
	public virtual ICollection<ConversationParticipant>? ConversationParticipants { get; set; }

	public string? LogoKey { get; set; }
	public string? LogoContentType { get; set; }

	public virtual ICollection<UserFollow>? Followers { get; set; }
	public virtual ICollection<UserFollow>? Following { get; set; }

	// University integration
	public string? UniversityDomain { get; set; }
	public string? UniversityName { get; set; }
	public string? FacultyCode { get; set; }
	public string? FacultyName { get; set; }
	public string? Major { get; set; }
	public string? MajorKey { get; set; }
	public int? YearOfStudy { get; set; }
	public string? AcademicRole { get; set; } // "student", "lecturer", "ta", "alumni"
	public bool IsUniversityVerified { get; set; } = false;
	public bool UniversityEmailVerified { get; set; } = false;

	// User interests for feed recommendations (stored as JSON array)
	public List<string> Interests { get; set; } = new();

	// Ban system
	public bool IsBanned { get; set; } = false;
	public string? BanReason { get; set; }
	public DateTime? BannedAt { get; set; }
	public Guid? BannedByAdminId { get; set; }
}
