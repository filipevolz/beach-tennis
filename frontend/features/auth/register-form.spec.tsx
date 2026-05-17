import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './register-form';

const registerMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('./auth-context', () => ({
  useAuth: () => ({ register: registerMock }),
}));

describe('RegisterForm', () => {
  it('rejects submission without role selected', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/nome a mostrar/i), 'Ana');
    await user.type(screen.getByLabelText(/^email$/i), 'ana@test.com');
    await user.type(screen.getByLabelText(/palavra-passe/i), 'password12');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(registerMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/selecione o seu papel/i);
  });
});
