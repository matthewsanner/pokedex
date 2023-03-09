import React, { useState, useEffect } from 'react';
import PokemonList from './components/PokemonList';
import TeamList from './components/TeamList';
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
      <h1>Pokemon Team Builder</h1>
      <div className="container2">
        <PokemonList pokemon={pokemon} onClick={addToTeam} />
        <TeamList team={team} onClick={removeFromTeam} />
      </div>
    </div>
  );
}

export default Pokedex;