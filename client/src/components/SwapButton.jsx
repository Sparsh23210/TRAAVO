import React from 'react';
import './SwapButton.css';

const SwapButton = ({ onSwap }) => {
    return (
        <button
            type="button"
            className="swap-button"
            onClick={onSwap}
            aria-label="Swap Locations"
        >
            ⇅
        </button>
    );
};

export default SwapButton;
