import React, { useState, useEffect } from 'react';
import { typeColors } from './typeColors';
import './App.css';

function Pokedex() {
  const [pokemon, setPokemon] = useState([]);
  const [team, setTeam] = useState([]);

  useEffect(() => {
    async function fetchPokemon() {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
      const data = await response.json();
      const promises = data.results.map(async (result) => {
        const response = await fetch(result.url);
        return response.json();
      });
      const results = await Promise.all(promises);
      setPokemon(results);
    }
    fetchPokemon();
  }, []);

  const addToTeam = (result) => {
    if (team.length < 6 && !team.includes(result)) {
      setTeam([...team, result]);
    }
  };

  const removeFromTeam = (result) => {
    setTeam(team.filter((pokemon) => pokemon !== result));
  };

  return (
    <div className="container">
      <div className="pokemon">
        {pokemon.map((result) => (
          <div
            className="pokemon"
            key={result.id}
            style={{ backgroundColor: typeColors[result.types[0].type.name] }}
            onClick={() => addToTeam(result)}
          >
            <img src={result.sprites.front_default} alt={result.name} />
            <div className="info">
              <h2>{result.name}</h2>
              <div className="types">
                {result.types.map((type, index) => (
                  <div key={index} className="type" style={{ backgroundColor: typeColors[type.type.name] }}>
                    {type.type.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="team">
        <h2>Team</h2>
        {team.map((result) => (
          <div
            className="pokemon"
            key={result.id}
            style={{ backgroundColor: typeColors[result.types[0].type.name] }}
            onClick={() => removeFromTeam(result)}
          >
            <img src={result.sprites.front_default} alt={result.name} />
            <div className="info">
              <h2>{result.name}</h2>
              <div className="types">
                {result.types.map((type, index) => (
                  <div key={index} className="type" style={{ backgroundColor: typeColors[type.type.name] }}>
                    {type.type.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Pokedex;