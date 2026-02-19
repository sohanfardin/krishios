import { createContext, useContext } from 'react';

interface NavigationContextType {
  navigateTo: (page: string, params?: Record<string, any>) => void;
  goBack: () => void;
  currentPage: string;
  navParams: Record<string, any>;
}

export const NavigationContext = createContext<NavigationContextType>({
  navigateTo: () => {},
  goBack: () => {},
  currentPage: 'dashboard',
  navParams: {},
});

export const useNavigation = () => useContext(NavigationContext);
