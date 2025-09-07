#!/usr/bin/env ts-node

import { config } from 'dotenv';
import { createClient } from 'redis';
import { SessionData, TokenBlacklistEntry } from 'src/redis';

// Load environment variables
config();

async function checkRedisSessions() {
  const redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DB || '0'),
  });

  try {
    await redisClient.connect();
    console.log('Connected to Redis');

    // Get all session keys
    const sessionKeys = await redisClient.keys('medicalink:session:*');
    console.log(`\n> Found ${sessionKeys.length} session(s):`);

    if (sessionKeys.length === 0) {
      console.log('! No sessions found in Redis');
    }

    // Get session details
    for (const key of sessionKeys) {
      console.log(`\n- Key: ${key}`);

      const sessionData = await redisClient.get(key);
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData) as SessionData;
          console.log(`   - Email: ${session.email}`);
          console.log(`   - User ID: ${session.userId}`);
          console.log(`   - Session ID: ${session.sessionId}`);
          console.log(`   - Role: ${session.role}`);
          console.log(
            `   - Created: ${new Date(session.createdAt).toLocaleString()}`,
          );
          console.log(
            `   - Last Accessed: ${new Date(session.lastAccessedAt).toLocaleString()}`,
          );
          console.log(
            `   - Expires: ${new Date(session.expiresAt).toLocaleString()}`,
          );

          // Check TTL
          const ttl = await redisClient.ttl(key);
          if (ttl > 0) {
            console.log(
              `   - TTL: ${ttl} seconds (${Math.round(ttl / 60)} minutes)`,
            );
          } else if (ttl === -1) {
            console.log(`   - TTL: No expiration set`);
          } else {
            console.log(`   - TTL: Expired`);
          }
        } catch (error) {
          console.log(`   ! Error parsing session data: ${error}`);
        }
      } else {
        console.log(`   ! No data found for key`);
      }
    }

    // Check blacklisted tokens
    console.log('\n> Checking blacklisted tokens...');
    const blacklistKeys = await redisClient.keys('medicalink:blacklist:*');
    console.log(`+ Found ${blacklistKeys.length} blacklisted token(s)`);

    if (blacklistKeys.length > 0) {
      for (const key of blacklistKeys.slice(0, 5)) {
        // Show only first 5
        const tokenData = await redisClient.get(key);
        if (tokenData) {
          try {
            const blacklistEntry = JSON.parse(tokenData) as TokenBlacklistEntry;
            console.log(
              `   - Token: ${key.replace('medicalink:blacklist:', '').substring(0, 20)}...`,
            );
            console.log(
              `   - Expires: ${new Date(blacklistEntry.expiresAt).toLocaleString()}`,
            );
            console.log(
              `   - Reason: ${blacklistEntry.reason || 'No reason provided'}`,
            );
          } catch (error) {
            console.log(`   ! Error parsing blacklist data: ${error}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('! Error:', error);
  } finally {
    await redisClient.quit();
    console.log('\n> Disconnected from Redis');
  }
}

// Clear specific session
async function clearSession(sessionId: string) {
  const redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DB || '0'),
  });

  try {
    await redisClient.connect();
    console.log('> Connected to Redis');

    const key = `medicalink:session:${sessionId}`;
    const result = await redisClient.del(key);

    if (result === 1) {
      console.log(`> Session ${sessionId} deleted successfully`);
    } else {
      console.log(`! Session ${sessionId} not found`);
    }
  } catch (error) {
    console.error('! Error:', error);
  } finally {
    await redisClient.quit();
  }
}

// Clear all sessions
async function clearAllSessions() {
  const redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD,
    database: parseInt(process.env.REDIS_DB || '0'),
  });

  try {
    await redisClient.connect();
    console.log('> Connected to Redis');

    const sessionKeys = await redisClient.keys('medicalink:session:*');

    if (sessionKeys.length === 0) {
      console.log('> No sessions found to clear');
      return;
    }

    const result = await redisClient.del(sessionKeys);
    console.log(`> Cleared ${result} session(s)`);
  } catch (error) {
    console.error('> Error:', error);
  } finally {
    await redisClient.quit();
  }
}

// CLI interface
const command = process.argv[2];
const sessionId = process.argv[3];

switch (command) {
  case 'check':
  case 'list':
    void checkRedisSessions();
    break;
  case 'clear':
    if (sessionId) {
      void clearSession(sessionId);
    } else {
      console.log(
        '! Please provide a session ID: npm run redis:clear <sessionId>',
      );
    }
    break;
  case 'clear-all':
    void clearAllSessions();
    break;
  default:
    console.log(`
      # Redis Session Management Tool

      Commands:
        npm run redis:check          - List all sessions and their details
        npm run redis:clear <id>     - Clear specific session by ID
        npm run redis:clear-all      - Clear all sessions

      Examples:
        npm run redis:check
        npm run redis:clear 1234567890-abc123xyz
        npm run redis:clear-all
    `);
}
