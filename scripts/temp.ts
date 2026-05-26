import http from 'http';
import https from 'https';
import fs from 'fs';
import { AccountManager } from '../core/src/plugin/accounts';
import { refreshAccessToken } from '../core/src/plugin/token';

const PORT = 8080;
const HOST = '127.0.0.1';

let accountManager;
let currentAccessToken = null;
let currentAccountEmail = null;
let tokenExpiresAt = 0;

function logDebug(msg) {
  try {
    fs.appendFileSync('C:\\Users\\finn\\.claude\\proxy-debug.log', [] \n);
  } catch (e) {}
}

async function getAccessToken() {
  if (!accountManager) {
    accountManager = await AccountManager.loadFromDisk();
  }

  // Reload disk state periodically or just use in-memory state
  
  if (currentAccessToken && Date.now() < tokenExpiresAt) {
    return { token: currentAccessToken, email: currentAccountEmail };
  }

  const { account } = await accountManager.getAvailableAccount("claude", "sequential");
  
  if (!account) {
    throw new Error('All accounts are either disabled or cooling down from rate limits!');
  }

  // Now we need to refresh the token using core token utility
  // refreshAccessToken expects OAuthAuthDetails and a dummy client
  try {
    const newAuth = await refreshAccessToken(account, { sendRequest: async () => ({}) } as any);
    currentAccessToken = newAuth.accessToken;
    currentAccountEmail = account.email;
    tokenExpiresAt = newAuth.expiresAt || Date.now() + 3500 * 1000;
    
    // update storage with new access token if necessary
    // accountManager.save() or something?
    
    return { token: currentAccessToken, email: currentAccountEmail };
  } catch (err) {
    logDebug('Token refresh failed for ' + account.email + ': ' + err.message);
    accountManager.reportRateLimit(account.email, "SERVER_ERROR");
    return getAccessToken(); // Try next account
  }
}
