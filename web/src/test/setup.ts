import '@testing-library/jest-dom/vitest';

// Mock window.alert
if (typeof window !== 'undefined') {
  window.alert = (msg: string) => {
    console.log('[Alert Mock]:', msg);
  };

  // Mock navigator.clipboard
  Object.assign(navigator, {
    clipboard: {
      writeText: async (text: string) => text,
    },
  });
}

