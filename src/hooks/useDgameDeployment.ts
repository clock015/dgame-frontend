import { useMemo } from 'react';

import {
  type DgameContractKey,
  type DgameDeployment,
  listMissingAddresses,
  mergeDeployments,
} from '../contracts/addresses';

export type UseDgameDeploymentOptions = {
  deployment?: DgameDeployment;
  required?: DgameContractKey[];
};

export function useDgameDeployment(options: UseDgameDeploymentOptions = {}) {
  const deployment = useMemo(
    () => mergeDeployments(options.deployment),
    [options.deployment],
  );

  const missing = useMemo(
    () => listMissingAddresses(deployment, options.required ?? []),
    [deployment, options.required],
  );

  return {
    deployment,
    missing,
    isReady: missing.length === 0,
  };
}
