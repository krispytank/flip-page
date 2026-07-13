/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NavigationControls from '../components/NavigationControls';

describe('NavigationControls', () => {
  const defaultProps = {
    currentPage: 0,
    totalPages: 5,
    onPrev: jest.fn(),
    onNext: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page indicator correctly', () => {
    render(<NavigationControls {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onNext when next button is clicked', () => {
    render(<NavigationControls {...defaultProps} />);
    const nextButton = screen.getByLabelText ? 
      document.querySelector('.nav-button.next') : 
      document.querySelectorAll('button')[1];
    fireEvent.click(nextButton);
    expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onPrev when prev button is clicked', () => {
    render(<NavigationControls {...defaultProps} currentPage={2} />);
    const prevButton = document.querySelector('.nav-button.prev');
    fireEvent.click(prevButton);
    expect(defaultProps.onPrev).toHaveBeenCalledTimes(1);
  });

  it('disables prev button on first page', () => {
    render(<NavigationControls {...defaultProps} currentPage={0} />);
    const prevButton = document.querySelector('.nav-button.prev');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<NavigationControls {...defaultProps} currentPage={4} />);
    const nextButton = document.querySelector('.nav-button.next');
    expect(nextButton).toBeDisabled();
  });

  it('shows correct current page number', () => {
    render(<NavigationControls {...defaultProps} currentPage={2} />);
    const currentPageEl = document.querySelector('.current-page');
    expect(currentPageEl.textContent).toBe('3');
  });
});
