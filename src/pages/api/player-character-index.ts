import type { NextApiRequest, NextApiResponse } from 'next';

import {
  listPlayerCharacterHoldings,
  removePlayerCharacterHolding,
  upsertPlayerCharacterHolding,
} from '../../server/indexer/playerCharacterStore';
import {
  parsePlayerIdQuery,
  parseSyncPlayerCharacterInput,
  verifyPlayerCharacterHolding,
} from '../../server/indexer/playerCharacterVerifier';
import type { PlayerCharacterHolding } from '../../server/indexer/types';

type PlayerCharacterIndexResponse =
  | { holdings: PlayerCharacterHolding[] }
  | { holding?: PlayerCharacterHolding; removed: boolean }
  | { error: string };

function sendError(
  response: NextApiResponse<PlayerCharacterIndexResponse>,
  status: number,
  error: unknown,
) {
  response.status(status).json({
    error: error instanceof Error ? error.message : 'Unknown indexer error',
  });
}

async function applyVerifiedHolding(
  playerId: string,
  characterId: string,
  transactionHash?: string,
) {
  const result = await verifyPlayerCharacterHolding({
    playerId,
    characterId,
    transactionHash,
  });

  if (result.holding) {
    await upsertPlayerCharacterHolding(result.holding);
  } else {
    await removePlayerCharacterHolding(playerId, characterId);
  }

  return result;
}

async function refreshPlayerHoldings(playerId: string) {
  const existingHoldings = await listPlayerCharacterHoldings(playerId);

  for (const holding of existingHoldings) {
    await applyVerifiedHolding(playerId, holding.characterId, holding.transactionHash);
  }

  return listPlayerCharacterHoldings(playerId);
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<PlayerCharacterIndexResponse>,
) {
  try {
    if (request.method === 'GET') {
      const playerId = parsePlayerIdQuery(request.query.playerId);
      const holdings = await listPlayerCharacterHoldings(playerId);
      response.status(200).json({ holdings });
      return;
    }

    if (request.method === 'POST') {
      const action =
        typeof request.body?.action === 'string' ? request.body.action : 'sync';

      if (action === 'refreshPlayer') {
        const playerId = parsePlayerIdQuery(request.body?.playerId);
        const holdings = await refreshPlayerHoldings(playerId);
        response.status(200).json({ holdings });
        return;
      }

      const input = parseSyncPlayerCharacterInput(request.body);
      const result = await applyVerifiedHolding(
        input.playerId,
        input.characterId,
        input.transactionHash,
      );

      response.status(200).json(result);
      return;
    }

    response.setHeader('Allow', 'GET, POST');
    response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    sendError(response, 400, error);
  }
}
