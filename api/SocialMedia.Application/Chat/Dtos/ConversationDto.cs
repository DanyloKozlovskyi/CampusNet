using SocialMedia.Domain.Entities;

namespace SocialMedia.Application.Chat.Dtos;

public class ConversationDto
{
    public Guid ConversationId { get; set; }
    public string? Name { get; set; }
    public string? LogoKey { get; set; }
    public ConversationType Type { get; set; }
    public string? UniversityDomain { get; set; }
    public string? FacultyCode { get; set; }
    public string? Major { get; set; }
    public int? YearOfStudy { get; set; }
    public MessageDto? LastMessage { get; set; }
    public List<ParticipantDto> Participants { get; set; } = new();
    public int UnreadCount { get; set; }
}
