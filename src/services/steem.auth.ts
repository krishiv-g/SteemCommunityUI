import * as secp from '@noble/secp256k1';
import { ripemd160 } from '@noble/hashes/ripemd160';
import bs58 from 'bs58';
import { steemRpc } from './steem.rpc';

/**
 * Check if Steem Keychain browser extension is available
 */
export function isKeychainAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.steem_keychain;
}

/**
 * Generate a timestamped login message
 */
export function generateLoginMessage(): string {
  return `Login to SteemDev ${Date.now()}`;
}

/**
 * Sign a message using Steem Keychain
 */
export function signWithKeychain(username: string, message: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.steem_keychain) {
      reject(new Error('Steem Keychain not available'));
      return;
    }
    window.steem_keychain.requestSignBuffer(username, message, 'Posting', (response) => {
      if (response.success) {
        resolve(response.result || '');
      } else {
        reject(new Error(response.error || response.message || 'Keychain signing failed'));
      }
    });
  });
}

/**
 * Decode a WIF (Wallet Import Format) private key to raw bytes
 */
function wifToPrivateKey(wif: string): Uint8Array {
  const decoded = bs58.decode(wif);
  return decoded.slice(1, 33);
}

/**
 * Encode a compressed public key to Steem's STM... format
 */
function publicKeyToSteem(pubKeyBytes: Uint8Array): string {
  const checksum = ripemd160(pubKeyBytes).slice(0, 4);
  const payload = new Uint8Array(pubKeyBytes.length + 4);
  payload.set(pubKeyBytes);
  payload.set(checksum, pubKeyBytes.length);
  return 'STM' + bs58.encode(payload);
}

/**
 * Verify a WIF posting key belongs to the given Steem account.
 * Keys never leave the browser.
 */
export async function verifyPostingKey(username: string, wif: string): Promise<boolean> {
  const rawAccounts = await steemRpc<any[]>('condenser_api.get_accounts', [[username]]);
  if (!rawAccounts || rawAccounts.length === 0) {
    throw new Error('Account not found on Steem blockchain');
  }

  const postingAuth = rawAccounts[0].posting;
  const accountPostingKeys: string[] = postingAuth.key_auths.map((k: [string, number]) => k[0]);

  try {
    const privKey = wifToPrivateKey(wif);
    const pubKey = secp.getPublicKey(privKey, true);
    const steemPubKey = publicKeyToSteem(pubKey);
    return accountPostingKeys.includes(steemPubKey);
  } catch {
    return false;
  }
}

/**
 * Register or update login via the backend API, returns JWT token
 */
export async function registerLogin(username: string): Promise<string> {
  const res = await fetch('/api/steem-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Login registration failed');
  }

  const data = await res.json();
  return data.token;
}
