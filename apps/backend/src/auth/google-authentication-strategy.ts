import {
  AuthenticationStrategy,
  ExternalAuthenticationService,
  Injector,
  RequestContext,
  User,
} from '@vendure/core';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import gql from 'graphql-tag';

type GoogleAuthenticationData = {
  token?: string | null;
  code?: string | null;
  redirectUri?: string | null;
};

type ResolveIdTokenResult =
  | { idToken: string }
  | { error: string };

export class GoogleAuthenticationStrategy implements AuthenticationStrategy<GoogleAuthenticationData> {
  readonly name = 'google';

  private externalAuthenticationService!: ExternalAuthenticationService;

  async init(injector: Injector) {
    this.externalAuthenticationService = injector.get(ExternalAuthenticationService);
  }

  defineInputType() {
    return gql`
      input GoogleAuthInput {
        token: String
        code: String
        redirectUri: String
      }
    `;
  }

  async authenticate(ctx: RequestContext, data: GoogleAuthenticationData): Promise<User | false | string> {
    const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!googleClientId) {
      return 'Google authentication is not configured on the server.';
    }

    const tokenResult = await this.resolveIdToken(data, googleClientId);
    if ('error' in tokenResult) {
      return tokenResult.error;
    }

    const verifier = new OAuth2Client(googleClientId);

    let payload: TokenPayload | undefined;
    try {
      const ticket = await verifier.verifyIdToken({
        idToken: tokenResult.idToken,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      return 'Google token verification failed.';
    }

    const externalIdentifier = payload?.sub?.trim();
    const emailAddress = payload?.email?.trim().toLowerCase();

    if (!externalIdentifier || !emailAddress) {
      return 'Google account did not include a usable identifier or email address.';
    }

    const existingUser = await this.externalAuthenticationService.findCustomerUser(
      ctx,
      this.name,
      externalIdentifier,
      false,
    );

    if (existingUser) {
      return existingUser;
    }

    const { firstName, lastName } = splitName(payload?.name, payload?.given_name, payload?.family_name);

    return this.externalAuthenticationService.createCustomerAndUser(ctx, {
      strategy: this.name,
      externalIdentifier,
      emailAddress,
      firstName,
      lastName,
      verified: payload?.email_verified === true,
    });
  }

  private async resolveIdToken(
    data: GoogleAuthenticationData,
    googleClientId: string,
  ): Promise<ResolveIdTokenResult> {
    const directToken = data.token?.trim();
    if (directToken) {
      return { idToken: directToken };
    }

    const authCode = data.code?.trim();
    if (!authCode) {
      return { error: 'Missing Google token or authorization code.' };
    }

    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    if (!googleClientSecret) {
      return { error: 'GOOGLE_CLIENT_SECRET is not configured on the server.' };
    }

    const redirectUri = data.redirectUri?.trim() || process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
    if (!redirectUri) {
      return { error: 'Google redirect URI is not configured on the server.' };
    }

    try {
      const oauthClient = new OAuth2Client(googleClientId, googleClientSecret, redirectUri);
      const { tokens } = await oauthClient.getToken({
        code: authCode,
        redirect_uri: redirectUri,
      });

      const idToken = tokens.id_token?.trim();
      if (!idToken) {
        return { error: 'Google did not return an ID token.' };
      }

      return { idToken };
    } catch {
      return { error: 'Failed to exchange Google authorization code.' };
    }
  }
}

function splitName(name?: string | null, givenName?: string | null, familyName?: string | null) {
  const firstNameFromGiven = givenName?.trim();
  const lastNameFromFamily = familyName?.trim();

  if (firstNameFromGiven) {
    return {
      firstName: firstNameFromGiven,
      lastName: lastNameFromFamily || '',
    };
  }

  const normalized = (name || '').trim();
  if (!normalized) {
    return {
      firstName: 'Customer',
      lastName: '',
    };
  }

  const parts = normalized.split(/\s+/);
  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: '',
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}
