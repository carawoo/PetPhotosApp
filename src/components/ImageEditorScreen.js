import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ImageEditorScreen({ visible, imageUri, onConfirm, onCancel }) {
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [activeAdjustment, setActiveAdjustment] = useState(null); // 'brightness', 'saturation', 'contrast'
  const [croppedUri, setCroppedUri] = useState(null); // 크롭된 이미지 URI
  const [customFilters, setCustomFilters] = useState([]); // 커스텀 필터 목록
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [isCropping, setIsCropping] = useState(false);

  const { currentUser } = useAuth();

  // 기본 필터 목록 (세피아, 빈티지 제거)
  const defaultFilters = [
    { id: 'normal', name: '원본', filter: 'none', isDefault: true },
    { id: 'grayscale', name: '흑백', filter: 'grayscale(100%)', isDefault: true },
    { id: 'warm', name: '따뜻한', filter: 'saturate(150%) contrast(110%) brightness(105%)', isDefault: true },
    { id: 'cool', name: '시원한', filter: 'saturate(80%) hue-rotate(15deg) brightness(105%)', isDefault: true },
    { id: 'dramatic', name: '드라마틱', filter: 'contrast(150%) brightness(90%)', isDefault: true },
    { id: 'fade', name: '페이드', filter: 'contrast(85%) brightness(110%) saturate(80%)', isDefault: true },
  ];

  // 전체 필터 목록 (기본 + 커스텀)
  const filters = [...defaultFilters, ...customFilters];

  // 커스텀 필터 로드
  useEffect(() => {
    loadCustomFilters();
  }, []);

  const loadCustomFilters = async () => {
    try {
      if (!currentUser) return;

      const { doc, getDoc } = require('firebase/firestore');
      const { db } = require('../config/firebase.config');

      const userRef = doc(db, 'users', currentUser.id);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.customFilters) {
          setCustomFilters(userData.customFilters);
        }
      }
    } catch (error) {
      console.error('Failed to load custom filters:', error);
    }
  };

  // 1:1 크롭 함수
  const handleCrop = async () => {
    try {
      setIsCropping(true);
      const currentUri = croppedUri || imageUri;

      // 이미지 크기 가져오기
      const imageInfo = await new Promise((resolve, reject) => {
        if (Platform.OS === 'web') {
          const img = new window.Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = reject;
          img.src = currentUri;
        } else {
          Image.getSize(
            currentUri,
            (width, height) => resolve({ width, height }),
            reject
          );
        }
      });

      const { width, height } = imageInfo;
      const size = Math.min(width, height);
      const originX = (width - size) / 2;
      const originY = (height - size) / 2;

      // 1:1 정사각형으로 크롭
      const manipResult = await ImageManipulator.manipulateAsync(
        currentUri,
        [
          {
            crop: {
              originX,
              originY,
              width: size,
              height: size,
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCroppedUri(manipResult.uri);

      if (Platform.OS === 'web') {
        alert('✅ 1:1 비율로 크롭되었습니다!');
      } else {
        Alert.alert('완료', '1:1 비율로 크롭되었습니다!');
      }
    } catch (error) {
      console.error('Crop error:', error);
      if (Platform.OS === 'web') {
        alert('크롭에 실패했습니다.');
      } else {
        Alert.alert('오류', '크롭에 실패했습니다.');
      }
    } finally {
      setIsCropping(false);
    }
  };

  // 커스텀 필터 저장
  const handleSaveCustomFilter = async () => {
    if (!filterName.trim()) {
      if (Platform.OS === 'web') {
        alert('필터 이름을 입력해주세요.');
      } else {
        Alert.alert('알림', '필터 이름을 입력해주세요.');
      }
      return;
    }

    try {
      const filterString = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`;
      const newFilter = {
        id: `custom_${Date.now()}`,
        name: filterName.trim(),
        filter: filterString,
        isDefault: false,
      };

      const updatedFilters = [...customFilters, newFilter];
      setCustomFilters(updatedFilters);

      // Firestore에 저장
      const { doc, updateDoc } = require('firebase/firestore');
      const { db } = require('../config/firebase.config');

      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, { customFilters: updatedFilters });

      setShowSaveFilterModal(false);
      setFilterName('');

      if (Platform.OS === 'web') {
        alert('✨ 커스텀 필터가 저장되었습니다!');
      } else {
        Alert.alert('완료', '커스텀 필터가 저장되었습니다!');
      }
    } catch (error) {
      console.error('Failed to save custom filter:', error);
      if (Platform.OS === 'web') {
        alert('필터 저장에 실패했습니다.');
      } else {
        Alert.alert('오류', '필터 저장에 실패했습니다.');
      }
    }
  };

  // 커스텀 필터 삭제
  const handleDeleteCustomFilter = async (filterId) => {
    const confirmDelete = Platform.OS === 'web'
      ? window.confirm('이 필터를 삭제하시겠습니까?')
      : await new Promise((resolve) => {
          Alert.alert(
            '필터 삭제',
            '이 필터를 삭제하시겠습니까?',
            [
              { text: '취소', style: 'cancel', onPress: () => resolve(false) },
              { text: '삭제', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmDelete) return;

    try {
      const updatedFilters = customFilters.filter(f => f.id !== filterId);
      setCustomFilters(updatedFilters);

      // Firestore에 저장
      const { doc, updateDoc } = require('firebase/firestore');
      const { db } = require('../config/firebase.config');

      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, { customFilters: updatedFilters });

      if (selectedFilter === filterId) {
        setSelectedFilter('normal');
      }
    } catch (error) {
      console.error('Failed to delete custom filter:', error);
    }
  };

  // 현재 적용된 필터 스타일
  const getFilterStyle = () => {
    const baseFilter = filters.find(f => f.id === selectedFilter)?.filter || 'none';
    const adjustments = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`;

    if (baseFilter === 'none') {
      return adjustments;
    }
    return `${baseFilter} ${adjustments}`;
  };

  const handleConfirm = () => {
    // 편집된 이미지 정보를 부모 컴포넌트로 전달
    onConfirm({
      uri: croppedUri || imageUri, // 크롭된 이미지가 있으면 크롭된 URI 사용
      filter: getFilterStyle(),
      brightness,
      saturation,
      contrast,
      selectedFilter,
    });
  };

  const handleReset = () => {
    setSelectedFilter('normal');
    setBrightness(100);
    setSaturation(100);
    setContrast(100);
    setActiveAdjustment(null);
    setCroppedUri(null); // 크롭도 초기화
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>편집</Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Ionicons name="checkmark" size={28} color="#FF3366" />
          </TouchableOpacity>
        </View>

        {/* 이미지 미리보기 */}
        <View style={styles.imageContainer}>
          {Platform.OS === 'web' ? (
            React.createElement('img', {
              src: croppedUri || imageUri,
              alt: 'Preview',
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: getFilterStyle(),
              },
            })
          ) : (
            <Image
              source={{ uri: croppedUri || imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          )}

          {/* 크롭 버튼 */}
          <TouchableOpacity
            style={styles.cropButton}
            onPress={handleCrop}
            disabled={isCropping}
          >
            {isCropping ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="crop" size={20} color="#fff" />
                <Text style={styles.cropButtonText}>1:1</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 조정 도구 */}
        {activeAdjustment && (
          <View style={styles.adjustmentPanel}>
            <View style={styles.adjustmentHeader}>
              <Text style={styles.adjustmentTitle}>
                {activeAdjustment === 'brightness' && '밝기'}
                {activeAdjustment === 'saturation' && '채도'}
                {activeAdjustment === 'contrast' && '대비'}
              </Text>
              <Text style={styles.adjustmentValue}>
                {activeAdjustment === 'brightness' && brightness}
                {activeAdjustment === 'saturation' && saturation}
                {activeAdjustment === 'contrast' && contrast}
              </Text>
            </View>
            {Platform.OS === 'web' ? (
              <input
                type="range"
                min="0"
                max="200"
                value={
                  activeAdjustment === 'brightness' ? brightness :
                  activeAdjustment === 'saturation' ? saturation :
                  contrast
                }
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (activeAdjustment === 'brightness') setBrightness(value);
                  else if (activeAdjustment === 'saturation') setSaturation(value);
                  else setContrast(value);
                }}
                style={{
                  width: '100%',
                  height: 4,
                  appearance: 'none',
                  background: '#E5E5EA',
                  borderRadius: 2,
                  outline: 'none',
                }}
              />
            ) : null}
          </View>
        )}

        {/* 하단 도구 */}
        <View style={styles.toolsContainer}>
          {/* 필터 또는 조정 탭 */}
          {!activeAdjustment ? (
            <>
              {/* 필터 스크롤 */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterScrollContent}
              >
                {filters.map((filter) => (
                  <View key={filter.id} style={styles.filterButtonContainer}>
                    <TouchableOpacity
                      style={styles.filterButton}
                      onPress={() => setSelectedFilter(filter.id)}
                    >
                      <View
                        style={[
                          styles.filterPreview,
                          selectedFilter === filter.id && styles.filterPreviewActive,
                        ]}
                      >
                        {Platform.OS === 'web' && React.createElement('img', {
                          src: croppedUri || imageUri,
                          alt: filter.name,
                          style: {
                            width: 60,
                            height: 60,
                            borderRadius: 8,
                            objectFit: 'cover',
                            filter: filter.filter,
                          },
                        })}
                      </View>
                      <Text
                        style={[
                          styles.filterName,
                          selectedFilter === filter.id && styles.filterNameActive,
                        ]}
                      >
                        {filter.name}
                      </Text>
                    </TouchableOpacity>

                    {/* 커스텀 필터 삭제 버튼 */}
                    {!filter.isDefault && (
                      <TouchableOpacity
                        style={styles.deleteFilterButton}
                        onPress={() => handleDeleteCustomFilter(filter.id)}
                      >
                        <Ionicons name="close-circle" size={20} color="#FF3366" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>

              {/* 조정 버튼 */}
              <View style={styles.adjustmentButtons}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => setActiveAdjustment('brightness')}
                >
                  <Ionicons name="sunny-outline" size={24} color="#333" />
                  <Text style={styles.adjustButtonText}>밝기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => setActiveAdjustment('saturation')}
                >
                  <Ionicons name="color-palette-outline" size={24} color="#333" />
                  <Text style={styles.adjustButtonText}>채도</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => setActiveAdjustment('contrast')}
                >
                  <Ionicons name="contrast-outline" size={24} color="#333" />
                  <Text style={styles.adjustButtonText}>대비</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => setShowSaveFilterModal(true)}
                >
                  <Ionicons name="bookmark-outline" size={24} color="#FF3366" />
                  <Text style={[styles.adjustButtonText, { color: '#FF3366' }]}>저장</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={handleReset}
                >
                  <Ionicons name="refresh-outline" size={24} color="#333" />
                  <Text style={styles.adjustButtonText}>초기화</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={styles.doneAdjustButton}
              onPress={() => setActiveAdjustment(null)}
            >
              <Text style={styles.doneAdjustButtonText}>완료</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 커스텀 필터 저장 모달 */}
        <Modal
          visible={showSaveFilterModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSaveFilterModal(false)}
        >
          <View style={styles.saveFilterModalOverlay}>
            <View style={styles.saveFilterModalContent}>
              <Text style={styles.saveFilterModalTitle}>커스텀 필터 저장</Text>
              <Text style={styles.saveFilterModalSubtitle}>
                현재 조정값을 저장하여 나만의 필터를 만드세요!
              </Text>
              <TextInput
                style={styles.filterNameInput}
                placeholder="필터 이름 (예: 내 필터)"
                placeholderTextColor="#AEAEB2"
                value={filterName}
                onChangeText={setFilterName}
                maxLength={15}
                autoFocus
              />
              <View style={styles.saveFilterModalButtons}>
                <TouchableOpacity
                  style={[styles.saveFilterModalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowSaveFilterModal(false);
                    setFilterName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveFilterModalButton, styles.saveButton]}
                  onPress={handleSaveCustomFilter}
                >
                  <Text style={styles.saveButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cropButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  cropButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  adjustmentPanel: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  adjustmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  adjustmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  adjustmentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3366',
  },
  toolsContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: 30,
  },
  filterScroll: {
    maxHeight: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  filterButtonContainer: {
    position: 'relative',
    marginRight: 8,
  },
  filterButton: {
    alignItems: 'center',
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  filterPreviewActive: {
    borderColor: '#FF3366',
  },
  filterName: {
    fontSize: 12,
    color: '#666',
  },
  filterNameActive: {
    color: '#FF3366',
    fontWeight: '600',
  },
  deleteFilterButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    zIndex: 10,
  },
  adjustmentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  adjustButton: {
    alignItems: 'center',
  },
  adjustButtonText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
  },
  doneAdjustButton: {
    margin: 20,
    backgroundColor: '#FF3366',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneAdjustButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveFilterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  saveFilterModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  saveFilterModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  saveFilterModalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  filterNameInput: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 20,
  },
  saveFilterModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveFilterModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  saveButton: {
    backgroundColor: '#FF3366',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
