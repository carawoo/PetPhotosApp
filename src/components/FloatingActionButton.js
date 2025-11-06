import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { usePost } from '../contexts/PostContext';

export default function FloatingActionButton() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [petName, setPetName] = useState('');
  const [description, setDescription] = useState('');
  const [facing, setFacing] = useState('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = React.useRef(null);
  const { addPost } = usePost();

  const openCamera = async () => {
    setMenuOpen(false);

    if (!cameraPermission?.granted) {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
        return;
      }
    }

    setCameraModalVisible(true);
  };

  const openGallery = async () => {
    setMenuOpen(false);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setUploadModalVisible(true);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
        });
        setCameraModalVisible(false);
        setSelectedImage(photo.uri);
        setUploadModalVisible(true);
      } catch (error) {
        Alert.alert('오류', '사진을 촬영할 수 없습니다.');
      }
    }
  };

  const handleUpload = () => {
    if (!petName.trim()) {
      Alert.alert('알림', '반려동물 이름을 입력해주세요.');
      return;
    }

    addPost({
      imageUrl: selectedImage,
      petName: petName.trim(),
      description: description.trim(),
    });

    // 초기화
    setSelectedImage(null);
    setPetName('');
    setDescription('');
    setUploadModalVisible(false);

    Alert.alert('성공', '게시물이 업로드되었습니다!');
  };

  return (
    <>
      {/* 메인 FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setMenuOpen(!menuOpen)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={menuOpen ? 'close' : 'add'}
          size={32}
          color="#fff"
        />
      </TouchableOpacity>

      {/* 서브 메뉴 */}
      {menuOpen && (
        <>
          <View style={styles.overlay} onTouchEnd={() => setMenuOpen(false)} />

          <TouchableOpacity
            style={[styles.subFab, styles.cameraFab]}
            onPress={openCamera}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.subFab, styles.galleryFab]}
            onPress={openGallery}
            activeOpacity={0.8}
          >
            <Ionicons name="images" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* 카메라 모달 */}
      <Modal
        visible={cameraModalVisible}
        animationType="slide"
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCameraModalVisible(false)}
              >
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraControls}>
              <View style={styles.spacer} />
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
              >
                <Ionicons name="camera-reverse" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* 업로드 모달 */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.uploadModalOverlay}>
          <View style={styles.uploadModalContent}>
            <View style={styles.uploadModalHeader}>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

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
              <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
                <Ionicons name="checkmark" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 998,
  },
  subFab: {
    position: 'absolute',
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 999,
  },
  cameraFab: {
    bottom: 220,
  },
  galleryFab: {
    bottom: 150,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  spacer: {
    width: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  uploadModalHeader: {
    padding: 20,
    alignItems: 'flex-end',
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
  uploadButton: {
    backgroundColor: '#FF6B6B',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});
