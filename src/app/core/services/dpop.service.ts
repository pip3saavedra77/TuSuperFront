import { Injectable } from '@angular/core';

interface DpopJwk {
  kty: string;
  crv: string;
  x: string;
  y: string;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
}

function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i);
  }
  return buf;
}

@Injectable({ providedIn: 'root' })
export class DpopService {
  private keyPair: CryptoKeyPair | null = null;
  private publicJwk: DpopJwk | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.keyPair = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign', 'verify'],
      );
      const rawPublic = await crypto.subtle.exportKey('jwk', this.keyPair.publicKey);
      this.publicJwk = {
        kty: rawPublic.kty as string,
        crv: rawPublic.crv as string,
        x: rawPublic.x as string,
        y: rawPublic.y as string,
      };
      this.initialized = true;
    } catch {
      this.initialized = false;
    }
  }

  getPublicJwk(): DpopJwk | null {
    return this.publicJwk;
  }

  getPublicJwkBase64(): string | null {
    if (!this.publicJwk) return null;
    const json = JSON.stringify(this.publicJwk);
    return btoa(json);
  }

  isReady(): boolean {
    return this.initialized && this.keyPair !== null;
  }

  async signProof(
    method: string,
    url: string,
    accessToken?: string,
  ): Promise<string | null> {
    if (!this.keyPair || !this.initialized) return null;

    const jti = crypto.randomUUID();
    const iat = Math.floor(Date.now() / 1000);
    const htu = url.split('?')[0];

    const header = { alg: 'ES256', typ: 'dpop+jwt' };
    const payload: Record<string, unknown> = { jti, htm: method, htu, iat };
    if (accessToken) {
      const athBytes = await crypto.subtle.digest('SHA-256', str2ab(accessToken));
      payload['ath'] = base64UrlEncode(athBytes);
    }

    const headerB64 = base64UrlEncode(str2ab(JSON.stringify(header)));
    const payloadB64 = base64UrlEncode(str2ab(JSON.stringify(payload)));
    const signingInput = `${headerB64}.${payloadB64}`;

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      this.keyPair.privateKey,
      str2ab(signingInput),
    );

    const signatureB64 = base64UrlEncode(signature);
    return `${signingInput}.${signatureB64}`;
  }
}
