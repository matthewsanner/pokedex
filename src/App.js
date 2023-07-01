import React, { useState, useEffect, useCallback } from "react";
import PokemonList from "./components/PokemonList";
import TeamList from "./components/TeamList";
import TypeButton from "./components/TypeButton";
import "./App.css";
import { typeColors } from "./typeColors";

function Pokedex() {
  const [pokemon, setPokemon] = useState([]);
  const [team, setTeam] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [offset, setOffset] = useState(0);

  let limit = 50;
  if (searchTerm) {
    limit = 100;
  }

  const handleLoadMore = useCallback(() => {
    setOffset((prevOffset) => {
      const newOffset = prevOffset + limit;
      if (searchTerm) {
        return newOffset > 908 ? 908 : newOffset;
      } else {
        return newOffset > 958 ? 958 : newOffset;
      }
    });
  }, [limit, searchTerm]);

  useEffect(() => {
    async function fetchPokemon() {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
      );
      const data = await response.json();
      const promises = data.results.map(async (result) => {
        const response = await fetch(result.url);
        return response.json();
      });
      const results = await Promise.all(promises);
      setPokemon((prevPokemon) => [...prevPokemon, ...results]);
    }

    fetchPokemon();
  }, [offset, limit]);

  useEffect(() => {
    function handleScroll() {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isScrolledToBottom) {
        handleLoadMore();
      }
    }

    function handleTouchMove() {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isScrolledToBottom) {
        handleLoadMore();
      }
    }

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [handleLoadMore]);

  const addToTeam = (result) => {
    if (team.length < 6 && !team.includes(result)) {
      setTeam([...team, result]);
    }
  };

  const removeFromTeam = (result) => {
    setTeam(team.filter((pokemon) => pokemon !== result));
  };

  const searchType = (type) => {
    setSearchTerm(type);
  };

  const filteredPokemon = pokemon.filter((p) =>
    searchTerm === "" ? true : p.types.some((t) => t.type.name === searchTerm)
  );

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <h1>Pokemon Team Builder</h1>
        </div>
      </div>
      <div className="row justify-content-center">
        <div className="accordion col-11 col-xl-4 order-xl-2 text-center sections sticky-top team">
          <div className="accordion-item">
            <div
              className="accordion-title"
              onClick={() => setIsActive(!isActive)}
            >
              <h3>Your Team (up to 6)</h3>
              <h3>{isActive ? "-" : "+"}</h3>
            </div>
            {isActive && (
              <div className="accordion-content">
                <TeamList team={team} onClick={removeFromTeam} />
              </div>
            )}
          </div>
        </div>
        <div className="col-11 col-xl-7 order-xl-1 text-center sections pokelist">
          <h3>Click to choose your Pokemon!</h3>
          <div className="typeButtons">
            <button onClick={() => searchType("")} className="type-styles">
              All Types
            </button>
            {Object.entries(typeColors).map(([key]) => (
              <TypeButton key={key} type={key} searchType={searchType} />
            ))}
          </div>
          <PokemonList pokemon={filteredPokemon} onClick={addToTeam} />
        </div>
      </div>
    </div>
  );
}

export default Pokedex;
