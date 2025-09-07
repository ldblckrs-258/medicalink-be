# Redis Module Documentation

## 📋 Tổng Quan

Redis Module được tích hợp để cung cấp các tính năng caching, session
management, token blacklisting và rate limiting cho ứng dụng MedicalInk Backend.

## 🚀 Cài Đặt & Cấu Hình

### Environment Variables

Thêm các biến môi trường sau vào file `.env`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password      # Optional
REDIS_USERNAME=your_username      # Optional
REDIS_DB=0
REDIS_TTL=300                     # Default TTL (seconds)
REDIS_MAX=100                     # Max cache items
REDIS_KEY_PREFIX=medicalink:      # Key prefix
```

### Redis Server

Đảm bảo Redis server đang chạy:

```bash
# Sử dụng Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Hoặc cài đặt local Redis
# Windows: Download từ https://redis.io/download
# Linux: sudo apt-get install redis-server
# macOS: brew install redis
```

## 📦 Cấu Trúc Module

```
src/redis/
├── config/
│   ├── redis-config.type.ts     # Type definitions
│   └── redis.config.ts          # Configuration
├── decorators/
│   └── rate-limit.decorator.ts  # Rate limiting decorator
├── guards/
│   └── rate-limit.guard.ts      # Rate limiting guard
├── interfaces/
│   └── redis-client.interface.ts # Redis client interface
├── redis.module.ts              # Module definition
├── redis.service.ts             # Core service
├── redis-demo.controller.ts     # Demo endpoints
└── index.ts                     # Exports
```

## 🔧 Core Features

### 1. Caching

#### Basic Caching Operations

```typescript
import { RedisService } from '../redis';

@Injectable()
export class ExampleService {
  constructor(private readonly redisService: RedisService) {}

  // Set cache với TTL
  async cacheData() {
    await this.redisService.set('user:123', { name: 'John' }, 3600); // 1 hour
  }

  // Get cached data
  async getCachedData() {
    const data = await this.redisService.get('user:123');
    return data;
  }

  // Delete cache
  async clearCache() {
    await this.redisService.del('user:123');
  }

  // Check if key exists
  async checkExists() {
    const exists = await this.redisService.exists('user:123');
    return exists;
  }
}
```

#### Advanced Caching

```typescript
// Set multiple keys
await this.redisService.mset({
  'user:123': { name: 'John' },
  'user:456': { name: 'Jane' },
});

// Get multiple keys
const users = await this.redisService.mget(['user:123', 'user:456']);

// Set with expiration
await this.redisService.setex('temp:data', 60, 'temporary data'); // 60 seconds

// Increment counter
await this.redisService.incr('page:views');
```

### 2. Session Management

#### Tạo Session

```typescript
import { AuthService } from '../auth/auth.service';

// Session được tự động tạo khi login
const loginResult = await this.authService.validateLogin({
  email: 'user@example.com',
  password: 'password',
});

// Session data structure:
// {
//   id: 'session_uuid',
//   email: 'user@example.com',
//   role: 'DOCTOR',
//   sessionId: 'session_uuid',
//   userId: 'user_id',
//   createdAt: Date,
//   lastAccessedAt: Date,
//   expiresAt: Date
// }
```

#### Validate Session

```typescript
// Check session validity
const isValid = await this.authService.validateSession('session_id');

// Get session data
const session = await this.redisService.getSession('session_id');
```

#### Session Operations

```typescript
// Update session
await this.authService.updateSessionLastAccessed('session_id');

// Logout (deactivate session)
await this.authService.logout('session_id');

// Logout all sessions for user
await this.authService.logoutAll('user_id');
```

### 3. Token Blacklisting

#### Blacklist Token

```typescript
// Blacklist token khi logout
await this.authService.blacklistToken(
  'jwt_token',
  new Date(Date.now() + 3600000), // Expires in 1 hour
  'User logout',
);
```

#### Check Blacklisted Token

```typescript
// Check if token is blacklisted
const isBlacklisted = await this.authService.isTokenBlacklisted('jwt_token');

if (isBlacklisted) {
  throw new UnauthorizedException('Token has been revoked');
}
```

### 4. Rate Limiting

#### Sử Dụng Decorator

```typescript
import { RateLimit } from '../redis/decorators/rate-limit.decorator';
import { RateLimitGuard } from '../redis/guards/rate-limit.guard';

@Controller('api')
export class ApiController {
  // Limit 10 requests per minute
  @RateLimit({ windowMs: 60000, maxRequests: 10 })
  @UseGuards(RateLimitGuard)
  @Get('limited-endpoint')
  async limitedEndpoint() {
    return { message: 'This endpoint is rate limited' };
  }

  // Limit 100 requests per hour
  @RateLimit({ windowMs: 3600000, maxRequests: 100 })
  @UseGuards(RateLimitGuard)
  @Post('heavy-operation')
  async heavyOperation() {
    return { message: 'Heavy operation completed' };
  }
}
```

#### Custom Rate Limiting

```typescript
// Manual rate limiting check
const isAllowed = await this.redisService.checkRateLimit(
  'user:123', // Key
  100, // Max requests
  3600, // Window in seconds (1 hour)
);

if (!isAllowed) {
  throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
}
```

## 🛡️ Security Guards

### 1. Basic JWT Guard

```typescript
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('basic')
export class BasicController {
  @UseGuards(JwtAuthGuard) // Only JWT validation
  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayloadType) {
    return user;
  }
}
```

### 2. Enhanced Redis JWT Guard

```typescript
import { RedisJwtAuthGuard } from '../auth/guards/redis-jwt-auth.guard';

@Controller('secure')
export class SecureController {
  @UseGuards(RedisJwtAuthGuard) // JWT + Session + Blacklist validation
  @Get('sensitive-data')
  async getSensitiveData(@CurrentUser() user: JwtPayloadType) {
    return { message: 'Highly secure data' };
  }
}
```

### So Sánh Guards

| Feature                 | JwtAuthGuard | RedisJwtAuthGuard       |
| ----------------------- | ------------ | ----------------------- |
| JWT Validation          | ✅           | ✅                      |
| Performance             | ⚡ Fast      | 🐌 Slower (Redis calls) |
| Session Validation      | ❌           | ✅                      |
| Token Blacklist Check   | ❌           | ✅                      |
| Session Activity Update | ❌           | ✅                      |
| Security Level          | 🔒 Basic     | 🔐 High                 |

## 🔄 Advanced Operations

### 1. Pub/Sub Messaging

```typescript
// Subscribe to channel
await this.redisService.subscribe('notifications', (message) => {
  console.log('Received:', message);
});

// Publish message
await this.redisService.publish('notifications', 'New notification');
```

### 2. Set Operations

```typescript
// Add to set
await this.redisService.sadd('online_users', 'user:123');

// Check membership
const isOnline = await this.redisService.sismember('online_users', 'user:123');

// Get all members
const onlineUsers = await this.redisService.smembers('online_users');

// Remove from set
await this.redisService.srem('online_users', 'user:123');
```

### 3. Hash Operations

```typescript
// Set hash field
await this.redisService.hset('user:123', 'name', 'John Doe');

// Get hash field
const name = await this.redisService.hget('user:123', 'name');

// Get all hash fields
const userInfo = await this.redisService.hgetall('user:123');
```

### 4. List Operations

```typescript
// Push to list
await this.redisService.lpush('notifications', 'New message');

// Pop from list
const notification = await this.redisService.rpop('notifications');

// Get list range
const recent = await this.redisService.lrange('notifications', 0, 9); // Last 10
```

## 🧪 Testing với Demo Controller

Sử dụng Redis Demo Controller để test các tính năng:

```http
# Get cache info
GET /redis/cache-info

# Test caching
POST /redis/test-cache

# Get session info (requires login)
GET /redis/session-info
Authorization: Bearer <jwt_token>

# Test rate limiting
GET /redis/rate-limited

# Logout và blacklist token
POST /redis/logout
Authorization: Bearer <jwt_token>

# Blacklist current token
POST /redis/blacklist-token
Authorization: Bearer <jwt_token>
```

## ⚡ Performance Best Practices

### 1. Key Naming Convention

```typescript
// Good: Structured, predictable
'medicalink:user:123:profile';
'medicalink:session:abc-def-ghi';
'medicalink:cache:patient:456';

// Bad: Unstructured
'user123';
'mydata';
'temp';
```

### 2. TTL Management

```typescript
// Always set TTL for temporary data
await this.redisService.setex('temp:data', 300, data); // 5 minutes

// Use appropriate TTL for different data types
const TTL = {
  SESSION: 3600 * 24 * 7, // 7 days
  CACHE: 3600, // 1 hour
  RATE_LIMIT: 60, // 1 minute
  TOKEN_BLACKLIST: 3600 * 24, // 24 hours
};
```

### 3. Batch Operations

```typescript
// Good: Batch operations
await this.redisService.mset({
  key1: 'value1',
  key2: 'value2',
  key3: 'value3',
});

// Bad: Individual operations
await this.redisService.set('key1', 'value1');
await this.redisService.set('key2', 'value2');
await this.redisService.set('key3', 'value3');
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Error**

   ```
   Error: connect ECONNREFUSED 127.0.0.1:6379
   ```

   **Solution**: Ensure Redis server is running

2. **Memory Issues**

   ```
   Error: OOM command not allowed when used memory > 'maxmemory'
   ```

   **Solution**: Configure Redis memory policy or increase memory

3. **Authentication Error**
   ```
   Error: NOAUTH Authentication required
   ```
   **Solution**: Check REDIS_PASSWORD in .env

### Monitoring

```typescript
// Check Redis connection
const ping = await this.redisService.ping();
console.log('Redis status:', ping); // Should return 'PONG'

// Get Redis info
const info = await this.redisService.info();
console.log('Redis info:', info);

// Monitor memory usage
const memory = await this.redisService.memory('usage', 'key:name');
console.log('Memory usage:', memory);
```

## 📚 Additional Resources

- [Redis Commands](https://redis.io/commands)
- [Redis Best Practices](https://redis.io/topics/memory-optimization)
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)
- [Redis Data Types](https://redis.io/topics/data-types)

## 🔐 Security Considerations

1. **Password Protection**: Always use strong passwords for Redis
2. **Network Security**: Use Redis AUTH and configure firewall
3. **Data Encryption**: Consider Redis TLS for production
4. **Key Expiration**: Always set appropriate TTL for sensitive data
5. **Access Control**: Use Redis ACL for fine-grained permissions

---

**Last Updated**: September 7, 2025  
**Version**: 1.0.0  
**Author**: MedicalInk Development Team
