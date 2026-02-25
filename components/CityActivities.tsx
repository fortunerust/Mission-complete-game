import React from 'react';
import { Map, Mission } from '@/types';
import ActivityCard from './ActivityCard';

interface CityActivitiesProps {
  activities: Mission[];
  containerWidth: number;
  containerHeight: number;
  selectedActivity: { activity: Mission; index: number } | null;
  /** Ref attached to the expanded card root so parent can detect click-outside. */
  expandedCardRef?: React.RefObject<HTMLDivElement>;
  /** Current map (1 = Beach Side, 2 = Miami Nights, 3 = City Lights) for activity card positions. */
  currentMap?: Map;
  onSelectActivity: (activity: Mission, index: number) => void;
  onCloseActivity: () => void;
  /** Called when user clicks start on an activity (e.g. open missions modal with that mission selected). */
  onStartActivity?: (activity: Mission) => void;
}

export default function CityActivities({
  activities,
  containerWidth,
  containerHeight,
  selectedActivity,
  expandedCardRef,
  currentMap,
  onSelectActivity,
  onCloseActivity,
  onStartActivity,
}: CityActivitiesProps) {
  return (
    <div
      className="ml-[566px] pt-[104px] pb-24 pr-4"
      style={{
        width: `${containerWidth - 566}px`,
        height: `${containerHeight}px`,
        minHeight: `${containerHeight}px`,
      }}
    >
      <div
        className="relative z-20"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-8">
          {activities.map((activity, index) => (
            <ActivityCard
              key={index}
              activity={activity}
              index={index}
              mapOrder={currentMap?.order ?? 1}
              isExpanded={selectedActivity?.index === index}
              expandedRef={selectedActivity?.index === index ? expandedCardRef : undefined}
              onSelect={() => onSelectActivity(activity, index)}
              onClose={onCloseActivity}
              onStart={(a: Mission) => onStartActivity?.(a)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
