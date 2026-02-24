import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useWallet } from '../context/WalletContext';
import WalletsModal from '../components/modals/wallets';

export default function Landing() {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      router.replace('/');
    }
  }, [isConnected, address, router]);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/images/maps/main.png)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Logo */}
      <div className="absolute top-8 left-8 z-10 relative h-20 w-48">
        <Image
          src="/images/logos/main-logo.svg"
          alt="Look maxxxing"
          fill
          className="object-contain object-left"
          priority
          sizes="192px"
        />
      </div>

      {/* Title + Connect - responsive */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center z-30 w-full flex flex-col items-center justify-center gap-12 max-w-[90vw] px-4"
        style={{ bottom: 'clamp(1.5rem, 14vh, 17rem)' }}
      >
        <button
          type="button"
          onClick={() => setShowWalletModal(true)}
          className="bg-[#F7237A] border-[1px] border-[#FD8BBA] font-medium font-anton uppercase rounded-lg w-full max-w-[180px] sm:max-w-[220px] text-base sm:text-lg md:text-xl py-2.5 sm:py-3 px-6 sm:px-8"
        >
          Connect
        </button>
      </div>

      <WalletsModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
}
