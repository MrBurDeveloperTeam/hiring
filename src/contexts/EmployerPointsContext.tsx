import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface EmployerPointsContextType {
    points: number;
    addPoints: (amount: number) => void;
    deductPoints: (amount: number) => boolean;
}

const EmployerPointsContext = createContext<EmployerPointsContextType | undefined>(undefined);

export function EmployerPointsProvider({ children }: { children: ReactNode }) {
    const [points, setPoints] = useState<number>(() => {
        const stored = localStorage.getItem('mock_employer_points');
        return stored ? parseInt(stored, 10) : 100;
    });

    useEffect(() => {
        localStorage.setItem('mock_employer_points', points.toString());
    }, [points]);

    const addPoints = (amount: number) => {
        setPoints(p => p + amount);
    };

    const deductPoints = (amount: number): boolean => {
        if (points >= amount) {
            setPoints(p => p - amount);
            return true;
        }
        return false;
    };

    return (
        <EmployerPointsContext.Provider value={{ points, addPoints, deductPoints }}>
            {children}
        </EmployerPointsContext.Provider>
    );
}

export function useEmployerPoints() {
    const context = useContext(EmployerPointsContext);
    if (context === undefined) {
        throw new Error('useEmployerPoints must be used within a EmployerPointsProvider');
    }
    return context;
}
