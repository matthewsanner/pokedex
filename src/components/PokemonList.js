import React from 'react';
import PokemonCard from './PokemonCard';

function PokemonList({ pokemon, onClick }) {
  return (
    <div>
      {pokemon.map((result) => (
        <PokemonCard key={result.id} pokemon={result} onClick={() => onClick(result)} />
      ))}
    </div>
  );
}

export default PokemonList;
