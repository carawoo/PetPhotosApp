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
  TextInput,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { usePost } from '../contexts/PostContext';

const { width } = Dimensions.get('window');
const imageSize = width / 3 - 1;

export default function GalleryScreen() {
  const [photos, setPhotos] = useState([]);
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [petName, setPetName] = useState('');
  const [description, setDescription] = useState('');
  const { addPost } = usePost();

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

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      // 선택한 사진으로 업로드 모달 열기
      setSelectedPhotos([result.assets[0].uri]);
      setUploadModalVisible(true);
    }
  };

  const togglePhotoSelection = (photoUri) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoUri)) {
        return prev.filter(uri => uri !== photoUri);
      } else {
        return [photoUri]; // 하나만 선택 가능하게
      }
    });
  };

  const handleUpload = () => {
    if (selectedPhotos.length === 0) {
      Alert.alert('알림', '사진을 선택해주세요.');
      return;
    }
    setUploadModalVisible(true);
  };

  const confirmUpload = () => {
    if (!petName.trim()) {
      Alert.alert('알림', '반려동물 이름을 입력해주세요.');
      return;
    }

    // 게시물 추가
    addPost({
      imageUrl: selectedPhotos[0],
      petName: petName.trim(),
      description: description.trim(),
    });

    // 초기화
    setSelectedPhotos([]);
    setPetName('');
    setDescription('');
    setUploadModalVisible(false);

    Alert.alert('성공', '사진이 업로드되었습니다!', [
      {
        text: '확인',
        onPress: () => {
          // 피드 탭으로 이동하고 싶다면 네비게이션 추가
        },
      },
    ]);
  };

  const renderPhoto = ({ item }) => {
    const isSelected = selectedPhotos.includes(item.uri);

    return (
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={() => togglePhotoSelection(item.uri)}
      >
        <Image source={{ uri: item.uri }} style={styles.photo} />
        {isSelected && (
          <View style={styles.selectedOverlay}>
            <View style={styles.checkmark}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </View>
          </View>
        )}
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
        <TouchableOpacity onPress={pickImageFromGallery}>
          <Ionicons name="add-circle-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 선택된 사진 수 */}
      {selectedPhotos.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedPhotos.length}개 선택됨
          </Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
          >
            <Text style={styles.uploadButtonText}>업로드</Text>
          </TouchableOpacity>
        </View>
      )}

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
            <TouchableOpacity
              style={styles.addButton}
              onPress={pickImageFromGallery}
            >
              <Text style={styles.addButtonText}>사진 추가하기</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* 업로드 모달 */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>게시물 업로드</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {/* 선택한 사진 미리보기 */}
            {selectedPhotos[0] && (
              <Image
                source={{ uri: selectedPhotos[0] }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

            {/* 입력 폼 */}
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="반려동물 이름 *"
                value={petName}
                onChangeText={setPetName}
              />
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="설명을 입력하세요..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmUpload}
              >
                <Text style={styles.confirmButtonText}>업로드하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  photoContainer: {
    width: imageSize,
    height: imageSize,
    margin: 0.5,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  formContainer: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
