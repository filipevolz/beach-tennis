'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface InviteShareProps {
  inviteCode: string;
}

export function InviteShare({ inviteCode }: InviteShareProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/matches/invite/${inviteCode}`
      : `/matches/invite/${inviteCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — select text manually
    }
  }

  return (
    <div className="invite-share" aria-label="Partilhar convite">
      <p className="invite-share__label">Link de convite:</p>
      <div className="invite-share__row">
        <input
          className="invite-share__url input"
          type="text"
          readOnly
          value={inviteUrl}
          aria-label="URL de convite"
          onFocus={(e) => e.target.select()}
        />
        <Button
          variant="secondary"
          onClick={() => void handleCopy()}
          aria-label="Copiar link de convite"
        >
          {copied ? 'Copiado!' : 'Copiar'}
        </Button>
      </div>
    </div>
  );
}
