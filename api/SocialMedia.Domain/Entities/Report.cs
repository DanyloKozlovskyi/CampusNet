using SocialMedia.Domain.Entities.Identity;

namespace SocialMedia.Domain.Entities;

public enum ReportStatus
{
	Pending,
	Resolved,
	Dismissed
}

public enum ReportReason
{
	FakeUniversity,
	FakeFaculty,
	FakeMajor,
	Impersonation,
	Other
}

public class Report
{
	public Guid Id { get; set; }
	
	public Guid ReporterId { get; set; }
	public virtual ApplicationUser Reporter { get; set; } = null!;
	
	public Guid ReportedUserId { get; set; }
	public virtual ApplicationUser ReportedUser { get; set; } = null!;
	
	public ReportReason Reason { get; set; }
	public string? Description { get; set; }
	
	public ReportStatus Status { get; set; } = ReportStatus.Pending;
	
	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	public DateTime? ResolvedAt { get; set; }
	
	public Guid? ResolvedByAdminId { get; set; }
	public virtual ApplicationUser? ResolvedByAdmin { get; set; }
}
