import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// 데모 데이터
const SHORTS_DATA = [
  {
    id: '1',
    imageUrl: 'https://via.placeholder.com/400x600',
    petName: '멍멍이',
    description: '산책 나온 멍멍이 #강아지 #산책',
    likes: 1234,
    comments: 56,
  },
  {
    id: '2',
    imageUrl: 'https://via.placeholder.com/400x600',
    petName: '냥냥이',
    description: '잠자는 고양이 #고양이 #잠',
    likes: 892,
    comments: 34,
  },
  {
    id: '3',
    imageUrl: 'https://via.placeholder.com/400x600',
    petName: '토리',
    description: '당근 먹는 토끼 #토끼 #당근',
    likes: 567,
    comments: 23,
  },
];

export default function ShortsScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedPosts, setLikedPosts] = useState({});
  const flatListRef = useRef(null);

  const handleLike = (postId) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const renderShort = ({ item }) => (
    <View style={styles.shortContainer}>
      {/* 배경 이미지 */}
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.shortImage}
        resizeMode="cover"
      />

      {/* 오버레이 그라디언트 효과 */}
      <View style={styles.overlay} />

      {/* 우측 액션 버튼들 */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.actionIconContainer}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons
            name={likedPosts[item.id] ? 'heart' : 'heart-outline'}
            size={36}
            color={likedPosts[item.id] ? '#FF3366' : '#fff'}
          />
          <Text style={styles.actionText}>
            {item.likes + (likedPosts[item.id] ? 1 : 0)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionIconContainer}>
          <Ionicons name="chatbubble-outline" size={32} color="#fff" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionIconContainer}>
          <Ionicons name="share-outline" size={32} color="#fff" />
          <Text style={styles.actionText}>공유</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 정보 */}
      <View style={styles.bottomInfo}>
        <View style={styles.userInfoContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="paw" size={24} color="#FF3366" />
            </View>
          </View>
          <Text style={styles.username}>{item.petName}</Text>
        </View>

        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80
  }).current;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>숏츠</Text>
        <TouchableOpacity>
          <Ionicons name="camera-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 숏츠 리스트 */}
      <FlatList
        ref={flatListRef}
        data={SHORTS_DATA}
        renderItem={renderShort}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        snapToInterval={height}
        snapToAlignment="start"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  shortContainer: {
    width: width,
    height: height,
    backgroundColor: '#000',
  },
  shortImage: {
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  rightActions: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    alignItems: 'center',
  },
  actionIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 80,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF3366',
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
});
