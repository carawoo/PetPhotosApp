/**
 * 이미지 압축 및 리사이징 유틸리티
 * Firestore Base64 저장을 위해 이미지를 800KB 이하로 압축
 */

/**
 * Base64 이미지를 압축
 * @param {string} base64Image - Base64 이미지 문자열
 * @param {number} maxWidth - 최대 너비 (기본: 1200px)
 * @param {number} maxHeight - 최대 높이 (기본: 1200px)
 * @param {number} quality - JPEG 품질 (0.0-1.0, 기본: 0.8)
 * @returns {Promise<string>} - 압축된 Base64 이미지
 */
export const compressImage = async (
  base64Image,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();

      img.onload = () => {
        try {
          // 원본 크기
          let width = img.width;
          let height = img.height;

          // 비율 유지하면서 리사이징
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;

            if (width > height) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }

          // Canvas 생성
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');

          // 이미지 품질 향상을 위한 설정
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 캔버스에 이미지 그리기
          ctx.drawImage(img, 0, 0, width, height);

          // Base64로 변환 (JPEG, 품질 조절)
          let compressedBase64 = canvas.toDataURL('image/jpeg', quality);

          // 크기 확인 (800KB 제한)
          const maxSize = 800 * 1024; // 800KB in bytes
          const base64Size = (compressedBase64.length * 3) / 4; // Base64 실제 크기 계산

          // 800KB 초과 시 품질 낮춰서 재압축
          if (base64Size > maxSize && quality > 0.3) {
            console.log(`Image too large (${(base64Size / 1024).toFixed(0)}KB), re-compressing...`);
            return compressImage(base64Image, maxWidth, maxHeight, quality - 0.1)
              .then(resolve)
              .catch(reject);
          }

          console.log(`✅ Image compressed: ${(base64Size / 1024).toFixed(0)}KB (quality: ${quality})`);
          resolve(compressedBase64);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = (error) => {
        reject(new Error('Failed to load image for compression'));
      };

      img.src = base64Image;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Base64 이미지 크기 계산 (bytes)
 * @param {string} base64String - Base64 이미지 문자열
 * @returns {number} - 크기 (bytes)
 */
export const getBase64Size = (base64String) => {
  if (!base64String) return 0;

  // data:image/jpeg;base64, 부분 제거
  const base64Data = base64String.split(',')[1] || base64String;

  // Base64 실제 크기 계산
  const padding = (base64Data.match(/=/g) || []).length;
  return (base64Data.length * 3) / 4 - padding;
};

/**
 * Base64 이미지 크기를 KB 단위로 포맷
 * @param {string} base64String - Base64 이미지 문자열
 * @returns {string} - 포맷된 크기 (예: "345KB")
 */
export const formatBase64Size = (base64String) => {
  const bytes = getBase64Size(base64String);
  return `${(bytes / 1024).toFixed(0)}KB`;
};
