import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ScaleChangeSettingsModal from './ScaleChangeSettingsModal';
import { useMidiStore } from '../store/useMidiStore';

describe('ScaleChangeSettingsModal Portal & Controls', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('Test Case 1: Given the modal is open, Assert the DOM element exists as a direct child of <body>', () => {
    render(<ScaleChangeSettingsModal isOpen={true} onClose={() => {}} />);
    
    const modalElement = document.body.querySelector('#scale-change-settings-modal');
    expect(modalElement).not.toBeNull();
    expect(modalElement?.parentElement).toBe(document.body);
  });

  it('Test Case 2: Assert the "X" close button is NOT present in the component', () => {
    render(<ScaleChangeSettingsModal isOpen={true} onClose={() => {}} />);
    
    // There should be no SVG icon (such as the X icon) inside the modal
    const closeIcon = document.body.querySelector('svg');
    expect(closeIcon).toBeNull();
  });

  it('Test Case 3: Assert "Follow Root" is the first radio option', () => {
    render(<ScaleChangeSettingsModal isOpen={true} onClose={() => {}} />);
    
    const radioInputs = document.body.querySelectorAll('input[type="radio"]');
    expect(radioInputs.length).toBe(2);
    
    const firstRadio = radioInputs[0] as HTMLInputElement;
    const secondRadio = radioInputs[1] as HTMLInputElement;
    
    expect(firstRadio.id).toBe('scale-change-follow-root-button');
    expect(secondRadio.id).toBe('scale-change-voice-leading-button');
  });

  it('allows clicking "Voice-Leading" to update store scaleChangeMode state', () => {
    useMidiStore.setState({ scaleChangeMode: 'follow-root' });
    expect(useMidiStore.getState().scaleChangeMode).toBe('follow-root');

    render(<ScaleChangeSettingsModal isOpen={true} onClose={() => {}} />);

    const voiceLeadingRadio = document.body.querySelector('#scale-change-voice-leading-button');
    expect(voiceLeadingRadio).not.toBeNull();

    fireEvent.click(voiceLeadingRadio!);
    expect(useMidiStore.getState().scaleChangeMode).toBe('voice-leading');
  });
});
