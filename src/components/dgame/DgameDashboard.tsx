import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMemo, useState } from 'react';
import type { Hex } from 'viem';
import { useAccount, useChainId } from 'wagmi';

import type { DgameDeployment } from '../../contracts/addresses';
import { useContractOwner, useDgameDeployment, useDgameTransactions } from '../../hooks';
import styles from '../../styles/Dgame.module.css';
import { CharacterPanel } from './CharacterPanel';
import { DeploymentPanel } from './DeploymentPanel';
import { GachaPanel } from './GachaPanel';
import { GachaRequestsPanel } from './GachaRequestsPanel';
import { MerchantPanel } from './MerchantPanel';
import { PlayerPanel } from './PlayerPanel';
import { TransactionStatus } from './TransactionStatus';

type DgameDashboardProps = {
  initialDeployment: DgameDeployment;
};

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

      <TransactionStatus transaction={transactionSnapshot} />

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
          playerId={playerId}
          setCharacterId={setCharacterId}
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
    </main>
  );
}
