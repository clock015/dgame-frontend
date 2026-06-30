import { useState } from 'react';

import type { DgameDeployment } from '../../contracts/addresses';
import { useAssetBalance, useConnectedPlayerOwnership, usePlayerInfo } from '../../hooks';
import styles from '../../styles/Dgame.module.css';
import { formatTokenAmount, parsePositiveBigInt, parseTokenUnits } from '../../utils/format';
import { ActionButton, Field, Section, TextInput } from './Primitives';

type PlayerPanelProps = {
  deployment: DgameDeployment;
  isBusy: boolean;
  onApproveAsset: (amount: bigint) => void;
  onMintPlayer: () => void;
  onRecharge: (playerId: bigint, amount: bigint) => void;
  playerId: string;
  setPlayerId: (value: string) => void;
};

function getOwnershipLabel(isLoading: boolean, hasError: boolean, isOwner: boolean) {
  if (isLoading) {
    return 'Checking';
  }

  if (hasError) {
    return 'Not minted';
  }

  return isOwner ? 'Yes' : 'No';
}

export function PlayerPanel({
  deployment,
  isBusy,
  onApproveAsset,
  onMintPlayer,
  onRecharge,
  playerId,
  setPlayerId,
}: PlayerPanelProps) {
  const [rechargeAmount, setRechargeAmount] = useState('100');
  const parsedPlayerId = parsePositiveBigInt(playerId);
  const parsedRechargeAmount = parseTokenUnits(rechargeAmount);
  const playerInfo = usePlayerInfo(parsedPlayerId, { deployment });
  const ownership = useConnectedPlayerOwnership(parsedPlayerId, { deployment });
  const assetBalance = useAssetBalance({ deployment });
  const canRecharge = Boolean(
    deployment.usingMockMarket && parsedPlayerId !== undefined && parsedRechargeAmount !== undefined,
  );

  return (
    <Section meta="Player NFT" title="Player Account">
      <div className={styles.nftActionRow}>
        <ActionButton disabled={isBusy} onClick={onMintPlayer} variant="primary">
          Mint player
        </ActionButton>
        <Field
          label="Current wallet owns this player"
          value={getOwnershipLabel(ownership.isLoading, Boolean(ownership.error), ownership.isOwner)}
        />
      </div>

      <div className={styles.formGrid}>
        <TextInput label="Player ID" onChange={setPlayerId} placeholder="0" value={playerId} />
        <TextInput
          label="Recharge amount"
          onChange={setRechargeAmount}
          placeholder="100"
          value={rechargeAmount}
        />
      </div>

      <div className={styles.metricGroup}>
        <div className={styles.groupHeader}>
          <h3>Balances</h3>
          <span>Player {playerId || '-'}</span>
        </div>
        <div className={styles.metricGrid}>
          <Field label="Wallet asset" value={formatTokenAmount(assetBalance.data as bigint | undefined)} />
          <Field label="Game token" value={formatTokenAmount(playerInfo.data?.gameToken)} />
          <Field label="Exchange token" value={formatTokenAmount(playerInfo.data?.exchangeToken)} />
          <Field label="Free exchange" value={formatTokenAmount(playerInfo.data?.freeExchangeToken)} />
        </div>
      </div>

      <div className={styles.actions}>
        <ActionButton
          disabled={isBusy || !deployment.onMarket || parsedRechargeAmount === undefined}
          onClick={() => parsedRechargeAmount !== undefined && onApproveAsset(parsedRechargeAmount)}
        >
          Approve asset
        </ActionButton>
        <ActionButton
          disabled={isBusy || !canRecharge}
          onClick={() =>
            parsedPlayerId !== undefined && parsedRechargeAmount !== undefined
              ? onRecharge(parsedPlayerId, parsedRechargeAmount)
              : undefined
          }
        >
          Mock recharge
        </ActionButton>
      </div>

      {playerInfo.error ? <p className={styles.warning}>Player balance read failed</p> : null}
      <p className={styles.hint}>Amounts use the local token default of 6 decimals.</p>
    </Section>
  );
}
