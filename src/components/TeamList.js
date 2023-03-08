import React from 'react';
import PokemonCard from './PokemonCard';

function TeamList({ team, onClick }) {
  return (
    <div className="team">
      <h2>Team</h2>
      {team.map((result) => (
        <PokemonCard pokemon={result} onClick={() => onClick(result)} />
      ))}
    </div>
  );
}

export default TeamList;
