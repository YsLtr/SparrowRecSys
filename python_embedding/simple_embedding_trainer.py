import pandas as pd
import numpy as np
from gensim.models import Word2Vec
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
import logging
import sys

# 设置日志
logging.basicConfig(format='%(asctime)s : %(levelname)s : %(message)s', level=logging.INFO)

def train_item2vec_large_dataset():
    """训练大数据集的Item2Vec模型"""
    print("🚀 开始训练大数据集Item2Vec模型...")

    # 读取数据
    print("📖 读取评分数据...")
    ratings = pd.read_csv('ml-25m/ratings.csv')
    print(f"总评分数: {len(ratings):,}")
    print(f"用户数: {ratings['userId'].nunique():,}")
    print(f"电影数: {ratings['movieId'].nunique():,}")

    # 数据预处理 - 筛选活跃用户和热门电影
    print("🔄 数据预处理...")

    # 用户评分统计
    user_counts = ratings['userId'].value_counts()
    movie_counts = ratings['movieId'].value_counts()

    # 筛选标准: 用户至少20个评分，电影至少50个评分
    active_users = user_counts[user_counts >= 20].index
    popular_movies = movie_counts[movie_counts >= 50].index

    # 筛选数据
    filtered_ratings = ratings[
        (ratings['userId'].isin(active_users)) &
        (ratings['movieId'].isin(popular_movies))
    ].copy()

    print(f"筛选后评分数: {len(filtered_ratings):,}")
    print(f"筛选后用户数: {filtered_ratings['userId'].nunique():,}")
    print(f"筛选后电影数: {filtered_ratings['movieId'].nunique():,}")

    # 按时间排序，为每个用户创建电影序列
    print("📝 创建用户-电影序列...")
    filtered_ratings = filtered_ratings.sort_values(['userId', 'timestamp'])

    # 创建用户序列
    user_sequences = []
    for user_id in filtered_ratings['userId'].unique():
        user_movies = filtered_ratings[filtered_ratings['userId'] == user_id]['movieId'].astype(str).tolist()
        if len(user_movies) >= 5:  # 至少5个电影的序列
            user_sequences.append(user_movies)

    print(f"创建了 {len(user_sequences):,} 个用户序列")

    # 训练Word2Vec模型
    print("🤖 训练Word2Vec模型...")
    model = Word2Vec(
        sentences=user_sequences,
        vector_size=128,        # 更大的向量维度
        window=5,
        min_count=5,           # 最少出现5次
        workers=4,
        epochs=10,
        sg=1                   # Skip-gram
    )

    # 保存电影embeddings
    print("💾 保存电影embeddings...")
    item_embeddings = []
    for movie_id in model.wv.index_to_key:
        embedding = ' '.join(map(str, model.wv[movie_id]))
        item_embeddings.append(f"{movie_id}:{embedding}")

    with open('../src/main/resources/webroot/modeldata/item2vecEmb_large.csv', 'w') as f:
        f.write('\n'.join(item_embeddings))

    print(f"✅ 保存了 {len(item_embeddings):,} 个电影embeddings")
    return model, filtered_ratings

def train_user_embeddings_large_dataset(filtered_ratings, item_model):
    """训练大数据集的用户embeddings"""
    print("🚀 开始训练用户embeddings...")

    # 获取用户的电影偏好向量
    print("📊 计算用户偏好向量...")

    # 创建用户-电影矩阵
    user_movie_matrix = filtered_ratings.pivot_table(
        index='userId',
        columns='movieId',
        values='rating',
        fill_value=0
    )

    print(f"用户-电影矩阵大小: {user_movie_matrix.shape}")

    # 使用SVD降维
    print("🔍 使用SVD进行降维...")
    svd = TruncatedSVD(n_components=128, random_state=42)
    user_embeddings_matrix = svd.fit_transform(user_movie_matrix)

    # 保存用户embeddings
    print("💾 保存用户embeddings...")
    user_embeddings = []
    for i, user_id in enumerate(user_movie_matrix.index):
        embedding = ' '.join(map(str, user_embeddings_matrix[i]))
        user_embeddings.append(f"user_{i}:{embedding}")

    with open('../src/main/resources/webroot/modeldata/userEmb_large.csv', 'w') as f:
        f.write('\n'.join(user_embeddings))

    print(f"✅ 保存了 {len(user_embeddings):,} 个用户embeddings")

def main():
    print("=" * 60)
    print("🎬 SparrowRecSys 大规模模型训练")
    print("=" * 60)

    try:
        # 训练Item2Vec
        item_model, filtered_ratings = train_item2vec_large_dataset()

        # 训练用户embeddings
        train_user_embeddings_large_dataset(filtered_ratings, item_model)

        print("\n🎉 训练完成！")
        print("生成的文件:")
        print("  - item2vecEmb_large.csv: 电影embeddings")
        print("  - userEmb_large.csv: 用户embeddings")

    except Exception as e:
        print(f"❌ 训练过程中出现错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()