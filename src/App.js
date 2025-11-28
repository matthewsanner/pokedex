import React, { useState, useEffect, useCallback, useRef } from "react";
import PokemonList from "./components/PokemonList";
import TeamList from "./components/TeamList";
import TypeButton from "./components/TypeButton";
import "./App.css";
import { typeColors } from "./typeColors";
import { cachedFetch } from "./apiCache";

function Pokedex() {
  const [pokemon, setPokemon] = useState([]);
  const [team, setTeam] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [maxLoadedOffset, setMaxLoadedOffset] = useState(0);
  const loadedPokemonIds = useRef(new Set());
  const isFetching = useRef(false);
  const lastAutoFetchedFilter = useRef("");
  const pokemonRef = useRef([]);
  const maxLoadedOffsetRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => {
    pokemonRef.current = pokemon;
  }, [pokemon]);

  useEffect(() => {
    maxLoadedOffsetRef.current = maxLoadedOffset;
  }, [maxLoadedOffset]);

  const limit = searchTerm || nameSearch ? 100 : 50;

  // Filter existing Pokemon first
  const filteredPokemon = pokemon.filter((p) => {
    // Type filter
    const matchesType =
      searchTerm === "" || p.types.some((t) => t.type.name === searchTerm);
    // Name filter
    const matchesName =
      nameSearch === "" ||
      p.name.toLowerCase().includes(nameSearch.toLowerCase());
    return matchesType && matchesName;
  });

  const handleLoadMore = useCallback(() => {
    if (isFetching.current) return;

    // Check if we've loaded all Pokemon (applies to both filtered and unfiltered)
    if (maxLoadedOffset >= 1328) {
      return;
    }

    setOffset((prevOffset) => {
      // Only increment if we haven't already loaded this range
      if (prevOffset >= maxLoadedOffset) {
        const newOffset = prevOffset + limit;
        const maxOffset = 1328;
        return newOffset > maxOffset ? maxOffset : newOffset;
      }
      return prevOffset;
    });
  }, [limit, maxLoadedOffset]);

  useEffect(() => {
    // Only fetch if:
    // - Initial load: offset=0 and maxLoadedOffset=0
    // - Subsequent loads: offset > maxLoadedOffset
    const shouldFetch =
      (maxLoadedOffset === 0 && offset === 0) || offset > maxLoadedOffset;
    if (!shouldFetch || isFetching.current) {
      return;
    }

    async function fetchPokemon() {
      isFetching.current = true;
      try {
        // Use cached fetch for the list endpoint
        const listUrl = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
        const data = await cachedFetch(listUrl);

        // Use cached fetch for individual Pokemon endpoints
        // Use allSettled instead of all to handle individual failures gracefully
        const promises = data.results.map(async (result) => {
          try {
            return await cachedFetch(result.url);
          } catch (error) {
            console.warn(`Failed to fetch Pokemon at ${result.url}:`, error);
            return null; // Return null for failed fetches
          }
        });
        const settledResults = await Promise.allSettled(promises);

        // Extract successful results, filtering out nulls and rejected promises
        const results = settledResults
          .map((result) =>
            result.status === "fulfilled" ? result.value : null
          )
          .filter((p) => p !== null);

        // Filter out Pokemon without sprites and duplicates using Pokemon IDs
        const newPokemon = results.filter(
          (p) =>
            p && p.sprites?.front_default && !loadedPokemonIds.current.has(p.id)
        );

        // Add new IDs to the set
        newPokemon.forEach((p) => loadedPokemonIds.current.add(p.id));

        setPokemon((prevPokemon) => [...prevPokemon, ...newPokemon]);
        setMaxLoadedOffset(offset);
      } catch (error) {
        console.error("Error fetching Pokemon:", error);
      } finally {
        isFetching.current = false;
      }
    }

    fetchPokemon();
  }, [offset, limit, maxLoadedOffset]);

  // When filter changes, check if we need to load more Pokemon
  useEffect(() => {
    const filterKey = `${searchTerm}|${nameSearch}`;
    if (isFetching.current || filterKey === lastAutoFetchedFilter.current) {
      return;
    }

    // Mark that we've checked this filter combination
    lastAutoFetchedFilter.current = filterKey;

    // Only auto-fetch when a filter is applied and we don't have enough results
    if (searchTerm || nameSearch) {
      // Check current filtered count using ref to get latest pokemon
      const currentFiltered = pokemonRef.current.filter((p) => {
        const matchesType =
          searchTerm === "" || p.types.some((t) => t.type.name === searchTerm);
        const matchesName =
          nameSearch === "" ||
          p.name.toLowerCase().includes(nameSearch.toLowerCase());
        return matchesType && matchesName;
      });

      if (currentFiltered.length < 20 && maxLoadedOffsetRef.current < 1328) {
        // Use a small delay to avoid race conditions
        const timer = setTimeout(() => {
          handleLoadMore();
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      // Filter cleared, reset tracking
      lastAutoFetchedFilter.current = "";
    }
  }, [searchTerm, nameSearch, handleLoadMore]);

  // Auto-load more Pokemon if displaying less than 16 results
  useEffect(() => {
    // Only trigger if we have less than 16 displayed Pokemon
    // and we haven't loaded all Pokemon yet
    // and we're not currently fetching
    if (
      filteredPokemon.length < 16 &&
      maxLoadedOffset < 1328 &&
      !isFetching.current
    ) {
      // Use a small delay to avoid race conditions and allow state to settle
      const timer = setTimeout(() => {
        handleLoadMore();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [filteredPokemon.length, maxLoadedOffset, handleLoadMore]);

  useEffect(() => {
    function handleScroll() {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isScrolledToBottom) {
        handleLoadMore();
      }
    }

    function handleTouchMove() {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
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
    if (team.length < 10 && !team.includes(result)) {
      setTeam([...team, result]);
    }
  };

  const removeFromTeam = (result) => {
    setTeam(team.filter((pokemon) => pokemon !== result));
  };

  const searchType = (type) => {
    setSearchTerm(type);
  };

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
              onClick={() => setIsActive(!isActive)}>
              <h3>Your Team (up to 10)</h3>
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
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by name..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="name-search-input"
            />
          </div>
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
