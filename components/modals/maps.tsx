import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Button from '../Button';
import { gameAPI } from '../../lib/api';
import { toastError, toastSuccess } from '../../lib/toast';
import { Map } from '../../types';

export interface MapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  maps?: Map[];
  /** Currently applied map id; APPLY is disabled when selected map equals this. */
  currentMapId?: string;
  /** Called when user clicks APPLY with the selected map. May return a Promise so the modal can show loading until done. */
  onApplyMap?: (map: Map) => void | Promise<unknown>;
}

function MapThumbnail({
  map,
  imageSrc,
  selected,
  onClick,
}: {
  map: Map;
  imageSrc?: string;
  selected: boolean;
  onClick: () => void;
}) {
  const isLocked = !map.unlocked;
  const gradient = 'from-gray-700 to-gray-900';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      className={`relative w-full m-1 aspect-[4/3] ${selected ? 'ring-[3px] ring-[#5DACFB]' : ''} rounded-md overflow-hidden text-left flex flex-col transition-all ${
        isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:opacity-95'
      }`}
    >
      {/* Pink banner - map name at top */}
      <div className={`absolute top-[6px] right-[3px] z-10 ${isLocked ? 'hidden' : ''} w-fit bg-[#F7237A] px-1 py-0.5 flex items-center justify-center`}>
        <span className="text-white font-medium font-anton uppercase text-[10px] truncate">{map.name}</span>
      </div>
      {/* Thumbnail image area */}
      <div className="absolute inset-0 bg-gradient-to-br bg-[#09091E] flex items-center justify-center">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            className="w-full h-full object-cover"
            aria-hidden
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`} />
        )}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[#F7237A80]">
              <Icon icon="mdi:lock" className="text-white" width={24} height={24} />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export default function MapsModal({ isOpen, onClose, maps: mapsProp, currentMapId, onApplyMap }: MapsModalProps) {
  const [maps, setMaps] = useState<Map[]>(mapsProp ?? []);
  const [selectedMap, setSelectedMap] = useState<Map | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (mapsProp) {
      setMaps(mapsProp);
      const sel = mapsProp.find((m) => m.selected) ?? mapsProp[0];
      if (sel?.unlocked) setSelectedMap(sel);
    } else {
      gameAPI
        .getMaps()
        .then((res) => {
          const data = res.data?.length ? res.data : [];
          setMaps(data);
          const sel = data.find((m: Map) => m.selected) ?? data.find((m: Map) => m.unlocked);
          if (sel) setSelectedMap(sel);
          toastSuccess('Maps loaded successfully!');
        })
        .catch((err) => {
          toastError('Could not load maps. Please try again.', err);
          setMaps([]);
          setSelectedMap(null);
        });
    }
  }, [mapsProp]);

  useEffect(() => {
    if (isOpen && maps.length > 0 && !selectedMap) {
      const firstUnlocked = maps.find((m) => m.unlocked);
      if (firstUnlocked) setSelectedMap(firstUnlocked);
    }
  }, [isOpen, maps, selectedMap]);

  const handleSelect = (map: Map) => {
    if (!map.unlocked) return;
    setSelectedMap(map);
    setMaps((prev) => prev.map((m) => ({ ...m, selected: m._id === map._id })));
  };

  const handleApply = async () => {
    if (!selectedMap) return;
    setIsApplying(true);
    try {
      setMaps((prev) => prev.map((m) => ({ ...m, selected: m._id === selectedMap._id })));
      const result = onApplyMap?.(selectedMap);
      if (result != null && typeof (result as Promise<unknown>).then === 'function') {
        await (result as Promise<unknown>);
      }
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  const displayMaps = maps.length ? maps : [];
  const selected = selectedMap ?? displayMaps.find((m: Map) => m.unlocked) ?? displayMaps[0];
  const selectedImageSrc = selected ? selected.imageSrc : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col px-16 py-10 w-full min-w-[75vw] sm:min-w-[70vw] max-w-[95vw] sm:max-w-[90vw] lg:max-w-5xl max-h-[90vh] min-h-0 rounded-3xl bg-[#00012699]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title - center */}
        <div className="flex-shrink-0 flex justify-center pt-6 pb-4">
          <h2 className="text-white font-medium font-anton uppercase text-3xl sm:text-5xl">MAPS</h2>
        </div>

        {/* Close button - top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-[1px] -right-[1px] w-14 h-14 bg-[#3E95E3] rounded hover:opacity-90 flex items-center justify-center text-white"
        >
          <img src="/images/pack/text-x.svg" alt="CLOSE" className="h-7 w-auto object-contain" />
        </button>

        {/* Two panels: left wider (thumbnails grid), right narrower (preview + Apply) */}
        <div className="flex flex-col lg:flex-row flex-1 gap-6 pt-2 w-full min-h-0 max-h-[calc(90vh-6rem)] lg:items-stretch">
          {/* Left - map thumbnails grid (wider panel, scrollable) */}
          <div className="flex flex-1 lg:basis-0 min-w-0 min-h-0 rounded-2xl bg-[#202253E5] border-2 border-[#0967BC] p-4 overflow-hidden flex flex-col">
            <div className="grid grid-cols-4 gap-3 w-full min-h-0 overflow-y-auto content-start auto-rows-fr">
              {displayMaps.map((map) => (
                <MapThumbnail
                  key={map._id}
                  map={map}
                  imageSrc={map.imageSrc}
                  selected={selected?._id === map._id}
                  onClick={() => handleSelect(map)}
                />
              ))}
            </div>
          </div>

          {/* Right - narrower panel: 350px preview + Apply at bottom-right */}
          <div className="flex flex-shrink-0 flex-col w-full lg:w-[440px] rounded-2xl bg-[#2E2F4FE5] border-2 border-[#0967BC] p-5 overflow-hidden">
            {selected && (
              <>
                <div className="w-[400px] h-[400px] min-w-[400px] min-h-[400px] rounded-xl overflow-hidden bg-[#09091E4D] flex items-center justify-center flex-shrink-0 mx-auto">
                  {selectedImageSrc ? (
                    <img
                      src={selectedImageSrc}
                      alt=""
                      className="w-[400px] h-[400px] object-cover"
                      aria-hidden
                    />
                  ) : (
                    <span className="text-white/90 font-bold font-anton uppercase text-lg sm:text-xl">
                      {selected.name}
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0 flex justify-end mt-4">
                  <Button
                    variant="primary"
                    className="border-2 border-[#FD8BBA] rounded-lg font-anton uppercase font-medium px-10 py-2.5 min-w-[120px] flex items-center justify-center gap-2"
                    onClick={handleApply}
                    disabled={isApplying || (selectedMap != null && selectedMap._id === currentMapId)}
                  >
                    {isApplying ? (
                      <Icon icon="eos-icons:bubble-loading" className="text-white" width={24} height={24} aria-hidden />
                    ) : (
                      'APPLY'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
