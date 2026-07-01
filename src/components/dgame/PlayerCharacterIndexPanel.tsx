import {
  usePlayerCharacterHoldings,
  useRefreshPlayerCharacterHoldings,
  useSyncPlayerCharacterHolding,
} from '../../hooks';
import styles from '../../styles/Dgame.module.css';
import { formatTokenAmount, parsePositiveBigInt } from '../../utils/format';
import { ActionButton, Section } from './Primitives';

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
  const holdings = usePlayerCharacterHoldings(playerId);
  const refreshAll = useRefreshPlayerCharacterHoldings();
  const refreshOne = useSyncPlayerCharacterHolding();
  const normalizedPlayerId = parsePositiveBigInt(playerId)?.toString();
  const isRefreshing = refreshAll.isPending || refreshOne.isPending;

  return (
    <Section meta="Indexer" title="Player Characters">
      <div className={styles.actionsTop}>
        <ActionButton
          disabled={!normalizedPlayerId || refreshAll.isPending || !holdings.data?.length}
          onClick={() =>
            normalizedPlayerId ? refreshAll.mutate(normalizedPlayerId) : undefined
          }
        >
          Refresh all
        </ActionButton>
      </div>

      <div className={styles.holdingList}>
        {holdings.data?.length ? (
          holdings.data.map((holding) => (
            <div className={styles.holdingRow} key={`${holding.playerId}-${holding.characterId}`}>
              <div>
                <span>ID</span>
                <strong>#{holding.characterId}</strong>
              </div>
              <div>
                <span>Level</span>
                <strong>{holding.level ?? '-'}</strong>
              </div>
              <div>
                <span>Bought</span>
                <strong>{formatRawInteger(holding.purchaseCount)}</strong>
              </div>
              <div>
                <span>Spent</span>
                <strong>{formatRawTokenAmount(holding.spent)}</strong>
              </div>
              <ActionButton
                disabled={isRefreshing}
                onClick={() =>
                  refreshOne.mutate({
                    playerId: holding.playerId,
                    characterId: holding.characterId,
                    transactionHash: holding.transactionHash,
                  })
                }
              >
                Refresh
              </ActionButton>
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
      {refreshAll.error ? <p className={styles.warning}>{refreshAll.error.message}</p> : null}
      {refreshOne.error ? <p className={styles.warning}>{refreshOne.error.message}</p> : null}
    </Section>
  );
}
