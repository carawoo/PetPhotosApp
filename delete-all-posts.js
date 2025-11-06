/**
 * Firestore에서 모든 게시물 삭제하기
 *
 * 사용 방법:
 * 1. peto.real-e.space에서 브라우저 콘솔 열기 (F12 또는 Cmd+Option+I)
 * 2. 아래 코드를 복사해서 콘솔에 붙여넣기
 * 3. Enter 키 입력
 */

(async () => {
  try {
    console.log('🔥 Starting to delete all posts from Firestore...');

    // Firebase 가져오기
    const { collection, getDocs, deleteDoc, query } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

    // Firebase 초기화
    const firebaseConfig = {
      apiKey: "AIzaSyACENpHBZ2EyFzngBC2yuK_ddlsf45rluU",
      authDomain: "reale-40c3f.firebaseapp.com",
      projectId: "reale-40c3f",
      storageBucket: "reale-40c3f.firebasestorage.app",
      messagingSenderId: "360101403087",
      appId: "1:360101403087:web:4d783d424933fd1273daba",
      measurementId: "G-4DWWSBF399"
    };

    const app = initializeApp(firebaseConfig, 'deleteApp');
    const db = getFirestore(app);

    // 모든 posts 가져오기
    const q = query(collection(db, 'posts'));
    const snapshot = await getDocs(q);

    console.log(`📊 Found ${snapshot.docs.length} posts to delete`);

    // 모든 posts 삭제
    let deleted = 0;
    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(docSnapshot.ref);
      deleted++;
      console.log(`🗑️  Deleted post ${deleted}/${snapshot.docs.length}`);
    }

    console.log(`✅ Successfully deleted ${deleted} posts from Firestore!`);
    console.log('🔄 Refresh the page to see the empty feed.');

  } catch (error) {
    console.error('❌ Error deleting posts:', error);
    console.error('Error details:', error.message);
  }
})();
