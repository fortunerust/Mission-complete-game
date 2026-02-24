import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Router from 'next/router';
import { WalletProvider, useWallet } from '../context/WalletContext';
import { CharacterProvider } from '../context/CharacterContext';
import { GameSettingsProvider } from '../context/GameSettingsContext';
import TimeLoading from '../components/TimeLoading';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

const toastOptions = {
  duration: 4000,
  style: {
    background: '#202253',
    color: '#fff',
    border: '2px solid #0967BC',
    borderRadius: '12px',
    padding: '12px 16px',
    fontFamily: 'Anton, sans-serif',
    fontSize: '14px',
  },
  className: 'font-anton uppercase',
  success: { style: { borderColor: '#2D57DE' } },
  error: { style: { borderColor: '#FD8BBA', boxShadow: '0 0 12px rgba(253, 139, 186, 0.2)' } },
};

/** Shows TimeLoading while app/route is loading; enforces minimum 3s display before showing page. */
function AppContent({ Component, pageProps }: AppProps) {
  const { isReady: isWalletReady } = useWallet();
  const [isMounted, setIsMounted] = useState(false);
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Enforce TimeLoading for at least 3s before allowing page content
  useEffect(() => {
    const t = setTimeout(() => setMinLoadingTimeElapsed(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Handle route changes only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStart = () => setIsRouteChanging(true);
    const handleComplete = () => setIsRouteChanging(false);

    Router.events.on('routeChangeStart', handleStart);
    Router.events.on('routeChangeComplete', handleComplete);
    Router.events.on('routeChangeError', handleComplete);

    return () => {
      Router.events.off('routeChangeStart', handleStart);
      Router.events.off('routeChangeComplete', handleComplete);
      Router.events.off('routeChangeError', handleComplete);
    };
  }, []);

  const showLoadingScreen = !isMounted || !isWalletReady || isRouteChanging;

  // Show TimeLoading for at least 3s, and while app/route is loading
  if (showLoadingScreen || !minLoadingTimeElapsed) {
    return <TimeLoading />;
  }

  return <Component {...pageProps} />;
}

export default function App(appProps: AppProps) {
  return (
    <WalletProvider>
      <CharacterProvider>
        <GameSettingsProvider>
          <Head>
            <title>LM | Look Maxxxing</title>
            <meta name="application-name" content="LM | Look Maxxxing" />
            <link rel="icon" type="image/svg+xml" href="/images/logos/main-logo.svg" />
          </Head>
          <Toaster position="top-right" toastOptions={toastOptions} />
          <AppContent {...appProps} />
        </GameSettingsProvider>
      </CharacterProvider>
    </WalletProvider>
  );
}
