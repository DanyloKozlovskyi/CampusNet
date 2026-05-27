using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocialMedia.Application.BlogPosts;
using SocialMedia.Domain.Entities.Identity;

namespace SocialMedia.Application.Recommendation;

public class UniversityFeedService : IUniversityFeedService
{
	private readonly IBlogRepository _blogRepository;
	private readonly UserManager<ApplicationUser> _userManager;
	private readonly IUniversityPostRankingCache _cache;
	private readonly IImpressionTracker _impressionTracker;

	private const double FACULTY_RATIO = 0.40;
	private const double INTEREST_RATIO = 0.40;
	private const double GENERAL_RATIO = 0.20;

	private const float LIKE_WEIGHT = 0.01f;
	private const float COMMENT_WEIGHT = 0.1f;
	private const double SCORE_JITTER = 0.05;

	public UniversityFeedService(
		IBlogRepository blogRepository,
		UserManager<ApplicationUser> userManager,
		IUniversityPostRankingCache cache,
		IImpressionTracker impressionTracker)
	{
		_blogRepository = blogRepository;
		_userManager = userManager;
		_cache = cache;
		_impressionTracker = impressionTracker;
	}

	public async Task<UniversityFeedResult> GetUniversityFeedAsync(Guid userId, int page = 1, int pageSize = 30)
	{
		var user = await _userManager.FindByIdAsync(userId.ToString());
		if (user == null || string.IsNullOrEmpty(user.UniversityDomain))
		{
			return new UniversityFeedResult
			{
				Posts = new List<PostResponseModel>(),
				Page = page,
				PageSize = pageSize,
				HasMore = false
			};
		}

		var universityDomain = user.UniversityDomain;
		var facultyCode = user.FacultyCode;
		var userInterests = user.Interests ?? new List<string>();

		int facultyLimit = (int)Math.Ceiling(pageSize * FACULTY_RATIO);
		int interestLimit = (int)Math.Ceiling(pageSize * INTEREST_RATIO);
		int generalLimit = (int)Math.Ceiling(pageSize * GENERAL_RATIO);

		var impressionIds = await _impressionTracker.GetImpressionsAsync(userId);
		var seenPostIds = new HashSet<Guid>(impressionIds);
		var allPosts = new List<PostResponseModel>();

		// Batch 1: Faculty Posts (~40%)
		if (!string.IsNullOrEmpty(facultyCode))
		{
			var facultyPosts = await GetFacultyPostsAsync(
				universityDomain, facultyCode, userId, facultyLimit, seenPostIds);
			allPosts.AddRange(facultyPosts);
			foreach (var post in facultyPosts)
				seenPostIds.Add(post.Id);
		}

		// Batch 2: Interest Posts (~40%) - Cross-faculty within university
		if (userInterests.Count > 0)
		{
			var interestPosts = await GetInterestPostsAsync(
				universityDomain, userInterests, userId, interestLimit, seenPostIds);
			allPosts.AddRange(interestPosts);
			foreach (var post in interestPosts)
				seenPostIds.Add(post.Id);
		}

		// Batch 3: General University Posts (~20%) - Trending/Recent
		var generalPosts = await GetGeneralUniversityPostsAsync(
			universityDomain, userId, generalLimit, seenPostIds);
		allPosts.AddRange(generalPosts);

		// Sort combined results by hotness score (likes + comments weighted) then by recency
		var sortedPosts = SortByHotnessWithJitter(allPosts);

		// Apply pagination
		var skip = (page - 1) * pageSize;
		var pagedPosts = sortedPosts.Skip(skip).Take(pageSize).ToList();

		// Log impressions for the returned posts
		if (pagedPosts.Count > 0)
		{
			await _impressionTracker.LogImpressionsAsync(userId, pagedPosts.Select(p => p.Id));
		}

		return new UniversityFeedResult
		{
			Posts = pagedPosts,
			TotalCount = sortedPosts.Count,
			Page = page,
			PageSize = pageSize,
			HasMore = skip + pagedPosts.Count < sortedPosts.Count
		};
	}

	private async Task<List<PostResponseModel>> GetFacultyPostsAsync(
		string universityDomain,
		string facultyCode,
		Guid userId,
		int limit,
		HashSet<Guid> excludeIds)
	{
		var cachedIds = await _cache.GetFacultyPostsAsync(universityDomain, facultyCode, 1, limit * 2);

		var postIds = cachedIds.Where(id => !excludeIds.Contains(id)).Take(limit).ToList();

		if (postIds.Count == 0)
			return new List<PostResponseModel>();

		var posts = await _blogRepository.GetByFilterNoTracking(x => postIds.Contains(x.Id))
			.ToPostResponseModelQueryable(userId)
			.ToListAsync();

		return posts.OrderBy(p => postIds.IndexOf(p.Id)).ToList();
	}

	private async Task<List<PostResponseModel>> GetInterestPostsAsync(
		string universityDomain,
		List<string> userInterests,
		Guid userId,
		int limit,
		HashSet<Guid> excludeIds)
	{
		var cachedIds = await _cache.GetInterestPostsAsync(universityDomain, userInterests, 1, limit * 2);

		var postIds = cachedIds.Where(id => !excludeIds.Contains(id)).Take(limit).ToList();

		if (postIds.Count == 0)
			return new List<PostResponseModel>();

		var posts = await _blogRepository.GetByFilterNoTracking(x => postIds.Contains(x.Id))
			.ToPostResponseModelQueryable(userId)
			.ToListAsync();

		return posts.OrderBy(p => postIds.IndexOf(p.Id)).ToList();
	}

	private async Task<List<PostResponseModel>> GetGeneralUniversityPostsAsync(
		string universityDomain,
		Guid userId,
		int limit,
		HashSet<Guid> excludeIds)
	{
		var cachedIds = await _cache.GetPageFromListAsync(universityDomain, 1, limit * 2);

		var postIds = cachedIds.Where(id => !excludeIds.Contains(id)).Take(limit).ToList();

		if (postIds.Count == 0)
			return new List<PostResponseModel>();

		var posts = await _blogRepository.GetByFilterNoTracking(x => postIds.Contains(x.Id))
			.ToPostResponseModelQueryable(userId)
			.ToListAsync();

		return posts.OrderBy(p => postIds.IndexOf(p.Id)).ToList();
	}

	private List<PostResponseModel> SortByHotnessWithJitter(List<PostResponseModel> posts)
	{
		// Calculate hotness score: weighted engagement + time decay + jitter
		var now = DateTime.UtcNow;
		var random = Random.Shared;

		return posts
			.Select(p => new
			{
				Post = p,
				HotnessScore = CalculateHotnessScore(p, now) * ApplyJitter(random)
			})
			.OrderByDescending(x => x.HotnessScore)
			.Select(x => x.Post)
			.ToList();
	}

	private static double ApplyJitter(Random random)
	{
		// ±5% jitter (smaller than global feed's ±10%)
		return 1.0 + (random.NextDouble() * SCORE_JITTER * 2 - SCORE_JITTER);
	}

	private double CalculateHotnessScore(PostResponseModel post, DateTime now)
	{
		// Engagement score
		double engagementScore = post.LikeCount * LIKE_WEIGHT + post.CommentCount * COMMENT_WEIGHT;

		// Time decay: posts lose relevance over time
		var ageInHours = (now - post.PostedAt).TotalHours;
		double timeDecay = Math.Pow(0.95, ageInHours / 24); // ~5% decay per day

		// Combine: engagement boosted by recency
		return engagementScore * timeDecay + (1.0 / (1.0 + ageInHours / 24));
	}
}
