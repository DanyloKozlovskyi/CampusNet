using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Domain.Entities;
using SocialMedia.Domain.Entities.Identity;
using SocialMedia.Infrastructure.Persistence.Sql;
using System.Security.Claims;

namespace SocialMedia.WebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReportController : ControllerBase
{
	private readonly SocialMediaDbContext _context;
	private readonly UserManager<ApplicationUser> _userManager;

	public ReportController(SocialMediaDbContext context, UserManager<ApplicationUser> userManager)
	{
		_context = context;
		_userManager = userManager;
	}

	private Guid? GetUserId()
	{
		var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
		return Guid.TryParse(userIdString, out var parsed) ? parsed : null;
	}

	[HttpPost]
	[Authorize]
	public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)
	{
		var reporterId = GetUserId();
		if (reporterId == null)
			return Unauthorized();

		if (reporterId == dto.ReportedUserId)
			return BadRequest("You cannot report yourself");

		var reportedUser = await _userManager.FindByIdAsync(dto.ReportedUserId.ToString());
		if (reportedUser == null)
			return NotFound("User not found");

		var existingReport = await _context.Reports
			.FirstOrDefaultAsync(r => r.ReporterId == reporterId && 
									  r.ReportedUserId == dto.ReportedUserId && 
									  r.Status == ReportStatus.Pending);
		
		if (existingReport != null)
			return BadRequest("You have already reported this user");

		var report = new Report
		{
			Id = Guid.NewGuid(),
			ReporterId = reporterId.Value,
			ReportedUserId = dto.ReportedUserId,
			Reason = dto.Reason,
			Description = dto.Description,
			Status = ReportStatus.Pending,
			CreatedAt = DateTime.UtcNow
		};

		_context.Reports.Add(report);
		await _context.SaveChangesAsync();

		return Ok(new { message = "Report submitted successfully", reportId = report.Id });
	}

	[HttpGet]
	[Authorize(Roles = "Admin")]
	public async Task<IActionResult> GetReports([FromQuery] ReportStatus? status = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
	{
		var query = _context.Reports
			.Include(r => r.Reporter)
			.Include(r => r.ReportedUser)
			.AsQueryable();

		if (status.HasValue)
			query = query.Where(r => r.Status == status.Value);

		var totalCount = await query.CountAsync();

		var reports = await query
			.OrderByDescending(r => r.CreatedAt)
			.Skip((page - 1) * pageSize)
			.Take(pageSize)
			.Select(r => new ReportDto
			{
				Id = r.Id,
				ReporterId = r.ReporterId,
				ReporterName = r.Reporter.Name,
				ReportedUserId = r.ReportedUserId,
				ReportedUserName = r.ReportedUser.Name,
				ReportedUserEmail = r.ReportedUser.Email,
				ReportedUserUniversity = r.ReportedUser.UniversityName,
				ReportedUserFaculty = r.ReportedUser.FacultyName,
				ReportedUserMajor = r.ReportedUser.Major,
				Reason = r.Reason,
				Description = r.Description,
				Status = r.Status,
				CreatedAt = r.CreatedAt,
				ResolvedAt = r.ResolvedAt
			})
			.ToListAsync();

		return Ok(new { reports, totalCount, page, pageSize });
	}

	[HttpGet("{id}")]
	[Authorize(Roles = "Admin")]
	public async Task<IActionResult> GetReport(Guid id)
	{
		var report = await _context.Reports
			.Include(r => r.Reporter)
			.Include(r => r.ReportedUser)
			.FirstOrDefaultAsync(r => r.Id == id);

		if (report == null)
			return NotFound();

		return Ok(new ReportDto
		{
			Id = report.Id,
			ReporterId = report.ReporterId,
			ReporterName = report.Reporter.Name,
			ReportedUserId = report.ReportedUserId,
			ReportedUserName = report.ReportedUser.Name,
			ReportedUserEmail = report.ReportedUser.Email,
			ReportedUserUniversity = report.ReportedUser.UniversityName,
			ReportedUserFaculty = report.ReportedUser.FacultyName,
			ReportedUserMajor = report.ReportedUser.Major,
			Reason = report.Reason,
			Description = report.Description,
			Status = report.Status,
			CreatedAt = report.CreatedAt,
			ResolvedAt = report.ResolvedAt
		});
	}

	[HttpPost("{id}/resolve")]
	[Authorize(Roles = "Admin")]
	public async Task<IActionResult> ResolveReport(Guid id, [FromBody] ResolveReportDto dto)
	{
		var adminId = GetUserId();
		if (adminId == null)
			return Unauthorized();

		var report = await _context.Reports
			.Include(r => r.ReportedUser)
			.FirstOrDefaultAsync(r => r.Id == id);

		if (report == null)
			return NotFound();

		if (report.Status != ReportStatus.Pending)
			return BadRequest("Report has already been resolved");

		report.Status = dto.Action == ResolveAction.Ban ? ReportStatus.Resolved : ReportStatus.Dismissed;
		report.ResolvedAt = DateTime.UtcNow;
		report.ResolvedByAdminId = adminId;

		if (dto.Action == ResolveAction.Ban)
		{
			var user = report.ReportedUser;
			user.IsBanned = true;
			user.BanReason = dto.BanReason ?? $"Banned due to report: {report.Reason}";
			user.BannedAt = DateTime.UtcNow;
			user.BannedByAdminId = adminId;
		}

		await _context.SaveChangesAsync();

		return Ok(new { 
			message = dto.Action == ResolveAction.Ban ? "User has been banned" : "Report dismissed",
			reportId = report.Id,
			status = report.Status
		});
	}

	[HttpPost("ban/{userId}")]
	[Authorize(Roles = "Admin")]
	public async Task<IActionResult> BanUser(Guid userId, [FromBody] BanUserDto dto)
	{
		var adminId = GetUserId();
		if (adminId == null)
			return Unauthorized();

		var user = await _userManager.FindByIdAsync(userId.ToString());
		if (user == null)
			return NotFound("User not found");

		if (user.IsBanned)
			return BadRequest("User is already banned");

		user.IsBanned = true;
		user.BanReason = dto.Reason;
		user.BannedAt = DateTime.UtcNow;
		user.BannedByAdminId = adminId;

		await _userManager.UpdateAsync(user);

		return Ok(new { message = "User has been banned", userId = user.Id });
	}

	[HttpPost("unban/{userId}")]
	[Authorize(Roles = "Admin")]
	public async Task<IActionResult> UnbanUser(Guid userId)
	{
		var user = await _userManager.FindByIdAsync(userId.ToString());
		if (user == null)
			return NotFound("User not found");

		if (!user.IsBanned)
			return BadRequest("User is not banned");

		user.IsBanned = false;
		user.BanReason = null;
		user.BannedAt = null;
		user.BannedByAdminId = null;

		await _userManager.UpdateAsync(user);

		return Ok(new { message = "User has been unbanned", userId = user.Id });
	}
}

public class CreateReportDto
{
	public Guid ReportedUserId { get; set; }
	public ReportReason Reason { get; set; }
	public string? Description { get; set; }
}

public class ReportDto
{
	public Guid Id { get; set; }
	public Guid ReporterId { get; set; }
	public string? ReporterName { get; set; }
	public Guid ReportedUserId { get; set; }
	public string? ReportedUserName { get; set; }
	public string? ReportedUserEmail { get; set; }
	public string? ReportedUserUniversity { get; set; }
	public string? ReportedUserFaculty { get; set; }
	public string? ReportedUserMajor { get; set; }
	public ReportReason Reason { get; set; }
	public string? Description { get; set; }
	public ReportStatus Status { get; set; }
	public DateTime CreatedAt { get; set; }
	public DateTime? ResolvedAt { get; set; }
}

public enum ResolveAction
{
	Ban,
	Dismiss
}

public class ResolveReportDto
{
	public ResolveAction Action { get; set; }
	public string? BanReason { get; set; }
}

public class BanUserDto
{
	public string Reason { get; set; } = string.Empty;
}
