import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ImageEditorScreen({ visible, imageUri, onConfirm, onCancel }) {
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [activeAdjustment, setActiveAdjustment] = useState(null); // 'brightness', 'saturation', 'contrast'

  // 필터 목록
  const filters = [
    { id: 'normal', name: '원본', filter: 'none' },
    { id: 'grayscale', name: '흑백', filter: 'grayscale(100%)' },
    { id: 'sepia', name: '세피아', filter: 'sepia(100%)' },
    { id: 'vintage', name: '빈티지', filter: 'sepia(50%) contrast(120%) brightness(95%)' },
    { id: 'warm', name: '따뜻한', filter: 'saturate(150%) contrast(110%) brightness(105%)' },
    { id: 'cool', name: '시원한', filter: 'saturate(80%) hue-rotate(15deg) brightness(105%)' },
    { id: 'dramatic', name: '드라마틱', filter: 'contrast(150%) brightness(90%)' },
    { id: 'fade', name: '페이드', filter: 'contrast(85%) brightness(110%) saturate(80%)' },
  ];

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
      uri: imageUri,
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
              src: imageUri,
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
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          )}
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
                  <TouchableOpacity
                    key={filter.id}
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
                        src: imageUri,
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
  },
  image: {
    width: '100%',
    height: '100%',
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
  filterButton: {
    alignItems: 'center',
    marginRight: 8,
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
});
