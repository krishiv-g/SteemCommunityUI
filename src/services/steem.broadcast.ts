import * as secp from '@noble/secp256k1';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import bs58 from 'bs58';
import { steemRpc } from './steem.rpc';

// Set up hashes for noble-secp256k1 v3 sync operations
secp.hashes.hmacSha256 = (key: Uint8Array, msg: Uint8Array) => hmac(sha256, key, msg);
secp.hashes.sha256 = (msg: Uint8Array) => sha256(msg);

const CHAIN_ID = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Decode a WIF (Wallet Import Format) private key to raw 32 bytes.
 */
function wifToPrivateKey(wif: string): Uint8Array {
  const decoded = bs58.decode(wif);
  return decoded.slice(1, 33);
}

/**
 * Get the stored posting key from sessionStorage (only for posting_key login).
 */
export function getStoredPostingKey(): string | null {
  try {
    return sessionStorage.getItem('hempire_posting_key');
  } catch {
    return null;
  }
}

export function storePostingKey(wif: string): void {
  sessionStorage.setItem('hempire_posting_key', wif);
}

export function clearPostingKey(): void {
  sessionStorage.removeItem('hempire_posting_key');
}

// ─── Binary serialization helpers ────────────────────────────────

function writeUint16(buf: number[], value: number) {
  buf.push(value & 0xff, (value >> 8) & 0xff);
}

function writeUint32(buf: number[], value: number) {
  buf.push(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
}

function writeInt16(buf: number[], value: number) {
  const unsigned = value < 0 ? value + 0x10000 : value;
  buf.push(unsigned & 0xff, (unsigned >> 8) & 0xff);
}

function writeVarint32(buf: number[], value: number) {
  while (value > 0x7f) {
    buf.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  buf.push(value & 0x7f);
}

function writeString(buf: number[], str: string) {
  const encoded = new TextEncoder().encode(str);
  writeVarint32(buf, encoded.length);
  for (const b of encoded) buf.push(b);
}

// ─── Transaction building ────────────────────────────────────────

interface DynamicGlobalProps {
  head_block_number: number;
  head_block_id: string;
  time: string;
}

async function getDynamicGlobalProperties(): Promise<DynamicGlobalProps> {
  return steemRpc<DynamicGlobalProps>('condenser_api.get_dynamic_global_properties', []);
}

function serializeCustomJsonOp(
  requiredPostingAuths: string[],
  id: string,
  json: string,
): number[] {
  const buf: number[] = [];
  writeVarint32(buf, 18); // custom_json operation id
  writeVarint32(buf, 0);  // required_auths (active key) — empty
  writeVarint32(buf, requiredPostingAuths.length);
  for (const auth of requiredPostingAuths) writeString(buf, auth);
  writeString(buf, id);
  writeString(buf, json);
  return buf;
}

function serializeVoteOp(voter: string, author: string, permlink: string, weight: number): number[] {
  const buf: number[] = [];
  writeVarint32(buf, 0); // vote operation id
  writeString(buf, voter);
  writeString(buf, author);
  writeString(buf, permlink);
  writeInt16(buf, weight);
  return buf;
}

function serializeCommentOp(
  parentAuthor: string,
  parentPermlink: string,
  author: string,
  permlink: string,
  title: string,
  body: string,
  jsonMetadata: string
): number[] {
  const buf: number[] = [];
  writeVarint32(buf, 1); // comment operation id
  writeString(buf, parentAuthor);
  writeString(buf, parentPermlink);
  writeString(buf, author);
  writeString(buf, permlink);
  writeString(buf, title);
  writeString(buf, body);
  writeString(buf, jsonMetadata);
  return buf;
}

function serializeCommentOptionsOp(
  author: string,
  permlink: string,
  maxAcceptedPayout: string,
  percentSteemDollars: number,
  allowVotes: boolean,
  allowCurationRewards: boolean,
  extensions: unknown[]
): number[] {
  const buf: number[] = [];
  writeVarint32(buf, 19); // comment_options operation id
  writeString(buf, author);
  writeString(buf, permlink);
  writeString(buf, maxAcceptedPayout); // asset string e.g. "1000000.000 SBD"
  writeUint16(buf, percentSteemDollars);
  buf.push(allowVotes ? 1 : 0);
  buf.push(allowCurationRewards ? 1 : 0);

  // extensions
  if (extensions.length === 0) {
    writeVarint32(buf, 0);
  } else {
    writeVarint32(buf, extensions.length);
    for (const ext of extensions) {
      const [extType, extData] = ext as [number, { beneficiaries: { account: string; weight: number }[] }];
      writeVarint32(buf, extType); // extension type (0 = beneficiaries)
      const bens = extData.beneficiaries;
      writeVarint32(buf, bens.length);
      for (const ben of bens) {
        writeString(buf, ben.account);
        writeUint16(buf, ben.weight);
      }
    }
  }
  return buf;
}

function serializeTransaction(
  refBlockNum: number,
  refBlockPrefix: number,
  expiration: number,
  operations: number[][],
): Uint8Array {
  const buf: number[] = [];
  writeUint16(buf, refBlockNum);
  writeUint32(buf, refBlockPrefix);
  writeUint32(buf, expiration);
  writeVarint32(buf, operations.length);
  for (const opBytes of operations) {
    buf.push(...opBytes);
  }
  writeVarint32(buf, 0); // extensions
  return new Uint8Array(buf);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Sign a transaction digest with the posting key.
 */
async function signDigest(digest: Uint8Array, wif: string): Promise<string> {
  const privKey = wifToPrivateKey(wif);
  // prehash: false — digest is already sha256(chainId + txBytes); don't double-hash
  const sig = secp.sign(digest, privKey, { lowS: true, prehash: false }) as Uint8Array;
  const sigRecovered = secp.sign(digest, privKey, { format: 'recovered', lowS: true, prehash: false }) as Uint8Array;
  const recoveryFlag = sigRecovered[0];
  const rHex = secp.etc.bytesToHex(sig.slice(0, 32));
  const sHex = secp.etc.bytesToHex(sig.slice(32, 64));
  const headerByte = (recoveryFlag + 31).toString(16).padStart(2, '0');
  return headerByte + rHex + sHex;
}

async function buildAndSign(operationByteArrays: number[][], wif: string) {
  const dgp = await getDynamicGlobalProperties();
  const refBlockNum = dgp.head_block_number & 0xffff;
  const blockIdBytes = hexToBytes(dgp.head_block_id);
  const refBlockPrefix = new DataView(blockIdBytes.buffer).getUint32(4, true);
  const expiration = Math.floor(new Date(dgp.time + 'Z').getTime() / 1000) + 60;

  const txBytes = serializeTransaction(refBlockNum, refBlockPrefix, expiration, operationByteArrays);

  const chainIdBytes = hexToBytes(CHAIN_ID);
  const message = new Uint8Array(chainIdBytes.length + txBytes.length);
  message.set(chainIdBytes);
  message.set(txBytes, chainIdBytes.length);
  const digest = sha256(message);

  const signature = await signDigest(digest, wif);

  return { refBlockNum, refBlockPrefix, expiration, signature };
}

/**
 * Broadcast a vote operation using a stored posting key.
 */
export async function broadcastVoteWithKey(
  voter: string,
  author: string,
  permlink: string,
  weight: number,
  wif: string
): Promise<void> {
  const opBytes = serializeVoteOp(voter, author, permlink, weight);
  const { refBlockNum, refBlockPrefix, expiration, signature } = await buildAndSign([opBytes], wif);

  const transaction = {
    ref_block_num: refBlockNum,
    ref_block_prefix: refBlockPrefix,
    expiration: new Date(expiration * 1000).toISOString().replace('.000Z', ''),
    operations: [['vote', { voter, author, permlink, weight }]],
    extensions: [],
    signatures: [signature],
  };

  await steemRpc('condenser_api.broadcast_transaction_synchronous', [transaction]);
}

/**
 * Generate a permlink from a title (slug)
 */
export function generatePermlink(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
  return slug || `post-${Date.now()}`;
}

/**
 * Broadcast a comment (post or reply) using posting key.
 */
export async function broadcastCommentWithKey(params: {
  parentAuthor: string;
  parentPermlink: string;
  author: string;
  permlink: string;
  title: string;
  body: string;
  jsonMetadata: string;
  beneficiaries?: { account: string; weight: number }[];
  wif: string;
}): Promise<void> {
  const {
    parentAuthor, parentPermlink, author, permlink, title, body,
    jsonMetadata, beneficiaries, wif
  } = params;

  const commentOpBytes = serializeCommentOp(parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata);

  const allOpBytes = [commentOpBytes];
  const operations: [string, Record<string, unknown>][] = [
    ['comment', { parent_author: parentAuthor, parent_permlink: parentPermlink, author, permlink, title, body, json_metadata: jsonMetadata }],
  ];

  // Add comment_options with beneficiaries if any
  if (beneficiaries && beneficiaries.length > 0) {
    const extensions: [number, { beneficiaries: { account: string; weight: number }[] }][] = [
      [0, { beneficiaries }],
    ];
    const commentOptionsBytes = serializeCommentOptionsOp(
      author, permlink, '1000000.000 SBD', 10000, true, true, extensions
    );
    allOpBytes.push(commentOptionsBytes);
    operations.push(['comment_options', {
      author,
      permlink,
      max_accepted_payout: '1000000.000 SBD',
      percent_steem_dollars: 10000,
      allow_votes: true,
      allow_curation_rewards: true,
      extensions,
    }]);
  }

  const { refBlockNum, refBlockPrefix, expiration, signature } = await buildAndSign(allOpBytes, wif);

  const transaction = {
    ref_block_num: refBlockNum,
    ref_block_prefix: refBlockPrefix,
    expiration: new Date(expiration * 1000).toISOString().replace('.000Z', ''),
    operations,
    extensions: [],
    signatures: [signature],
  };

  await steemRpc('condenser_api.broadcast_transaction_synchronous', [transaction]);
}

/**
 * Broadcast a comment (post or reply) using Keychain.
 */
export function broadcastCommentWithKeychain(params: {
  parentAuthor: string;
  parentPermlink: string;
  author: string;
  permlink: string;
  title: string;
  body: string;
  jsonMetadata: string;
  beneficiaries?: { account: string; weight: number }[];
}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.steem_keychain) {
      reject(new Error('Steem Keychain not available'));
      return;
    }

    const {
      parentAuthor, parentPermlink, author, permlink, title, body,
      jsonMetadata, beneficiaries
    } = params;

    const operations: [string, Record<string, unknown>][] = [
      ['comment', {
        parent_author: parentAuthor,
        parent_permlink: parentPermlink,
        author,
        permlink,
        title,
        body,
        json_metadata: jsonMetadata,
      }],
    ];

    if (beneficiaries && beneficiaries.length > 0) {
      operations.push(['comment_options', {
        author,
        permlink,
        max_accepted_payout: '1000000.000 SBD',
        percent_steem_dollars: 10000,
        allow_votes: true,
        allow_curation_rewards: true,
        extensions: [[0, { beneficiaries }]],
      }]);
    }

    window.steem_keychain.requestBroadcast(author, operations, 'Posting', (response) => {
      if (response.success) {
        resolve();
      } else {
        reject(new Error(response.error || response.message || 'Broadcast failed'));
      }
    });
  });
}

/**
 * Broadcast a custom_json operation using a posting key.
 */
export async function broadcastCustomJsonWithKey(
  account: string,
  id: string,
  json: string,
  wif: string,
): Promise<void> {
  const opBytes = serializeCustomJsonOp([account], id, json);
  const { refBlockNum, refBlockPrefix, expiration, signature } = await buildAndSign([opBytes], wif);

  const transaction = {
    ref_block_num: refBlockNum,
    ref_block_prefix: refBlockPrefix,
    expiration: new Date(expiration * 1000).toISOString().replace('.000Z', ''),
    operations: [['custom_json', {
      required_auths: [],
      required_posting_auths: [account],
      id,
      json,
    }]],
    extensions: [],
    signatures: [signature],
  };

  await steemRpc('condenser_api.broadcast_transaction_synchronous', [transaction]);
}

/**
 * Broadcast a custom_json operation using Keychain.
 * Returns a Promise that resolves only on user approval — rejects on cancel/denial.
 */
export function broadcastCustomJsonWithKeychain(
  account: string,
  id: string,
  json: string,
  displayTitle?: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.steem_keychain) {
      reject(new Error('Steem Keychain not available'));
      return;
    }
    (window.steem_keychain as any).requestCustomJson(
      account,
      id,
      'Posting',
      json,
      displayTitle || id,
      (response: any) => {
        if (response.success) resolve();
        else reject(new Error(response.error || response.message || 'Broadcast cancelled'));
      },
    );
  });
}
