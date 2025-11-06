import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';

export default function CameraScreen() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const cameraRef = useRef(null);

  if (!permission || !mediaPermission) {
    return <View style={styles.container}><Text>로딩 중...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#ccc" />
        <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>권한 허용하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
        });
        setCapturedPhoto(photo);
      } catch (error) {
        console.error('사진 촬영 오류:', error);
        Alert.alert('오류', '사진을 촬영할 수 없습니다.');
      }
    }
  };

  const savePhoto = async () => {
    if (capturedPhoto) {
      try {
        if (!mediaPermission.granted) {
          const { status } = await requestMediaPermission();
          if (status !== 'granted') {
            Alert.alert('오류', '미디어 라이브러리 권한이 필요합니다.');
            return;
          }
        }

        await MediaLibrary.saveToLibraryAsync(capturedPhoto.uri);
        Alert.alert('성공', '사진이 갤러리에 저장되었습니다!', [
          {
            text: '확인',
            onPress: () => setCapturedPhoto(null),
          },
        ]);
      } catch (error) {
        console.error('저장 오류:', error);
        Alert.alert('오류', '사진을 저장할 수 없습니다.');
      }
    }
  };

  const discardPhoto = () => {
    setCapturedPhoto(null);
  };

  if (capturedPhoto) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedPhoto.uri }} style={styles.preview} />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.discardButton} onPress={discardPhoto}>
            <Ionicons name="close-circle" size={48} color="#fff" />
            <Text style={styles.actionLabel}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={savePhoto}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            <Text style={styles.actionLabel}>저장</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        {/* 상단 컨트롤 */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="flash-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="settings-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 하단 컨트롤 */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.galleryButton}>
            <Ionicons name="images-outline" size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Ionicons name="camera-reverse-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  preview: {
    flex: 1,
  },
  previewActions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  discardButton: {
    alignItems: 'center',
  },
  saveButton: {
    alignItems: 'center',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
});
