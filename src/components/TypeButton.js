import React from 'react';
import { typeColors } from '../typeColors';

function TypeButton({ type, searchType }) {
  return (
    <button onClick={() => searchType(type)} className="type-styles" style={{ backgroundColor: typeColors[type] }}>{type}</button>
  );
}

export default TypeButton;