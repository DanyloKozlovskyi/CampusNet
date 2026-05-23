using System.ComponentModel.DataAnnotations;

namespace SocialMedia.Application.Chat.Dtos;

public class CreateGroupRequest
{
    [Required(ErrorMessage = "Group name is required")]
    [MinLength(1, ErrorMessage = "Group name cannot be empty")]
    public string Name { get; set; } = string.Empty;
    public string? LogoKey { get; set; }
    public string? LogoContentType { get; set; }
    public List<Guid> ParticipantIds { get; set; } = new List<Guid>();
}
