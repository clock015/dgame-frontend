import { useState } from 'react';

import type { DgameDeployment } from '../../contracts/addresses';
import { useGachaPoolFee } from '../../hooks';
import styles from '../../styles/Dgame.module.css';
import { formatTokenAmount, parsePositiveBigInt } from '../../utils/format';
import { ActionButton, Field, Section, TextInput } from './Primitives';

type GachaPanelProps = {
  characterId: string;
  deployment: DgameDeployment;
  isBusy: boolean;
  onCommitBatch: () => void;
  onRequestGacha: (params: {
    playerId: bigint;
    roundCount: bigint;
    characterId: bigint;
    rarity: number;
  }) => void;
  playerId: string;
  setCharacterId: (value: string) => void;
};

export function GachaPanel({
  characterId,
  deployment,
  isBusy,
  onCommitBatch,
  onRequestGacha,
  playerId,
  setCharacterId,
}: GachaPanelProps) {
  const [roundCount, setRoundCount] = useState('10');
  const [rarity, setRarity] = useState('1');
  const parsedPlayerId = parsePositiveBigInt(playerId);
  const parsedCharacterId = parsePositiveBigInt(characterId);
  const parsedRoundCount = parsePositiveBigInt(roundCount);
  const parsedRarity = Number(rarity || '0');
  const fee = useGachaPoolFee(parsedRarity > 0 ? parsedRarity : undefined, { deployment });
  const estimatedCost =
    fee.data !== undefined && parsedRoundCount !== undefined
      ? fee.data * parsedRoundCount
      : undefined;
  const canRequest = Boolean(
    parsedPlayerId !== undefined &&
      parsedCharacterId !== undefined &&
      parsedRoundCount !== undefined &&
      parsedRarity > 0,
  );

  return (
    <Section meta="Request / commit" title="Gacha">
      <div className={styles.formGrid}>
        <TextInput label="Character ID" onChange={setCharacterId} placeholder="0" value={characterId} />
        <TextInput label="Rounds" onChange={setRoundCount} placeholder="10" value={roundCount} />
        <TextInput label="Rarity" onChange={setRarity} placeholder="1" value={rarity} />
      </div>

      <div className={styles.metricGrid}>
        <Field label="Fee per round" value={formatTokenAmount(fee.data)} />
        <Field label="Estimated cost" value={formatTokenAmount(estimatedCost)} />
      </div>

      <div className={styles.actions}>
        <ActionButton
          disabled={isBusy || !canRequest}
          onClick={() =>
            parsedPlayerId !== undefined && parsedCharacterId !== undefined && parsedRoundCount !== undefined
              ? onRequestGacha({
                  playerId: parsedPlayerId,
                  roundCount: parsedRoundCount,
                  characterId: parsedCharacterId,
                  rarity: parsedRarity,
                })
              : undefined
          }
          variant="primary"
        >
          Request gacha
        </ActionButton>
        <ActionButton disabled={isBusy} onClick={onCommitBatch}>
          Commit batch
        </ActionButton>
      </div>

      <p className={styles.hint}>
        Request creates a roll. Commit finalizes the current batch after a later block.
      </p>
    </Section>
  );
}
