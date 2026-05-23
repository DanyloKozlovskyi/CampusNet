using SocialMedia.Domain.Entities.Identity;

namespace SocialMedia.Domain.Entities
{
    public enum ConversationType
    {
        Direct = 0,
        Group = 1,
        University = 2,
        Faculty = 3,
        Major = 4,
        MajorYear = 5
    }

    public class Conversation : IKeyedEntity<Guid>
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public string? LogoKey { get; set; }
        public string? LogoContentType { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ConversationType Type { get; set; } = ConversationType.Direct;

        // University chat identifiers
        public string? UniversityDomain { get; set; }
        public string? FacultyCode { get; set; }
        public string? Major { get; set; }
        public string? MajorKey { get; set; }
        public int? YearOfStudy { get; set; }

        public virtual ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
