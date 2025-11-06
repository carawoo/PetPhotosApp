import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import FloatingActionButton from '../components/FloatingActionButton';

const { width } = Dimensions.get('window');
const imageSize = width / 3 - 1;

export default function GalleryScreen() {
  const [photos, setPhotos] = useState([]);
  const [permission, requestPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }
    }

    try {
      const { assets } = await MediaLibrary.getAssetsAsync({
        first: 100,
        mediaType: 'photo',
        sortBy: ['creationTime'],
      });
      setPhotos(assets);
    } catch (error) {
      console.error('갤러리 로드 오류:', error);
    }
  };

  const renderPhoto = ({ item }) => {
    return (
      <TouchableOpacity style={styles.photoContainer}>
        <Image source={{ uri: item.uri }} style={styles.photo} />
      </TouchableOpacity>
    );
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="images-outline" size={64} color="#ccc" />
        <Text style={styles.permissionText}>갤러리 접근 권한이 필요합니다</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>권한 허용하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>갤러리</Text>
        <TouchableOpacity onPress={loadPhotos}>
          <Ionicons name="refresh-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 사진 그리드 */}
      <FlatList
        data={photos}
        renderItem={renderPhoto}
        keyExtractor={item => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>갤러리에 사진이 없습니다</Text>
            <Text style={styles.emptySubText}>
              오른쪽 하단 버튼으로 사진을 추가해보세요!
            </Text>
          </View>
        }
      />

      {/* 플로팅 액션 버튼 */}
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  permissionButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  photoContainer: {
    width: imageSize,
    height: imageSize,
    margin: 0.5,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
