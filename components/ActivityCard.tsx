import React from 'react';
import { Icon } from '@iconify/react';

export interface Activity {
  name: string;
  icon: string;
  image: string;
  stars: number;
}

interface ActivityCardProps {
  activity: Activity;
  index: number;
  /** Map order (1 = Beach Side, 2 = Miami Nights, 3 = City Lights) for card position. */
  mapOrder: number;
  isExpanded: boolean;
  /** Ref for the expanded card root (used by parent for click-outside to close). */
  expandedRef?: React.RefObject<HTMLDivElement>;
  onSelect: () => void;
  onClose: () => void;
  /** Called when user clicks start; e.g. open missions modal and preselect this activity's mission. */
  onStart?: (activity: Activity) => void;
}

/** Card positions per map so activity cards align with landmarks. */
const CARD_POSITIONS_BY_MAP: Record<number, { top: string; left: string }[]> = {
  // Map 1: BEACH SIDE (default)
  1: [
    { top: '18%', left: '44.7%' },
    { top: '20.5%', left: '65%' },
    { top: '38%', left: '81.5%' },
    { top: '47%', left: '63.7%' },
  ],
  // Map 2: MIAMI NIGHTS – casino districts, fountain plaza, central skyscrapers, coastal area
  2: [
    { top: '41.5%', left: '40%' },
    { top: '25%', left: '75%' },
    { top: '51.5%', left: '86%' },
    { top: '72%', left: '64%' },
  ],
  // Map 3: CITY LIGHTS – fallback same as map 1
  3: [
    { top: '18%', left: '44.7%' },
    { top: '20.5%', left: '65%' },
    { top: '38%', left: '81.5%' },
    { top: '47%', left: '63.7%' },
  ],
};

export default function ActivityCard({
  activity,
  index,
  mapOrder = 1,
  isExpanded,
  expandedRef,
  onSelect,
  onClose,
  onStart,
}: ActivityCardProps) {
  const isPink = index === 0 || index === 3;
  const borderColor = isPink ? 'border-[#FF79B0]' : 'border-[#95A2FF]';
  const starColor = isPink ? 'text-[#FF79B0]' : 'text-[#95A2FF]';
  const positions = CARD_POSITIONS_BY_MAP[mapOrder] ?? CARD_POSITIONS_BY_MAP[1];
  const position = positions[index] ?? positions[0];

  return (
    <div
      ref={expandedRef}
      className={`absolute ${isExpanded ? 'z-[30]' : 'z-10 hover:z-20'}`}
      style={{
        top: position.top,
        left: position.left,
        transform: isExpanded ? 'translate(-50%, -20%)' : 'translate(-50%, -50%)',
      }}
    >
      {isExpanded ? (
        <div
          className={`w-[210px] bg-[#14163FCC] border-[1px] ${borderColor} rounded-lg cursor-pointer transition-transform duration-200 flex items-center gap-3 px-[6px] py-1 origin-center`}
          onClick={onClose}
        >
          <div
            className={`flex flex-col gap-2 w-full ${isPink ? 'border-[#FF79B0]' : 'border-[#95A2FF]'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={activity.image}
                  alt={activity.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col items-start justify-center">
                <h3 className="text-white font-medium font-anton text-sm uppercase leading-tight">
                  {activity.name}
                </h3>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Icon
                      key={i}
                      icon="mage:star"
                      width="24"
                      height="24"
                      className={starColor}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-white text-sm px-4 pb-2 text-center">
              Click to start playing
            </p>
            <div className="px-4 pb-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  onStart?.(activity);
                  onClose();
                }}
                className={`font-bold py-1.5 px-6 rounded-lg text-white lowercase hover:opacity-90 transition-opacity ${isPink ? 'bg-[#F7237A]' : 'bg-[#2781EA]'}`}
              >
                start
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={onSelect}
          className={`w-[210px] bg-[#14163FCC] border-[1px] ${borderColor} rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200 flex items-center gap-3 px-[6px] py-1 origin-center`}
        >
          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={activity.image}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col items-start justify-center">
            <h3 className="text-white font-medium font-anton text-sm uppercase mb-1">
              {activity.name}
            </h3>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Icon
                  key={i}
                  icon="mage:star"
                  width="24"
                  height="24"
                  className={starColor}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
