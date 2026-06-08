using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Application.Recommendation;
using SocialMedia.Domain.Entities;
using SocialMedia.Domain.Entities.Identity;
using SocialMedia.Infrastructure.Persistence.Sql.Configurations;

namespace SocialMedia.Infrastructure.Persistence.Sql
{
	public class SocialMediaDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>, IRecommendationDbContext
	{
		public DbSet<BlogPost> Blogs { get; set; }
		public DbSet<Like> Likes { get; set; }
		public DbSet<Message> Messages { get; set; }
		public DbSet<Conversation> Conversations { get; set; }
		public DbSet<ConversationParticipant> ConversationParticipants { get; set; }
		public DbSet<UserFollow> UserFollows { get; set; }
		public DbSet<Report> Reports { get; set; }
		
		public SocialMediaDbContext(DbContextOptions<SocialMediaDbContext> options) : base(options)
		{

		}

		public SocialMediaDbContext()
		{

		}
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);

			modelBuilder.ApplyConfiguration(new ApplicationUserConfiguration());
			modelBuilder.ApplyConfiguration(new BlogPostConfiguration());
			modelBuilder.ApplyConfiguration(new MessageConfiguration());
			modelBuilder.ApplyConfiguration(new ConversationConfiguration());
			modelBuilder.ApplyConfiguration(new ConversationParticipantConfiguration());
			modelBuilder.ApplyConfiguration(new UserFollowConfiguration());
			modelBuilder.ApplyConfiguration(new ReportConfiguration());
		}
	}
}
