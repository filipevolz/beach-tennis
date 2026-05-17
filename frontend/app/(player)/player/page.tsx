import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PlayerHomePage() {
  return (
    <div className="player-home">
      <section className="page-hero">
        <h1>Área do jogador</h1>
        <p>
          Descubra jogos públicos, crie partidas por convite e confirme reservas
          de court sem sair do fluxo.
        </p>
        <div className="player-home__actions">
          <Link href="/player/discover">
            <Button>Descobrir jogos</Button>
          </Link>
          <Link href="/player/matches/create">
            <Button variant="secondary">Criar jogo</Button>
          </Link>
        </div>
      </section>

      <section className="page-hero player-home__grid" aria-label="Ações rápidas">
        <article className="player-home__card">
          <h2>Juntar-me a um jogo</h2>
          <p>
            Use filtros de localização, formato e nível para encontrar vagas
            abertas perto de si.
          </p>
          <Link href="/player/discover">Ver discovery →</Link>
        </article>

        <article className="player-home__card">
          <h2>Reservar horário</h2>
          <p>
            Depois de formar o grupo, confirme um slot disponível e acompanhe o
            estado da booking.
          </p>
          <Link href="/player/matches">Ver os meus jogos →</Link>
        </article>
      </section>
    </div>
  );
}
