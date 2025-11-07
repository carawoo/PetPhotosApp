import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ImageSlider({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 단일 이미지인 경우 슬라이더 없이 표시
  if (!images || images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    return (
      <Image
        source={{ uri: images[0] }}
        style={styles.singleImage}
        resizeMode="cover"
      />
    );
  }

  // 여러 이미지인 경우 슬라이더
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: images[currentIndex] }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* 이전 버튼 */}
      {currentIndex > 0 && (
        <TouchableOpacity
          style={[styles.button, styles.prevButton]}
          onPress={() => setCurrentIndex(currentIndex - 1)}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* 다음 버튼 */}
      {currentIndex < images.length - 1 && (
        <TouchableOpacity
          style={[styles.button, styles.nextButton]}
          onPress={() => setCurrentIndex(currentIndex + 1)}
        >
          <Ionicons name="chevron-forward" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* 인디케이터 */}
      <View style={styles.indicators}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.activeIndicator,
            ]}
          />
        ))}
      </View>

      {/* 카운터 */}
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {images.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  singleImage: {
    width: '100%',
    aspectRatio: 1,
  },
  button: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  prevButton: {
    left: 10,
  },
  nextButton: {
    right: 10,
  },
  indicators: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  counter: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
