import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { usePost } from '../contexts/PostContext';
import { compressImage } from '../utils/imageCompression';

export default function CameraScreen() {
  const [facing, setFacing] = useState('back');
  const [webFacingMode, setWebFacingMode] = useState('environment'); // 'environment' = 후면, 'user' = 전면
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [petName, setPetName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [webStream, setWebStream] = useState(null);
  const [webCameraReady, setWebCameraReady] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [showCustomFilterEditor, setShowCustomFilterEditor] = useState(false);
  const [customFilters, setCustomFilters] = useState([]);
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [filterName, setFilterName] = useState('');
  const [showFilterNameInput, setShowFilterNameInput] = useState(false);
  const [activeSlider, setActiveSlider] = useState('brightness'); // 'brightness', 'saturation', 'contrast'
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const { currentUser } = useAuth();
  const { addPost } = usePost();

  // 기본 필터 목록
  const defaultFilters = [
    { id: 'normal', name: '원본', filter: 'none', isDefault: true },
    { id: 'grayscale', name: '흑백', filter: 'grayscale(100%)', isDefault: true },
    { id: 'vintage', name: '빈티지', filter: 'sepia(50%) contrast(120%) brightness(95%)', isDefault: true },
    { id: 'warm', name: '따뜻한', filter: 'saturate(150%) contrast(110%) brightness(105%)', isDefault: true },
    { id: 'dramatic', name: '드라마틱', filter: 'contrast(150%) brightness(90%)', isDefault: true },
  ];

  // 전체 필터 목록 (기본 + 커스텀)
  const filters = [...defaultFilters, ...customFilters];

  // 커스텀 필터 불러오기
  useEffect(() => {
    loadCustomFilters();
  }, []);

  // 웹 카메라 초기화
  useEffect(() => {
    if (Platform.OS === 'web' && !showPostForm && !capturedPhoto) {
      startWebCamera();
    }

    return () => {
      // cleanup
    };
  }, [showPostForm, capturedPhoto]);

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      if (webStream) {
        webStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadCustomFilters = () => {
    try {
      const saved = localStorage.getItem('customFilters');
      if (saved) {
        setCustomFilters(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load custom filters:', error);
    }
  };

  const saveCustomFilter = () => {
    setShowFilterNameInput(true);
  };

  const confirmSaveFilter = () => {
    if (!filterName.trim()) {
      alert('필터 이름을 입력해주세요.');
      return;
    }

    const filterString = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`;
    const newFilter = {
      id: `custom_${Date.now()}`,
      name: filterName.trim(),
      filter: filterString,
      isDefault: false,
    };

    const updated = [...customFilters, newFilter];
    setCustomFilters(updated);
    localStorage.setItem('customFilters', JSON.stringify(updated));

    // 초기화
    setBrightness(100);
    setSaturation(100);
    setContrast(100);
    setFilterName('');
    setShowCustomFilterEditor(false);
    setShowFilterNameInput(false);
    setSelectedFilter('normal');

    alert('커스텀 필터가 저장되었습니다!');
  };

  const deleteCustomFilter = (filterId) => {
    if (window.confirm('이 필터를 삭제하시겠습니까?')) {
      const updated = customFilters.filter(f => f.id !== filterId);
      setCustomFilters(updated);
      localStorage.setItem('customFilters', JSON.stringify(updated));

      if (selectedFilter === filterId) {
        setSelectedFilter('normal');
      }
    }
  };

  const openCustomFilterEditor = () => {
    setBrightness(100);
    setSaturation(100);
    setContrast(100);
    setFilterName('');
    setShowCustomFilterEditor(true);
    setShowFilterNameInput(false);
    setSelectedFilter('custom');
  };

  const startWebCamera = async () => {
    try {
      // 고해상도 카메라 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: webFacingMode, // 'environment' 또는 'user'
          width: { ideal: 3840, max: 4096 },  // 4K 해상도
          height: { ideal: 2160, max: 2160 },
          aspectRatio: { ideal: 16/9 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setWebStream(stream);
        setWebCameraReady(true);
      }
    } catch (error) {
      console.error('웹 카메라 시작 오류:', error);
      // 고해상도 실패 시 기본 설정으로 재시도
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: webFacingMode },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setWebStream(stream);
          setWebCameraReady(true);
        }
      } catch (retryError) {
        console.error('카메라 재시도 실패:', retryError);
        alert('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      }
    }
  };

  const captureWebPhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      // 비디오의 실제 해상도 사용
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { alpha: false });

      // 필터 적용
      const currentFilterStyle = filters.find(f => f.id === selectedFilter)?.filter || 'none';
      if (currentFilterStyle !== 'none') {
        ctx.filter = currentFilterStyle;
      }

      // 고품질 렌더링 설정
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0);

      // 최고 품질로 저장 (0.98)
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setCapturedPhoto({ uri: url });
        setShowPostForm(true);

        // 카메라 스트림 정지
        if (webStream) {
          webStream.getTracks().forEach(track => track.stop());
          setWebStream(null);
        }
      }, 'image/jpeg', 0.98);
    }
  };

  // 이미지에 필터 적용
  const applyFilterToImage = (imageDataUrl, filterStyle) => {
    return new Promise((resolve) => {
      if (filterStyle === 'none') {
        resolve(imageDataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { alpha: false });

        // 필터 적용
        ctx.filter = filterStyle;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0);

        // 최고 품질로 변환
        const filteredDataUrl = canvas.toDataURL('image/jpeg', 0.98);
        resolve(filteredDataUrl);
      };
      img.src = imageDataUrl;
    });
  };

  // 웹 카메라 전면/후면 전환
  const toggleWebCameraFacing = () => {
    // 기존 스트림 정지
    if (webStream) {
      webStream.getTracks().forEach(track => track.stop());
      setWebStream(null);
      setWebCameraReady(false);
    }

    // facingMode 전환
    const newFacingMode = webFacingMode === 'environment' ? 'user' : 'environment';
    setWebFacingMode(newFacingMode);

    // 새로운 카메라로 다시 시작
    setTimeout(() => {
      startWebCamera();
    }, 100);
  };

  // 네이티브 카메라로 직접 촬영
  const openNativeCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = webFacingMode; // 'environment' 또는 'user'

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          let imageUri = event.target.result;

          // 선택된 필터 적용
          let filterStyle = 'none';
          if (selectedFilter === 'custom') {
            // 커스텀 필터 적용
            filterStyle = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`;
          } else {
            const currentFilter = filters.find(f => f.id === selectedFilter);
            if (currentFilter) {
              filterStyle = currentFilter.filter;
            }
          }

          if (filterStyle !== 'none') {
            imageUri = await applyFilterToImage(imageUri, filterStyle);
          }

          setCapturedPhoto({ uri: imageUri });
          setShowPostForm(true);

          // 카메라 스트림 정지
          if (webStream) {
            webStream.getTracks().forEach(track => track.stop());
            setWebStream(null);
          }
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  };

  // 웹이 아닌 경우에만 권한 체크
  if (Platform.OS !== 'web') {
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
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        let imageUri = result.assets[0].uri;

        // 웹에서 선택한 필터 적용
        if (Platform.OS === 'web') {
          // Base64로 변환 필요 시
          if (!imageUri.startsWith('data:')) {
            try {
              const response = await fetch(imageUri);
              const blob = await response.blob();
              imageUri = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
              });
            } catch (e) {
              console.error('Image conversion failed:', e);
            }
          }

          // 필터 적용
          let filterStyle = 'none';
          if (selectedFilter === 'custom') {
            // 커스텀 필터 적용
            filterStyle = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`;
          } else {
            const currentFilter = filters.find(f => f.id === selectedFilter);
            if (currentFilter) {
              filterStyle = currentFilter.filter;
            }
          }

          if (filterStyle !== 'none') {
            imageUri = await applyFilterToImage(imageUri, filterStyle);
          }
        }

        setCapturedPhoto({ uri: imageUri });
        setShowPostForm(true);

        // 웹 카메라 스트림 정지
        if (Platform.OS === 'web' && webStream) {
          webStream.getTracks().forEach(track => track.stop());
          setWebStream(null);
        }
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      if (Platform.OS === 'web') {
        alert('이미지를 선택할 수 없습니다.');
      } else {
        Alert.alert('오류', '이미지를 선택할 수 없습니다.');
      }
    }
  };

  const takePicture = async () => {
    if (Platform.OS === 'web') {
      // 웹에서는 이미지 피커 사용
      pickImage();
      return;
    }

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
        });
        setCapturedPhoto(photo);
        setShowPostForm(true);
      } catch (error) {
        console.error('사진 촬영 오류:', error);
        Alert.alert('오류', '사진을 촬영할 수 없습니다.');
      }
    }
  };

  const handlePost = async () => {
    if (!petName.trim()) {
      if (Platform.OS === 'web') {
        alert('반려동물 이름을 입력해주세요.');
      } else {
        Alert.alert('알림', '반려동물 이름을 입력해주세요.');
      }
      return;
    }

    if (!capturedPhoto) {
      if (Platform.OS === 'web') {
        alert('이미지를 선택해주세요.');
      } else {
        Alert.alert('알림', '이미지를 선택해주세요.');
      }
      return;
    }

    try {
      setUploading(true);
      let imageUrl = capturedPhoto.uri;

      // Blob URL을 Base64로 변환 (웹용)
      if (imageUrl.startsWith('blob:')) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          imageUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Blob conversion failed:', error);
        }
      }

      // 이미지 압축
      if (imageUrl.startsWith('data:image')) {
        try {
          imageUrl = await compressImage(imageUrl, 800, 600, 0.8);
        } catch (error) {
          console.warn('Compression failed, using original:', error);
        }
      }

      // 게시물 생성
      await addPost({
        petName: petName.trim(),
        description: description.trim(),
        imageUrl: imageUrl,
      });

      // 초기화
      setCapturedPhoto(null);
      setShowPostForm(false);
      setPetName('');
      setDescription('');
      setSelectedFilter('normal'); // 필터 초기화
      setUploading(false);

      if (Platform.OS === 'web') {
        alert('게시물이 등록되었습니다!');
        // 카메라 다시 시작
        setTimeout(() => {
          startWebCamera();
        }, 100);
      } else {
        Alert.alert('성공', '게시물이 등록되었습니다!');
      }
    } catch (error) {
      console.error('게시물 등록 오류:', error);
      setUploading(false);
      if (Platform.OS === 'web') {
        alert('게시물 등록에 실패했습니다.');
      } else {
        Alert.alert('오류', '게시물 등록에 실패했습니다.');
      }
    }
  };

  const discardPhoto = () => {
    setCapturedPhoto(null);
    setShowPostForm(false);
    setPetName('');
    setDescription('');
    setSelectedFilter('normal'); // 필터 초기화

    // 웹에서는 카메라를 다시 시작
    if (Platform.OS === 'web') {
      setTimeout(() => {
        startWebCamera();
      }, 100);
    }
  };

  if (showPostForm && capturedPhoto) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={discardPhoto}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.formTitle}>새 게시물</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* 이미지 미리보기 */}
          <Image source={{ uri: capturedPhoto.uri }} style={styles.formImage} />

          {/* 입력 폼 */}
          <View style={styles.formInputs}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>반려동물 이름 *</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 멍멍이, 냥냥이"
                value={petName}
                onChangeText={setPetName}
                maxLength={20}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>설명</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="반려동물에 대해 설명해주세요..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
              <Text style={styles.charCount}>{description.length}/200</Text>
            </View>

            {/* 게시 버튼 */}
            <TouchableOpacity
              style={[styles.postButton, uploading && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.postButtonText}>게시하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // 웹 카메라 UI
  if (Platform.OS === 'web') {
    // 커스텀 필터 편집 중이면 실시간 슬라이더 값 적용
    const currentFilterStyle = selectedFilter === 'custom'
      ? `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%)`
      : filters.find(f => f.id === selectedFilter)?.filter || 'none';

    const VideoElement = React.createElement('video', {
      ref: videoRef,
      autoPlay: true,
      playsInline: true,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        backgroundColor: '#000',
        filter: currentFilterStyle,
        transition: showCustomFilterEditor ? 'filter 0.1s ease' : 'filter 0.3s ease',
      },
    });

    return (
      <View style={styles.webCameraContainer}>
        {VideoElement}

        {/* 필터 선택 UI */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filters.map((filter) => (
            <View key={filter.id} style={styles.filterButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedFilter === filter.id && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <View
                  style={[
                    styles.filterPreview,
                    selectedFilter === filter.id && styles.filterPreviewActive,
                  ]}
                >
                  {Platform.OS === 'web' && React.createElement('img', {
                    src: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=100&h=100&fit=crop',
                    alt: filter.name,
                    style: {
                      width: 50,
                      height: 50,
                      borderRadius: 25,
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
              {!filter.isDefault && (
                <TouchableOpacity
                  style={styles.deleteFilterButton}
                  onPress={() => deleteCustomFilter(filter.id)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3366" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* 커스텀 필터 생성 버튼 */}
          {!showCustomFilterEditor && (
            <TouchableOpacity
              style={styles.addFilterButton}
              onPress={openCustomFilterEditor}
            >
              <View style={styles.addFilterPreview}>
                <Ionicons name="add" size={32} color="#FF3366" />
              </View>
              <Text style={styles.addFilterText}>필터 추가</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* 하단 컨트롤 */}
        <View style={styles.webCameraControls}>
          <TouchableOpacity style={styles.webGalleryButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.webCaptureButton}
            onPress={openNativeCamera}
          >
            <View style={styles.webCaptureButtonInner}>
              <Ionicons name="camera" size={32} color="#FF3366" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.webFlipButton}
            onPress={toggleWebCameraFacing}
          >
            <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 커스텀 필터 편집기 (애플 스타일) */}
        {showCustomFilterEditor && (
          <View style={styles.customFilterEditor}>
            {/* 상단 컨트롤 버튼들 */}
            <View style={styles.editorTopControls}>
              <TouchableOpacity
                style={styles.editorControlButton}
                onPress={() => {
                  setShowCustomFilterEditor(false);
                  setSelectedFilter('normal');
                  setBrightness(100);
                  setSaturation(100);
                  setContrast(100);
                }}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editorControlButton}
                onPress={saveCustomFilter}
              >
                <Ionicons name="checkmark" size={24} color="#FF3366" />
              </TouchableOpacity>
            </View>

            {/* 중앙 슬라이더 영역 */}
            <View style={styles.editorSliderArea}>
              {/* 슬라이더 선택 버튼 */}
              <View style={styles.sliderTypeButtons}>
                <TouchableOpacity
                  style={[styles.sliderTypeButton, activeSlider === 'brightness' && styles.sliderTypeButtonActive]}
                  onPress={() => setActiveSlider('brightness')}
                >
                  <Ionicons name="sunny" size={20} color={activeSlider === 'brightness' ? '#FF3366' : '#fff'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sliderTypeButton, activeSlider === 'saturation' && styles.sliderTypeButtonActive]}
                  onPress={() => setActiveSlider('saturation')}
                >
                  <Ionicons name="color-palette" size={20} color={activeSlider === 'saturation' ? '#FF3366' : '#fff'} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sliderTypeButton, activeSlider === 'contrast' && styles.sliderTypeButtonActive]}
                  onPress={() => setActiveSlider('contrast')}
                >
                  <Ionicons name="contrast" size={20} color={activeSlider === 'contrast' ? '#FF3366' : '#fff'} />
                </TouchableOpacity>
              </View>

              {/* 현재 선택된 슬라이더 */}
              <View style={styles.activeSliderContainer}>
                {activeSlider === 'brightness' && (
                  <View style={styles.sliderWrapper}>
                    <View style={styles.sliderInputContainer}>
                      {Platform.OS === 'web' && React.createElement('input', {
                        type: 'range',
                        min: 50,
                        max: 150,
                        value: brightness,
                        onChange: (e) => setBrightness(Number(e.target.value)),
                        style: {
                          width: '100%',
                          height: 4,
                          borderRadius: 2,
                          outline: 'none',
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${(brightness - 50) / 1}%, rgba(255,255,255,0.2) ${(brightness - 50) / 1}%, rgba(255,255,255,0.2) 100%)`,
                          cursor: 'pointer',
                        },
                      })}
                    </View>
                    <Text style={styles.sliderValueText}>{brightness}%</Text>
                  </View>
                )}
                {activeSlider === 'saturation' && (
                  <View style={styles.sliderWrapper}>
                    <View style={styles.sliderInputContainer}>
                      {Platform.OS === 'web' && React.createElement('input', {
                        type: 'range',
                        min: 0,
                        max: 200,
                        value: saturation,
                        onChange: (e) => setSaturation(Number(e.target.value)),
                        style: {
                          width: '100%',
                          height: 4,
                          borderRadius: 2,
                          outline: 'none',
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${saturation / 2}%, rgba(255,255,255,0.2) ${saturation / 2}%, rgba(255,255,255,0.2) 100%)`,
                          cursor: 'pointer',
                        },
                      })}
                    </View>
                    <Text style={styles.sliderValueText}>{saturation}%</Text>
                  </View>
                )}
                {activeSlider === 'contrast' && (
                  <View style={styles.sliderWrapper}>
                    <View style={styles.sliderInputContainer}>
                      {Platform.OS === 'web' && React.createElement('input', {
                        type: 'range',
                        min: 50,
                        max: 200,
                        value: contrast,
                        onChange: (e) => setContrast(Number(e.target.value)),
                        style: {
                          width: '100%',
                          height: 4,
                          borderRadius: 2,
                          outline: 'none',
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${(contrast - 50) / 1.5}%, rgba(255,255,255,0.2) ${(contrast - 50) / 1.5}%, rgba(255,255,255,0.2) 100%)`,
                          cursor: 'pointer',
                        },
                      })}
                    </View>
                    <Text style={styles.sliderValueText}>{contrast}%</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* 필터 이름 입력 모달 */}
        <Modal
          visible={showFilterNameInput}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFilterNameInput(false)}
        >
          <View style={styles.filterNameModalOverlay}>
            <View style={styles.filterNameModalContent}>
              <Text style={styles.filterNameModalTitle}>필터 이름을 입력하세요</Text>
              <TextInput
                style={styles.filterNameModalInput}
                placeholder="예: 내가 만든 필터"
                placeholderTextColor="#AEAEB2"
                value={filterName}
                onChangeText={setFilterName}
                maxLength={15}
                autoFocus
              />
              <View style={styles.filterNameModalButtons}>
                <TouchableOpacity
                  style={[styles.filterNameModalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowFilterNameInput(false);
                    setFilterName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterNameModalButton, styles.confirmButton]}
                  onPress={confirmSaveFilter}
                >
                  <Text style={styles.confirmButtonText}>저장</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
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
  webCameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  webCameraControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  webGalleryButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webFlipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webCaptureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webCaptureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScrollView: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 120,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterButton: {
    alignItems: 'center',
    marginRight: 4,
  },
  filterButtonActive: {
    // 활성 상태는 자식 요소로 표현
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterPreviewActive: {
    borderColor: '#FF3366',
    backgroundColor: 'rgba(255, 51, 102, 0.2)',
  },
  filterPreviewSample: {
    width: 50,
    height: 50,
    borderRadius: 25,
    background: 'linear-gradient(135deg, #ff6b9d 0%, #feca57 30%, #48dbfb 60%, #ff9ff3 100%)',
    overflow: 'hidden',
  },
  filterName: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  filterNameActive: {
    color: '#FF3366',
    fontWeight: '700',
  },
  filterButtonContainer: {
    position: 'relative',
    marginRight: 4,
  },
  deleteFilterButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    zIndex: 10,
  },
  addFilterButton: {
    alignItems: 'center',
    marginLeft: 8,
  },
  addFilterPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#FF3366',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  addFilterText: {
    fontSize: 12,
    color: '#FF3366',
    fontWeight: '600',
  },
  customFilterEditor: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(20px)',
  },
  editorTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  editorControlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorSliderArea: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  sliderTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  sliderTypeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTypeButtonActive: {
    backgroundColor: 'rgba(255, 51, 102, 0.2)',
    borderWidth: 2,
    borderColor: '#FF3366',
  },
  activeSliderContainer: {
    minHeight: 40,
  },
  sliderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderInputContainer: {
    flex: 1,
  },
  sliderValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.5,
    minWidth: 50,
    textAlign: 'right',
  },
  filterNameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  filterNameModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  filterNameModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterNameModalInput: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 20,
  },
  filterNameModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  filterNameModalButton: {
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
  confirmButton: {
    backgroundColor: '#FF3366',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#FAFBFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  webTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  webSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  webPickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3366',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  webPickButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  formImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#E5E5EA',
  },
  formInputs: {
    padding: 20,
    paddingBottom: 100, // 바텀 네비게이션바 높이(80px) + 여유 공간
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  charCount: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'right',
  },
  postButton: {
    backgroundColor: '#FF3366',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  postButtonDisabled: {
    backgroundColor: '#AEAEB2',
    shadowOpacity: 0.2,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 24,
    textAlign: 'center',
    color: '#8E8E93',
    fontWeight: '500',
  },
  permissionButton: {
    backgroundColor: '#FF3366',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
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
