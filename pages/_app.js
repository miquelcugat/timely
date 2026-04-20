import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import CookieBanner from '../components/CookieBanner';
import FloatingTimer from '../components/FloatingTimer';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      console.log(`Navegó a: ${url}`);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  // Don't show floating timer on auth/public pages
  const publicPaths = ['/', '/login', '/register', '/reset-password', '/update-password', '/terminos', '/privacidad', '/cookies', '/pricing'];
  const showFloatingTimer = !publicPaths.includes(router.pathname);

  return (
    <>
      <Component {...pageProps} />
      {showFloatingTimer && <FloatingTimer />}
      <CookieBanner />
    </>
  );
}

export default MyApp;
