import type { DgameDeployment } from '../../contracts/addresses';
import styles from '../../styles/Dgame.module.css';
import { CopyableAddress } from './CopyableAddress';
import { Field, Section } from './Primitives';

const addressRows: Array<[keyof DgameDeployment, string]> = [
  ['asset', 'Asset'],
  ['onMarket', 'onMarket'],
  ['characterProxy', 'Character'],
  ['merchantProxy', 'Merchant'],
  ['marketProxy', 'Market'],
  ['gachaPoolProxy', 'Gacha pool'],
];

type DeploymentPanelProps = {
  deployment: DgameDeployment;
  missing: string[];
};

export function DeploymentPanel({ deployment, missing }: DeploymentPanelProps) {
  return (
    <Section
      meta={deployment.usingMockMarket ? 'Mock onMarket' : 'External onMarket'}
      title="Deployment"
    >
      <div className={styles.addressGrid}>
        {addressRows.map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={<CopyableAddress address={deployment[key]?.toString()} />}
          />
        ))}
      </div>
      {missing.length > 0 ? (
        <p className={styles.warning}>Missing addresses: {missing.join(', ')}</p>
      ) : null}
    </Section>
  );
}
