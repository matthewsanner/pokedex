import React from 'react';
import PokemonCard from './PokemonCard';

function TeamList({ team, onClick }) {
  return (
    <div>
      <h3>Your Team (up to 6)</h3>
      {team.map((result) => (
        <PokemonCard key={result.id} pokemon={result} onClick={() => onClick(result)} />
      ))}
    </div>
  );
}

export default TeamList;
