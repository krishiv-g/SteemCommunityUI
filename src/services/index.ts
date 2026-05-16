import { steemApi } from './steem.api';
import type { ApiService } from './api.interface';

// Use real Steem blockchain API
export const api: ApiService = steemApi;
