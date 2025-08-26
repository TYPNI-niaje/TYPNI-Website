import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../Card/Card';

interface CountryData {
  name: string;
  code: string;
  count: number;
  flag: string;
}

interface GeographicalDistributionProps {
  geoData: {
    countries: string[];
    counts: number[];
  };
  isVisible?: boolean;
}

const GeographicalDistribution: React.FC<GeographicalDistributionProps> = ({ 
  geoData, 
  isVisible = false 
}) => {
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  // Country code mapping for common countries
  const countryCodeMap: { [key: string]: { code: string; flag: string } } = {
    'Kenya': { code: 'KE', flag: '🇰🇪' },
    'Uganda': { code: 'UG', flag: '🇺🇬' },
    'Tanzania': { code: 'TZ', flag: '🇹🇿' },
    'United States': { code: 'US', flag: '🇺🇸' },
    'United Kingdom': { code: 'GB', flag: '🇬🇧' },
    'Canada': { code: 'CA', flag: '🇨🇦' },
    'Nigeria': { code: 'NG', flag: '🇳🇬' },
    'South Africa': { code: 'ZA', flag: '🇿🇦' },
    'Ghana': { code: 'GH', flag: '🇬🇭' },
    'Ethiopia': { code: 'ET', flag: '🇪🇹' },
    'Rwanda': { code: 'RW', flag: '🇷🇼' },
    'India': { code: 'IN', flag: '🇮🇳' },
    'Australia': { code: 'AU', flag: '🇦🇺' },
    'Germany': { code: 'DE', flag: '🇩🇪' },
    'France': { code: 'FR', flag: '🇫🇷' },
    'Brazil': { code: 'BR', flag: '🇧🇷' },
    'China': { code: 'CN', flag: '🇨🇳' },
    'Japan': { code: 'JP', flag: '🇯🇵' },
    'Russia': { code: 'RU', flag: '🇷🇺' },
    'Netherlands': { code: 'NL', flag: '🇳🇱' }
  };

  useEffect(() => {
    const processedData = geoData.countries.map((country, index) => {
      const countryInfo = countryCodeMap[country] || { 
        code: country.slice(0, 2).toUpperCase(), 
        flag: '🌍' 
      };
      
      return {
        name: country,
        code: countryInfo.code,
        count: geoData.counts[index] || 0,
        flag: countryInfo.flag
      };
    });

    setCountryData(processedData);
    setTotalUsers(geoData.counts.reduce((sum, count) => sum + count, 0));
  }, [geoData]);

  const maxCount = Math.max(...geoData.counts);

  const getBarWidth = (count: number) => {
    return maxCount > 0 ? (count / maxCount) * 100 : 0;
  };

  const getColorIntensity = (count: number) => {
    const intensity = maxCount > 0 ? count / maxCount : 0;
    if (intensity > 0.8) return 'bg-gradient-to-r from-blue-600 to-blue-700';
    if (intensity > 0.6) return 'bg-gradient-to-r from-blue-500 to-blue-600';
    if (intensity > 0.4) return 'bg-gradient-to-r from-blue-400 to-blue-500';
    if (intensity > 0.2) return 'bg-gradient-to-r from-blue-300 to-blue-400';
    return 'bg-gradient-to-r from-blue-200 to-blue-300';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 12
      }
    }
  };

  const barVariants = {
    hidden: { width: 0 },
    visible: (width: number) => ({
      width: `${width}%`,
      transition: {
        duration: 1,
        ease: 'easeOut',
        delay: 0.2
      }
    })
  };

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-900">User Distribution by Country</span>
            <motion.div 
              className="w-2 h-2 rounded-full bg-blue-500"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="text-sm text-gray-500">
            Total: {totalUsers.toLocaleString()} users
          </div>
        </div>
      }
      className="h-full"
    >
      <div className="p-6">
        {/* World Map Visualization Placeholder */}
        <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-center h-32 bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-4xl mb-2">🌍</div>
              <p className="text-sm text-gray-600">Global User Presence</p>
              <p className="text-xs text-gray-500">{countryData.length} countries</p>
            </div>
          </div>
        </div>

        {/* Country List with Bars */}
        <div className="space-y-3">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="space-y-3"
          >
            {countryData.slice(0, 10).map((country, index) => (
              <motion.div
                key={country.name}
                variants={itemVariants}
                className="group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <span className="font-medium text-gray-900">{country.name}</span>
                      <span className="ml-2 text-xs text-gray-500 uppercase tracking-wide">
                        {country.code}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-700">
                      {country.count.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {totalUsers > 0 ? ((country.count / totalUsers) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${getColorIntensity(country.count)} rounded-full`}
                      custom={getBarWidth(country.count)}
                      variants={barVariants}
                      initial="hidden"
                      animate={isVisible ? "visible" : "hidden"}
                    />
                  </div>
                  
                  {/* Rank indicator */}
                  <div className="absolute -left-6 top-0 flex items-center justify-center w-4 h-2">
                    <span className="text-xs font-bold text-gray-400">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* View More Button */}
          {countryData.length > 10 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ delay: 1 }}
              className="pt-4 border-t border-gray-100"
            >
              <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors">
                View all {countryData.length} countries →
              </button>
            </motion.div>
          )}
        </div>

        {/* Statistics Footer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 10 }}
          transition={{ delay: 1.2 }}
          className="mt-6 pt-4 border-t border-gray-100"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {countryData.length}
              </div>
              <div className="text-xs text-gray-500">Countries</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {countryData.length > 0 ? countryData[0]?.count || 0 : 0}
              </div>
              <div className="text-xs text-gray-500">Top Country</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {countryData.length > 0 ? Math.round((countryData.length / 195) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-500">Global Coverage</div>
            </div>
          </div>
        </motion.div>
      </div>
    </Card>
  );
};

export default GeographicalDistribution;



