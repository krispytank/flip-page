/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import ZoomControls from '../components/ZoomControls';

describe('ZoomControls', () => {
  const defaultProps = {
    zoomLevel: 1,
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    onZoomReset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders zoom level as percentage', () => {
    render(<ZoomControls {...defaultProps} />);
    const zoomValue = document.querySelector('.zoom-value');
    expect(zoomValue.textContent).toBe('100%');
  });

  it('displays correct percentage for different zoom levels', () => {
    render(<ZoomControls {...defaultProps} zoomLevel={1.5} />);
    const zoomValue = document.querySelector('.zoom-value');
    expect(zoomValue.textContent).toBe('150%');
  });

  it('calls onZoomIn when zoom in button is clicked', () => {
    render(<ZoomControls {...defaultProps} />);
    const buttons = document.querySelectorAll('.zoom-button');
    const zoomInBtn = buttons[1];
    fireEvent.click(zoomInBtn);
    expect(defaultProps.onZoomIn).toHaveBeenCalledTimes(1);
  });

  it('calls onZoomOut when zoom out button is clicked', () => {
    render(<ZoomControls {...defaultProps} />);
    const buttons = document.querySelectorAll('.zoom-button');
    const zoomOutBtn = buttons[0];
    fireEvent.click(zoomOutBtn);
    expect(defaultProps.onZoomOut).toHaveBeenCalledTimes(1);
  });

  it('calls onZoomReset when reset button is clicked', () => {
    render(<ZoomControls {...defaultProps} />);
    const resetBtn = document.querySelector('.zoom-button.reset');
    fireEvent.click(resetBtn);
    expect(defaultProps.onZoomReset).toHaveBeenCalledTimes(1);
  });

  it('disables zoom out at minimum zoom', () => {
    render(<ZoomControls {...defaultProps} zoomLevel={0.5} minZoom={0.5} />);
    const buttons = document.querySelectorAll('.zoom-button');
    const zoomOutBtn = buttons[0];
    expect(zoomOutBtn).toBeDisabled();
  });

  it('disables zoom in at maximum zoom', () => {
    render(<ZoomControls {...defaultProps} zoomLevel={2} maxZoom={2} />);
    const buttons = document.querySelectorAll('.zoom-button');
    const zoomInBtn = buttons[1];
    expect(zoomInBtn).toBeDisabled();
  });
});
