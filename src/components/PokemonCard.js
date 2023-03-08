import React from 'react';
import { typeColors } from '../typeColors';

function PokemonCard({ pokemon, onClick }) {
  return (
    <div
      className="pokemon"
      key={pokemon.id}
      style={{ backgroundColor: typeColors[pokemon.types[0].type.name] }}
      onClick={onClick}
    >
      <img src={pokemon.sprites.front_default} alt={pokemon.name} />
      <div className="info">
        <h2>{pokemon.name}</h2>
        <div className="types">
          {pokemon.types.map((type, index) => (
            <div key={index} className="type" style={{ backgroundColor: typeColors[type.type.name] }}>
              {type.type.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PokemonCard;
