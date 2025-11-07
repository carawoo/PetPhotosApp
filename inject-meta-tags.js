const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');

console.log('📝 Injecting meta tags into index.html...\n');

// Read the generated index.html
let html = fs.readFileSync(indexPath, 'utf8');

// Meta tags to inject
const metaTags = `
    <!-- Naver Search Advisor Verification -->
    <meta name="naver-site-verification" content="2d3393624026903cde4ecb4d313dd32687dfff6f" />

    <!-- SEO Meta Tags -->
    <meta name="keywords" content="반려동물, 펫, 사진, 공유, 소셜네트워크, pet, photos, 강아지, 고양이, peto" />
    <meta name="author" content="Peto" />

    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://peto.real-e.space/" />
    <meta property="og:title" content="Peto - 반려동물 사진첩" />
    <meta property="og:description" content="반려동물 사진을 공유하는 소셜 네트워크 앱" />
    <meta property="og:image" content="https://peto.real-e.space/favicon-512x512.png" />
    <meta property="og:image:width" content="512" />
    <meta property="og:image:height" content="512" />
    <meta property="og:site_name" content="Peto" />
    <meta property="og:locale" content="ko_KR" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:url" content="https://peto.real-e.space/" />
    <meta name="twitter:title" content="Peto - 반려동물 사진첩" />
    <meta name="twitter:description" content="반려동물 사진을 공유하는 소셜 네트워크 앱" />
    <meta name="twitter:image" content="https://peto.real-e.space/favicon-512x512.png" />

    <!-- Favicons -->
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png" />
    <link rel="shortcut icon" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/favicon-192x192.png" />
`;

// Update title
html = html.replace(/<title>.*?<\/title>/, '<title>Peto - 반려동물 사진첩</title>');

// Update description if exists
if (html.includes('name="description"')) {
  html = html.replace(
    /<meta name="description" content=".*?".*?>/,
    '<meta name="description" content="반려동물 사진을 공유하는 소셜 네트워크 앱" />'
  );
}

// Inject meta tags before </head>
html = html.replace('</head>', `${metaTags}\n  </head>`);

// Write back
fs.writeFileSync(indexPath, html, 'utf8');

console.log('✅ Meta tags injected successfully!');
console.log('✅ Title updated to: Peto - 반려동물 사진첩');
console.log('✅ Favicons linked');
console.log('✅ Open Graph tags added\n');
