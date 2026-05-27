using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SocialMedia.Application.Chat;
using SocialMedia.Application.Chat.Dtos;
using SocialMedia.Domain.Entities.Identity;
using System.Security.Claims;

namespace SocialMedia.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
	private readonly IChatService _chatService;
	private readonly UserManager<ApplicationUser> _userManager;

	public MessagesController(IChatService chatService, UserManager<ApplicationUser> userManager)
	{
		_chatService = chatService;
		_userManager = userManager;
	}

	private async Task<bool> IsUniversityEmailVerified(Guid userId)
	{
		var user = await _userManager.FindByIdAsync(userId.ToString());
		return user?.UniversityEmailVerified ?? false;
	}

	[HttpGet("conversations")]
	public async Task<IActionResult> GetConversations()
	{
		var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
		{
			return Unauthorized();
		}

		var conversations = await _chatService.GetConversations(currentUserId);
		return Ok(conversations);
	}

	[HttpGet("conversation/{conversationId}")]
	public async Task<IActionResult> GetMessages(Guid conversationId, [FromQuery] DateTime? cursor, [FromQuery] int limit = 20)
	{
		var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
		{
			return Unauthorized();
		}

		try
		{
			var messages = await _chatService.GetMessages(conversationId, currentUserId, cursor, limit);

			return Ok(messages);
		}
		catch (UnauthorizedAccessException)
		{
			return Forbid();
		}
	}

	[HttpGet("conversation/{conversationId}/participants")]
	public async Task<IActionResult> GetConversationParticipants(
		Guid conversationId, 
		[FromQuery] int page = 1, 
		[FromQuery] int pageSize = 20,
		[FromQuery] string? search = null)
	{
		var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
		{
			return Unauthorized();
		}
		try
		{
			var result = await _chatService.GetConversationParticipants(conversationId, currentUserId, page, pageSize, search);
			return Ok(result);
		}
		catch (UnauthorizedAccessException)
		{
			return Forbid();
		}
	}

	[HttpPost("conversation/start")]
	public async Task<IActionResult> StartConversation([FromBody] Guid otherUserId)
	{
		var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
		{
			return Unauthorized();
		}

		var conversationId = await _chatService.StartConversation(currentUserId, otherUserId);
		return Ok(new { ConversationId = conversationId });
	}

	[HttpPost("conversation/group")]
	public async Task<IActionResult> CreateGroupConversation([FromBody] CreateGroupRequest request)
	{
		var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
		{
			return Unauthorized();
		}

		try
		{
			var conversationId = await _chatService.CreateGroupConversation(
				currentUserId, 
				request.Name, 
				request.ParticipantIds,
				request.LogoKey,
				request.LogoContentType);
			return Ok(new { ConversationId = conversationId });
		}
		catch (ArgumentException ex)
		{
			return BadRequest(ex.Message);
		}
	}

	[HttpPost("conversation/university")]
	public async Task<IActionResult> JoinUniversityChat([FromBody] JoinUniversityChatRequest request)
	{
		var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
		{
			return Unauthorized();
		}

		if (!await IsUniversityEmailVerified(currentUserId))
		{
			return Forbid("University email not verified");
		}

		var conversationId = await _chatService.JoinUniversityChat(currentUserId, request.UniversityDomain, request.UniversityName);
		return Ok(new { ConversationId = conversationId });
	}

	[HttpPost("conversation/faculty")]
	public async Task<IActionResult> JoinFacultyChat([FromBody] JoinFacultyChatRequest request)
	{
		var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
		{
			return Unauthorized();
		}

		if (!await IsUniversityEmailVerified(currentUserId))
		{
			return Forbid("University email not verified");
		}

		var conversationId = await _chatService.JoinFacultyChat(currentUserId, request.UniversityDomain, request.FacultyCode, request.FacultyName);
		return Ok(new { ConversationId = conversationId });
	}

	[HttpPost("conversation/major")]
	public async Task<IActionResult> JoinMajorChat([FromBody] JoinMajorChatRequest request)
	{
		var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
		{
			return Unauthorized();
		}

		if (!await IsUniversityEmailVerified(currentUserId))
		{
			return Forbid("University email not verified");
		}

		var conversationId = await _chatService.JoinMajorChat(currentUserId, request.UniversityDomain, request.FacultyCode, request.MajorKey, request.Major);
		return Ok(new { ConversationId = conversationId });
	}

	[HttpPost("conversation/major-year")]
	public async Task<IActionResult> JoinMajorYearChat([FromBody] JoinMajorYearChatRequest request)
	{
		var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
		{
			return Unauthorized();
		}

		if (!await IsUniversityEmailVerified(currentUserId))
		{
			return Forbid("University email not verified");
		}

		var conversationId = await _chatService.JoinMajorYearChat(currentUserId, request.UniversityDomain, request.FacultyCode, request.MajorKey, request.Major, request.YearOfStudy);
		return Ok(new { ConversationId = conversationId });
	}

	[HttpPost("conversation/{conversationId}/leave")]
	public async Task<IActionResult> LeaveConversation(Guid conversationId)
	{
		var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
		{
			return Unauthorized();
		}
		try
		{
			await _chatService.LeaveConversation(conversationId, currentUserId);
			return Ok();
		}
		catch (UnauthorizedAccessException)
		{
			return Forbid();
		}
	}

	[HttpDelete("conversation/{conversationId}")]
	public async Task<IActionResult> DeleteConversation(Guid conversationId)
	{
		var currentUserIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		if (currentUserIdClaim == null || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
		{
			return Unauthorized();
		}

		try
		{
			await _chatService.DeleteConversation(conversationId, currentUserId);
			return Ok();
		}
		catch (UnauthorizedAccessException)
		{
			return Forbid();
		}
		catch (KeyNotFoundException)
		{
			return NotFound();
		}
	}
}

public record JoinUniversityChatRequest(string UniversityDomain, string UniversityName);
public record JoinFacultyChatRequest(string UniversityDomain, string FacultyCode, string FacultyName);
public record JoinMajorChatRequest(string UniversityDomain, string FacultyCode, string MajorKey, string Major);
public record JoinMajorYearChatRequest(string UniversityDomain, string FacultyCode, string MajorKey, string Major, int YearOfStudy);
