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
    <Card className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border border-slate-200/60 shadow-2xl backdrop-blur-sm overflow-hidden h-full">
      <div className="relative">
        {/* Ambient background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
          }} />
        </div>
        
        <div className="relative p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </motion.svg>
                
                {/* Glowing ring effect */}
                <motion.div 
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400 to-purple-500"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </motion.div>
              
              <div>
                <motion.h3 
                  className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  User Distribution by Country
                </motion.h3>
                <motion.p 
                  className="text-sm text-slate-600 flex items-center space-x-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span>Global reach analytics</span>
                  <motion.span 
                    className="text-blue-500"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    •
                  </motion.span>
                  <span className="text-blue-600 font-medium">Total: {totalUsers} users</span>
                </motion.p>
              </div>
            </div>
            
            <motion.div 
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 backdrop-blur-sm px-4 py-2 rounded-2xl border border-blue-200/30"
              animate={{ 
                backgroundColor: [
                  "rgba(59, 130, 246, 0.1)", 
                  "rgba(99, 102, 241, 0.15)", 
                  "rgba(139, 92, 246, 0.1)",
                  "rgba(59, 130, 246, 0.1)"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <motion.div 
                className="relative"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                <motion.div 
                  className="absolute inset-0 w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.3, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <span className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold tracking-wide">
                LIVE GLOBAL
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="relative px-6 pb-6">
        {/* Enhanced World Map Visualization */}
        <motion.div 
          className="mb-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 rounded-3xl p-8 relative overflow-hidden border border-blue-100/50 shadow-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.95 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.3) 0%, transparent 25%),
                radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.2) 0%, transparent 25%),
                linear-gradient(45deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                linear-gradient(-45deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px, 40px 40px, 15px 15px, 15px 15px'
            }} />
          </div>
          
          <div className="relative z-10 flex items-center justify-center h-48">
            <div className="text-center">
              <motion.div 
                className="text-7xl mb-6 relative"
                animate={{ 
                  rotate: [0, 8, -8, 0],
                  scale: [1, 1.08, 1]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                🌍
                
                {/* Multiple orbiting rings */}
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-32 h-32 relative">
                    <motion.div 
                      className="absolute top-0 left-1/2 w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full -translate-x-1/2 shadow-lg"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.div 
                      className="absolute bottom-0 left-1/2 w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full -translate-x-1/2 shadow-lg"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    />
                    <motion.div 
                      className="absolute left-0 top-1/2 w-3 h-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full -translate-y-1/2 shadow-lg"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    />
                    <motion.div 
                      className="absolute right-0 top-1/2 w-3 h-3 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full -translate-y-1/2 shadow-lg"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                    />
                  </div>
                </motion.div>
                
                {/* Inner ring */}
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-20 h-20 relative">
                    <div className="absolute top-1/2 left-0 w-1.5 h-1.5 bg-indigo-500 rounded-full -translate-y-1/2 opacity-60" />
                    <div className="absolute top-1/2 right-0 w-1.5 h-1.5 bg-cyan-500 rounded-full -translate-y-1/2 opacity-60" />
                  </div>
                </motion.div>
              </motion.div>
              
              <motion.h4 
                className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Global User Presence
              </motion.h4>
              <motion.p 
                className="text-blue-600 font-semibold text-lg mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {countryData.length} countries worldwide
              </motion.p>
              <motion.div 
                className="flex items-center justify-center space-x-2 text-slate-500 text-sm"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 4, repeat: Infinity }}
                initial={{ opacity: 0, y: 10 }}
                style={{ opacity: 1, y: 0 }}
              >
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500 animate-pulse" />
                <span>Live tracking</span>
                <span>•</span>
                <span>Real-time data</span>
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse" />
              </motion.div>
            </div>
          </div>
          
          {/* Enhanced pulse effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl"
            animate={{
              opacity: [0, 0.4, 0],
              scale: [1, 1.03, 1]
            }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          
          {/* Corner decorative elements */}
          <div className="absolute top-4 right-4 w-8 h-8 border-2 border-blue-300/30 rounded-full" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-2 border-purple-300/30 rounded-full" />
        </motion.div>

        {/* Enhanced Country List with Bars */}
        <div className="space-y-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="space-y-4"
          >
            {countryData.slice(0, 10).map((country, index) => (
              <motion.div
                key={country.name}
                variants={itemVariants}
                className="group relative"
                whileHover={{ scale: 1.02, x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 relative">
                  {/* Country rank badge */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-xs font-bold text-white">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">
                          {country.flag}
                        </span>
                        <div>
                          <span className="font-medium text-gray-900 text-base">
                            {country.name}
                          </span>
                          <div className="mt-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide">
                              {country.code}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {country.count.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {totalUsers > 0 ? ((country.count / totalUsers) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Simplified progress bar */}
                    <div className="relative mt-4">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${getColorIntensity(country.count)} rounded-full`}
                          custom={getBarWidth(country.count)}
                          variants={barVariants}
                          initial="hidden"
                          animate={isVisible ? "visible" : "hidden"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced View More Button */}
          {countryData.length > 10 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ delay: 1.2 }}
              className="pt-6 mt-6 border-t border-gradient-to-r from-slate-200 via-blue-100 to-slate-200"
            >
              <motion.button 
                className="w-full relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 border border-blue-200/50 text-blue-700 hover:text-blue-800 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="flex items-center justify-center space-x-3">
                  <motion.span
                    className="text-lg"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🌍
                  </motion.span>
                  <span className="text-base">
                    View all {countryData.length} countries
                  </span>
                  <motion.span
                    className="text-xl"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </div>
                
                {/* Animated background shine */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.button>
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



