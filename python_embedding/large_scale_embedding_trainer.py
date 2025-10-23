#!/usr/bin/env python3
"""
大规模电影嵌入向量训练器
适用于24K+电影的item2vec训练
"""
import pandas as pd
import numpy as np
from gensim.models import Word2Vec
import os
import logging
from datetime import datetime
import pickle

# 配置日志
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

def create_user_sequences(ratings_df, min_interactions=10, cache_file='cache/user_sequences.pkl'):
    """
    创建用户观影序列（按时间排序），支持缓存
    """
    # 检查缓存
    os.makedirs('cache', exist_ok=True)
    if os.path.exists(cache_file):
        print(f"加载缓存的用户序列: {cache_file}")
        with open(cache_file, 'rb') as f:
            return pickle.load(f)
    
    print(f"创建用户观影序列...")

    # 筛选活跃用户（至少10次评分）
    user_counts = ratings_df['userId'].value_counts()
    active_users = user_counts[user_counts >= min_interactions].index

    filtered_ratings = ratings_df[ratings_df['userId'].isin(active_users)]
    print(f"活跃用户数量: {len(active_users):,}")
    print(f"活跃用户评分: {len(filtered_ratings):,} 条")

    # 按用户和时间排序
    filtered_ratings = filtered_ratings.sort_values(['userId', 'timestamp'])

    # 创建用户序列
    user_sequences = []
    for user_id in active_users:
        user_ratings = filtered_ratings[filtered_ratings['userId'] == user_id]
        # 只保留高评分电影 (≥3.5)
        liked_movies = user_ratings[user_ratings['rating'] >= 3.5]['movieId'].tolist()
        if len(liked_movies) >= 5:  # 至少5部喜欢的电影
            user_sequences.append([str(movie_id) for movie_id in liked_movies])

    print(f"生成用户序列: {len(user_sequences)} 个")
    
    # 保存缓存
    with open(cache_file, 'wb') as f:
        pickle.dump(user_sequences, f)
    print(f"用户序列已缓存: {cache_file}")
    
    return user_sequences

def train_item2vec_model(sequences, vector_size=100, window=5, min_count=5, workers=4):
    """
    训练item2vec模型
    """
    print(f"\n=== 开始训练Item2Vec模型 ===")
    print(f"参数配置:")
    print(f"  向量维度: {vector_size}")
    print(f"  窗口大小: {window}")
    print(f"  最小出现次数: {min_count}")
    print(f"  并行线程: {workers}")

    # 训练Word2Vec模型
    model = Word2Vec(
        sentences=sequences,
        vector_size=vector_size,
        window=window,
        min_count=min_count,
        workers=workers,
        sg=1,  # skip-gram
        hs=0,  # negative sampling
        negative=10,
        epochs=20,
        seed=42
    )

    print(f"训练完成!")
    print(f"词汇表大小: {len(model.wv.key_to_index)}")

    return model

def save_embeddings(model, movies_df, sequences, output_dir='embeddings'):
    """
    保存嵌入向量为SparrowRecSys格式 - 使用空格分隔
    """
    print(f"\n=== 保存嵌入向量 ===")
    os.makedirs(output_dir, exist_ok=True)

    # 保存item2vec嵌入 - 使用空格分隔的格式
    item_embeddings = []
    valid_movies = 0

    for _, row in movies_df.iterrows():
        movie_id = str(row['movieId'])
        if movie_id in model.wv.key_to_index:
            vector = model.wv[movie_id]
            # 正确格式: movieId:v1 v2 v3 ... v100 (空格分隔)
            embedding_str = f"{movie_id}:" + " ".join(map(str, vector))
            item_embeddings.append(embedding_str)
            valid_movies += 1

    # 保存到文件
    embedding_file = f'{output_dir}/item2vecEmb.csv'
    with open(embedding_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(item_embeddings))

    print(f"Item2Vec嵌入已保存: {embedding_file}")
    print(f"有效电影向量: {valid_movies} / {len(movies_df)}")

    # 生成用户嵌入
    print("生成用户嵌入向量...")
    user_embeddings = generate_real_user_embeddings(model, sequences, output_dir)

    return valid_movies, len(user_embeddings)

def generate_real_user_embeddings(model, sequences, output_dir):
    """基于真实用户序列生成用户嵌入 - 使用空格分隔"""
    user_embeddings = []
    valid_users = 0
    
    for user_id, sequence in enumerate(sequences, 1):
        try:
            # 获取用户序列中所有电影的向量
            vectors = [model.wv[movie_id] for movie_id in sequence 
                      if movie_id in model.wv.key_to_index]
            if len(vectors) >= 3:  # 至少有3个有效电影向量
                avg_vector = np.mean(vectors, axis=0)
                # 正确格式: userId:v1 v2 v3 ... v100 (空格分隔)
                embedding_str = f"{user_id}:" + " ".join(map(str, avg_vector))
                user_embeddings.append(embedding_str)
                valid_users += 1
        except Exception as e:
            print(f"用户 {user_id} 向量生成失败: {e}")
            continue
    
    # 保存到文件
    user_file = f'{output_dir}/userEmb.csv'
    with open(user_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(user_embeddings))
    
    print(f"真实用户嵌入已保存: {user_file}")
    print(f"有效用户数量: {valid_users} / {len(sequences)}")
    return user_embeddings

def verify_file_format():
    """验证生成的文件格式是否正确"""
    print("\n=== 验证文件格式 ===")
    
    # 检查电影嵌入文件
    with open('embeddings/item2vecEmb.csv', 'r') as f:
        lines = f.readlines()
        print(f"电影嵌入文件行数: {len(lines)}")
        if lines:
            first_line = lines[0].strip()
            parts = first_line.split(':')
            if len(parts) == 2:
                movie_id = parts[0]
                vector_str = parts[1]
                vector_parts = vector_str.split()
                print(f"第一行格式: 电影ID={movie_id}, 向量维度={len(vector_parts)}")
                print(f"向量分隔符: {'空格' if ' ' in vector_str else '逗号'}")
                print(f"示例向量值: {vector_str[:100]}...")
    
    # 检查用户嵌入文件
    with open('embeddings/userEmb.csv', 'r') as f:
        lines = f.readlines()
        print(f"用户嵌入文件行数: {len(lines)}")
        if lines:
            first_line = lines[0].strip()
            parts = first_line.split(':')
            if len(parts) == 2:
                user_id = parts[0]
                vector_str = parts[1]
                vector_parts = vector_str.split()
                print(f"第一行格式: 用户ID={user_id}, 向量维度={len(vector_parts)}")
                print(f"向量分隔符: {'空格' if ' ' in vector_str else '逗号'}")

def main():
    """主函数"""
    print("=== 大规模电影嵌入向量训练器 ===")

    try:
        # 检查数据文件
        data_dir = 'sparrow_data'
        if not os.path.exists(f'{data_dir}/ratings.csv'):
            print("错误: 找不到转换后的数据文件")
            print("请先运行 convert_ml25m_to_sparrow.py")
            return

        # 读取数据
        print("读取数据...")
        ratings_df = pd.read_csv(f'{data_dir}/ratings.csv')
        movies_df = pd.read_csv(f'{data_dir}/movies.csv')

        print(f"数据规模:")
        print(f"  电影: {len(movies_df):,} 部")
        print(f"  评分: {len(ratings_df):,} 条")
        print(f"  用户: {ratings_df['userId'].nunique():,} 个")

        # 创建用户序列（带缓存功能）
        sequences = create_user_sequences(ratings_df)

        # 训练模型
        model = train_item2vec_model(sequences)

        # 保存嵌入向量
        valid_movies, user_count = save_embeddings(model, movies_df, sequences)

        # 修正覆盖率计算
        coverage_movie = valid_movies / len(movies_df) * 100
        coverage_user = user_count / len(sequences) * 100  # 基于真实用户序列

        # 验证文件格式
        verify_file_format()

        # 生成报告
        report = f"""
=== 大规模嵌入训练报告 ===
训练时间: {datetime.now()}

数据规模:
  输入电影: {len(movies_df):,} 部
  输入评分: {len(ratings_df):,} 条
  用户序列: {len(sequences):,} 个

模型参数:
  向量维度: 100
  窗口大小: 5
  最小频次: 5

输出结果:
  电影向量: {valid_movies} 个
  用户向量: {user_count} 个
  电影覆盖率: {coverage_movie:.1f}%
  用户覆盖率: {coverage_user:.1f}%

文件输出:
  embeddings/item2vecEmb.csv
  embeddings/userEmb.csv
  缓存文件: cache/user_sequences.pkl
"""

        print(report)

        # 保存报告
        with open('embeddings/training_report.txt', 'w') as f:
            f.write(report)

        print("\n=== 训练完成 ===")
        print("下一步: 将embeddings/目录下的文件复制到SparrowRecSys")

    except Exception as e:
        print(f"训练过程中出错: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()