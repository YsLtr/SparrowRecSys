package com.sparrowrecsys.online.datamanager;

import redis.clients.jedis.Jedis;

/**
 * RedisClient 类，提供 Redis 客户端的单例模式
 */
public class RedisClient {
    private static volatile Jedis redisClient;
    final static String REDIS_END_POINT = "localhost";
    final static int REDIS_PORT = 6379;
    final static String REDIS_PASSWORD = ""; // 设置为空字符串表示无密码

    /**
     * 获取 Jedis 客户端的单例实例
     * @return Jedis 客户端实例
     */
    public static Jedis getInstance(){
        if (null == redisClient){
            synchronized (RedisClient.class){
                if (null == redisClient){
                    redisClient = new Jedis(REDIS_END_POINT, REDIS_PORT);
                    // 只有密码非空时才进行认证
                    if (REDIS_PASSWORD != null && !REDIS_PASSWORD.isEmpty()) {
                        redisClient.auth(REDIS_PASSWORD);
                    }
                }
            }
        }
        return redisClient;
    }
}