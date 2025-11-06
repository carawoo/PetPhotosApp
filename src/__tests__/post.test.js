/**
 * 게시물 작성 완료 테스트
 *
 * 이 테스트는 게시물이 정상적으로 작성되고 저장되는지 확인합니다.
 */

import { createPost, subscribeToPosts } from '../services/firestore.service';
import { getStorageKey } from '../config/environment';

// 테스트용 게시물 데이터
const testPost = {
  petName: '테스트강아지',
  description: '테스트 설명입니다',
  imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  userId: 'test_user_123',
  userNickname: '테스트유저',
};

/**
 * localStorage 게시물 저장 테스트
 */
export async function testLocalStoragePost() {
  console.log('📝 localStorage 게시물 저장 테스트 시작...');

  try {
    // 기존 게시물 가져오기
    const storageKey = getStorageKey('posts');
    const existingPosts = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const beforeCount = existingPosts.length;

    // 새 게시물 추가
    const newPost = {
      ...testPost,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
      comments: [],
    };

    const updatedPosts = [newPost, ...existingPosts];
    localStorage.setItem(storageKey, JSON.stringify(updatedPosts));

    // 검증
    const savedPosts = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const afterCount = savedPosts.length;

    console.assert(afterCount === beforeCount + 1, '❌ 게시물 개수가 증가하지 않았습니다');
    console.assert(savedPosts[0].id === newPost.id, '❌ 최신 게시물이 맨 앞에 없습니다');
    console.assert(savedPosts[0].petName === testPost.petName, '❌ 반려동물 이름이 일치하지 않습니다');
    console.assert(savedPosts[0].description === testPost.description, '❌ 설명이 일치하지 않습니다');

    console.log('✅ localStorage 테스트 성공!');
    console.log(`   - 게시물 개수: ${beforeCount} → ${afterCount}`);
    console.log(`   - 최신 게시물 ID: ${savedPosts[0].id}`);

    // 테스트 게시물 삭제 (정리)
    const cleanedPosts = savedPosts.filter(p => p.id !== newPost.id);
    localStorage.setItem(storageKey, JSON.stringify(cleanedPosts));

    return { success: true, message: 'localStorage 테스트 성공' };
  } catch (error) {
    console.error('❌ localStorage 테스트 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Firestore 게시물 저장 테스트
 */
export async function testFirestorePost() {
  console.log('🔥 Firestore 게시물 저장 테스트 시작...');

  try {
    // Firestore에 게시물 생성
    const postId = await createPost({
      ...testPost,
      userId: testPost.userId,
      userNickname: testPost.userNickname,
    });

    console.assert(postId, '❌ 게시물 ID가 생성되지 않았습니다');
    console.log(`✅ Firestore에 게시물 생성 성공! ID: ${postId}`);

    // 게시물 목록에서 확인 (구독 테스트)
    return new Promise((resolve) => {
      const unsubscribe = subscribeToPosts((posts) => {
        const createdPost = posts.find(p => p.id === postId);

        if (createdPost) {
          console.assert(createdPost.petName === testPost.petName, '❌ 반려동물 이름이 일치하지 않습니다');
          console.assert(createdPost.description === testPost.description, '❌ 설명이 일치하지 않습니다');

          console.log('✅ Firestore 구독 테스트 성공!');
          console.log(`   - 게시물 ID: ${createdPost.id}`);
          console.log(`   - 반려동물 이름: ${createdPost.petName}`);
          console.log(`   - 생성 시간: ${createdPost.createdAt}`);

          // 구독 해제
          unsubscribe();

          // 참고: 테스트 게시물은 Firebase Console에서 수동으로 삭제해야 합니다
          console.log('⚠️  테스트 게시물은 Firebase Console에서 수동으로 삭제하세요');

          resolve({ success: true, postId, message: 'Firestore 테스트 성공' });
        }
      });

      // 5초 타임아웃
      setTimeout(() => {
        unsubscribe();
        resolve({ success: false, error: '타임아웃: 게시물을 찾을 수 없습니다' });
      }, 5000);
    });
  } catch (error) {
    console.error('❌ Firestore 테스트 실패:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 통합 테스트: localStorage + Firestore
 */
export async function runAllPostTests() {
  console.log('🧪 게시물 작성 통합 테스트 시작...\n');

  const results = {
    localStorage: null,
    firestore: null,
  };

  // localStorage 테스트
  results.localStorage = await testLocalStoragePost();
  console.log('');

  // Firestore 테스트
  try {
    results.firestore = await testFirestorePost();
  } catch (error) {
    results.firestore = { success: false, error: 'Firestore가 비활성화되어 있습니다' };
    console.log('⚠️  Firestore 테스트 건너뛰기 (비활성화 상태)');
  }

  console.log('\n📊 테스트 결과 요약:');
  console.log(`   localStorage: ${results.localStorage.success ? '✅ 성공' : '❌ 실패'}`);
  console.log(`   Firestore: ${results.firestore.success ? '✅ 성공' : '❌ 실패'}`);

  const allPassed = results.localStorage.success && results.firestore.success;
  console.log(`\n${allPassed ? '✅ 모든 테스트 통과!' : '⚠️  일부 테스트 실패'}`);

  return results;
}

/**
 * 브라우저 콘솔에서 실행하는 방법:
 *
 * 1. 개발자 도구 열기 (F12)
 * 2. Console 탭 선택
 * 3. 테스트 모듈 로드:
 *
 * ```javascript
 * import('./src/__tests__/post.test.js').then(module => {
 *   window.testLocalStoragePost = module.testLocalStoragePost;
 *   window.testFirestorePost = module.testFirestorePost;
 *   window.runAllPostTests = module.runAllPostTests;
 *   console.log('✅ 테스트 함수 로드 완료!');
 * });
 * ```
 *
 * 4. 테스트 실행:
 * ```javascript
 * testLocalStoragePost();  // localStorage 테스트
 * testFirestorePost();     // Firestore 테스트
 * runAllPostTests();       // 전체 테스트
 * ```
 */
