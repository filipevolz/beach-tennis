'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api-errors';
import type { SkillLevel, UserRole } from '@/lib/auth-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './auth-context';

const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

function homeForRole(role: UserRole): string {
  return role === 'player' ? '/player' : '/venue';
}

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<UserRole | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [roleError, setRoleError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRoleError(null);
    setError(null);

    if (!role) {
      setRoleError('Selecione o seu papel na plataforma.');
      return;
    }

    setIsSubmitting(true);

    try {
      const registeredRole =
        role === 'player'
          ? await register({
              email,
              password,
              role: 'player',
              playerProfile: {
                displayName,
                skillLevel,
                latitude: -23.0,
                longitude: -43.2,
              },
            })
          : await register({
              email,
              password,
              role: 'venue_manager',
              venueManagerProfile: { displayName },
            });

      router.replace(homeForRole(registeredRole));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Não foi possível criar a conta. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h1>Criar conta</h1>

      <fieldset className="form-field">
        <legend className="label">Papel</legend>
        <div className="role-options">
          <label className="role-option">
            <input
              type="radio"
              name="role"
              value="player"
              checked={role === 'player'}
              onChange={() => setRole('player')}
            />
            Jogador
          </label>
          <label className="role-option">
            <input
              type="radio"
              name="role"
              value="venue_manager"
              checked={role === 'venue_manager'}
              onChange={() => setRole('venue_manager')}
            />
            Gestor de clube
          </label>
        </div>
        {roleError ? (
          <p className="form-error" role="alert">
            {roleError}
          </p>
        ) : null}
      </fieldset>

      <div className="form-field">
        <Label htmlFor="displayName">Nome a mostrar</Label>
        <Input
          id="displayName"
          name="displayName"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="form-field">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="form-field">
        <Label htmlFor="password">Palavra-passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {role === 'player' ? (
        <div className="form-field">
          <Label htmlFor="skillLevel">Nível</Label>
          <select
            id="skillLevel"
            name="skillLevel"
            className="input"
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
          >
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'A criar conta…' : 'Criar conta'}
      </Button>

      <p>
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </form>
  );
}
