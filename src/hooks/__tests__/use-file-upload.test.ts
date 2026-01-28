import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules BEFORE importing
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock crypto.randomUUID with Object.defineProperty
Object.defineProperty(global, 'crypto', {
  value: {
    ...global.crypto,
    randomUUID: () => 'test-uuid-123',
  },
  writable: true,
  configurable: true,
});

// NOW import after mocking
import { useFileUpload } from '../use-file-upload';
import { supabase } from '@/integrations/supabase/client';

describe('useFileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/test.pdf' }
    });

    const mockUpload = vi.fn().mockResolvedValue({
      data: { path: 'test-uuid-123-test.pdf' },
      error: null,
    });

    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    } as any);
  });

  it('initialise avec status idle', () => {
    const { result } = renderHook(() => useFileUpload({
      maxSize: 20 * 1024 * 1024,
      acceptedTypes: ['application/pdf']
    }));

    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.progress).toBe(0);
  });

  it('upload un fichier avec succès', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useFileUpload({
      maxSize: 20 * 1024 * 1024,
      acceptedTypes: ['application/pdf'],
      onSuccess
    }));

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.handleFile(file);
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('success');
    });

    expect(result.current.state.progress).toBe(100);
    expect(result.current.state.fileUrl).toBe('https://example.com/test.pdf');
    expect(onSuccess).toHaveBeenCalledWith(file, 'https://example.com/test.pdf');
  });

  it('rejette les fichiers trop grands', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useFileUpload({
      maxSize: 1024, // 1KB max
      acceptedTypes: ['application/pdf'],
      onError
    }));

    const file = new File(['a'.repeat(2000)], 'large.pdf', { type: 'application/pdf' });

    await act(async () => {
      await result.current.handleFile(file);
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('error');
    });

    expect(result.current.state.error).toContain('ne doit pas dépasser');
    expect(onError).toHaveBeenCalled();
  });
});
