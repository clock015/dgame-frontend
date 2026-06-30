import { useMemo, useState } from 'react';

import type { DgameDeployment } from '../../contracts/addresses';
import { useGachaRollSummaries, usePlayerGachaRequests } from '../../hooks';
import styles from '../../styles/Dgame.module.css';
import { formatAddress, parsePositiveBigInt } from '../../utils/format';
import { ActionButton, Field, Section, TextInput } from './Primitives';

type GachaRequestsPanelProps = {
  deployment: DgameDeployment;
  isBusy: boolean;
  onResolveRoll: (requestId: bigint) => void;
  playerId: string;
};

function formatRollStatus(status: string | undefined, rawStatus: number | undefined) {
  if (!status) {
    return 'Loading';
  }

  if (status === 'requested') {
    return 'Pending';
  }

  if (status === 'resolved') {
    return 'Resolved';
  }

  return rawStatus === undefined ? 'Unknown' : `Unknown (${rawStatus})`;
}

export function GachaRequestsPanel({
  deployment,
  isBusy,
  onResolveRoll,
  playerId,
}: GachaRequestsPanelProps) {
  const [blockLookbackInput, setBlockLookbackInput] = useState('500');
  const parsedPlayerId = parsePositiveBigInt(playerId);
  const parsedBlockLookback = parsePositiveBigInt(blockLookbackInput) ?? 500n;
  const requests = usePlayerGachaRequests({
    blockLookback: parsedBlockLookback,
    deployment,
    playerId: parsedPlayerId,
  });
  const requestIds = useMemo(
    () => requests.data?.map((request) => request.requestId) ?? [],
    [requests.data],
  );
  const rollSummaries = useGachaRollSummaries(requestIds, { deployment });

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
            const isResolved = roll?.status === 'resolved';

            return (
              <div className={styles.eventRow} key={`${request.transactionHash}-${request.requestId}`}>
                <div>
                  <span>Request #{request.requestId.toString()}</span>
                  <strong>Batch {request.batchId.toString()}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{formatRollStatus(roll?.status, roll?.rawStatus)}</strong>
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
      {rollSummaries.error ? <p className={styles.warning}>{rollSummaries.error.message}</p> : null}
    </Section>
  );
}
