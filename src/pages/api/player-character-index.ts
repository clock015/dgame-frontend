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
      const input = parseSyncPlayerCharacterInput(request.body);
      const result = await verifyPlayerCharacterHolding(input);

      if (result.holding) {
        await upsertPlayerCharacterHolding(result.holding);
      } else {
        await removePlayerCharacterHolding(input.playerId, input.characterId);
      }

      response.status(200).json(result);
      return;
    }

    response.setHeader('Allow', 'GET, POST');
    response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    sendError(response, 400, error);
  }
}
