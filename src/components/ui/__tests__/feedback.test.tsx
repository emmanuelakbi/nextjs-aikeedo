import { describe, it, expect } from 'vitest';
import Toast from '../Toast';
import Spinner from '../Spinner';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';

describe('Toast Component', () => {
  it('exports Toast component', () => {
    expect(Toast).toBeDefined();
    expect(typeof Toast).toBe('function');
  });

  it('has correct display name', () => {
    expect(Toast.name).toBe('Toast');
  });
});

describe('Spinner Component', () => {
  it('exports Spinner component', () => {
    expect(Spinner).toBeDefined();
    expect(typeof Spinner).toBe('function');
  });

  it('has correct display name', () => {
    expect(Spinner.name).toBe('Spinner');
  });
});

describe('ErrorMessage Component', () => {
  it('exports ErrorMessage component', () => {
    expect(ErrorMessage).toBeDefined();
    expect(typeof ErrorMessage).toBe('function');
  });

  it('has correct display name', () => {
    expect(ErrorMessage.name).toBe('ErrorMessage');
  });
});

describe('SuccessMessage Component', () => {
  it('exports SuccessMessage component', () => {
    expect(SuccessMessage).toBeDefined();
    expect(typeof SuccessMessage).toBe('function');
  });

  it('has correct display name', () => {
    expect(SuccessMessage.name).toBe('SuccessMessage');
  });
});
