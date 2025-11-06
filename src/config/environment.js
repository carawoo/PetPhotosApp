/**
 * 환경 설정
 * localhost는 개발 환경, 배포된 도메인은 프로덕션 환경으로 구분
 */

// 개발 환경 체크
export const isDevelopment = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }
  return false;
};

// 환경에 따른 localStorage 키 prefix
export const getStoragePrefix = () => {
  return isDevelopment() ? 'petPhotos_dev_' : 'petPhotos_';
};

// 환경 정보
export const ENV = {
  isDev: isDevelopment(),
  storagePrefix: getStoragePrefix(),
};

// localStorage 키 생성 헬퍼
export const getStorageKey = (key) => {
  return `${getStoragePrefix()}${key}`;
};
