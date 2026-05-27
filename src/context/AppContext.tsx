import React, { createContext, useContext, ReactNode } from "react";
import { AppState } from "../types";
import { useLocalStorage } from "../hooks/useLocalStorage";

const INITIAL_STATE: AppState = {
  caseBrief: "",
  caseGlance: null,
  hypothesis: "",
  issueTree: null,
  frameworks: null,
  coreRecommendation: "",
  expandedRecommendation: null,
  slideOutline: null,
  storyHook: null,
  quantificationPrompt: "",
  quantitativeEstimate: null,
  jargonAudience: "Consulting Judges",
  calibratedRecommendation: null,
  qas: null,
  activeFrameworks: [],
  assumptions: null,
  issueTreeMode: "playground",
  playgroundTree: null,
  meceFeedback: null,
  recLead: "",
  recPillar1: "",
  recPillar2: "",
  recRisk: "",
  userClues: [],
  intakeFeedback: null,
  frameworksScore: null,
  frameworksMode: "socratic",
  userFrameworksInput: "",
  frameworksHintsCount: 0,
  socraticFeedback: null,
  tokens: 50,
  isSessionCompleted: false,
  focusedNodeId: null,
  hasReceivedLoginBonus: false,
  lastReceivedBonusEmail: ""
};

interface AppContextProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  handleReset: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [appState, setAppState] = useLocalStorage<AppState>('caseedge-state', INITIAL_STATE);

  const handleReset = () => {
    setAppState(prev => ({
      ...INITIAL_STATE,
      tokens: prev.tokens,
      hasReceivedLoginBonus: prev.hasReceivedLoginBonus,
      lastReceivedBonusEmail: prev.lastReceivedBonusEmail
    }));
  };

  return (
    <AppContext.Provider value={{ appState, setAppState, handleReset }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export { INITIAL_STATE };
