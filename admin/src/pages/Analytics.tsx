import { useEffect, useState } from 'react';
import type { FC } from 'react';
import Card from '../components/Card/Card';
import { supabase } from '../lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { parseISO, format, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';
import typniLogo from '../assets/images/TYPNI-11.jpg';
import GeographicalDistribution from '../components/GeographicalDistribution/GeographicalDistribution';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

interface UserGrowthData {
  dates: string[];
  counts: number[];
}

interface ContentMetrics {
  published: number;
  draft: number;
  total: number;
  categories: {
    [key: string]: number;
  };
}

interface EventMetrics {
  upcoming: number;
  past: number;
  categories: {
    [key: string]: number;
  };
}

interface GeoData {
  countries: string[];
  counts: number[];
}

// Animation variants
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
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12
    }
  }
};

const chartVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      delay: 0.2
    }
  }
};



const LoadingScreen: FC = () => {
  return (
    <div className="flex flex-col justify-center items-center h-[80vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center"
      >
        <div className="relative mb-8 w-32 h-32 flex items-center justify-center">
          {/* Outer spinning circle */}
          <motion.div
            animate={{ 
              rotate: 360,
              boxShadow: [
                "0 0 10px rgba(79, 70, 229, 0.3)",
                "0 0 20px rgba(79, 70, 229, 0.5)",
                "0 0 10px rgba(79, 70, 229, 0.3)"
              ]
            }}
            transition={{ 
              rotate: { duration: 4, repeat: Infinity, ease: "linear" },
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-32 h-32 rounded-full border-t-4 border-l-4 border-r-4 border-transparent border-t-primary absolute"
          />
          
          {/* Middle spinning ring */}
          <motion.div
            animate={{ 
              rotate: -180,
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-24 h-24 rounded-full border-b-4 border-r-4 border-accent border-opacity-80 absolute"
          />

          {/* Image container with clean border */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-full p-1 shadow-xl z-10 w-20 h-20 flex items-center justify-center"
          >
            <img 
              src={typniLogo} 
              alt="TYPNI Logo" 
              className="w-full h-full object-cover rounded-full"
            />
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-xl font-bold text-primary mb-3">Loading Analytics</h2>
          <div className="flex justify-center space-x-2">
            {[0, 1, 2, 3].map((dot) => (
              <motion.div
                key={dot}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                  y: [0, -5, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: dot * 0.2,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const Analytics: FC = () => {
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData>({ dates: [], counts: [] });
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics>({
    published: 0,
    draft: 0,
    total: 0,
    categories: {}
  });
  const [eventMetrics, setEventMetrics] = useState<EventMetrics>({
    upcoming: 0,
    past: 0,
    categories: {}
  });
  const [geoData, setGeoData] = useState<GeoData>({ countries: [], counts: [] });
  const [timeFrame, setTimeFrame] = useState<'6months' | '12months'>('6months');
  const [chartVisible, setChartVisible] = useState(false);

  const primaryColor = 'rgba(79, 70, 229, 1)'; // Indigo-600
  const primaryColorLight = 'rgba(79, 70, 229, 0.1)';
  const accentColor = 'rgba(236, 72, 153, 1)'; // Pink-500
  const secondaryColor = 'rgba(16, 185, 129, 1)'; // Green-500
  const tertiaryColor = 'rgba(245, 158, 11, 1)'; // Amber-500

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setChartVisible(false);
      setShowContent(false);
      
      try {
        await Promise.all([
          fetchUserGrowth(),
          fetchContentMetrics(),
          fetchEventMetrics(),
          fetchGeoData()
        ]);
        
        // Small delay to ensure smooth animations
        setTimeout(() => {
          setLoading(false);
          // Set a small delay before showing content for a smooth transition
          setTimeout(() => setShowContent(true), 100);
          setTimeout(() => setChartVisible(true), 500);
        }, 1800);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setLoading(false);
        setShowContent(true);
      }
    };

    fetchAnalyticsData();
  }, [timeFrame]);

  const fetchUserGrowth = async () => {
    // Calculate the date range based on selected time frame
    const endDate = endOfMonth(new Date());
    const startDate = subMonths(
      startOfMonth(new Date()),
      timeFrame === '6months' ? 5 : 11
    );

    // Generate array of months
    const months = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      months.push(format(currentDate, 'MMM yyyy'));
      currentDate = endOfMonth(subMonths(currentDate, -1));
    }

    // Fetch user registration data
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('Error fetching user growth data:', error);
      return;
    }

    // Process data to count users per month
    const usersByMonth: { [key: string]: number } = {};
    months.forEach(month => {
      usersByMonth[month] = 0;
    });

    profiles?.forEach(profile => {
      const date = parseISO(profile.created_at);
      const monthYear = format(date, 'MMM yyyy');
      if (usersByMonth[monthYear] !== undefined) {
        usersByMonth[monthYear]++;
      }
    });

    // Convert to cumulative growth
    let cumulativeCount = 0;
    const cumulativeData = months.map(month => {
      cumulativeCount += usersByMonth[month];
      return cumulativeCount;
    });

    setUserGrowth({
      dates: months,
      counts: cumulativeData
    });
  };

  const fetchContentMetrics = async () => {
    // Get blog post data
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('status, category');

    if (error) {
      console.error('Error fetching blog metrics:', error);
      return;
    }

    const published = blogs?.filter(blog => blog.status === 'published').length || 0;
    const draft = blogs?.filter(blog => blog.status === 'draft').length || 0;
    const total = blogs?.length || 0;

    // Count posts by category
    const categories: { [key: string]: number } = {};
    blogs?.forEach(blog => {
      if (blog.category) {
        categories[blog.category] = (categories[blog.category] || 0) + 1;
      }
    });

    setContentMetrics({
      published,
      draft,
      total,
      categories
    });
  };

  const fetchEventMetrics = async () => {
    const today = new Date().toISOString();
    
    // Get upcoming events
    const { data: upcomingEvents, error: upcomingError } = await supabase
      .from('events')
      .select('type, start_date')
      .gte('start_date', today);

    // Get past events
    const { data: pastEvents, error: pastError } = await supabase
      .from('events')
      .select('type, start_date')
      .lt('start_date', today);

    if (upcomingError || pastError) {
      console.error('Error fetching event metrics:', upcomingError || pastError);
      return;
    }

    // Count events by type
    const categories: { [key: string]: number } = {};
    [...(upcomingEvents || []), ...(pastEvents || [])].forEach(event => {
      if (event.type) {
        categories[event.type] = (categories[event.type] || 0) + 1;
      }
    });

    setEventMetrics({
      upcoming: upcomingEvents?.length || 0,
      past: pastEvents?.length || 0,
      categories
    });
  };

  const fetchGeoData = async () => {
    // Get user distribution by country
    const { data: countryData, error } = await supabase
      .from('profiles')
      .select('country')
      .not('country', 'is', null);

    if (error) {
      console.error('Error fetching geo data:', error);
      return;
    }

    // Count users by country
    const countryCount: { [key: string]: number } = {};
    countryData?.forEach(profile => {
      if (profile.country) {
        countryCount[profile.country] = (countryCount[profile.country] || 0) + 1;
      }
    });

    // Sort countries by count
    const sortedCountries = Object.entries(countryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 countries

    setGeoData({
      countries: sortedCountries.map(([country]) => country),
      counts: sortedCountries.map(([, count]) => count)
    });
  };

  // Enhanced forex-style chart configurations
  const userGrowthChart = {
    labels: userGrowth.dates,
    datasets: [
      {
        label: 'User Growth',
        data: userGrowth.counts,
        fill: 'start',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          
          if (!chartArea) {
            return null;
          }
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(79, 70, 229, 0.8)');
          gradient.addColorStop(0.5, 'rgba(79, 70, 229, 0.4)');
          gradient.addColorStop(1, 'rgba(79, 70, 229, 0.05)');
          return gradient;
        },
        borderColor: primaryColor,
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: primaryColor,
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: primaryColor,
        pointHoverBorderWidth: 4,
        // Add shadow effect
        shadowColor: 'rgba(79, 70, 229, 0.3)',
        shadowBlur: 10,
        shadowOffsetY: 4
      }
    ]
  };

  const userGrowthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(79, 70, 229, 0.8)',
        borderWidth: 2,
        padding: 16,
        boxPadding: 8,
        cornerRadius: 12,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            const value = context.parsed.y;
            const growth = context.dataIndex > 0 ? 
              context.dataset.data[context.dataIndex] - context.dataset.data[context.dataIndex - 1] : 0;
            return [
              `Total Users: ${value.toLocaleString()}`,
              growth > 0 ? `+${growth} new users` : 'No new users'
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          lineWidth: 1,
        },
        border: {
          display: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
            weight: '500' as const
          },
          padding: 12,
          callback: function(value: any) {
            return value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        border: {
          color: 'rgba(148, 163, 184, 0.2)'
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: '500' as const
          },
          padding: 8
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart' as const,
      delay: (context: any) => {
        return context.dataIndex * 100;
      }
    },
    elements: {
      line: {
        borderJoinStyle: 'round' as const,
        borderCapStyle: 'round' as const
      },
      point: {
        hoverBorderWidth: 4
      }
    }
  };

  const contentChart = {
    labels: Object.keys(contentMetrics.categories),
    datasets: [
      {
        label: 'Posts by Category',
        data: Object.values(contentMetrics.categories),
        backgroundColor: [
          primaryColor,
          accentColor,
          secondaryColor,
          tertiaryColor,
          'rgba(99, 102, 241, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
      }
    ]
  };

  const eventTypeChart = {
    labels: Object.keys(eventMetrics.categories),
    datasets: [
      {
        data: Object.values(eventMetrics.categories),
        backgroundColor: [
          secondaryColor,
          accentColor,
          tertiaryColor,
          primaryColor,
          'rgba(99, 102, 241, 0.8)'
        ],
        borderWidth: 1
      }
    ]
  };



  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative">
      {loading && (
        <motion.div
          className="absolute inset-0 z-10 bg-white"
          initial={{ opacity: 1 }}
          animate={{ 
            opacity: showContent ? 0 : 1,
          }}
          transition={{ duration: 0.5 }}
        >
          <LoadingScreen />
        </motion.div>
      )}
      
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate={showContent ? "visible" : "hidden"}
      >
        <motion.div 
          className="flex justify-between items-center mb-6" 
          variants={itemVariants}
        >
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimeFrame('6months')}
              className={`px-4 py-2 text-sm rounded-md ${
                timeFrame === '6months'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 6 Months
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimeFrame('12months')}
              className={`px-4 py-2 text-sm rounded-md ${
                timeFrame === '12months'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 12 Months
            </motion.button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div variants={itemVariants} whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <Card className="bg-gradient-to-br from-primary to-purple-700 text-white relative overflow-hidden">
              <motion.div
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 45 }}
                transition={{ delay: 0.2, type: "spring" }}
              />
              <div className="p-4 relative z-10">
                <h3 className="text-lg font-semibold mb-1 text-white/90">Total Users</h3>
                <motion.p 
                  className="text-3xl font-bold"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {userGrowth.counts[userGrowth.counts.length - 1] || 0}
                </motion.p>
                <div className="mt-2 text-sm text-white/80">
                  {userGrowth.counts.length > 1 && userGrowth.counts[userGrowth.counts.length - 2] > 0 ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      {Math.round(
                        ((userGrowth.counts[userGrowth.counts.length - 1] - userGrowth.counts[userGrowth.counts.length - 2]) /
                          userGrowth.counts[userGrowth.counts.length - 2]) *
                          100
                      )}% growth this month
                    </motion.span>
                  ) : (
                    <span>New users this month</span>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <Card className="bg-gradient-to-br from-accent to-pink-700 text-white relative overflow-hidden">
              <motion.div
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 45 }}
                transition={{ delay: 0.3, type: "spring" }}
              />
              <div className="p-4 relative z-10">
                <h3 className="text-lg font-semibold mb-1 text-white/90">Content</h3>
                <motion.p 
                  className="text-3xl font-bold"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {contentMetrics.total}
                </motion.p>
                <div className="mt-2 text-sm text-white/80">
                  {contentMetrics.published} published, {contentMetrics.draft} drafts
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <Card className="bg-gradient-to-br from-secondary to-green-700 text-white relative overflow-hidden">
              <motion.div
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 45 }}
                transition={{ delay: 0.4, type: "spring" }}
              />
              <div className="p-4 relative z-10">
                <h3 className="text-lg font-semibold mb-1 text-white/90">Events</h3>
                <motion.p 
                  className="text-3xl font-bold"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  {eventMetrics.upcoming + eventMetrics.past}
                </motion.p>
                <div className="mt-2 text-sm text-white/80">
                  {eventMetrics.upcoming} upcoming, {eventMetrics.past} past
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <Card className="bg-gradient-to-br from-gray-700 to-gray-900 text-white relative overflow-hidden">
              <motion.div
                className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 45 }}
                transition={{ delay: 0.5, type: "spring" }}
              />
              <div className="p-4 relative z-10">
                <h3 className="text-lg font-semibold mb-1 text-white/90">Countries</h3>
                <motion.p 
                  className="text-3xl font-bold"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  {geoData.countries.length}
                </motion.p>
                <div className="mt-2 text-sm text-white/80">
                  User presence worldwide
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            variants={itemVariants}
            className="h-full"
            whileHover={{ 
              y: -5, 
              transition: { duration: 0.2 },
              boxShadow: "0px 10px 30px -5px rgba(0, 0, 0, 0.1)" 
            }}
          >
            <Card title={
              <div className="flex items-center space-x-2">
                <span>User Growth Over Time</span>
                <motion.div 
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            }>
              <motion.div 
                className="p-4 h-80"
                variants={chartVariants}
                initial="hidden"
                animate={chartVisible ? "visible" : "hidden"}
              >
                <Line data={userGrowthChart} options={userGrowthOptions} />
              </motion.div>
            </Card>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="h-full"
            whileHover={{ 
              y: -5, 
              transition: { duration: 0.2 },
              boxShadow: "0px 10px 30px -5px rgba(0, 0, 0, 0.1)" 
            }}
          >
            <GeographicalDistribution 
              geoData={geoData} 
              isVisible={chartVisible}
            />
          </motion.div>
        </div>

        {/* Charts Row 2 - Enhanced Modern Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            variants={itemVariants}
            className="h-full"
            whileHover={{ 
              y: -5, 
              transition: { duration: 0.2 },
              boxShadow: "0px 15px 35px -5px rgba(79, 70, 229, 0.15)" 
            }}
          >
            <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-xl overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Content Categories</h3>
                      <p className="text-sm text-gray-500">Distribution by type</p>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="flex items-center space-x-2 bg-primary/10 px-3 py-1 rounded-xl"
                    animate={{ 
                      backgroundColor: ["rgba(79, 70, 229, 0.1)", "rgba(79, 70, 229, 0.15)", "rgba(79, 70, 229, 0.1)"]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs text-primary font-semibold">ACTIVE</span>
                  </motion.div>
                </div>
              </div>
              
              <motion.div 
                className="relative px-6 pb-6 h-80"
                variants={chartVariants}
                initial="hidden"
                animate={chartVisible ? "visible" : "hidden"}
              >
                <div className="relative h-full flex items-center justify-center">
                  <div className="w-72 h-72 relative">
                    <Doughnut
                      data={contentChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#1f2937',
                            bodyColor: '#4b5563',
                            borderColor: 'rgba(79, 70, 229, 0.2)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                              label: function(context: any) {
                                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                              }
                            }
                          }
                        },
                        cutout: '70%',
                        animation: {
                          animateRotate: true,
                          duration: 2000,
                          easing: 'easeInOutQuart'
                        }
                      }}
                    />
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-2xl font-bold text-gray-900">{contentMetrics.total}</div>
                      <div className="text-xs text-gray-500 font-medium">Total Posts</div>
                    </div>
                  </div>
                  
                  {/* Custom legend */}
                  <div className="absolute bottom-0 left-0 right-0">
                    <div className="flex flex-wrap justify-center gap-3">
                      {Object.entries(contentMetrics.categories).map(([category, count], index) => (
                        <motion.div 
                          key={category}
                          className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.5 }}
                        >
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: [primaryColor, accentColor, secondaryColor, tertiaryColor, 'rgba(99, 102, 241, 0.8)', 'rgba(139, 92, 246, 0.8)'][index % 6]
                            }}
                          />
                          <span className="text-xs font-medium text-gray-700">{category}</span>
                          <span className="text-xs text-gray-500">({count})</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Card>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="h-full"
            whileHover={{ 
              y: -5, 
              transition: { duration: 0.2 },
              boxShadow: "0px 15px 35px -5px rgba(16, 185, 129, 0.15)" 
            }}
          >
            <Card className="bg-gradient-to-br from-white to-emerald-50/30 border-0 shadow-xl overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Event Types</h3>
                      <p className="text-sm text-gray-500">Event distribution</p>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="flex items-center space-x-2 bg-emerald-500/10 px-3 py-1 rounded-xl"
                    animate={{ 
                      backgroundColor: ["rgba(16, 185, 129, 0.1)", "rgba(16, 185, 129, 0.15)", "rgba(16, 185, 129, 0.1)"]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-emerald-500"
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs text-emerald-600 font-semibold">LIVE</span>
                  </motion.div>
                </div>
              </div>
              
              <motion.div 
                className="relative px-6 pb-6 h-80"
                variants={chartVariants}
                initial="hidden"
                animate={chartVisible ? "visible" : "hidden"}
              >
                <div className="relative h-full flex items-center justify-center">
                  <div className="w-72 h-72 relative">
                    <Doughnut
                      data={eventTypeChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#1f2937',
                            bodyColor: '#4b5563',
                            borderColor: 'rgba(16, 185, 129, 0.2)',
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: true,
                            callbacks: {
                              label: function(context: any) {
                                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                              }
                            }
                          }
                        },
                        cutout: '70%',
                        animation: {
                          animateRotate: true,
                          duration: 2000,
                          easing: 'easeInOutQuart'
                        }
                      }}
                    />
                    
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-2xl font-bold text-gray-900">{eventMetrics.upcoming + eventMetrics.past}</div>
                      <div className="text-xs text-gray-500 font-medium">Total Events</div>
                    </div>
                  </div>
                  
                  {/* Custom legend */}
                  <div className="absolute bottom-0 left-0 right-0">
                    <div className="flex flex-wrap justify-center gap-3">
                      {Object.entries(eventMetrics.categories).map(([category, count], index) => (
                        <motion.div 
                          key={category}
                          className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.5 }}
                        >
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: [secondaryColor, accentColor, tertiaryColor, primaryColor, 'rgba(99, 102, 241, 0.8)'][index % 5]
                            }}
                          />
                          <span className="text-xs font-medium text-gray-700">{category}</span>
                          <span className="text-xs text-gray-500">({count})</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;