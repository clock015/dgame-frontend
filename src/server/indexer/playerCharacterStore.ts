import { mkdir, readFile, rename, rm, writeFile } from 'fs/promises';
import path from 'path';

import type {
  PlayerCharacterHolding,
  PlayerCharacterIndexSnapshot,
} from './types';

const storeDir = path.join(process.cwd(), '.dgame-indexer');
const storeFile = path.join(storeDir, 'player-character-holdings.json');
function createEmptySnapshot(): PlayerCharacterIndexSnapshot {
  return {
    version: 1,
    holdings: {},
  };
}

function holdingKey(playerId: string, characterId: string) {
  return `${playerId}:${characterId}`;
}

async function ensureStoreDir() {
  await mkdir(storeDir, { recursive: true });
}

async function readSnapshot(): Promise<PlayerCharacterIndexSnapshot> {
  try {
    const raw = await readFile(storeFile, 'utf8');
    const parsed = JSON.parse(raw) as PlayerCharacterIndexSnapshot;

    if (parsed.version !== 1 || !parsed.holdings) {
      return createEmptySnapshot();
    }

    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return createEmptySnapshot();
    }

    throw error;
  }
}

async function writeSnapshot(snapshot: PlayerCharacterIndexSnapshot) {
  await ensureStoreDir();

  const tempFile = `${storeFile}.${process.pid}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  try {
    await rename(tempFile, storeFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }

    await rm(storeFile, { force: true });
    await rename(tempFile, storeFile);
  }
}

export async function listPlayerCharacterHoldings(playerId: string) {
  const snapshot = await readSnapshot();

  return Object.values(snapshot.holdings)
    .filter((holding) => holding.playerId === playerId)
    .sort((left, right) => {
      const leftId = BigInt(left.characterId);
      const rightId = BigInt(right.characterId);

      if (leftId === rightId) {
        return 0;
      }

      return leftId < rightId ? -1 : 1;
    });
}

export async function upsertPlayerCharacterHolding(holding: PlayerCharacterHolding) {
  const snapshot = await readSnapshot();
  snapshot.holdings[holdingKey(holding.playerId, holding.characterId)] = holding;
  await writeSnapshot(snapshot);

  return holding;
}

export async function removePlayerCharacterHolding(playerId: string, characterId: string) {
  const snapshot = await readSnapshot();
  delete snapshot.holdings[holdingKey(playerId, characterId)];
  await writeSnapshot(snapshot);
}


