import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useWallet, type WalletId, WALLET_META } from '../../context/WalletContext';
import Button from '../Button';

export type { WalletId };

export interface WalletsModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called when connection succeeds (e.g. to close modal). Optional if modal auto-closes via useWallet. */
    onConnectSuccess?: () => void;
}

const WALLET_IDS: WalletId[] = ['phantom', 'metamask', 'coinbase', 'rabby'];

export default function WalletsModal({
    isOpen,
    onClose,
    onConnectSuccess,
}: WalletsModalProps) {
    const { connect, isConnecting, detectedWallets, isConnected } = useWallet();
    const [selectedWallet, setSelectedWallet] = useState<WalletId>('phantom');
    const [optionsOpen, setOptionsOpen] = useState(false);
    const wasConnectedWhenOpened = useRef(false);

    useEffect(() => {
        if (isOpen) {
            wasConnectedWhenOpened.current = isConnected;
        }
    }, [isOpen, isConnected]);

    useEffect(() => {
        if (isOpen && isConnected && !wasConnectedWhenOpened.current) {
            onClose();
            onConnectSuccess?.();
        }
    }, [isOpen, isConnected, onClose, onConnectSuccess]);

    const otherWallets = WALLET_IDS.slice(1).map((id) => WALLET_META[id]);
    const isDetected = (id: WalletId) => detectedWallets.includes(id);
    const getWalletInfo = (id: WalletId) => WALLET_META[id];

    const handleConnect = async () => {
        await connect(selectedWallet);
    };

    const handleWalletClick = async (walletId: WalletId) => {
        setSelectedWallet(walletId);
        await connect(walletId);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[450px] min-h-[360px] rounded-2xl bg-[#1C1E3EFA] p-2 shadow-xl mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button - top right */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute -top-[3px] -right-[1px] w-14 h-14 bg-[#3E95E3] rounded hover:opacity-90 flex items-center justify-center text-white"
                >
                    <img src="/images/pack/text-x.svg" alt="CLOSE" className="h-7 w-auto object-contain" />
                </button>

                {/* Title: Connect a wallet */}
                <div className="flex justify-center items-center mt-12">
                    <p className="text-white font-bold font-['Arial'] text-3xl text-center">
                        Connect a wallet
                    </p>
                </div>

                {/* Wallet list - click to connect */}
                <div className="mt-10 flex flex-col gap-2">
                    {detectedWallets.map((walletId) => {
                        const info = getWalletInfo(walletId);
                        return (
                            <button
                                key={walletId}
                                type="button"
                                onClick={() => handleWalletClick(walletId)}
                                disabled={isConnecting}
                                className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-2 transition-colors bg-[#32345A] hover:bg-[#2D2D4499] disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${info.iconBg || 'bg-gray-600'}`}>
                                        {info.iconImage ? (
                                            <img src={info.iconImage} alt="" className="w-8 h-8 object-contain" />
                                        ) : (
                                            <Icon icon={info.icon} className="text-white text-xl" />
                                        )}
                                    </div>
                                    <span className="text-white font-medium">{info.name}</span>
                                </div>
                                {isDetected(walletId) && !isConnecting && (
                                    <span className="text-gray-400 text-sm">Detected</span>
                                )}
                                {isConnecting && selectedWallet === walletId && (
                                    <span className="text-white/80 text-sm">Connecting...</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Options dropdown */}
                <div className="mt-3 relative">
                    <button
                        type="button"
                        onClick={() => setOptionsOpen(!optionsOpen)}
                        className="w-full flex items-center justify-end gap-2 rounded-xl px-4 py-1 text-[#E8E8EC] text-md"
                    >
                        Options
                        <Icon icon={optionsOpen ? 'prime:sort-up-fill' : 'prime:sort-down-fill'} width={20} height={20} />
                    </button>
                    {optionsOpen && (
                        <div className="absolute w-[230px] h-[230px] top-1/2 left-[90%] transform -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#04062799] overflow-auto hide-scrollbar z-10 shadow-lg">
                            {otherWallets.map((wallet) => (
                                <button
                                    key={wallet.id}
                                    type="button"
                                    onClick={() => {
                                        setOptionsOpen(false);
                                        handleWalletClick(wallet.id);
                                    }}
                                    disabled={isConnecting}
                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#2D2D4499] transition-colors disabled:opacity-60 ${selectedWallet === wallet.id ? 'bg-[#2D2D44]' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${wallet.iconBg || 'bg-gray-600'}`}>
                                            {wallet.iconImage ? (
                                                <img src={wallet.iconImage} alt="" className="w-5 h-5 object-contain" />
                                            ) : (
                                                <Icon icon={wallet.icon} className="text-white text-lg" />
                                            )}
                                        </div>
                                        <span className="text-white font-medium text-sm">{wallet.name}</span>
                                    </div>
                                    {isDetected(wallet.id) && (
                                        <span className="text-gray-400 text-xs">Detected</span>
                                    )}
                                </button>
                            ))}
                            <div className="flex justify-center items-center mb-2">
                                <button
                                    type="button"
                                    className="w-fit px-4 py-2.5 text-white/80 text-sm hover:bg-[#2D2D44] hover:rounded-b-xl border-[1px] border-dotted rounded-xl border-white/10"
                                >
                                    More Options
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Connect button */}
                <div className="flex justify-center items-center mt-6 mb-4">
                    <Button
                        variant="primary"
                        className="w-fit font-medium border-[1px] border-[#FD8BBA] px-12 py-2.5 text-xl font-anton uppercase"
                        onClick={handleConnect}
                        disabled={isConnecting}
                    >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
