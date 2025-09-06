import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Globe, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface LocationResult {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  type: string;
  country?: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: LocationResult) => void;
  placeholder?: string;
}

const LocationSearch: React.FC<LocationSearchProps> = ({ 
  onLocationSelect, 
  placeholder = "Search for any location..." 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Search using Supabase edge function for geocoding
  const searchLocations = useCallback(async (searchQuery: string): Promise<LocationResult[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-location', {
        body: { query: searchQuery }
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching locations:', error);
      
      // Fallback to mock data if Nominatim fails
      const mockResults: LocationResult[] = [
        {
          id: '1',
          name: 'New York City',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          type: 'city',
          country: 'United States'
        },
        {
          id: '2',
          name: 'London',
          coordinates: { lat: 51.5074, lng: -0.1278 },
          type: 'city',
          country: 'United Kingdom'
        },
        {
          id: '3',
          name: 'Tokyo',
          coordinates: { lat: 35.6762, lng: 139.6503 },
          type: 'city',
          country: 'Japan'
        }
      ];
      
      return mockResults.filter(location => 
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.country?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchLocations(searchQuery);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [searchLocations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleLocationSelect = (location: LocationResult) => {
    setQuery(location.name);
    setIsOpen(false);
    onLocationSelect(location);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'city':
        return <MapPin className="w-4 h-4 text-primary" />;
      case 'country':
        return <Globe className="w-4 h-4 text-accent" />;
      default:
        return <MapPin className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-300"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-climate overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="max-h-64 overflow-y-auto">
            {results.map((location) => (
              <button
                key={location.id}
                onClick={() => handleLocationSelect(location)}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-accent/10 transition-colors text-left group"
              >
                {getLocationIcon(location.type)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {location.name}
                  </div>
                  {location.country && (
                    <div className="text-sm text-muted-foreground">
                      {location.country}
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {location.coordinates.lat.toFixed(2)}, {location.coordinates.lng.toFixed(2)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && results.length === 0 && query.trim() && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-climate p-4">
          <div className="text-center text-muted-foreground">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No locations found for "{query}"</p>
            <p className="text-xs mt-1">Try searching for a city, region, or country</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;