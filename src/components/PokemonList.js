import React from 'react';
import PokemonCard from './PokemonCard';

function PokemonList({ pokemon, onClick }) {
  return (
    <div className="pokemon">
      {pokemon.map((result) => (
        <PokemonCard pokemon={result} onClick={() => onClick(result)} />
      ))}
    </div>
  );
}

export default PokemonList;
