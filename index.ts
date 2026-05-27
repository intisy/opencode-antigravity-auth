import { AntigravityCLIOAuthPlugin, GoogleOAuthPlugin } from "./src/plugin";

export { AntigravityCLIOAuthPlugin, GoogleOAuthPlugin };

export {
  authorizeAntigravity,
  exchangeAntigravity,
} from "./core/src/antigravity/oauth";

export type {
  AntigravityAuthorization,
  AntigravityTokenExchangeResult,
} from "./core/src/antigravity/oauth";

export default AntigravityCLIOAuthPlugin;

export const server = AntigravityCLIOAuthPlugin;
