/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import FlipBook from '../components/FlipBook';

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

  it('navigates to next page via click on right half', () => {
    const { container } = render(<FlipBook {...defaultProps} />);
    const pageFront = container.querySelector('.page-front');

    const mockGetBoundingClientRect = jest.fn(() => ({
      left: 0, top: 0, width: 200, height: 100,
      right: 200, bottom: 100, x: 0, y: 0, toJSON: () => {},
    }));
    pageFront.getBoundingClientRect = mockGetBoundingClientRect;

    act(() => {
      fireEvent.click(pageFront, { clientX: 150, clientY: 50 });
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it('navigates to previous page via click on left half', () => {
    const { container } = render(
      <FlipBook {...defaultProps} initialPage={1} />
    );
    const pages = container.querySelectorAll('.page');
    const pageFront = pages[1].querySelector('.page-front');

    const mockGetBoundingClientRect = jest.fn(() => ({
      left: 0, top: 0, width: 200, height: 100,
      right: 200, bottom: 100, x: 0, y: 0, toJSON: () => {},
    }));
    pageFront.getBoundingClientRect = mockGetBoundingClientRect;

    act(() => {
      fireEvent.click(pageFront, { clientX: 50, clientY: 50 });
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(0);
  });

  it('does not navigate when flipping animation is in progress', () => {
    const { container } = render(<FlipBook {...defaultProps} />);
    const pageFronts = container.querySelectorAll('.page-front');

    const mockGetBoundingClientRect = jest.fn(() => ({
      left: 0, top: 0, width: 200, height: 100,
      right: 200, bottom: 100, x: 0, y: 0, toJSON: () => {},
    }));

    pageFronts[1].getBoundingClientRect = mockGetBoundingClientRect;
    pageFronts[2].getBoundingClientRect = mockGetBoundingClientRect;

    act(() => {
      fireEvent.click(pageFronts[1], { clientX: 150, clientY: 50 });
    });

    act(() => {
      fireEvent.click(pageFronts[2], { clientX: 150, clientY: 50 });
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

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

  describe('ref methods', () => {
    it('exposes goToNextPage via ref', () => {
      const ref = React.createRef();
      render(<FlipBook {...defaultProps} ref={ref} />);

      act(() => {
        ref.current.goToNextPage();
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
    });

    it('exposes goToPreviousPage via ref', () => {
      const ref = React.createRef();
      render(<FlipBook {...defaultProps} initialPage={1} ref={ref} />);

      act(() => {
        ref.current.goToPreviousPage();
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(0);
    });

    it('exposes getCurrentPage via ref', () => {
      const ref = React.createRef();
      render(<FlipBook {...defaultProps} initialPage={2} ref={ref} />);

      expect(ref.current.getCurrentPage()).toBe(2);
    });
  });

  describe('click zones', () => {
    it('renders click-zone classes on page-front and page-back', () => {
      const { container } = render(<FlipBook {...defaultProps} />);
      const pageFront = container.querySelector('.page-front');
      const pageBack = container.querySelector('.page-back');
      expect(pageFront.classList.contains('click-zone')).toBe(true);
      expect(pageBack.classList.contains('click-zone')).toBe(true);
    });

    it('page-front has data-direction="previous"', () => {
      const { container } = render(<FlipBook {...defaultProps} />);
      const pageFront = container.querySelector('.page-front');
      expect(pageFront.getAttribute('data-direction')).toBe('previous');
    });

    it('page-back has data-direction="next"', () => {
      const { container } = render(<FlipBook {...defaultProps} />);
      const pageBack = container.querySelector('.page-back');
      expect(pageBack.getAttribute('data-direction')).toBe('next');
    });
  });

  describe('animation timing', () => {
    it('uses consistent FLIP_DURATION for transitions', () => {
      const { container } = render(<FlipBook {...defaultProps} />);
      const pages = container.querySelectorAll('.page');
      const style = pages[0].getAttribute('style');
      expect(style).toContain('400ms');
    });
  });
});
