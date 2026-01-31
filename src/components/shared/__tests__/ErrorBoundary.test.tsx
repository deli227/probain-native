import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Suppress React error boundary console.error spam in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Component that throws on render
function ThrowingChild({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Child content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe content')).toBeDefined();
  });

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Une erreur est survenue')).toBeDefined();
    expect(screen.getByText(/Veuillez recharger l'application/)).toBeDefined();
    expect(screen.getByRole('button', { name: /Recharger/i })).toBeDefined();
  });

  it('auto-recovers when resetKey changes', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="/page-a">
        <ThrowingChild />
      </ErrorBoundary>
    );

    // Should show error state
    expect(screen.getByText('Une erreur est survenue')).toBeDefined();

    // Change resetKey to simulate navigation + provide non-throwing child
    rerender(
      <ErrorBoundary resetKey="/page-b">
        <div>Recovered content</div>
      </ErrorBoundary>
    );

    // Should render children again
    expect(screen.getByText('Recovered content')).toBeDefined();
  });

  it('does NOT recover when resetKey stays the same', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="/same">
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Une erreur est survenue')).toBeDefined();

    // Rerender with same resetKey and a non-throwing child
    rerender(
      <ErrorBoundary resetKey="/same">
        <div>Should not appear</div>
      </ErrorBoundary>
    );

    // Should still show error because resetKey didn't change
    expect(screen.getByText('Une erreur est survenue')).toBeDefined();
  });
});
