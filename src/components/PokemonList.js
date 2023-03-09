import React from 'react';
import PokemonCard from './PokemonCard';

function PokemonList({ pokemon, onClick }) {
  return (
    <div>
      <h3>Click to choose your Pokemon!</h3>
      {pokemon.map((result) => (
        <PokemonCard key={result.id} pokemon={result} onClick={() => onClick(result)} />
      ))}
    </div>
  );
}

export default PokemonList;
