import React from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';

interface GameCardProps {
  _id: string;
  name: string;
  value: string;
  type: 'blue' | 'pink';
  imageBg?: string;
  imageItem?: string;
  stats?: {
    physique: number;
    strength: number;
    charisma: number;
    rizz: number;
  };
  onClick?: () => void;
}

const STATS_CONFIG = [
  { key: 'physique' as const, label: 'PHYSIQUE', iconType: 'img' as const, iconSrc: '/images/card/items/weight.svg' },
  { key: 'strength' as const, label: 'STRENGTH', iconType: 'icon' as const, icon: 'icon-park-outline:muscle' },
  { key: 'charisma' as const, label: 'CHARISMA', iconType: 'icon' as const, icon: 'mingcute:plus-fill' },
  { key: 'rizz' as const, label: 'RIZZ', iconType: 'img' as const, iconSrc: '/images/card/items/lightning.svg' },
];

const SEGMENTS = 10;

export default function GameCard({
  _id,
  name,
  value,
  type,
  imageBg,
  imageItem,
  stats,
  onClick,
}: GameCardProps) {
  const isBlue = type === 'blue';
  const borderColor = isBlue ? 'border-[#5DACFB]' : 'border-[#FD8BBA]';
  const bgColor = isBlue ? 'bg-[#7796FA]' : 'bg-[#FF6FAA]';
  const statValues = stats
    ? [stats.physique, stats.strength, stats.charisma, stats.rizz]
    : [0, 0, 0, 0];

  const bgImage = imageBg || (isBlue ? '/images/card/bgs/blue-bg.svg' : '/images/card/bgs/pink-bg.svg');

  return (
    <div
      onClick={onClick}
      className={`relative w-[180px] h-[270px] rounded-xl border-[3px] ${borderColor} overflow-hidden ${bgColor} px-2 pt-2 pb-4 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg`}
    >
      {/* Top section - background image + item + title */}
      <div className="relative h-full overflow-hidden bg-gradient-to-t from-black/70 to-transparent">
        <div
          className="absolute inset-0 bg-cover bg-center rounded-lg"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        {imageItem && (
          <div className="absolute top-[7%] left-0 right-0 mx-auto flex items-center justify-center p-2 h-[70px] w-full">
            <Image
              src={imageItem}
              alt=""
              width={120}
              height={70}
              className="h-[70px] w-auto object-contain"
            />
          </div>
        )}
        {/* Title overlay */}
        <div className="absolute flex flex-col items-center justify-center top-[24%] left-0 right-0 px-2 pt-8">
          <h4
            className="text-white font-bold font-saira-condensed uppercase text-lg text-nowrap leading-[90%]"
            style={{
              WebkitTextStroke: '1px black',
              textShadow: '0 0.5px 1px rgba(0,0,0,0.8)',
            }}
          >
            {name}
          </h4>
          <p className="text-[#FF0092] font-rock-salt text-[8px] mt-[-1px]">{value}</p>
        </div>
      </div>

      {/* Bottom section - angled stats panel with white peek + blue/pink bg */}
      <div className="absolute bottom-[13%] left-0 right-0 w-full">
        {/* White layer peeking out at diagonal edges */}
        <Image
          src="/images/card/bgs/card-bg.svg"
          alt=""
          width={300}
          height={127}
          className="absolute top-0 left-0 right-0 w-[300px] h-[127px] object-cover"
          aria-hidden
        />
        {/* Stats content */}
        <div className="relative flex flex-col justify-end px-7 pb-2 mt-1 h-[95px]">
          {STATS_CONFIG.map((stat, i) => {
            const value = statValues[i];
            const filledSegments = Math.round(value / 10 / SEGMENTS);
            return (
              <div
                key={stat.key}
                className="flex flex-col items-center py-0.5 w-full"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1">
                    {stat.iconType === 'img' ? (
                      <Image
                        src={stat.iconSrc}
                        alt=""
                        width={10}
                        height={10}
                        className="w-2.5 h-2.5 flex-shrink-0 object-contain"
                      />
                    ) : (
                      <Icon
                        icon={stat.icon}
                        className="text-white flex-shrink-0"
                        width={9}
                        height={9}
                      />
                    )}
                    <span className="text-white font-saira-condensed font-medium text-[7px] uppercase flex-shrink-0">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-white font-saira-condensed font-semibold text-[7px] w-5 text-right">
                    {statValues[i] ?? 0}
                  </span>
                </div>
                {/* Segmented progress bar */}
                <div className="flex gap-px h-[4px] min-w-[140px] w-full px-3">
                  {Array.from({ length: SEGMENTS }).map((_, segIdx) => (
                    <div
                      key={segIdx}
                      className={`w-full ${segIdx < filledSegments ? 'bg-white' : 'bg-black/60'
                        }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
