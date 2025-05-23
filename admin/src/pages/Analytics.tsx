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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { parseISO, format, startOfMonth, subMonths, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';
import typniLogo from '../assets/images/TYPNI-11.jpg';

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

  // Chart configurations
  const userGrowthChart = {
    labels: userGrowth.dates,
    datasets: [
      {
        label: 'User Growth',
        data: userGrowth.counts,
        fill: true,
        backgroundColor: primaryColorLight,
        borderColor: primaryColor,
        tension: 0.4,
        pointBackgroundColor: primaryColor,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const userGrowthOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        }
      },
      x: {
        grid: {
          display: false
        }
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

  const geoDataChart = {
    labels: geoData.countries,
    datasets: [
      {
        label: 'Users by Country',
        data: geoData.counts,
        backgroundColor: accentColor,
        borderColor: 'rgba(236, 72, 153, 0.8)',
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
            <Card title={
              <div className="flex items-center space-x-2">
                <span>Geographic Distribution</span>
                <motion.div 
                  className="w-2 h-2 rounded-full bg-accent"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                />
              </div>
            }>
              <motion.div 
                className="p-4 h-80"
                variants={chartVariants}
                initial="hidden"
                animate={chartVisible ? "visible" : "hidden"}
              >
                <Bar
                  data={geoDataChart}
                  options={{
                    indexAxis: 'y',
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    responsive: true,
                    scales: {
                      x: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(229, 231, 235, 0.5)'
                        }
                      },
                      y: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </motion.div>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
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
                <span>Content Categories</span>
                <motion.div 
                  className="w-2 h-2 rounded-full bg-secondary"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                />
              </div>
            }>
              <motion.div 
                className="p-4 h-64 flex justify-center"
                variants={chartVariants}
                initial="hidden"
                animate={chartVisible ? "visible" : "hidden"}
              >
                <div className="w-64">
                  <Doughnut
                    data={contentChart}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'right'
                        }
                      },
                      cutout: '60%'
                    }}
                  />
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
              boxShadow: "0px 10px 30px -5px rgba(0, 0, 0, 0.1)" 
            }}
          >
            <Card title={
              <div className="flex items-center space-x-2">
                <span>Event Types</span>
                <motion.div 
                  className="w-2 h-2 rounded-full bg-amber-500"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                />
              </div>
            }>
              <motion.div 
                className="p-4 h-64 flex justify-center"
                variants={chartVariants}
                initial="hidden"
                animate={chartVisible ? "visible" : "hidden"}
              >
                <div className="w-64">
                  <Doughnut
                    data={eventTypeChart}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'right'
                        }
                      },
                      cutout: '60%'
                    }}
                  />
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