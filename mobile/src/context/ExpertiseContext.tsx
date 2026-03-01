import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the two modes
export type ExpertiseMode = 'novice' | 'expert';

interface ExpertiseContextType {
    mode: ExpertiseMode;
    toggleMode: () => void;
    setMode: (mode: ExpertiseMode) => void;
}

const ExpertiseContext = createContext<ExpertiseContextType | undefined>(undefined);

export function ExpertiseProvider({ children }: { children: ReactNode }) {
    // Default to novice (Grandmother mode) for safety
    const [mode, setMode] = useState<ExpertiseMode>('novice');

    const toggleMode = () => {
        setMode((prev) => (prev === 'novice' ? 'expert' : 'novice'));
    };

    return (
        <ExpertiseContext.Provider value={{ mode, toggleMode, setMode }}>
            {children}
        </ExpertiseContext.Provider>
    );
}

export function useExpertise() {
    const context = useContext(ExpertiseContext);
    if (context === undefined) {
        throw new Error('useExpertise must be used within an ExpertiseProvider');
    }
    return context;
}
