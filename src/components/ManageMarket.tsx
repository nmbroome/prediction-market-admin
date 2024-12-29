import React from "react";

type MarketOutcome = {
  id: string;
  label: string;
};

type MarketOutcomesProps = {
  outcomes: MarketOutcome[];
  onOutcomeClick: (outcomeId: string) => void;
  onAnnulClick: () => void;
};

const MarketOutcomes: React.FC<MarketOutcomesProps> = ({
  outcomes,
  onOutcomeClick,
  onAnnulClick,
}) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {outcomes.map((outcome) => (
          <button
            key={outcome.id}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            onClick={() => onOutcomeClick(outcome.id)}
          >
            {outcome.label}
          </button>
        ))}
      </div>
      <button
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        onClick={onAnnulClick}
      >
        Annul Market
      </button>
    </div>
  );
};

export default MarketOutcomes;
