using Amazon.Runtime;
using Amazon.S3;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SocialMedia.Application;
using SocialMedia.Application.BlogPosts;
using SocialMedia.Application.Recommendation;
using SocialMedia.Application.Identity;
using SocialMedia.Application.Images;
using SocialMedia.Application.Videos;
using SocialMedia.Application.Options;
using SocialMedia.Application.Utilities;
using SocialMedia.Domain.Entities.Identity;
using SocialMedia.Infrastructure.Caching.Redis;
using SocialMedia.Infrastructure.Persistence.Blob;
using SocialMedia.Infrastructure.Persistence.Blob.Backfills;
using SocialMedia.Infrastructure.Persistence.Sql;
using SocialMedia.Infrastructure.Persistence.Sql.Repositories;
using SocialMedia.Infrastructure.Persistence.Sql.Seeders.BlogPosts;
using SocialMedia.Infrastructure.Persistence.Sql.Seeders.Comments;
using SocialMedia.Infrastructure.Persistence.Sql.Seeders.Likes;
using SocialMedia.Infrastructure.Persistence.Sql.Seeders.Roles;
using SocialMedia.Infrastructure.Persistence.Sql.Seeders.Users;
using SocialMedia.WebApi.Hubs;
using StackExchange.Redis;
using SocialMedia.WebApi;
using SocialMedia.Application.Chat;
using SocialMedia.Application.Recommendation;

var builder = WebApplication.CreateBuilder(args);

DotNetEnv.Env.Load();

var accountId = Environment.GetEnvironmentVariable("CF_ACCOUNT_ID")!;
var accessKey = Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID")!;
var secretKey = Environment.GetEnvironmentVariable("AWS_SECRET_ACCESS_KEY")!;

// 3) Configure and register IAmazonS3
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
	var config = new AmazonS3Config
	{
		ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
		ForcePathStyle = true,
		AuthenticationRegion = "auto"   
	};

	var creds = new BasicAWSCredentials(accessKey, secretKey);
	return new AmazonS3Client(creds, config);
});

builder.Services.AddSingleton<IUserIdProvider, NameUserIdProvider>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddControllers(options =>
{
	var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
	options.Filters.Add(new AuthorizeFilter(policy));
});

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddDbContext<SocialMediaDbContext>(options =>
{
	options.UseSqlServer(builder.Configuration.GetConnectionString("Default"), opt => opt.CommandTimeout(60).UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)).EnableSensitiveDataLogging();
});
builder.Services.AddDbContextFactory<SocialMediaDbContext>(options =>
{
	options.UseSqlServer(builder.Configuration.GetConnectionString("Default"), opt => opt.CommandTimeout(60).UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery));
}, ServiceLifetime.Scoped);
builder.Services.AddScoped<IRecommendationDbContextFactory>(sp =>
	new RecommendationDbContextFactoryAdapter<SocialMediaDbContext>(sp.GetRequiredService<IDbContextFactory<SocialMediaDbContext>>()));

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
	options.Password.RequireDigit = false;
	options.Password.RequireNonAlphanumeric = false;
	options.Password.RequireUppercase = false;
}).AddEntityFrameworkStores<SocialMediaDbContext>()
.AddUserStore<UserStore<ApplicationUser, ApplicationRole, SocialMediaDbContext, Guid>>()
.AddRoleStore<RoleStore<ApplicationRole, SocialMediaDbContext, Guid>>()
.AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
	options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
	options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
	options.TokenValidationParameters = new TokenValidationParameters()
	{
		ValidateAudience = true,
		ValidAudience = builder.Configuration["Jwt:Audience"],
		ValidateIssuer = true,
		ValidIssuer = builder.Configuration["Jwt:Issuer"],
		ValidateLifetime = true,
		ValidateIssuerSigningKey = true,
		IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
	};

	options.Events = new JwtBearerEvents
	{
		OnMessageReceived = context =>
		{
			var accessToken = context.Request.Query["access_token"];

			// If the request is for our hub read the token out of the query string
			var path = context.HttpContext.Request.Path;
			if (!string.IsNullOrEmpty(accessToken) &&
				(path.StartsWithSegments("/api/hubs/chat")))
			{
				context.Token = accessToken;
			}
			return Task.CompletedTask;
		}
	};
});

builder.Services.AddScoped<BlogBackfillService>();
builder.Services.AddScoped<LogoBackfillService>();
builder.Services.AddHostedService<ImageBackfillWorker>();

builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
	options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo() { Title = "Social Media WebApi", Version = "1.0" });
});

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Value?
	.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
	?? ["http://localhost:3000", "http://localhost:8000"];

builder.Services.AddCors(options =>
{
	options.AddDefaultPolicy(policyBuilder =>
	{
		policyBuilder.WithOrigins(allowedOrigins)
		.AllowAnyHeader()
		.AllowAnyMethod()
		.AllowCredentials();
	});
});

builder.Services.AddScoped(typeof(IEntityRepository<,>), typeof(EntityRepository<,>));
builder.Services.AddScoped<IPostRankingCache, PostRankingCache>();
builder.Services.AddScoped<IBlogRepository, BlogRepositoryCacheDecorator>();
builder.Services.AddTransient<IJwtService, JwtService>();
builder.Services.AddScoped<BlogService>();
builder.Services.AddScoped<IBlogService, BlogServiceCacheDecorator>();
builder.Services.AddScoped<IImageRepository, R2ImageRepository>();
builder.Services.AddScoped<IUploadUrlFactory, UploadUrlFactory>();
builder.Services.AddScoped<IImageService, ImageService>();
builder.Services.AddScoped<IStorageService, StorageService>();
builder.Services.AddScoped<IConversationRepository, ConversationRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IUserFollowRepository, UserFollowRepository>();
builder.Services.AddScoped<IUserFollowService, UserFollowService>();
builder.Services.AddScoped<IImpressionTracker, ImpressionTracker>();

builder.Services.AddScoped<SubscriptionGenerator>();
builder.Services.AddScoped<NlpGenerator>();
builder.Services.AddScoped<TrendingGenerator>();
builder.Services.AddScoped<ExplorationGenerator>();
builder.Services.AddScoped<CollaborativeGenerator>();
builder.Services.AddScoped<IFeedMixer, FeedMixer>();
builder.Services.AddScoped<IUniversityPostRankingCache, UniversityPostRankingCache>();
builder.Services.AddScoped<IUniversityFeedService, UniversityFeedService>();

builder.Services.AddAutoMapper(typeof(MappingProfile));

builder.Services.Configure<UserSeedOptions>(opt =>
{
	opt.AvatarsDirectory = Path.Combine(builder.Environment.WebRootPath, "avatars");
});
builder.Services.AddScoped<IUserSeeder, CsvUserSeeder>();

builder.Services.Configure<BlogPostSeedOptions>(opt =>
{
	opt.ImagesDirectory = Path.Combine(builder.Environment.WebRootPath, "posts");
	opt.ImagesCsvPath = Path.Combine(opt.ImagesDirectory, "labels.csv");
});

builder.Services.AddScoped<IBlogPostSeeder, BlogPostSeeder>();

builder.Services.Configure<CommentSeedOptions>(opt =>
{
	opt.ImagesDirectory = Path.Combine(builder.Environment.WebRootPath, "comment-images");
	opt.CommentCount = 800;
	opt.ImageProbability = 0.25;
});

builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
	var configuration = builder.Configuration["Redis:ConnectionString"];
	return ConnectionMultiplexer.Connect(configuration);
});

builder.Services.AddSingleton<PostRankingCache>();

builder.Services.Configure<LuaScriptOptions>(builder.Configuration.GetSection("LuaScriptOptions"));

builder.Services.AddSingleton<RedisScriptManager>();

builder.Services.AddScoped<ICommentSeeder, CommentSeeder>();

builder.Services.Configure<LikeSeedOptions>(opt =>
{
	opt.MinPerPost = 0;
	opt.MaxPerPost = 30;
});

builder.Services.AddScoped<ILikeSeeder, LikeSeeder>();

var app = builder.Build();

app.UseHsts();
app.UseRouting();

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/api/hubs/chat");

if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI(options =>
	{
		options.SwaggerEndpoint("/swagger/v1/swagger.json", "1.0");
	});
}

using (var scope = app.Services.CreateScope())
{
	try
	{
		await RoleInitializer.SeedRoles(scope.ServiceProvider);
	}
	catch (Exception exc)
	{
		Console.WriteLine(exc);
	}
}

using (var scope = app.Services.CreateScope())
{
	var seeder = scope.ServiceProvider.GetRequiredService<IUserSeeder>();
	await seeder.SeedAsync();
}

using (var scope = app.Services.CreateScope())
{
	await scope.ServiceProvider.GetRequiredService<IBlogPostSeeder>().SeedAsync(300);
	await scope.ServiceProvider.GetRequiredService<ICommentSeeder>().SeedAsync();
	await scope.ServiceProvider.GetRequiredService<ILikeSeeder>().SeedAsync();
}

app.Run();
