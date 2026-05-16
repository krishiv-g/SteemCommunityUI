import { communityConfig } from '@/config/community';

async function tryNode<T>(node: string, method: string, params: Record<string, unknown> | unknown[]): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), communityConfig.rpcTimeout);

  try {
    const res = await fetch(node, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    if (json.error) throw new Error(json.error.message || 'RPC error');

    return json.result as T;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Fires all RPC nodes in parallel and returns the first successful response.
 * Falls back to sequential if Promise.any is unavailable (shouldn't happen in modern browsers).
 */
export async function steemRpc<T = unknown>(
  method: string,
  params: Record<string, unknown> | unknown[],
): Promise<T> {
  // Race all nodes; first to resolve wins
  const nodes = communityConfig.rpcNodes;
  return new Promise<T>((resolve, reject) => {
    let failCount = 0;
    for (const node of nodes) {
      tryNode<T>(node, method, params).then(resolve, () => {
        failCount++;
        if (failCount === nodes.length) {
          reject(new Error(`All RPC nodes failed for ${method}`));
        }
      });
    }
  });
}
