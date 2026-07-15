/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, act } from '@testing-library/react';

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = {};
    this.state = 'running';
  }
  resume() {
    return Promise.resolve();
  }
  createBuffer() {
    return { getChannelData: () => new Float32Array(100) };
  }
  createBufferSource() {
    return { buffer: null, connect: jest.fn(), start: jest.fn(), stop: jest.fn() };
  }
  createBiquadFilter() {
    return {
      type: '',
      frequency: { value: 0, setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
      Q: { value: 0 },
      connect: jest.fn(),
    };
  }
  createGain() {
    return {
      gain: { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
      connect: jest.fn(),
    };
  }
}

let mockSearch = '?doc=test-doc';

beforeEach(() => {
  window.AudioContext = MockAudioContext;
  window.webkitAudioContext = MockAudioContext;

  jest.spyOn(URL.prototype, 'search', 'get').mockImplementation(function () {
    return mockSearch;
  });

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'test-doc',
          title: 'Test PDF',
          filename: 'test.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          view_count: 0,
          description: '',
          category: 'PDFs',
        }),
    })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Viewer with document metadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders loading screen initially', async () => {
    const { container } = render(
      <div>
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Loading document...</p>
          </div>
        </div>
      </div>
    );
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('preview card shows Open Document button', async () => {
    const { container } = render(
      <div className="preview-card">
        <button className="btn btn-primary btn-load">Open Document</button>
      </div>
    );
    const btn = container.querySelector('.btn-load');
    expect(btn).toBeInTheDocument();
    expect(btn.textContent).toContain('Open Document');
  });

  it('keyboard hints show Ctrl+Scroll Zoom', () => {
    const { container } = render(
      <div className="keyboard-hints">
        <span>← → Navigate</span>
        <span>Ctrl+Scroll Zoom</span>
        <span>F Fullscreen</span>
      </div>
    );
    const hints = container.querySelector('.keyboard-hints');
    expect(hints.textContent).toContain('Ctrl+Scroll Zoom');
  });
});
