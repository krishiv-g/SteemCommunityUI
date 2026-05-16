interface SteemKeychainResponse {
  success: boolean;
  error?: string;
  result?: string;
  message?: string;
  data?: {
    key: string;
    message: string;
    method: string;
    request_id: number;
    type: string;
    username: string;
  };
  publicKey?: string;
}

interface SteemKeychain {
  requestSignBuffer: (
    username: string,
    message: string,
    keyType: 'Posting' | 'Active' | 'Memo',
    callback: (response: SteemKeychainResponse) => void,
    rpc?: string
  ) => void;
  requestBroadcast: (
    username: string,
    operations: [string, Record<string, unknown>][],
    keyType: 'Posting' | 'Active',
    callback: (response: SteemKeychainResponse) => void
  ) => void;
  requestCustomJson: (
    username: string,
    id: string,
    keyType: 'Posting' | 'Active',
    json: string,
    display_msg: string,
    callback: (response: SteemKeychainResponse) => void
  ) => void;
}

interface Window {
  steem_keychain?: SteemKeychain;
}
