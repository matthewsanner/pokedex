import React from 'react';
import PokemonCard from './PokemonCard';

function PokemonList({ pokemon, onClick }) {
  return (
    <div>
      {pokemon.map((result, index) => (
        <PokemonCard key={index} pokemon={result} onClick={() => onClick(result)} />
      ))}
    </div>
  );
}

export default PokemonList;
