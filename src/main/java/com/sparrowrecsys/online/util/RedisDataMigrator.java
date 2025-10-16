package com.sparrowrecsys.online.util;

import com.sparrowrecsys.online.datamanager.RedisClient;
import redis.clients.jedis.Jedis;
import java.io.File;
import java.util.Scanner;
import java.util.Set;

/**
 * Redis数据迁移工具
 * 将嵌入向量和特征数据从文件系统迁移到Redis存储
 */
public class RedisDataMigrator {

    /**
     * 将电影嵌入向量迁移到Redis
     */
    public static void migrateMovieEmbeddings(String movieEmbPath) throws Exception {
        System.out.println("开始迁移电影嵌入向量到Redis...");
        Jedis redisClient = RedisClient.getInstance();
        int migratedCount = 0;

        try (Scanner scanner = new Scanner(new File(movieEmbPath))) {
            while (scanner.hasNextLine()) {
                String line = scanner.nextLine();
                String[] parts = line.split(":", 2);
                if (parts.length == 2) {
                    String movieId = parts[0];
                    String embedding = parts[1];
                    String redisKey = "i2vEmb:" + movieId;

                    redisClient.set(redisKey, embedding);
                    migratedCount++;

                    if (migratedCount % 100 == 0) {
                        System.out.println("已迁移 " + migratedCount + " 个电影嵌入向量");
                    }
                }
            }
        }
        System.out.println("电影嵌入向量迁移完成！总共迁移了 " + migratedCount + " 个向量");
    }

    /**
     * 将用户嵌入向量迁移到Redis
     */
    public static void migrateUserEmbeddings(String userEmbPath) throws Exception {
        System.out.println("开始迁移用户嵌入向量到Redis...");
        Jedis redisClient = RedisClient.getInstance();
        int migratedCount = 0;

        try (Scanner scanner = new Scanner(new File(userEmbPath))) {
            while (scanner.hasNextLine()) {
                String line = scanner.nextLine();
                String[] parts = line.split(":", 2);
                if (parts.length == 2) {
                    String userId = parts[0];
                    String embedding = parts[1];
                    String redisKey = "uEmb:" + userId;

                    redisClient.set(redisKey, embedding);
                    migratedCount++;

                    if (migratedCount % 100 == 0) {
                        System.out.println("已迁移 " + migratedCount + " 个用户嵌入向量");
                    }
                }
            }
        }
        System.out.println("用户嵌入向量迁移完成！总共迁移了 " + migratedCount + " 个向量");
    }

    /**
     * 检查Redis中的数据统计
     */
    public static void checkRedisDataStats() throws Exception {
        Jedis redisClient = RedisClient.getInstance();

        Set<String> movieEmbKeys = redisClient.keys("i2vEmb:*");
        Set<String> userEmbKeys = redisClient.keys("uEmb:*");

        System.out.println("Redis数据统计:");
        System.out.println("电影嵌入向量数量: " + movieEmbKeys.size());
        System.out.println("用户嵌入向量数量: " + userEmbKeys.size());
    }

    public static void main(String[] args) {
        try {
            String movieEmbPath = "src/main/resources/webroot/modeldata/item2vecEmb.csv";
            String userEmbPath = "src/main/resources/webroot/modeldata/userEmb.csv";

            System.out.println("=== Redis数据迁移工具 ===");

            // 测试Redis连接
            System.out.println("测试Redis连接...");
            Jedis redisClient = RedisClient.getInstance();
            redisClient.set("test", "migration_test");
            String testResult = redisClient.get("test");
            if ("migration_test".equals(testResult)) {
                System.out.println("✅ Redis连接正常");
                redisClient.del("test");
            } else {
                System.out.println("❌ Redis连接失败");
                return;
            }

            // 执行数据迁移
            migrateMovieEmbeddings(movieEmbPath);
            migrateUserEmbeddings(userEmbPath);

            // 显示统计信息
            System.out.println("\n=== 迁移完成统计 ===");
            checkRedisDataStats();

            System.out.println("\n✅ 数据迁移完成！现在可以修改Config.java启用Redis数据源");

        } catch (Exception e) {
            System.err.println("数据迁移失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
}