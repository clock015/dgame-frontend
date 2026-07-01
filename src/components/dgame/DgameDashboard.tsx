import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMemo, useState } from 'react';
import type { Hex } from 'viem';
import { useAccount, useChainId } from 'wagmi';

import type { DgameDeployment } from '../../contracts/addresses';
import {
  useAutoSyncCurrentPlayerCharacter,
  useContractOwner,
  useDgameDeployment,
  useDgameTransactions,
} from '../../hooks';
import styles from '../../styles/Dgame.module.css';
import { CharacterCreatePanel } from './CharacterCreatePanel';
import { CharacterPanel } from './CharacterPanel';
import { DeploymentPanel } from './DeploymentPanel';
import { GachaPanel } from './GachaPanel';
import { GachaRequestsPanel } from './GachaRequestsPanel';
import { MerchantPanel } from './MerchantPanel';
import { PlayerPanel } from './PlayerPanel';
import { PlayerCharacterIndexPanel } from './PlayerCharacterIndexPanel';
import { TransactionStatus } from './TransactionStatus';

type DgameDashboardProps = {
  initialDeployment: DgameDeployment;
};

type ConsolePage = 'play' | 'characters';

type PageTab = {
  id: ConsolePage;
  label: string;
};

const pageTabs: PageTab[] = [
  { id: 'play', label: 'Play' },
  { id: 'characters', label: 'Characters' },
];

const requiredAddresses = [
  'asset',
  'onMarket',
  'characterProxy',
  'merchantProxy',
  'marketProxy',
  'gachaPoolProxy',
] as const;

export function DgameDashboard({ initialDeployment }: DgameDashboardProps) {
  const chainId = useChainId();
  const { address } = useAccount();
  const [activePage, setActivePage] = useState<ConsolePage>('play');
  const [playerId, setPlayerId] = useState('0');
  const [characterId, setCharacterId] = useState('0');
  const { deployment, missing } = useDgameDeployment({
    deployment: initialDeployment,
    required: [...requiredAddresses],
  });
  const transactions = useDgameTransactions({ deployment });
  const merchantOwner = useContractOwner('merchantProxy', { deployment });
  const isMerchantOwner = Boolean(
    address &&
      typeof merchantOwner.data === 'string' &&
      merchantOwner.data.toLowerCase() === address.toLowerCase(),
  );
  const isBusy = transactions.isPendingWallet || transactions.isConfirming;
  const confirmedTransactionHash = transactions.isConfirmed ? transactions.hash : undefined;
  const currentPairSync = useAutoSyncCurrentPlayerCharacter(
    playerId,
    characterId,
    confirmedTransactionHash,
  );

  const transactionSnapshot = useMemo(
    () => ({
      hash: transactions.hash as Hex | undefined,
      error: transactions.writeError,
      isPendingWallet: transactions.isPendingWallet,
      isConfirming: transactions.isConfirming,
      isConfirmed: transactions.isConfirmed,
    }),
    [
      transactions.hash,
      transactions.isConfirmed,
      transactions.isConfirming,
      transactions.isPendingWallet,
      transactions.writeError,
    ],
  );

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>Dgame onMarket</span>
          <h1>Contract Console</h1>
        </div>
        <div className={styles.walletArea}>
          <span>Chain {chainId}</span>
          <ConnectButton />
        </div>
      </header>

      <nav className={styles.navBar}>
        {pageTabs.map((tab) => (
          <button
            className={tab.id === activePage ? styles.navButtonActive : styles.navButton}
            key={tab.id}
            onClick={() => setActivePage(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <TransactionStatus transaction={transactionSnapshot} />
      {currentPairSync.error ? (
        <p className={styles.globalWarning}>{currentPairSync.error.message}</p>
      ) : null}

      {activePage === 'play' ? (
        <div className={styles.grid}>
          <PlayerPanel
            deployment={deployment}
            isBusy={isBusy}
            onApproveAsset={(amount) =>
              deployment.onMarket ? transactions.approveAsset(deployment.onMarket, amount) : undefined
            }
            onMintPlayer={transactions.mintPlayer}
            onRecharge={transactions.mockRechargeConnectedPlayer}
            playerId={playerId}
            setPlayerId={setPlayerId}
          />
          <CharacterPanel
            characterId={characterId}
            deployment={deployment}
            isBusy={isBusy}
            onClaimReward={(id) =>
              deployment.merchantProxy
                ? transactions.claimRewardViaMerchant({
                    characterId: id,
                    settlementMerchant: deployment.merchantProxy,
                    rechargeTarget: id,
                    data: '0x',
                  })
                : undefined
            }
            setCharacterId={setCharacterId}
          />
          <PlayerCharacterIndexPanel
            characterId={characterId}
            playerId={playerId}
          />
          <GachaPanel
            characterId={characterId}
            deployment={deployment}
            isBusy={isBusy}
            onCommitBatch={transactions.commitGachaBatch}
            onRequestGacha={transactions.requestGacha}
            playerId={playerId}
            setCharacterId={setCharacterId}
          />
          <GachaRequestsPanel
            deployment={deployment}
            isBusy={isBusy}
            onResolveRoll={transactions.resolveGachaRoll}
            playerId={playerId}
            refreshKey={confirmedTransactionHash}
          />
          {isMerchantOwner ? (
            <MerchantPanel
              deployment={deployment}
              isBusy={isBusy}
              onApproveOwnerAsset={(amount) =>
                deployment.merchantProxy ? transactions.approveAsset(deployment.merchantProxy, amount) : undefined
              }
              onClaimOwnerSales={transactions.claimOwnerSales}
              onDepositOwnerBalance={transactions.depositOwnerBalance}
              onRegisterMerchant={transactions.registerMerchant}
            />
          ) : null}
          <DeploymentPanel deployment={deployment} missing={missing} />
        </div>
      ) : (
        <div className={styles.grid}>
          <CharacterCreatePanel
            deployment={deployment}
            isBusy={isBusy}
            onCreateCharacter={(attributes, characterCID, name) =>
              transactions.mintCharacter({ attributes, characterCID, name })
            }
          />
          <CharacterPanel
            characterId={characterId}
            deployment={deployment}
            isBusy={isBusy}
            onClaimReward={(id) =>
              deployment.merchantProxy
                ? transactions.claimRewardViaMerchant({
                    characterId: id,
                    settlementMerchant: deployment.merchantProxy,
                    rechargeTarget: id,
                    data: '0x',
                  })
                : undefined
            }
            setCharacterId={setCharacterId}
          />
        </div>
      )}
    </main>
  );
}
