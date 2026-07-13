import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    service = new TokenService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('set / get', () => {
    it('should store a token in localStorage', () => {
      service.set('my-token', false);
      expect(service.get()).toBe('my-token');
    });

    it('should set persistence flag when persistent is true', () => {
      service.set('t', true);
      expect(service.isPersistent()).toBe(true);
    });

    it('should set persistence flag to false when persistent is false', () => {
      service.set('t', false);
      expect(service.isPersistent()).toBe(false);
    });
  });

  describe('setRefreshToken / getRefreshToken', () => {
    it('should store and retrieve a refresh token', () => {
      service.setRefreshToken('refresh-123');
      expect(service.getRefreshToken()).toBe('refresh-123');
    });
  });

  describe('clear', () => {
    it('should remove all stored tokens', () => {
      service.set('token', true);
      service.setRefreshToken('refresh');
      service.clear();
      expect(service.get()).toBeNull();
      expect(service.getRefreshToken()).toBeNull();
      expect(service.isPersistent()).toBe(false);
    });
  });

  describe('get', () => {
    it('should return null when no token is stored', () => {
      expect(service.get()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return null when no refresh token is stored', () => {
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('isPersistent', () => {
    it('should return false when no persistence flag is set', () => {
      expect(service.isPersistent()).toBe(false);
    });
  });
});
