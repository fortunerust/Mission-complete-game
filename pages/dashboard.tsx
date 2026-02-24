import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import Button from '../components/Button';
import SettingDropdown from '../components/SettingDropdown';
import { useCharacter } from '../context/CharacterContext';
import { useGameSettings } from '../context/GameSettingsContext';

type DashboardTab = 'review' | 'communities' | 'about' | 'terms' | 'settings';

const TABS: { id: DashboardTab; label: string; icon: string }[] = [
  { id: 'review', label: 'Review', icon: 'material-symbols:star-rounded' },
  { id: 'communities', label: 'Communities', icon: 'heroicons:user-group-20-solid' },
  { id: 'about', label: 'About Game', icon: 'material-symbols:info-i' },
  { id: 'terms', label: 'Terms', icon: 'mdi:file-document-outline' },
  { id: 'settings', label: 'Settings', icon: 'mdi:cog' },
];

const MUSIC_OPTIONS = [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }];
const RESOLUTION_OPTIONS = [
  { value: '1920x1444', label: '1920 x 1444' },
  { value: '1920x1080', label: '1920 x 1080' },
  { value: '1280x720', label: '1280 x 720' },
];
const ANIMATIONS_OPTIONS = [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('review');
  const { characterImage } = useCharacter();
  const [music, setMusic] = useState('off');
  const { resolution, setResolution } = useGameSettings();
  const [animations, setAnimations] = useState('off');

  return (
    <div className="min-h-screen relative">
      {/* Background - main.jpg blurred */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: 'url(/images/maps/main.jpg)' }}
        aria-hidden
      />
      <div className="fixed inset-0" aria-hidden />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="w-full max-w-[90vw] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[90vh]">
          {/* Top nav */}
          <div className="flex-shrink-0 flex items-center gap-3 py-2 h-full">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-lg border border-[#0967BC] w-[160px] h-[48px] text-white font-medium transition-colors ${activeTab === tab.id ? 'bg-[#0B26F0]' : 'bg-[#202253E5] hover:bg-[#0B26F0]'
                  }`}
              >
                <div className="flex items-center justify-center w-[30px] h-[30px] bg-[#0B26F0] rounded-full">
                  <Icon icon={tab.icon} width={20} height={20} className="text-white" />
                </div>
                <span className="text-white text-sm">{tab.label}</span>
              </button>
            ))}
            <Link
              href="/"
              className="flex items-center justify-center w-[70px] h-[48px] rounded-lg border border-[#0967BC] text-white bg-[#202253E5] hover:bg-[#0B26F0]"
              aria-label="Back to game"
            >
              <Icon icon="mdi:arrow-u-left-top" width={24} height={24} />
            </Link>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-[#202253E5] h-full border border-[#0967BC] p-16 rounded-md">
            {activeTab === 'review' && (
              <div className="flex flex-col justify-center px-12 gap-6 min-h-[50vh]">
                <h2 className="flex items-center gap-3 text-[#FF9900] font-medium font-anton text-4xl">
                  <Icon icon="mingcute:star-fill" width={48} height={48} />
                  Enjoying the Game?
                </h2>
                <div className="flex flex-col gap-10 pl-4">
                  <div className="flex flex-col gap-4">
                    <p className="text-white text-xl font-medium font-anton">Leave a Review..</p>
                    <textarea
                      placeholder="Share your experience..."
                      className="w-full min-h-[200px] rounded-lg bg-[#141531E5] border border-[#656565] text-white p-4 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#3E95E3]"
                      rows={6}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Link href="/">
                      <Button variant="secondary" className="bg-[#030A37] px-8 border-2 border-[#0967BC] rounded font-anton text-lg font-medium">
                        Back to Game
                      </Button>
                    </Link>
                    <Button variant="secondary" className="border border-[#0967BC] px-14 rounded font-anton text-lg font-medium">
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'communities' && (
              <div className="flex flex-col items-center justify-center gap-16 px-12 min-h-[50vh]">
                <h2 className="text-[#FF9900] font-medium font-anton text-4xl">
                  Join the growing Communities
                </h2>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-16 h-16 rounded border border-[#0967BC] bg-[#0B26F0] hover:bg-[#5BA3F5] transition-colors"
                  >
                    <Icon icon="simple-icons:x" width={32} height={32} className="text-white" />
                  </a>
                  <a
                    href="https://telegram.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-16 h-16 rounded border border-[#0967BC] bg-[#0B26F0] hover:bg-[#5BA3F5] transition-colors"
                  >
                    <Icon icon="fa6-brands:telegram" width={32} height={32} className="text-white" />
                  </a>
                </div>
                <p className="font-medium font-anton text-white text-md text-center leading-relaxed">
                  Join a growing community of players who are leveling up together. Share strategies, celebrate wins, compete in challenges, and connect with
                  others on the same mission. Whether you&apos;re just starting or already ahead of the curve, this is your space to grow, improve, and build alongside
                  like-minded players
                </p>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="flex flex-col gap-12 min-h-[50vh]">
                <h2 className="text-[#FF9900] font-medium font-anton text-4xl">About Game</h2>
                <div className="flex flex-col lg:flex-row gap-20">
                  <div className="flex-1 space-y-8 text-white font-medium font-anton text-md leading-relaxed pr-20">
                    <p>
                      A semi-realistic, progression-driven character transformation experience built around one core
                      idea: evolution. You start in an underdeveloped state—limited stats, limited presence, and limited
                      influence. Every mission, system, and mechanic is designed around self-improvement, discipline,
                      status building, and strategic growth.
                    </p>
                    <p>
                      The gameplay loop revolves around structured missions that mirror real-world self-optimization
                      themes: physical upgrades, social dominance, financial growth, skill mastery, aesthetic
                      improvements, and mindset shifts. Each completed mission feeds into larger progression systems:
                      stat boosts, visual transformations, unlocked environments, new social tiers, and higher-stakes
                      challenges. You progress from &quot;basic&quot; to &quot;elite,&quot; from overlooked to undeniable.
                    </p>
                    <p>
                      The world blends grounded realism with stylized exaggeration. Characters evolve physically and
                      socially as their stats improve. Environments reflect status progression—from small, limited
                      spaces to expansive, high-value locations. The UI reinforces growth: clean, bold, confident, and
                      gamified.
                    </p>
                  </div>
                  <div className="relative flex-shrink-0 w-60 h-60 rounded-xl bg-gradient-to-b from-[#F7237A] to-[#FF7EB3] flex items-center justify-center overflow-hidden">
                    <Image src={characterImage} alt="Current character" fill className="object-cover object-top" sizes="240px" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="flex flex-col gap-4 min-h-[50vh]">
                <h2 className="text-[#FF9900] font-medium font-anton text-4xl">Terms</h2>
                <div className="flex gap-20 h-full">
                  <div className="flex flex-col gap-4 max-h-[42vh] overflow-y-auto hide-scrollbar">
                    <p className="text-white font-medium font-anton text-md">
                      Welcome. By playing this game, you agree to the following completely serious and definitely-not-over-the-top
                      terms:
                    </p>
                    <ol className="list-decimal list-inside space-y-4 text-white font-medium font-anton text-md leading-relaxed">
                      <li>
                        <strong>It&apos;s Just a Game (Relax)</strong>
                        <br />
                        Everything in this game is fictional, exaggerated, and slightly dramatic on purpose. Any resemblance to real-life &quot;alpha energy,&quot; glow-ups, or legendary transformations is purely motivational.
                      </li>
                      <li>
                        <strong>You Start at Level 1. That&apos;s the Point.</strong>
                        <br />
                        No complaining about starting stats. Growth is earned here. If your character is mid, that&apos;s called game design.
                      </li>
                      <li>
                        <strong>Grind Responsibly</strong>
                        <br />
                        This game encourages discipline, focus, and leveling up but please:
                        <ul className="list-disc list-inside mt-1 ml-2 space-y-0.5">
                          <li>Drink water.</li>
                          <li>Touch grass occasionally.</li>
                          <li>Sleep.</li>
                          <li>Real-world HP matters.</li>
                        </ul>
                      </li>
                      <li>
                        <strong>No Exploits, No Chaos</strong>
                        <br />
                        Don&apos;t cheat, hack, exploit bugs, or try to break the economy. If you find a glitch, report it. Don&apos;t build your empire on it.
                      </li>
                      <li>
                        <strong>Respect the Community</strong>
                        <br />
                        Compete. Dominate. Win. But don&apos;t harass, bully, or ruin the experience for others. Real confidence doesn&apos;t need toxicity.
                      </li>
                      <li>
                        <strong>Your Progress Is Yours</strong>
                        <br />
                        Your stats, achievements, and transformations are tied to your account. Don&apos;t share access unless you enjoy chaos.
                      </li>
                      <li>
                        <strong>We Can Update the Game</strong>
                        <br />
                        The world evolves. Missions change. Systems get upgraded. If something becomes stronger, weaker, or cooler, that&apos;s balance.
                      </li>
                      <li>
                        <strong>This Game Does Not Guarantee Real-Life Superpowers</strong>
                        <br />
                        Playing this game may increase motivation. It will not:
                        <ul className="list-disc list-inside mt-1 ml-2 space-y-0.5">
                          <li>Make you 6&apos;5 overnight</li>
                          <li>Instantly multiply your bank account</li>
                          <li>Summon mysterious aura</li>
                        </ul>
                        (Results may vary.)
                      </li>
                      <li>
                        <strong>Have Fun</strong>
                        <br />
                        At the end of the day, this is about growth, challenge, and enjoyment. If you&apos;re not having fun, you&apos;re playing it wrong.
                      </li>
                    </ol>
                  </div>
                  <div className="flex justify-end mt-4">
                    <div className="relative w-full h-[400px] flex items-center justify-center">
                      <Image src="/images/characters/fat.svg" alt="Happy" fill className="object-cover object-top" sizes="(max-width: 768px) 100vw, 400px" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="flex flex-col gap-10 min-h-[50vh]">
                <h2 className="text-[#FF9900] font-medium font-anton text-4xl">Settings</h2>
                <div className="space-y-3 pl-4">
                  <SettingDropdown
                    label="Music"
                    value={music}
                    options={MUSIC_OPTIONS}
                    onSelect={setMusic}
                  />
                  <SettingDropdown
                    label="Resolution"
                    value={resolution}
                    options={RESOLUTION_OPTIONS}
                    onSelect={setResolution}
                  />
                  <SettingDropdown
                    label="Animations"
                    value={animations}
                    options={ANIMATIONS_OPTIONS}
                    onSelect={setAnimations}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
