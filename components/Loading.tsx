import React, { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * Full-screen "checking wallet" state: same scene as the loading/connect screen
 * but with "LOOK. MAXXXING" title, "LOADING..." text, and a progress bar.
 * Shown on the main page while wallet connection state is being determined.
 */
export default function Loading() {
  return (
    <div
      className="min-h-screen relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/images/maps/main.png)' }}
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

      {/* Copyright */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 text-white text-md font-medium font-anton">
        ©2026. All Rights Reserved.
      </p>
    </div>
  );
}
