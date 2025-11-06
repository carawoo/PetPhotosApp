import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '../config/firebase.config';

/**
 * Base64를 Blob으로 변환
 */
const base64ToBlob = (base64, contentType = 'image/jpeg') => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

/**
 * 이미지 업로드 (Base64 또는 File)
 * @param {string|File} imageData - Base64 string 또는 File object
 * @param {string} folder - 저장할 폴더 (예: 'posts', 'profiles')
 * @param {function} onProgress - 업로드 진행률 콜백
 * @returns {Promise<string>} - 업로드된 이미지의 Download URL
 */
export const uploadImage = async (imageData, folder = 'posts', onProgress) => {
  try {
    let blob;
    let fileName;

    // Base64 string인 경우
    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      blob = base64ToBlob(imageData);
      fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    }
    // File object인 경우
    else if (imageData instanceof File) {
      blob = imageData;
      fileName = `${folder}/${Date.now()}_${imageData.name}`;
    }
    // URI 형식인 경우 (React Native)
    else if (typeof imageData === 'string') {
      const response = await fetch(imageData);
      blob = await response.blob();
      fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    } else {
      throw new Error('Invalid image data format');
    }

    // Storage reference 생성
    const storageRef = ref(storage, fileName);

    // 업로드
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // 진행률 계산
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // 업로드 완료 - Download URL 가져오기
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Upload image error:', error);
    throw error;
  }
};

/**
 * 이미지 삭제
 * @param {string} imageUrl - Firebase Storage의 이미지 URL
 */
export const deleteImage = async (imageUrl) => {
  try {
    // URL에서 파일 경로 추출
    const fileRef = ref(storage, imageUrl);
    await deleteObject(fileRef);
  } catch (error) {
    // 이미지가 이미 삭제되었거나 존재하지 않는 경우 무시
    if (error.code !== 'storage/object-not-found') {
      console.error('Delete image error:', error);
      throw error;
    }
  }
};

/**
 * 여러 이미지 업로드
 * @param {Array} images - 이미지 데이터 배열
 * @param {string} folder - 저장할 폴더
 * @param {function} onProgress - 전체 진행률 콜백
 * @returns {Promise<Array<string>>} - 업로드된 이미지들의 Download URL 배열
 */
export const uploadMultipleImages = async (images, folder = 'posts', onProgress) => {
  try {
    const uploadPromises = images.map((image, index) =>
      uploadImage(image, folder, (progress) => {
        if (onProgress) {
          const totalProgress = ((index * 100 + progress) / images.length);
          onProgress(totalProgress);
        }
      })
    );

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Upload multiple images error:', error);
    throw error;
  }
};
