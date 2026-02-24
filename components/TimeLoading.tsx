import React, { useState, useEffect } from 'react';
import Image from 'next/image';

/** Image paths to preload when this component mounts (works reliably on Vercel via DOM, not Next/Head). */
const IMAGE_PRELOADS = [
  '/images/maps/main.png',
  '/images/maps/map1.png',
  '/images/maps/map2.png',
  '/images/maps/map3.png',
  '/images/logos/main-logo.svg',
  '/images/logos/coin-logo.svg',
  '/images/icons/rabby.svg',
  '/images/icons/coinbase.svg',
  '/images/icons/phantom.svg',
  '/images/icons/metamask.svg',
  '/images/icons/dollar.svg',
  '/images/icons/hugeicons_hanger.svg',
  '/images/icons/power-bar-nofill.svg',
  '/images/icons/power-bar-fill.svg',
  '/images/icons/jerry-box.svg',
  '/images/icons/icon-bg.svg',
  '/images/icons/text-box.svg',
  '/images/icons/muscle.svg',
  '/images/characters/fat.svg',
  '/images/characters/girl.svg',
  '/images/characters/handsome.svg',
  '/images/characters/character-bg.svg',
  '/images/characters/icon-bg.svg',
  '/images/characters/chubby.svg',
  '/images/characters/chad.svg',
  '/images/card/bgs/card-bg.svg',
  '/images/card/bgs/pink-bg.svg',
  '/images/card/bgs/blue-bg.svg',
  '/images/card/bgs/white-bg.svg',
  '/images/card/bgs/floor45.svg',
  '/images/card/bgs/dubai.svg',
  '/images/card/bgs/fx500.svg',
  '/images/card/items/lightning.svg',
  '/images/card/items/weight.svg',
  '/images/card/items/chad.svg',
  '/images/card/items/dubai.svg',
  '/images/card/items/red-ellipse.svg',
  '/images/card/items/fx500.svg',
  '/images/pack/currency.svg',
  '/images/pack/text-x.svg',
  '/images/pack/packs.svg',
  '/images/pack/pack.svg',
  '/images/pack/pack-btn.svg',
  '/images/tooltips/blue-down.svg',
  '/images/tooltips/pink-down.svg',
  '/images/tooltips/pink-up.svg',
  '/images/tooltips/blue-up.svg',
  '/images/navigation/location-bg.svg',
  '/images/navigation/target-bg.svg',
  '/images/navigation/users.svg',
  '/images/navigation/blue-bg.svg',
  '/images/navigation/pink-bg.svg',
  '/images/navigation/fillbar.svg',
  '/images/navigation/nofillbar.svg',
  '/images/navigation/top-bg.svg',
  '/images/missioins/pumpfun.svg',
  '/images/missioins/pool.svg',
  '/images/missioins/perps.svg',
  '/images/missioins/lockin.svg',
  '/images/missioins/gym.svg',
  '/images/header/dolla-circle.svg',
  '/images/header/connect-retangle.svg',
  '/images/header/user-retangle.svg',
  '/images/header/amount-retangle.svg',
  '/images/header/black-retangle.svg',
  '/images/header/blue-retangle.svg',
];

/**
 * Full-screen loading: "LOADING..." and progress bar.
 * Preloads app images in the browser so they are ready when main content loads (reliable on Vercel).
 */
export default function TimeLoading() {
  const [progress, setProgress] = useState(0);

  // Preload images via DOM when component mounts (works on Vercel; avoids Next/Head + Fragment issues)
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    IMAGE_PRELOADS.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = base + href;
      document.head.appendChild(link);
      links.push(link);
    });
    return () => {
      links.forEach((link) => {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
    };
  }, []);

  // Progress animation
  useEffect(() => {
    let raf: number;
    const start = Date.now();
    const duration = 3500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = (elapsed % duration) / duration;
      setProgress(Math.min(100, 15 + t * 82));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/images/maps/main.png)' }}
    >
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

      <div
        className="absolute left-1/2 -translate-x-1/2 text-center z-30 w-full flex flex-col items-center justify-center gap-8 max-w-[90vw] px-4"
        style={{ bottom: 'clamp(1.5rem, 16vh, 17rem)' }}
      >
        <div className="flex flex-col items-center gap-3 w-full max-w-[420px]">
          <span className="text-white font-medium font-anton uppercase text-2xl tracking-widest">
            LOADING...
          </span>
          <div
            className="w-full h-14 rounded-full overflow-hidden border-2 border-[#FFDADA] bg-[#681034] p-1"
            style={{ maxWidth: '360px' }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-[#F7237A] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 text-white text-md font-medium font-anton">
        ©2026. All Rights Reserved.
      </p>
    </div>
  );
}
