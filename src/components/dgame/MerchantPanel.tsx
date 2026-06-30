import { useState } from 'react';

import type { DgameDeployment } from '../../contracts/addresses';
import { useMerchantSummary } from '../../hooks';
import styles from '../../styles/Dgame.module.css';
import { formatAddress, formatTokenAmount, parseTokenUnits } from '../../utils/format';
import { ActionButton, Field, Section, TextInput } from './Primitives';

type MerchantPanelProps = {
  deployment: DgameDeployment;
  isBusy: boolean;
  onApproveOwnerAsset: (amount: bigint) => void;
  onClaimOwnerSales: () => void;
  onDepositOwnerBalance: (amount: bigint) => void;
  onRegisterMerchant: (amount: bigint) => void;
};

export function MerchantPanel({
  deployment,
  isBusy,
  onApproveOwnerAsset,
  onClaimOwnerSales,
  onDepositOwnerBalance,
  onRegisterMerchant,
}: MerchantPanelProps) {
  const [amount, setAmount] = useState('100');
  const parsedAmount = parseTokenUnits(amount);
  const merchant = useMerchantSummary({ deployment });
  const hasAmount = parsedAmount !== undefined && parsedAmount > 0n;

  return (
    <Section meta="Owner ledger" title="Merchant">
      <div className={styles.formGrid}>
        <TextInput label="Owner amount" onChange={setAmount} placeholder="100" value={amount} />
      </div>

      <div className={styles.metricGrid}>
        <Field label="Owner balance" value={formatTokenAmount(merchant.data?.ownerBalance)} />
        <Field label="Business" value={formatAddress(merchant.data?.business)} />
        <Field label="Market" value={formatAddress(merchant.data?.market)} />
        <Field label="Underlying" value={formatAddress(merchant.data?.underlying)} />
      </div>

      <div className={styles.actions}>
        <ActionButton disabled={isBusy} onClick={onClaimOwnerSales} variant="primary">
          Claim sales
        </ActionButton>
        <ActionButton
          disabled={isBusy || !hasAmount || !deployment.merchantProxy}
          onClick={() => (hasAmount ? onApproveOwnerAsset(parsedAmount) : undefined)}
        >
          Approve merchant
        </ActionButton>
        <ActionButton
          disabled={isBusy || !hasAmount}
          onClick={() => (hasAmount ? onDepositOwnerBalance(parsedAmount) : undefined)}
        >
          Deposit owner balance
        </ActionButton>
        <ActionButton
          disabled={isBusy || !hasAmount}
          onClick={() => (hasAmount ? onRegisterMerchant(parsedAmount) : undefined)}
        >
          Register
        </ActionButton>
      </div>

      <p className={styles.hint}>
        Register spends owner balance. To add owner balance, approve the merchant first, then deposit.
      </p>
    </Section>
  );
}
