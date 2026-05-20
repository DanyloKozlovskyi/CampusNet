using SocialMedia.Application.BlogPosts;
using SocialMedia.Domain.Entities;
using StackExchange.Redis;
using System.Text.Json;

namespace SocialMedia.Infrastructure.Caching.Redis;

public class BlogServiceCacheDecorator : IBlogService
{
	private readonly BlogService _inner;
	private readonly IConnectionMultiplexer _redis;

	// TTLs balanced for free-tier Redis (~25 MB):
	// Long enough to meaningfully reduce DB hits,
	// short enough that memory stays low even with per-user keys.
	private static readonly TimeSpan FeedTtl = TimeSpan.FromMinutes(5);
	private static readonly TimeSpan PostTtl = TimeSpan.FromMinutes(10);
	private static readonly TimeSpan SearchTtl = TimeSpan.FromMinutes(3);
	private const int WarmPages = 10;

	private static readonly JsonSerializerOptions JsonOpts = new()
	{
		PropertyNamingPolicy = JsonNamingPolicy.CamelCase
	};

	public BlogServiceCacheDecorator(BlogService inner, IConnectionMultiplexer redis)
	{
		_inner = inner;
		_redis = redis;
	}

	private static string U(Guid? userId) => userId?.ToString("N") ?? "anon";

	private async Task<T?> CacheGetOrSet<T>(string key, TimeSpan ttl, Func<Task<T?>> factory)
	{
		try
		{
			var db = _redis.GetDatabase();
			var cached = await db.StringGetAsync(key);
			if (cached.HasValue)
				return JsonSerializer.Deserialize<T>(cached!, JsonOpts);
		}
		catch { /* Redis down – fall through to DB */ }

		var result = await factory();

		if (result is not null)
		{
			try
			{
				var db = _redis.GetDatabase();
				await db.StringSetAsync(key, JsonSerializer.Serialize(result, JsonOpts), ttl);
			}
			catch { /* Redis write failed – ignore */ }
		}

		return result;
	}

	private async Task<List<T>?> CacheGetOrSetPaged<T>(
		string keyPrefix, int page, int pageSize,
		TimeSpan ttl, Func<int, int, Task<List<T>?>> factory)
	{
		var key = $"{keyPrefix}:{page}:{pageSize}";

		try
		{
			var db = _redis.GetDatabase();
			var cached = await db.StringGetAsync(key);
			if (cached.HasValue)
				return JsonSerializer.Deserialize<List<T>>(cached!, JsonOpts);
		}
		catch { /* Redis down – fall through to DB */ }

		if (page <= WarmPages)
		{
			var bulkData = await factory(1, WarmPages * pageSize);
			if (bulkData is null || bulkData.Count == 0)
				return bulkData;

			var chunks = new Dictionary<int, List<T>>();
			for (int i = 0; i < bulkData.Count; i++)
			{
				int pageNum = (i / pageSize) + 1;
				if (!chunks.TryGetValue(pageNum, out var list))
				{
					list = new List<T>(pageSize);
					chunks[pageNum] = list;
				}
				list.Add(bulkData[i]);
			}

			try
			{
				var db = _redis.GetDatabase();
				var batch = db.CreateBatch();
				foreach (var (pageNum, items) in chunks)
				{
					var pageKey = $"{keyPrefix}:{pageNum}:{pageSize}";
					var json = JsonSerializer.Serialize(items, JsonOpts);
					batch.StringSetAsync(pageKey, json, ttl);
				}
				batch.Execute();
			}
			catch { /* Redis write failed – ignore */ }

			return chunks.GetValueOrDefault(page);
		}
		else
		{
			var data = await factory(page, pageSize);
			if (data is not null)
			{
				try
				{
					var db = _redis.GetDatabase();
					await db.StringSetAsync(key, JsonSerializer.Serialize(data, JsonOpts), ttl);
				}
				catch { /* Redis write failed – ignore */ }
			}
			return data;
		}
	}

	public async Task<IEnumerable<PostResponseModel>> GetAll(Guid? userId = null, int page = 1, int pageSize = 30)
	{
		var key = $"blog:all:{U(userId)}:{page}:{pageSize}";
		var result = await CacheGetOrSet<List<PostResponseModel>>(key, FeedTtl, async () =>
		{
			var posts = await _inner.GetAll(userId, page, pageSize);
			return posts.ToList();
		});
		return result ?? Enumerable.Empty<PostResponseModel>();
	}

	public async Task<PostResponseModel?> GetById(Guid id, Guid? userId = null)
	{
		var key = $"blog:id:{id:N}:{U(userId)}";
		return await CacheGetOrSet<PostResponseModel>(key, PostTtl, () => _inner.GetById(id, userId));
	}

	public async Task<IEnumerable<PostResponseModel>?> GetParents(Guid id, Guid? userRequestId = null)
	{
		var key = $"blog:parents:{id:N}:{U(userRequestId)}";
		return await CacheGetOrSet<List<PostResponseModel>>(key, PostTtl, async () =>
		{
			var posts = await _inner.GetParents(id, userRequestId);
			return posts?.ToList();
		});
	}

	public async Task<IEnumerable<PostResponseModel>?> GetByParentId(Guid parentId, Guid? userId = null, int page = 1, int pageSize = 30)
	{
		var keyPrefix = $"blog:comments:{parentId:N}:{U(userId)}";
		return await CacheGetOrSetPaged<PostResponseModel>(keyPrefix, page, pageSize, FeedTtl,
			async (p, ps) =>
			{
				var posts = await _inner.GetByParentId(parentId, userId, p, ps);
				return posts?.ToList();
			});
	}

	public async Task<IEnumerable<PostResponseModel>?> GetByDescription(string description, Guid? userRequestId = null, int page = 1, int pageSize = 30)
	{
		var normalised = description.Trim().ToLowerInvariant();
		var keyPrefix = $"blog:search:{normalised}:{U(userRequestId)}";
		return await CacheGetOrSetPaged<PostResponseModel>(keyPrefix, page, pageSize, SearchTtl,
			async (p, ps) =>
			{
				var posts = await _inner.GetByDescription(description, userRequestId, p, ps);
				return posts?.ToList();
			});
	}

	public async Task<IEnumerable<PostResponseModel>?> GetByUserId(Guid userId, Guid? userRequestId = null, int page = 1, int pageSize = 30)
	{
		var keyPrefix = $"blog:user:{userId:N}:{U(userRequestId)}";
		return await CacheGetOrSetPaged<PostResponseModel>(keyPrefix, page, pageSize, FeedTtl,
			async (p, ps) =>
			{
				var posts = await _inner.GetByUserId(userId, userRequestId, p, ps);
				return posts?.ToList();
			});
	}

	public async Task<IEnumerable<PostResponseModel>?> GetByUniversity(string universityDomain, string? facultyCode, Guid? userRequestId = null, int page = 1, int pageSize = 30)
	{
		var faculty = facultyCode ?? "all";
		var keyPrefix = $"blog:university:{universityDomain}:{faculty}:{U(userRequestId)}";
		return await CacheGetOrSetPaged<PostResponseModel>(keyPrefix, page, pageSize, FeedTtl,
			async (p, ps) =>
			{
				var posts = await _inner.GetByUniversity(universityDomain, facultyCode, userRequestId, p, ps);
				return posts?.ToList();
			});
	}


	public Task<BlogPost?> Create(BlogPost blogPost) => _inner.Create(blogPost);

	public Task<int> SetLike(Guid postId, Guid userId) => _inner.SetLike(postId, userId);

	public Task<Like?> GetLike(Guid? postId, Guid? userId) => _inner.GetLike(postId, userId);

	public Task<IEnumerable<Like>?> GetLikes(Guid? postId) => _inner.GetLikes(postId);

	public Task<IEnumerable<Like>?> GetUserLikes(Guid? userId, PostsRequestModel posts) => _inner.GetUserLikes(userId, posts);
}
