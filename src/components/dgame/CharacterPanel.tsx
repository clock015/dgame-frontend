import type { DgameDeployment } from '../../contracts/addresses';
import { useCharacterInfo, usePlayerPurchase } from '../../hooks';
import styles from '../../styles/Dgame.module.css';
import { formatInteger, formatTokenAmount, parsePositiveBigInt } from '../../utils/format';
import { ActionButton, Field, Section, TextInput } from './Primitives';

type CharacterPanelProps = {
  characterId: string;
  deployment: DgameDeployment;
  isBusy: boolean;
  onClaimReward: (characterId: bigint) => void;
  playerId: string;
  setCharacterId: (value: string) => void;
};

export function CharacterPanel({
  characterId,
  deployment,
  isBusy,
  onClaimReward,
  playerId,
  setCharacterId,
}: CharacterPanelProps) {
  const parsedCharacterId = parsePositiveBigInt(characterId);
  const parsedPlayerId = parsePositiveBigInt(playerId);
  const character = useCharacterInfo(parsedCharacterId, { deployment });
  const purchase = usePlayerPurchase(parsedPlayerId, parsedCharacterId, { deployment });
  const relationLabel = `Player ${playerId || '-'} x Character ${characterId || '-'}`;

  return (
    <Section meta="IP NFT" title="Character">
      <div className={styles.formGrid}>
        <TextInput label="Character ID" onChange={setCharacterId} placeholder="0" value={characterId} />
      </div>

      <div className={styles.metricGroup}>
        <div className={styles.groupHeader}>
          <h3>Character asset</h3>
          <span>Global</span>
        </div>
        <div className={styles.metricGrid}>
          <Field label="CID" value={character.data?.metadata?.characterCID || '-'} />
          <Field label="Level" value={formatInteger(character.data?.tokenInfo?.level)} />
          <Field label="Score" value={formatInteger(character.data?.tokenInfo?.score)} />
          <Field label="Reward" value={formatTokenAmount(character.data?.rewardBalance)} />
        </div>
      </div>

      <div className={styles.metricGroup}>
        <div className={styles.groupHeader}>
          <h3>Player x Character position</h3>
          <span>{relationLabel}</span>
        </div>
        <div className={styles.metricGrid}>
          <Field label="Bought by player" value={formatInteger(purchase.data?.purchaseCount)} />
          <Field label="Spent by player" value={formatTokenAmount(purchase.data?.spent)} />
        </div>
      </div>

      <div className={styles.actions}>
        <ActionButton
          disabled={isBusy || parsedCharacterId === undefined || !deployment.merchantProxy}
          onClick={() => (parsedCharacterId !== undefined ? onClaimReward(parsedCharacterId) : undefined)}
          variant="primary"
        >
          Claim via merchant
        </ActionButton>
      </div>
    </Section>
  );
}
