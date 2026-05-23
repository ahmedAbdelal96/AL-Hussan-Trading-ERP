import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

type RequestWithId = Request & { id?: string };

/**
 * Injects/propagates correlation id for every request.
 * - Reuses inbound X-Request-ID when present
 * - Generates a new UUID when missing
 * - Exposes it to downstream handlers via request.id
 */
export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
) {
  const incoming = req.header('x-request-id') || req.header('X-Request-ID');
  const requestId =
    incoming && incoming.trim().length > 0 ? incoming : randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}
