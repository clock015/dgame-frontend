import { useState } from 'react';

import styles from '../../styles/Dgame.module.css';
import { formatAddress } from '../../utils/format';

type CopyableAddressProps = {
  address: string | undefined;
};

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

export function CopyableAddress({ address }: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copyAddress() {
    if (!address) {
      return;
    }

    try {
      await copyText(address);
      setCopied(true);
      setFailed(false);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setFailed(true);
      window.setTimeout(() => setFailed(false), 1600);
    }
  }

  return (
    <div className={styles.copyableAddress}>
      <strong title={address}>{formatAddress(address)}</strong>
      <button disabled={!address} onClick={copyAddress} type="button">
        {failed ? 'Failed' : copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
