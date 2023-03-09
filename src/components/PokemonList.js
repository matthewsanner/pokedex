import React from 'react';
import PokemonCard from './PokemonCard';

function PokemonList({ pokemon, onClick }) {
  return (
    <div className="pokemon-list">
      <h2>Choose Your Pokemon!</h2>
      {pokemon.map((result) => (
        <PokemonCard key={result.id} pokemon={result} onClick={() => onClick(result)} />
      ))}
    </div>
  );
}

export default PokemonList;
