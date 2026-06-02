import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SettingsModal from './SettingsModal';

describe('SettingsModal', () => {
  it('renders without On Scale Change Behavior section', () => {
    const { queryByText } = render(
      <SettingsModal isOpen={true} onClose={() => {}} inputs={[]} />
    );
    expect(queryByText('On Scale Change Behavior')).toBeNull();
  });
});
