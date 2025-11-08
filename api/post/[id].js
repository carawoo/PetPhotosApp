export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send('Post ID is required');
  }

  try {
    // Firebase REST API를 사용하여 게시물 데이터 가져오기
    const firebaseUrl = `https://firestore.googleapis.com/v1/projects/peto-app-c9cc2/databases/(default)/documents/posts/${id}`;

    const response = await fetch(firebaseUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch post data');
    }

    const data = await response.json();

    // Firestore 문서 데이터 파싱
    // images 배열에서 첫 번째 이미지 가져오기
    let imageUrl = 'https://peto.real-e.space/favicon-512x512.png';
    if (data.fields?.images?.arrayValue?.values && data.fields.images.arrayValue.values.length > 0) {
      imageUrl = data.fields.images.arrayValue.values[0].stringValue;
    } else if (data.fields?.imageUrl?.stringValue) {
      // 하위 호환성을 위해 imageUrl도 체크
      imageUrl = data.fields.imageUrl.stringValue;
    }

    const description = data.fields?.description?.stringValue || '반려동물 사진을 공유하는 소셜 네트워크 앱';
    const author = data.fields?.author?.stringValue || 'Peto 사용자';
    const petName = data.fields?.petName?.stringValue || '';

    const title = petName ? `${author}님의 ${petName} 사진` : `${author}님의 반려동물 사진`;

    // HTML with dynamic meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>${title}</title>
    <style id="expo-reset">
      html,
      body {
        height: 100%;
      }
      body {
        overflow: hidden;
      }
      #root {
        display: flex;
        height: 100%;
        flex: 1;
      }
    </style>
    <meta name="theme-color" content="#FF6B6B">
    <meta name="description" content="${description}" />
    <link rel="icon" href="/favicon.ico" />

    <!-- SEO Meta Tags -->
    <meta name="keywords" content="반려동물, 펫, 사진, 공유, 소셜네트워크, pet, photos, 강아지, 고양이, peto" />
    <meta name="author" content="${author}" />

    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="https://peto.real-e.space/post/${id}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="1200" />
    <meta property="og:site_name" content="Peto" />
    <meta property="og:locale" content="ko_KR" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://peto.real-e.space/post/${id}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <!-- Favicons -->
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png" />
    <link rel="shortcut icon" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/favicon-192x192.png" />

    <!-- Redirect to the app after meta tags are loaded -->
    <script>
      window.location.href = '/?postId=${id}';
    </script>
  </head>

  <body>
    <noscript>
      You need to enable JavaScript to run this app.
    </noscript>
    <div id="root"></div>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error fetching post:', error);

    // Fallback HTML
    const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Peto - 반려동물 사진첩</title>
    <meta property="og:title" content="Peto - 반려동물 사진첩" />
    <meta property="og:description" content="반려동물 사진을 공유하는 소셜 네트워크 앱" />
    <meta property="og:image" content="https://peto.real-e.space/favicon-512x512.png" />
    <script>
      window.location.href = '/?postId=${id}';
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(fallbackHtml);
  }
}
