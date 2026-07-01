import { useEffect, useMemo, useState } from 'react';

import type { DgameDeployment } from '../../contracts/addresses';
import {
  useAutoSyncPlayerCharacterHoldings,
  useGachaBatchSummaries,
  useGachaRollSummaries,
  usePlayerGachaRequests,
  usePlayerGachaResolvedEvents,
} from '../../hooks';
import styles from '../../styles/Dgame.module.css';
import { formatAddress, parsePositiveBigInt } from '../../utils/format';
import { ActionButton, Field, Section, TextInput } from './Primitives';

type GachaRequestsPanelProps = {
  deployment: DgameDeployment;
  isBusy: boolean;
  onResolveRoll: (requestId: bigint) => void;
  playerId: string;
  refreshKey?: string;
};

function formatRollStatus(
  status: string | undefined,
  rawStatus: number | undefined,
  batchCommitted: boolean | undefined,
) {
  if (!status) {
    return 'Loading';
  }

  if (status === 'requested') {
    return batchCommitted ? 'Committed' : 'Pending';
  }

  if (status === 'resolved') {
    return 'Resolved';
  }

  return rawStatus === undefined ? 'Unknown' : `Unknown (${rawStatus})`;
}

function uniqueBigInts(values: bigint[]) {
  return [...new Map(values.map((value) => [value.toString(), value])).values()];
}

export function GachaRequestsPanel({
  deployment,
  isBusy,
  onResolveRoll,
  playerId,
  refreshKey,
}: GachaRequestsPanelProps) {
  const [blockLookbackInput, setBlockLookbackInput] = useState('500');
  const parsedPlayerId = parsePositiveBigInt(playerId);
  const parsedBlockLookback = parsePositiveBigInt(blockLookbackInput) ?? 500n;
  const requests = usePlayerGachaRequests({
    blockLookback: parsedBlockLookback,
    deployment,
    playerId: parsedPlayerId,
  });
  const resolvedEvents = usePlayerGachaResolvedEvents({
    blockLookback: parsedBlockLookback,
    deployment,
    playerId: parsedPlayerId,
  });
  const requestIds = useMemo(
    () =>
      uniqueBigInts([
        ...(requests.data?.map((request) => request.requestId) ?? []),
        ...(resolvedEvents.data?.map((event) => event.requestId) ?? []),
      ]),
    [requests.data, resolvedEvents.data],
  );
  const rollSummaries = useGachaRollSummaries(requestIds, { deployment });
  const batchIds = useMemo(
    () =>
      uniqueBigInts(
        Object.values(rollSummaries.data ?? {}).map((roll) => roll.batchId),
      ),
    [rollSummaries.data],
  );
  const batchSummaries = useGachaBatchSummaries(batchIds, { deployment });
  const resolvedSyncHints = useMemo(
    () =>
      resolvedEvents.data?.flatMap((event) => {
        const roll = rollSummaries.data?.[event.requestId.toString()];

        if (!roll || roll.status !== 'resolved') {
          return [];
        }

        return [
          {
            sourceId: `gacha-resolved:${event.requestId.toString()}`,
            playerId: roll.playerId.toString(),
            characterId: roll.characterId.toString(),
            transactionHash: event.transactionHash,
          },
        ];
      }) ?? [],
    [resolvedEvents.data, rollSummaries.data],
  );
  const autoSync = useAutoSyncPlayerCharacterHoldings(resolvedSyncHints);
  const refetchRequests = requests.refetch;
  const refetchResolvedEvents = resolvedEvents.refetch;
  const refetchRollSummaries = rollSummaries.refetch;
  const refetchBatchSummaries = batchSummaries.refetch;

  useEffect(() => {
    if (!refreshKey) {
      return;
    }

    refetchRequests();
    refetchResolvedEvents();
    refetchRollSummaries();
    refetchBatchSummaries();
  }, [
    refreshKey,
    refetchRequests,
    refetchResolvedEvents,
    refetchRollSummaries,
    refetchBatchSummaries,
  ]);

  return (
    <Section meta="Event history" title="Gacha Requests">
      <div className={styles.formGrid}>
        <TextInput
          label="Recent blocks"
          onChange={setBlockLookbackInput}
          placeholder="500"
          value={blockLookbackInput}
        />
      </div>

      <div className={styles.metricGrid}>
        <Field label="Player ID" value={playerId || '-'} />
        <Field label="Requests found" value={requests.data?.length ?? '-'} />
      </div>

      <div className={styles.eventList}>
        {requests.data?.length ? (
          requests.data.map((request) => {
            const roll = rollSummaries.data?.[request.requestId.toString()];
            const batch = roll ? batchSummaries.data?.[roll.batchId.toString()] : undefined;
            const isResolved = roll?.status === 'resolved';

            return (
              <div className={styles.eventRow} key={`${request.transactionHash}-${request.requestId}`}>
                <div>
                  <span>Request #{request.requestId.toString()}</span>
                  <strong>Batch {request.batchId.toString()}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{formatRollStatus(roll?.status, roll?.rawStatus, batch?.committed)}</strong>
                </div>
                <div>
                  <span>Block</span>
                  <strong>{request.blockNumber.toString()}</strong>
                </div>
                <div>
                  <span>Tx</span>
                  <strong>{formatAddress(request.transactionHash)}</strong>
                </div>
                <ActionButton disabled={isBusy || isResolved} onClick={() => onResolveRoll(request.requestId)}>
                  {isResolved ? 'Done' : 'Resolve'}
                </ActionButton>
              </div>
            );
          })
        ) : (
          <p className={styles.hint}>
            {requests.isLoading ? 'Loading request events...' : 'No recent requests for this player.'}
          </p>
        )}
      </div>

      {requests.error ? <p className={styles.warning}>{requests.error.message}</p> : null}
      {resolvedEvents.error ? <p className={styles.warning}>{resolvedEvents.error.message}</p> : null}
      {rollSummaries.error ? <p className={styles.warning}>{rollSummaries.error.message}</p> : null}
      {batchSummaries.error ? <p className={styles.warning}>{batchSummaries.error.message}</p> : null}
      {autoSync.error ? <p className={styles.warning}>{autoSync.error.message}</p> : null}
    </Section>
  );
}
