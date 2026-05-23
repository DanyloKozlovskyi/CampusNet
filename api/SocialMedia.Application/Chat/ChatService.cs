using SocialMedia.Application.Chat.Dtos;
using SocialMedia.Domain.Entities;

namespace SocialMedia.Application.Chat;

public class ChatService : IChatService
{
    private readonly IConversationRepository _conversationRepository;
    private readonly IMessageRepository _messageRepository;

    public ChatService(IConversationRepository conversationRepository, IMessageRepository messageRepository)
    {
        _conversationRepository = conversationRepository;
        _messageRepository = messageRepository;
    }

    public async Task<IEnumerable<ConversationDto>> GetConversations(Guid userId)
    {
        var conversations = await _conversationRepository.GetConversationsByUserId(userId);

        return conversations.Select(c => new ConversationDto
        {
            ConversationId = c.Id,
            Name = c.Name,
            LogoKey = c.LogoKey,
            Type = c.Type,
            UniversityDomain = c.UniversityDomain,
            FacultyCode = c.FacultyCode,
            Major = c.Major,
            YearOfStudy = c.YearOfStudy,
            LastMessage = c.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault() != null
                ? MessageDto.FromEntity(c.Messages.OrderByDescending(m => m.CreatedAt).First())
                : null,
            Participants = c.Participants
                // .Where(p => p.UserId != userId)
                .Select(p => new ParticipantDto
                {
                    UserId = p.UserId,
                    Name = p.User?.Name,
                    LogoKey = p.User?.LogoKey,
                    LogoContentType = p.User?.LogoContentType
                })
                .ToList(),
            UnreadCount = c.Messages.Count(m => m.SenderId != userId && !m.IsRead)
        });
    }

	public async Task<IEnumerable<MessageDto>> GetMessages(Guid conversationId, Guid userId, DateTime? cursor = null, int limit = 20)
	{
		var isParticipant = await _conversationRepository.IsParticipant(conversationId, userId);
		if (!isParticipant)
		{
			throw new UnauthorizedAccessException("User is not a participant of this conversation");
		}

		// Pass the cursor and limit to the repository to execute at the DB level
		var messages = await _messageRepository.GetPagedMessagesByConversationId(conversationId, cursor, limit);

		return messages.Select(MessageDto.FromEntity);
	}

	public async Task<Guid> StartConversation(Guid currentUserId, Guid otherUserId)
    {
        var existingConversation = await _conversationRepository.GetExistingDirectConversation(currentUserId, otherUserId);
        
        if (existingConversation != null)
        {
            return existingConversation.Id;
        }

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _conversationRepository.Create(conversation);

        await _conversationRepository.AddParticipant(new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = currentUserId,
            JoinedAt = DateTime.UtcNow
        });

        await _conversationRepository.AddParticipant(new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = otherUserId,
            JoinedAt = DateTime.UtcNow
        });

        await _conversationRepository.SaveChangesAsync();

        return conversation.Id;
    }

    public async Task<Guid> CreateGroupConversation(Guid currentUserId, string? name, List<Guid> participantIds, string? logoKey = null, string? logoContentType = null)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Group name is required");
        }

        if (participantIds == null || participantIds.Count < 2)
        {
            throw new ArgumentException("Group must have at least 2 other participants");
        }

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            LogoKey = logoKey,
            LogoContentType = logoContentType,
            Type = ConversationType.Group,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _conversationRepository.Create(conversation);

        var participants = new List<ConversationParticipant>
        {
            new ConversationParticipant
            {
                ConversationId = conversation.Id,
                UserId = currentUserId,
                JoinedAt = DateTime.UtcNow
            }
        };

        participants.AddRange(participantIds.Select(id => new ConversationParticipant
        {
            ConversationId = conversation.Id,
            UserId = id,
            JoinedAt = DateTime.UtcNow
        }));

        await _conversationRepository.AddParticipants(participants);
        await _conversationRepository.SaveChangesAsync();

        return conversation.Id;
    }

    public async Task<MessageDto> SendMessage(Guid senderId, Guid conversationId, string? content, string? mediaKey, string? mediaContentType, string? mediaType)
    {
        var isParticipant = await _conversationRepository.IsParticipant(conversationId, senderId);
        if (!isParticipant)
        {
            throw new UnauthorizedAccessException("User is not a participant of this conversation");
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            SenderId = senderId,
            ConversationId = conversationId,
            Content = content,
            MediaKey = mediaKey,
            MediaContentType = mediaContentType,
            MediaType = mediaType,
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };

        await _messageRepository.Create(message);
        await _conversationRepository.UpdateConversationTimestamp(conversationId);
        await _messageRepository.SaveChangesAsync();

        return MessageDto.FromEntity(message);
    }

    public async Task MarkAsRead(Guid messageId)
    {
        var message = await _messageRepository.GetById(messageId);
        if (message != null)
        {
            message.IsRead = true;
            await _messageRepository.Update(message);
            await _messageRepository.SaveChangesAsync();
        }
    }

    public async Task MarkConversationAsRead(Guid conversationId, Guid userId)
    {
        var messages = await _messageRepository.GetMessagesByConversationId(conversationId);
        var unread = messages.Where(m => m.SenderId != userId && !m.IsRead).ToList();
        if (unread.Any())
        {
            foreach (var message in unread)
            {
                message.IsRead = true;
            }
            await _messageRepository.SaveChangesAsync();
        }
    }

    public async Task LeaveConversation(Guid conversationId, Guid userId)
    {
        var isParticipant = await _conversationRepository.IsParticipant(conversationId, userId);
        if (!isParticipant)
        {
            throw new UnauthorizedAccessException("User is not a participant of this conversation");
        }

        await _conversationRepository.RemoveParticipant(conversationId, userId);
        await _conversationRepository.SaveChangesAsync();
    }

    public async Task DeleteConversation(Guid conversationId, Guid userId)
    {
        var conversation = await _conversationRepository.GetConversationById(conversationId);
        if (conversation == null)
        {
            throw new KeyNotFoundException("Conversation not found");
        }

        var isParticipant = await _conversationRepository.IsParticipant(conversationId, userId);
        if (!isParticipant)
        {
            throw new UnauthorizedAccessException("User is not a participant of this conversation");
        }

        // For direct chats (2 participants), delete the whole conversation
        // For group/university chats, just remove the user
        if (conversation.Participants.Count <= 2 && conversation.Type == ConversationType.Direct)
        {
            await _conversationRepository.DeleteConversation(conversationId);
        }
        else
        {
            await _conversationRepository.RemoveParticipant(conversationId, userId);
        }

        await _conversationRepository.SaveChangesAsync();
    }

    public async Task<ParticipantsPageDto> GetConversationParticipants(Guid conversationId, Guid userId, int page = 1, int pageSize = 20, string? searchQuery = null)
    {
        var isParticipant = await _conversationRepository.IsParticipant(conversationId, userId);
        if (!isParticipant)
        {
            throw new UnauthorizedAccessException("User is not a participant of this conversation");
        }

        var skip = (page - 1) * pageSize;
        var (participants, totalCount) = await _conversationRepository.GetParticipantsPaginated(conversationId, skip, pageSize, searchQuery);

        return new ParticipantsPageDto
        {
            Participants = participants.Select(p => new ParticipantDto
            {
                UserId = p.UserId,
                Name = p.User?.Name,
                LogoKey = p.User?.LogoKey,
                LogoContentType = p.User?.LogoContentType
            }).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            HasMore = skip + pageSize < totalCount
        };
    }

    public async Task<Guid> JoinUniversityChat(Guid userId, string universityDomain, string universityName)
    {
        var conversation = await _conversationRepository.GetUniversityChat(universityDomain);

        if (conversation == null)
        {
            conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                Name = $"{universityName} – Chat",
                Type = ConversationType.University,
                UniversityDomain = universityDomain,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _conversationRepository.Create(conversation);
        }

        var isParticipant = await _conversationRepository.IsParticipant(conversation.Id, userId);
        if (!isParticipant)
        {
            await _conversationRepository.AddParticipant(new ConversationParticipant
            {
                ConversationId = conversation.Id,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            });
        }

        await _conversationRepository.SaveChangesAsync();
        return conversation.Id;
    }

    public async Task<Guid> JoinFacultyChat(Guid userId, string universityDomain, string facultyCode, string facultyName)
    {
        var conversation = await _conversationRepository.GetFacultyChat(universityDomain, facultyCode);

        if (conversation == null)
        {
            conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                Name = $"{facultyName} – Chat",
                Type = ConversationType.Faculty,
                UniversityDomain = universityDomain,
                FacultyCode = facultyCode,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _conversationRepository.Create(conversation);
        }

        var isParticipant = await _conversationRepository.IsParticipant(conversation.Id, userId);
        if (!isParticipant)
        {
            await _conversationRepository.AddParticipant(new ConversationParticipant
            {
                ConversationId = conversation.Id,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            });
        }

        await _conversationRepository.SaveChangesAsync();
        return conversation.Id;
    }

    public async Task<Guid> JoinMajorChat(Guid userId, string universityDomain, string facultyCode, string majorKey, string major)
    {
        var conversation = await _conversationRepository.GetMajorChat(universityDomain, facultyCode, majorKey);

        if (conversation == null)
        {
            conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                Name = $"{major} – Chat",
                Type = ConversationType.Major,
                UniversityDomain = universityDomain,
                FacultyCode = facultyCode,
                MajorKey = majorKey,
                Major = major,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _conversationRepository.Create(conversation);
        }

        var isParticipant = await _conversationRepository.IsParticipant(conversation.Id, userId);
        if (!isParticipant)
        {
            await _conversationRepository.AddParticipant(new ConversationParticipant
            {
                ConversationId = conversation.Id,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            });
        }

        await _conversationRepository.SaveChangesAsync();
        return conversation.Id;
    }

    public async Task<Guid> JoinMajorYearChat(Guid userId, string universityDomain, string facultyCode, string majorKey, string major, int yearOfStudy)
    {
        var conversation = await _conversationRepository.GetMajorYearChat(universityDomain, facultyCode, majorKey, yearOfStudy);

        if (conversation == null)
        {
            conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                Name = $"{major} – Year {yearOfStudy}",
                Type = ConversationType.MajorYear,
                UniversityDomain = universityDomain,
                FacultyCode = facultyCode,
                MajorKey = majorKey,
                Major = major,
                YearOfStudy = yearOfStudy,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _conversationRepository.Create(conversation);
        }

        var isParticipant = await _conversationRepository.IsParticipant(conversation.Id, userId);
        if (!isParticipant)
        {
            await _conversationRepository.AddParticipant(new ConversationParticipant
            {
                ConversationId = conversation.Id,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            });
        }

        await _conversationRepository.SaveChangesAsync();
        return conversation.Id;
    }
}
