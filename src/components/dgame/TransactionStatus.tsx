import type { Hex } from 'viem';

import styles from '../../styles/Dgame.module.css';
import { formatAddress } from '../../utils/format';

export type TransactionSnapshot = {
  hash?: Hex;
  error?: Error | null;
  isPendingWallet: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
};

type TransactionStatusProps = {
  transaction: TransactionSnapshot;
};

export function TransactionStatus({ transaction }: TransactionStatusProps) {
  const label = transaction.isPendingWallet
    ? 'Confirm in wallet'
    : transaction.isConfirming
      ? 'Waiting for block'
      : transaction.isConfirmed
        ? 'Confirmed'
        : 'Idle';

  return (
    <div className={styles.transactionBar}>
      <div>
        <span>Status</span>
        <strong>{label}</strong>
      </div>
      <div>
        <span>Tx</span>
        <strong>{formatAddress(transaction.hash)}</strong>
      </div>
      {transaction.error ? <p>{transaction.error.message}</p> : null}
    </div>
  );
}
