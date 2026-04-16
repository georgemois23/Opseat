import { Restaurant } from "@/features/restaurants/types/RestaurantData";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import api from "@/lib/axios";
import { useLocationContext } from "@/features/location/services/LocationContext";

interface RestaurantContextType {
  restaurants: Restaurant[];
  filteredRestaurants: Restaurant[];
  setFilteredRestaurants: React.Dispatch<React.SetStateAction<Restaurant[]>>;
  refetchRestaurants: () => void;
}

export const RestaurantContext = createContext<RestaurantContextType | null>(null);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { effectiveCoords } = useLocationContext();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);

  const getNearbyData = useCallback(async (coords?: { latitude: number; longitude: number }) => {
    try {
      const activeCoords = coords ?? effectiveCoords;
      const res = await api.get("/restaurants/nearby", {
        withCredentials: true,
        params:
          activeCoords != null
            ? {
                latitude: activeCoords.latitude,
                longitude: activeCoords.longitude,
                lat: activeCoords.latitude,
                lng: activeCoords.longitude,
              }
            : undefined,
      });
      setRestaurants(res.data);
      setFilteredRestaurants(res.data);
    } catch (error) {
      console.error("Error fetching nearby restaurants:", error);
    }
  }, [effectiveCoords]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setRestaurants([]);
      setFilteredRestaurants([]);
      return;
    }
    void getNearbyData();
  }, [isLoading, user, getNearbyData, effectiveCoords]);

  const refetchRestaurants = useCallback(() => {
    void getNearbyData();
  }, [getNearbyData]);

  const contextValue = useMemo(
    () => ({
      restaurants,
      filteredRestaurants,
      setFilteredRestaurants,
      refetchRestaurants,
    }),
    [
      restaurants,
      filteredRestaurants,
      refetchRestaurants,
    ]
  );

  return <RestaurantContext.Provider value={contextValue}>{children}</RestaurantContext.Provider>;
}

export const useRestaurants = () => {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error("useRestaurants must be used within Provider");
  return context;
};

export default RestaurantContext;
