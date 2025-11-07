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
  ActivityIndicator,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePost } from '../contexts/PostContext';
import { useAuth } from '../contexts/AuthContext';

export default function FloatingActionButton() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [petInputText, setPetInputText] = useState('');
  const [localPets, setLocalPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const { addPost } = usePost();
  const { currentUser } = useAuth();

  // 콤마 입력 처리 - 태그 추가
  const handlePetInputChange = (text) => {
    if (text.endsWith(',')) {
      const newPetName = text.slice(0, -1).trim();
      if (newPetName && !localPets.includes(newPetName)) {
        setLocalPets([...localPets, newPetName]);
        if (!selectedPet) {
          setSelectedPet(newPetName);
        }
      }
      setPetInputText('');
    } else {
      setPetInputText(text);
    }
  };

  // 칩 삭제
  const handleRemovePet = (petToRemove) => {
    setLocalPets(localPets.filter(p => p !== petToRemove));
    if (selectedPet === petToRemove) {
      setSelectedPet(localPets.find(p => p !== petToRemove) || '');
    }
  };

  // 칩 선택
  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
  };

  const openCamera = async () => {
    setMenuOpen(false);

    // 디바이스 네이티브 카메라 사용 (고해상도)
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1, // 최고 화질
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setUploadModalVisible(true);
    }
  };

  const openGallery = async () => {
    setMenuOpen(false);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1, // 최고 화질
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setUploadModalVisible(true);
    }
  };


  const convertBlobToBase64 = async (blobUrl) => {
    try {
      const response = await fetch(blobUrl);
      if (!response.ok) {
        throw new Error('이미지를 불러올 수 없습니다.');
      }

      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('이미지 변환에 실패했습니다.'));
          }
        };

        reader.onerror = () => {
          reject(new Error('이미지 읽기에 실패했습니다.'));
        };

        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert blob to base64:', error);
      throw error; // 에러를 다시 던져서 상위에서 처리하도록
    }
  };

  const handleUpload = async () => {
    if (!selectedPet && localPets.length === 0) {
      Alert.alert('알림', '반려동물 이름을 입력해주세요.');
      return;
    }

    const finalPetName = selectedPet || localPets[0];
    if (!finalPetName) {
      Alert.alert('알림', '반려동물을 선택해주세요.');
      return;
    }

    if (!selectedImage) {
      Alert.alert('알림', '이미지를 선택해주세요.');
      return;
    }

    setUploading(true);

    try {
      // blob URL을 base64로 변환 (필수)
      let imageUrl = selectedImage;

      if (selectedImage.startsWith('blob:')) {
        try {
          imageUrl = await convertBlobToBase64(selectedImage);
        } catch (conversionError) {
          throw new Error('이미지 변환에 실패했습니다. 다시 시도해주세요.');
        }
      }

      // base64 형식 검증
      if (!imageUrl.startsWith('data:image/')) {
        throw new Error('올바른 이미지 형식이 아닙니다.');
      }

      addPost({
        imageUrl,
        petName: finalPetName.trim(),
        description: description.trim(),
      });

      // 초기화
      setSelectedImage(null);
      setPetInputText('');
      setLocalPets([]);
      setSelectedPet('');
      setDescription('');
      setUploadModalVisible(false);

      Alert.alert('성공', '게시물이 업로드되었습니다!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        '업로드 실패',
        error.message || '게시물 업로드 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setUploading(false);
    }
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
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setMenuOpen(false)}
            activeOpacity={1}
          />

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

      {/* 업로드 모달 */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.uploadModalOverlay}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={() => setUploadModalVisible(false)}
          />
          <View
            style={styles.uploadModalContent}
            onStartShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
          >
            <View style={styles.uploadModalHeader}>
              <TouchableOpacity
                onPress={() => setUploadModalVisible(false)}
                disabled={uploading}
              >
                <Ionicons name="close" size={28} color={uploading ? "#ccc" : "#333"} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.uploadModalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.formContainer}>
              {/* 반려동물 선택 */}
              <View style={styles.petSelectionContainer}>
                <Text style={styles.petSelectionLabel}>반려동물 *</Text>

                {/* 이름 입력란 (콤마로 태그 추가) */}
                <TextInput
                  style={styles.addPetInput}
                  placeholder="이름 입력 후 콤마(,)로 추가"
                  value={petInputText}
                  onChangeText={handlePetInputChange}
                  editable={!uploading}
                  maxLength={20}
                />

                {/* 추가된 태그 칩 */}
                {localPets.length > 0 && (
                  <View style={styles.petChipsContainer}>
                    {localPets.map((pet, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.petChip,
                          selectedPet === pet && styles.petChipSelected
                        ]}
                        onPress={() => handleSelectPet(pet)}
                        disabled={uploading}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="paw"
                          size={16}
                          color={selectedPet === pet ? "#FFFFFF" : "#FF3366"}
                        />
                        <Text style={[
                          styles.petChipText,
                          selectedPet === pet && styles.petChipTextSelected
                        ]}>
                          {pet}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemovePet(pet)}
                          disabled={uploading}
                          style={styles.petChipRemoveButton}
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color={selectedPet === pet ? "#FFFFFF" : "#999"}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* 등록된 반려동물 빠른 추가 */}
                {currentUser?.pets && currentUser.pets.length > 0 && (
                  <View style={styles.registeredPetsContainer}>
                    <Text style={styles.registeredPetsLabel}>등록된 반려동물</Text>
                    <View style={styles.petChipsContainer}>
                      {currentUser.pets.map((pet, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.registeredPetChip}
                          onPress={() => {
                            if (!localPets.includes(pet)) {
                              setLocalPets([...localPets, pet]);
                              setSelectedPet(pet);
                            }
                          }}
                          disabled={uploading || localPets.includes(pet)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add-circle-outline" size={16} color="#FF3366" />
                          <Text style={styles.registeredPetChipText}>{pet}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="설명을 입력하세요..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                onStartShouldSetResponder={() => true}
                editable={!uploading}
              />
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.uploadingText}>업로드 중...</Text>
                  </>
                ) : (
                  <Text style={styles.uploadButtonText}>업로드</Text>
                )}
              </TouchableOpacity>
            </View>
            </ScrollView>
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
    bottom: 100,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF3366',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 998,
  },
  subFab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 999,
  },
  cameraFab: {
    bottom: 240,
  },
  galleryFab: {
    bottom: 170,
  },
  uploadModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  uploadModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    zIndex: 1,
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
  petSelectionContainer: {
    marginBottom: 20,
  },
  petSelectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  addPetInput: {
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  petChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 12,
    borderWidth: 2,
    borderColor: '#FFE8F0',
    gap: 6,
  },
  petChipSelected: {
    backgroundColor: '#FF3366',
    borderColor: '#FF3366',
  },
  petChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3366',
  },
  petChipTextSelected: {
    color: '#FFFFFF',
  },
  petChipRemoveButton: {
    padding: 2,
  },
  registeredPetsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  registeredPetsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  registeredPetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 6,
  },
  registeredPetChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  noPetsText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  uploadModalScrollView: {
    flex: 1,
  },
  uploadButton: {
    backgroundColor: '#FF6B6B',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
