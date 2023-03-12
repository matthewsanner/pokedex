import React from 'react';
import PokemonCard from './PokemonCard';

function TeamList({ team, onClick }) {
  return (
    <div>
      {team.map((result) => (
        <PokemonCard key={result.id} pokemon={result} onClick={() => onClick(result)} />
      ))}
    </div>
  );
}

export default TeamList;
