using SocialMedia.Application.Chat.Dtos;
using SocialMedia.Domain.Entities;

namespace SocialMedia.Application.Chat;

public interface IChatService
{
    Task<IEnumerable<ConversationDto>> GetConversations(Guid userId);
	Task<IEnumerable<MessageDto>> GetMessages(Guid conversationId, Guid userId, DateTime? cursor = null, int limit = 20);
	Task<Guid> StartConversation(Guid currentUserId, Guid otherUserId);
    Task<Guid> CreateGroupConversation(Guid currentUserId, string? name, List<Guid> participantIds, string? logoKey = null, string? logoContentType = null);
    Task<MessageDto> SendMessage(Guid senderId, Guid conversationId, string? content, string? mediaKey, string? mediaContentType, string? mediaType);
    Task MarkAsRead(Guid messageId);
    Task MarkConversationAsRead(Guid conversationId, Guid userId);
    Task LeaveConversation(Guid conversationId, Guid userId);
    Task DeleteConversation(Guid conversationId, Guid userId);
    Task<ParticipantsPageDto> GetConversationParticipants(Guid conversationId, Guid userId, int page = 1, int pageSize = 20, string? searchQuery = null);

    // University chat methods
    Task<Guid> JoinUniversityChat(Guid userId, string universityDomain, string universityName);
    Task<Guid> JoinFacultyChat(Guid userId, string universityDomain, string facultyCode, string facultyName);
    Task<Guid> JoinMajorChat(Guid userId, string universityDomain, string facultyCode, string majorKey, string major);
    Task<Guid> JoinMajorYearChat(Guid userId, string universityDomain, string facultyCode, string majorKey, string major, int yearOfStudy);
}
