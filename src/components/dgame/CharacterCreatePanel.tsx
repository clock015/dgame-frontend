import { useState } from 'react';
import { useAccount } from 'wagmi';

import type { DgameDeployment } from '../../contracts/addresses';
import { useContractOwner } from '../../hooks';
import styles from '../../styles/Dgame.module.css';
import { parsePositiveBigInt } from '../../utils/format';
import { ActionButton, Field, Section, TextInput } from './Primitives';

type CharacterCreatePanelProps = {
  deployment: DgameDeployment;
  isBusy: boolean;
  onCreateCharacter: (attributes: bigint, characterCID: string, name: string) => void;
};

function ownershipLabel(isLoading: boolean, isOwner: boolean) {
  if (isLoading) {
    return 'Checking';
  }

  return isOwner ? 'Yes' : 'No';
}

export function CharacterCreatePanel({
  deployment,
  isBusy,
  onCreateCharacter,
}: CharacterCreatePanelProps) {
  const { address } = useAccount();
  const [attributes, setAttributes] = useState('0');
  const [characterCID, setCharacterCID] = useState('');
  const [name, setName] = useState('');
  const parsedAttributes = parsePositiveBigInt(attributes);
  const characterOwner = useContractOwner('characterProxy', { deployment });
  const isCharacterOwner = Boolean(
    address &&
      typeof characterOwner.data === 'string' &&
      characterOwner.data.toLowerCase() === address.toLowerCase(),
  );
  const canCreate = Boolean(
    deployment.characterProxy &&
      parsedAttributes !== undefined &&
      characterCID.trim() &&
      name.trim() &&
      isCharacterOwner,
  );

  return (
    <Section meta="Owner" title="Create Character">
      <div className={styles.metricGrid}>
        <Field
          label="Current wallet owns Character"
          value={ownershipLabel(characterOwner.isLoading, isCharacterOwner)}
        />
        <Field label="Character contract" value={deployment.characterProxy ? 'Ready' : 'Not set'} />
      </div>

      <div className={styles.formGrid}>
        <TextInput
          label="Attributes"
          onChange={setAttributes}
          placeholder="0"
          value={attributes}
        />
        <TextInput
          label="Name"
          onChange={setName}
          placeholder="Hero name"
          value={name}
        />
        <TextInput
          label="Character CID"
          onChange={setCharacterCID}
          placeholder="ipfs://..."
          value={characterCID}
        />
      </div>

      <div className={styles.actions}>
        <ActionButton
          disabled={isBusy || !canCreate}
          onClick={() =>
            parsedAttributes !== undefined
              ? onCreateCharacter(parsedAttributes, characterCID.trim(), name.trim())
              : undefined
          }
          variant="primary"
        >
          Create character
        </ActionButton>
      </div>

      {!isCharacterOwner ? (
        <p className={styles.hint}>Only the Character contract owner can create characters.</p>
      ) : null}
    </Section>
  );
}
