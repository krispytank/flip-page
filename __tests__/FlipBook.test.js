/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import FlipBook from '../components/FlipBook';

// Mock AudioContext
class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.destination = {};
  }
  createBuffer() {
    return {
      getChannelData: () => new Float32Array(100),
    };
  }
  createBufferSource() {
    return {
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
  }
  createBiquadFilter() {
    return {
      type: '',
      frequency: {
        value: 0,
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      Q: { value: 0 },
      connect: jest.fn(),
    };
  }
  createGain() {
    return {
      gain: {
        value: 0,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    };
  }
}

beforeEach(() => {
  window.AudioContext = MockAudioContext;
  window.webkitAudioContext = MockAudioContext;
});

const samplePages = [
  { type: 'placeholder', content: 'Page 1', pageNumber: 1 },
  { type: 'placeholder', content: 'Page 2', pageNumber: 2 },
  { type: 'placeholder', content: 'Page 3', pageNumber: 3 },
];

describe('FlipBook', () => {
  const defaultProps = {
    pages: samplePages,
    initialPage: 0,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders all pages', () => {
    const { container } = render(<FlipBook {...defaultProps} />);
    const pages = container.querySelectorAll('.page');
    expect(pages.length).toBe(3);
  });

  it('renders page content correctly', () => {
    const { container } = render(<FlipBook {...defaultProps} />);
    const pages = container.querySelectorAll('.page');
    expect(pages.length).toBe(3);
    const pageFronts = container.querySelectorAll('.page-front .page-text');
    expect(pageFronts[0].textContent).toBe('Page 1');
  });

  it('sets first page as current by default', () => {
    const { container } = render(<FlipBook {...defaultProps} />);
    const pages = container.querySelectorAll('.page');
    expect(pages[0].classList.contains('current')).toBe(true);
  });

  it('navigates to next page on next page click', () => {
    const { container } = render(<FlipBook {...defaultProps} />);
    const pages = container.querySelectorAll('.page');

    act(() => {
      fireEvent.click(pages[1]);
    });

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it('does not navigate when flipping animation is in progress', () => {
    const { container } = render(<FlipBook {...defaultProps} />);
    const pages = container.querySelectorAll('.page');

    act(() => {
      fireEvent.click(pages[1]);
    });

    // Try to click again immediately
    act(() => {
      fireEvent.click(pages[2]);
    });

    act(() => {
      jest.advanceTimersByTime(700);
    });

    // Should only have been called once
    expect(defaultProps.onPageChange).toHaveBeenCalledTimes(1);
  });

  it('starts at specified initial page', () => {
    const { container } = render(
      <FlipBook {...defaultProps} initialPage={1} />
    );
    const pages = container.querySelectorAll('.page');
    expect(pages[1].classList.contains('current')).toBe(true);
  });

  it('renders image pages with img tag', () => {
    const imagePages = [
      { type: 'image', src: '/test.jpg', pageNumber: 1 },
    ];
    const { container } = render(
      <FlipBook pages={imagePages} initialPage={0} />
    );
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('/test.jpg');
  });
});
