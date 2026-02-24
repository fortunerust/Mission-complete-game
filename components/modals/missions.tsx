import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Button from '../Button';
import { gameAPI } from '../../lib/api';
import { toastError, toastSuccess } from '../../lib/toast';
import { GameHistoryEntry, Map, Mission } from '../../types';

/** Returns missions for a map with unique ids and mapId set. Missions on different maps do not relate. */
async function getMissionsForMap(mapId?: string): Promise<Mission[]> {
  if (!mapId) return [];
  const res = await gameAPI.getMissions(mapId);
  if (Array.isArray(res.data)) return res.data as Mission[];
  return [];
}

/** Parse "2 HRS" / "1 HR" to hours number. */
function parseDurationHours(duration: string): number {
  const match = duration.match(/^(\d+)\s*HR(?:S)?$/i);
  return match ? Math.max(1, parseInt(match[1], 10)) : 2;
}

/** "2 HRS" -> "2 hours", "1 HR" -> "1 hour". */
function durationToConfirmText(duration: string): { value: string; unit: string } {
  const h = parseDurationHours(duration);
  return { value: String(h), unit: h === 1 ? 'hour' : 'hours' };
}

function formatTimer(remainingMs: number): string {
  if (remainingMs <= 0) return '00 : 00 : 00';
  const totalSec = Math.floor(remainingMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(' : ');
}

export interface MissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions?: Mission[];
  /** Current map; modal shows this map's missions. */
  currentMap: Map;
  /** Current wallet for game history (fetch in-progress, start game). */
  wallet?: string | null;
  /** Current wallet/currency balance shown in mission completed rewards. */
  balance?: number;
  /** When set, the mission with this name is selected when the modal opens (e.g. from activity card "start"). */
  initialSelectedMissionName?: string | null;
  /** Called when a mission completes (timer reached 0). Parent should fetch player to update exp/level and other playerData. */
  onMissionCompleted?: (userData: any) => void;
}

function MissionItem({
  index,
  mission,
  selected,
  onClick,
  isInProgress = false,
  timerFormatted,
}: {
  index: number;
  mission: Mission;
  selected: boolean;
  onClick: () => void;
  isInProgress?: boolean;
  timerFormatted?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full flex flex-col rounded-xl p-3 text-left transition-all border-2 ${selected
        ? 'border-[#FD8BBA] bg-[#2E2F4F99]'
        : 'border-transparent bg-[#09091E4D] hover:bg-[#20225366] hover:border-[#0967BC66]'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-[#00112D] flex items-center justify-center">
          <img src={mission.imageSrc} alt="" className="w-full h-full object-cover" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium font-anton uppercase text-sm truncate">{mission.name}</p>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Icon
                key={i}
                icon="mage:star"
                className={mission.stars > 1 ? 'text-[#95A2FF]' : 'text-[#FF79B0]'}
                width={16}
                height={16}
              />
            ))}
          </div>
        </div>
      </div>
      {isInProgress && timerFormatted && (
        <div className="absolute bottom-[-24px] left-[8px] w-fit flex flex-col items-center justify-center z-50">
          <div className="flex items-center justify-center gap-6 bg-[#1F1F38] rounded-lg py-2 px-5">
            <p className="text-white font-medium font-anton uppercase text-sm">YIELD</p>
            <p className="text-[#FF79B0] font-medium font-anton text-sm">{mission.yield}</p>
          </div>
          <div className="w-[90px] rounded bg-[#1D1D3B] py-1 px-2 flex items-center justify-center">
            <p className="text-[#FF79B0] font-medium font-anton text-sm tabular-nums">{timerFormatted}</p>
          </div>
        </div>
      )}
    </button>
  );
}

function toMission(m: unknown): Mission | null {
  if (!m || typeof m !== 'object') return null;
  const o = m as Record<string, unknown>;
  return {
    _id: o._id as string,
    mapId: (o.mapId as string) ?? '',
    order: Number(o.order) ?? 0,
    name: String(o.name ?? ''),
    description: String(o.description ?? ''),
    duration: String(o.duration ?? '2 HRS'),
    yield: Number(o.yield) ?? 0,
    stars: Number(o.stars) ?? 0,
    imageSrc: String(o.imageSrc ?? ''),
  };
}

export default function MissionsModal({
  isOpen,
  onClose,
  missions: missionsProp,
  currentMap,
  wallet,
  balance = 0,
  initialSelectedMissionName,
  onMissionCompleted,
}: MissionsModalProps) {
  const [missions, setMissions] = useState<Mission[]>(missionsProp ?? []);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [confirmMission, setConfirmMission] = useState<Mission | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [missionsInProgress, setMissionsInProgress] = useState<Array<{ mission: Mission; endTimeMs: number }>>([]);
  const [timerTick, setTimerTick] = useState(0);

  useEffect(() => {
    if (missionsProp) {
      setMissions(missionsProp);
      if (missionsProp.length > 0) setSelectedMission((prev) => prev ?? missionsProp[0]);
    } else {
      const mapId = currentMap._id == null ? '' : String(currentMap._id);
      if (!mapId) return;
      getMissionsForMap(mapId).then((forMap) => {
        setMissions(forMap);
        setSelectedMission((prev) => {
          const keep = forMap.find((m) => m.name === prev?.name);
          return keep ?? forMap[0] ?? null;
        });
      });
    }
  }, [missionsProp, currentMap]);

  useEffect(() => {
    if (isOpen && missions.length > 0 && !selectedMission) {
      setSelectedMission(missions[0]);
    }
  }, [isOpen, missions, selectedMission]);

  // Preselect mission when opened with initialSelectedMissionName (e.g. from activity card "start")
  useEffect(() => {
    if (isOpen && initialSelectedMissionName && missions.length > 0) {
      const found = missions.find((m) => m.name === initialSelectedMissionName);
      if (found) setSelectedMission(found);
    }
  }, [isOpen, initialSelectedMissionName, missions]);

  // Fetch in-progress game history when modal opens so we show current game state
  useEffect(() => {
    if (!isOpen || !wallet?.trim()) return;
    gameAPI.getGameHistory(wallet.trim()).then((res) => {
      const list = Array.isArray(res.data) ? res.data : [];
      const completed = list.filter((game) => game.gameStation === 'completed');
      setGameHistory(completed);
      const inProgress = list.filter((game) => game.gameStation === 'in_progress');
      setMissionsInProgress(inProgress.map((game) => ({
        mission: toMission(game.missionId) ?? game.missionId,
        endTimeMs: game.endTime ? new Date(game.endTime).getTime() : 0,
        gameStation: game.gameStation,
      })));
    }).catch((err) => {
      toastError('Could not load missions. Please try again.', err);
      setGameHistory([]);
    });
  }, [isOpen, wallet]);

  // Timer for all missions in progress; when one completes, notify parent to fetch completion state from backend
  useEffect(() => {
    if (missionsInProgress.length === 0) return;
    setTimerTick(Date.now());
    const interval = setInterval(() => {
      const now = Date.now();
      setTimerTick(now);
      setMissionsInProgress((prev) => {
        const stillRunning = prev.filter((entry) => now < entry.endTimeMs);
        const completed = prev.filter((entry) => now >= entry.endTimeMs);
        if (completed.length > 0 && wallet?.trim()) {
          const w = wallet.trim();
          queueMicrotask(() => {
            gameAPI.getRecentCompletions(w).then((res) => {
              const list = Array.isArray(res.data?.completed) ? res.data.completed : [];
              setGameHistory(list);
              onMissionCompleted?.(res.data.user);
              toastSuccess('Completions refreshed successfully!');
            }).catch((err) => {
              setGameHistory([]);
              toastError('Could not refresh completions.', err);
              onMissionCompleted?.(w);
            });
          });
        }
        return stillRunning;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [missionsInProgress.length, wallet, onMissionCompleted]);

  const handleStartClick = () => {
    if (selected) setConfirmMission(selected);
  };

  const handleConfirmContinue = async () => {
    if (!confirmMission) return;
    setStartError(null);
    if (!wallet?.trim() || !confirmMission._id) {
      setConfirmMission(null);
      return;
    }
    try {
      const res = await gameAPI.startGame(wallet.trim(), String(confirmMission._id));
      const data = res.data as { endTime?: string; missionId?: unknown };
      const endTimeMs = data.endTime ? new Date(data.endTime).getTime() : 0;
      const mission = toMission(data.missionId) ?? confirmMission;
      setMissionsInProgress((prev) => [...prev, { mission, endTimeMs }]);
      const newGameHistory = gameHistory.filter((game) => (typeof game.missionId === 'string' ? game.missionId : game.missionId?._id) !== confirmMission._id);
      setGameHistory(newGameHistory);
      setConfirmMission(null);
      toastSuccess('Mission started successfully!');
    } catch (err) {
      setStartError('Failed to start mission. Try again.');
      toastError('Failed to start mission. Try again.', err);
    }
  };

  const handleConfirmCancel = () => {
    setConfirmMission(null);
    setStartError(null);
  };

  if (!isOpen) return null;

  const displayMissions = missions;
  const selected = selectedMission ?? displayMissions[0] ?? null;
  const selectedIconSrc = selected?.imageSrc ?? null;

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
          <h2 className="text-white font-medium font-anton uppercase text-3xl sm:text-5xl">MISSIONS</h2>
        </div>

        {/* Close button - top right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-[1px] -right-[1px] w-14 h-14 bg-[#3E95E3] rounded hover:opacity-90 flex items-center justify-center text-white z-20"
        >
          <img src="/images/pack/text-x.svg" alt="CLOSE" className="h-7 w-auto object-contain" />
        </button>

        {/* Two panels - same height */}
        <div className="flex flex-col lg:flex-row flex-1 gap-6 pt-2 w-full min-h-0 max-h-[calc(90vh-6rem)]">
          {/* Left panel - mission list (scrollable) */}
          <div className="flex flex-1 lg:basis-0 min-w-0 min-h-0 lg:min-w-[340px] lg:max-w-[720px] min-h-[500px] rounded-2xl bg-[#202253E5] border-2 border-[#0967BC] p-4 flex flex-col overflow-hidden">
            <div className="flex-1 w-full min-h-0 overflow-y-auto space-y-2 pr-1">
              {displayMissions.map((mission, index) => {
                const missionId = mission._id ?? mission.name;
                const progressEntry = missionsInProgress.find((e) => (e.mission._id ?? e.mission.name) === missionId);
                const isThisInProgress = !!progressEntry;
                const remainingMs = progressEntry
                  ? Math.max(0, progressEntry.endTimeMs - (timerTick || Date.now()))
                  : 0;
                return (
                  <MissionItem
                    index={index}
                    key={missionId}
                    mission={mission}
                    selected={selected ? (selected._id ?? selected.name) === missionId : false}
                    onClick={() => setSelectedMission(mission)}
                    isInProgress={isThisInProgress}
                    timerFormatted={isThisInProgress ? formatTimer(remainingMs) : undefined}
                  />
                );
              })}
            </div>
          </div>

          {/* Right panel - mission details (scrollable) */}
          <div className="flex flex-1 lg:basis-0 min-w-0 min-h-0 lg:min-w-[340px] lg:max-w-[720px] min-h-[500px] rounded-2xl bg-[#2E2F4FE5] border-2 border-[#0967BC] py-5 px-2 flex flex-col overflow-hidden relative">
            {selected && (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">
                  <div className="flex gap-2 px-2 w-full min-w-0 min-h-0 h-full justify-between">
                    <div className="flex flex-col bg-[#09091E80] px-4 gap-8 py-8 rounded-lg flex-1 w-[65%] max-h-[200px]">
                      <h3 className="text-[#FD8BBA] font-medium font-anton uppercase text-xl sm:text-2xl line-clamp-1">
                        {selected.name}
                      </h3>
                      <p className="text-white text-sm sm:text-base leading-snug line-clamp-2">{selected.description}</p>
                    </div>
                    <div className="rounded-xl overflow-hidden bg-[#09091E4D] border border-[#0967BC66] aspect-video max-h-[200px] flex items-center justify-center w-[35%]">
                      {selectedIconSrc ? (
                        <img
                          src={selectedIconSrc}
                          alt=""
                          className="w-full h-full object-cover"
                          aria-hidden
                        />
                      ) : (
                        <Icon icon="mdi:image-outline" className="text-white/40 text-5xl" />
                      )}
                    </div>
                  </div>

                  {/* Mission completed: banner + rewards */}
                  {gameHistory.some((game) => (typeof game.missionId === 'string' ? game.missionId : game.missionId?._id) === selected._id && game.gameStation === 'completed') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#000114B2] h-full">
                      <div className="w-full bg-gradient-to-r from-[#2F55FF0D] via-[#2644CC] to-[#1C33990D] py-8 px-6 flex items-center justify-center">
                        <span className="text-white font-medium font-anton uppercase text-2xl sm:text-3xl">MISSION COMPLETED</span>
                      </div>
                      <div className="w-full flex flex-col items-center justify-center gap-2 px-4">
                        <p className="text-[#6782FF] font-medium font-anton uppercase text-2xl">Rewards</p>
                        <div className="relative w-full bg-gradient-to-r from-[#2F55FF0D] via-[#2644CC] to-[#1C33990D] py-2 px-6 flex items-center justify-center">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-shrink-0">
                              <img
                                src="/images/header/dolla-circle.svg"
                                alt=""
                                className="w-10 h-10 object-contain"
                                aria-hidden
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <img src="/images/icons/dollar.svg" alt="" className="w-5 h-5 object-contain" aria-hidden />
                              </div>
                            </div>
                            <span className="text-white font-medium font-anton text-xl">{balance.toLocaleString()}</span>
                          </div>
                          <span className="absolute right-[20%] text-[#F7237A] font-bold font-anton text-2xl">{gameHistory.find((game) => (typeof game.missionId === 'string' ? game.missionId : game.missionId?._id) === selected._id && game.gameStation === 'completed')?.expAwarded?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* In progress: status bar + timer */}
                  {(() => {
                    const selectedProgress = missionsInProgress.find((e) => (e.mission._id ?? e.mission.name) === (selected._id ?? selected.name));
                    return selectedProgress ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 bg-[#000114B2] h-full">
                        <div className="w-fit rounded-xl bg-[#1F1F45] py-3 px-16 flex items-center justify-center gap-4">
                          <span className="text-[#FF5098] font-medium font-anton uppercase text-2xl">IN PROGRESS</span>
                          <Icon icon="eos-icons:bubble-loading" className="text-[#FD8BBA]" width={32} height={32} />
                        </div>
                        <div className="bg-[#1F1F38B2] rounded-xl pt-4 pb-2 px-4 text-[#FF98C2] font-medium font-anton text-3xl tabular-nums">
                          {formatTimer(Math.max(0, selectedProgress.endTimeMs - (timerTick || Date.now())))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Default: Duration + Yield (only when not completed and not in progress) */}
                  {!gameHistory.some((game) => (typeof game.missionId === 'string' ? game.missionId : game.missionId?._id) === selected._id && game.gameStation === 'completed') && !missionsInProgress.some((e) => (e.mission._id ?? e.mission.name) === (selected._id ?? selected.name)) && (
                    <div className="w-fit rounded-xl bg-[#09091E80] pl-5 pr-8 pb-4 flex gap-12 ml-12">
                      <div className="relative w-fit">
                        <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 rounded-md w-[98px] bg-[#3366FF] px-3 py-1.5 flex items-center justify-center z-10 whitespace-nowrap">
                          <span className="text-white font-medium font-['Arial'] uppercase text-sm">Duration</span>
                        </div>
                        <div className="w-fit rounded-xl bg-[#2F55FF66] w-[92px] px-5 pb-3 pt-10 flex items-center justify-center shadow-inner">
                          <span className="text-white font-medium font-anton uppercase text-2xl">{selected.duration}</span>
                        </div>
                      </div>
                      <div className="relative w-fit">
                        <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 rounded-md w-[98px] bg-[#3366FF] px-5 py-1.5 flex items-center justify-center z-10 whitespace-nowrap">
                          <span className="text-white font-medium font-['Arial'] uppercase text-sm">Yield</span>
                        </div>
                        <div className="w-fit rounded-xl bg-[#2F55FF66] w-[92px] px-5 pb-3 pt-10 flex items-center justify-center shadow-inner">
                          <span className="text-white font-medium font-anton uppercase text-2xl">{selected.yield}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Start button: show when this mission is not in progress (allows start and restart after complete) */}
                {!missionsInProgress.some((e) => (e.mission._id ?? e.mission.name) === (selected._id ?? selected.name)) && (
                  <div className="flex-shrink-0 flex justify-end pt-4">
                    <Button
                      variant="primary"
                      className={`border-2 border-[#FD8BBA] ${gameHistory.some((game) => (typeof game.missionId === 'string' ? game.missionId : game.missionId?._id) === selected._id && game.gameStation === 'completed') ? 'z-50' : ''} rounded-lg font-anton uppercase font-medium px-8 py-2.5`}
                      onClick={handleStartClick}
                    >
                      {gameHistory.some((game) => {
                        const mid = typeof game.missionId === 'string' ? game.missionId : game.missionId?._id;
                        return mid === selected._id && game.gameStation === 'completed';
                      }) ? 'Restart' : 'Start'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Start confirmation modal overlay (screenshots 1–2) */}
        {confirmMission && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-end rounded-3xl bg-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-xl bg-[#0018CF99] shadow-xl border border-[#99A5FF33] px-8 py-8 max-w-md w-full mr-[10%]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative flex w-full">
                <div className="absolute -top-[38px] -left-[38px] flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-white/30 flex items-center justify-center">
                  <Icon icon="pepicons-pop:question" className="text-[#021180]" width={28} height={28} />
                </div>
                <div className="flex flex-col min-w-0 gap-10 mt-8 w-full">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <p className="text-white text-md font-['Arial']">
                      This mission takes <strong>{durationToConfirmText(confirmMission.duration).value} {durationToConfirmText(confirmMission.duration).unit}</strong> to complete
                    </p>
                    <p className="text-white font-anton uppercase text-2xl sm:text-3xl font-medium">DO YOU WANT TO CONTINUE?</p>
                    {startError && (
                      <p className="text-[#FF79B0] text-sm font-medium mt-2" role="alert">{startError}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      className="bg-[#0B26F0] rounded-lg text-white border-0 font-medium font-anton uppercase px-6 py-2 hover:bg-[#0B26F0]/60"
                      onClick={handleConfirmCancel}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-white rounded-lg text-[#18398D] border-0 font-medium font-anton uppercase px-6 py-2 hover:bg-white/60"
                      onClick={handleConfirmContinue}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
