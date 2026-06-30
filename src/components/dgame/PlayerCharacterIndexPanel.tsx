import { useMemo } from 'react';

import { usePlayerCharacterHoldings, useSyncPlayerCharacterHolding } from '../../hooks';
import styles from '../../styles/Dgame.module.css';
import { formatTokenAmount, parsePositiveBigInt } from '../../utils/format';
import { ActionButton, Field, Section } from './Primitives';

type PlayerCharacterIndexPanelProps = {
  characterId: string;
  playerId: string;
};

function formatRawTokenAmount(value: string | undefined) {
  if (value === undefined) {
    return '-';
  }

  return formatTokenAmount(BigInt(value));
}

function formatRawInteger(value: string | undefined) {
  if (value === undefined) {
    return '-';
  }

  return BigInt(value).toLocaleString();
}

export function PlayerCharacterIndexPanel({
  characterId,
  playerId,
}: PlayerCharacterIndexPanelProps) {
  const parsedPlayerId = parsePositiveBigInt(playerId);
  const parsedCharacterId = parsePositiveBigInt(characterId);
  const normalizedPlayerId = parsedPlayerId?.toString();
  const normalizedCharacterId = parsedCharacterId?.toString();
  const holdings = usePlayerCharacterHoldings(playerId);
  const syncHolding = useSyncPlayerCharacterHolding();
  const currentHolding = useMemo(() => {
    if (!normalizedCharacterId) {
      return undefined;
    }

    return holdings.data?.find(
      (holding) => holding.characterId === normalizedCharacterId,
    );
  }, [holdings.data, normalizedCharacterId]);
  const canSync = Boolean(normalizedPlayerId && normalizedCharacterId);

  return (
    <Section meta="Indexer" title="Player Characters">
      <div className={styles.metricGrid}>
        <Field label="Indexed characters" value={holdings.data?.length ?? '-'} />
        <Field
          label="Current character indexed"
          value={currentHolding ? 'Yes' : 'No'}
        />
      </div>

      <div className={styles.actions}>
        <ActionButton
          disabled={!canSync || syncHolding.isPending}
          onClick={() =>
            normalizedPlayerId && normalizedCharacterId
              ? syncHolding.mutate({
                  playerId: normalizedPlayerId,
                  characterId: normalizedCharacterId,
                })
              : undefined
          }
          variant="primary"
        >
          Sync current character
        </ActionButton>
      </div>

      <div className={styles.holdingList}>
        {holdings.data?.length ? (
          holdings.data.map((holding) => (
            <div className={styles.holdingRow} key={`${holding.playerId}-${holding.characterId}`}>
              <div>
                <span>Character</span>
                <strong>#{holding.characterId}</strong>
              </div>
              <div>
                <span>Bought</span>
                <strong>{formatRawInteger(holding.purchaseCount)}</strong>
              </div>
              <div>
                <span>Spent</span>
                <strong>{formatRawTokenAmount(holding.spent)}</strong>
              </div>
              <div>
                <span>Level / Score</span>
                <strong>
                  {holding.level ?? '-'} / {formatRawInteger(holding.score)}
                </strong>
              </div>
              <div>
                <span>Verified block</span>
                <strong>{holding.verifiedBlockNumber}</strong>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.hint}>
            {holdings.isLoading
              ? 'Loading indexed characters...'
              : 'No indexed characters for this player yet.'}
          </p>
        )}
      </div>

      {holdings.error ? <p className={styles.warning}>{holdings.error.message}</p> : null}
      {syncHolding.error ? <p className={styles.warning}>{syncHolding.error.message}</p> : null}
      {syncHolding.data?.removed ? (
        <p className={styles.hint}>The backend verified zero holding and removed this entry.</p>
      ) : null}
    </Section>
  );
}
