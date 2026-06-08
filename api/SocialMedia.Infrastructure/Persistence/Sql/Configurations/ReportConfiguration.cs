using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialMedia.Domain.Entities;

namespace SocialMedia.Infrastructure.Persistence.Sql.Configurations;

public class ReportConfiguration : IEntityTypeConfiguration<Report>
{
	public void Configure(EntityTypeBuilder<Report> builder)
	{
		builder.HasKey(x => x.Id);

		builder.HasOne(x => x.Reporter)
			   .WithMany()
			   .HasForeignKey(x => x.ReporterId)
			   .OnDelete(DeleteBehavior.Restrict);

		builder.HasOne(x => x.ReportedUser)
			   .WithMany()
			   .HasForeignKey(x => x.ReportedUserId)
			   .OnDelete(DeleteBehavior.Restrict);

		builder.HasOne(x => x.ResolvedByAdmin)
			   .WithMany()
			   .HasForeignKey(x => x.ResolvedByAdminId)
			   .OnDelete(DeleteBehavior.Restrict);

		builder.Property(x => x.Reason).IsRequired();
		builder.Property(x => x.Status).IsRequired();
		builder.Property(x => x.CreatedAt).HasDefaultValueSql("GETUTCDATE()").IsRequired();
		builder.Property(x => x.Description).HasMaxLength(1000);
	}
}
