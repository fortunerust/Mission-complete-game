import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Anton+SC&family=Lilita+One&family=Rock+Salt&family=Saira+Condensed:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Critical image preloads in first HTML (helps on Vercel before TimeLoading mounts) */}
        <link rel="preload" href="/images/maps/main.png" as="image" />
        <link rel="preload" href="/images/maps/map1.png" as="image" />
        <link rel="preload" href="/images/maps/map2.png" as="image" />
        <link rel="preload" href="/images/maps/map3.png" as="image" />
        <link rel="preload" href="/images/logos/main-logo.svg" as="image" />
        <link rel="preload" href="/images/tooltips/pink-up.svg" as="image" />
        <link rel="preload" href="/images/tooltips/pink-down.svg" as="image" />
        <link rel="preload" href="/images/tooltips/blue-up.svg" as="image" />
        <link rel="preload" href="/images/tooltips/blue-down.svg" as="image" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
