import React, { useState, useEffect } from 'react'; // useEffect is needed for initial background
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_KEY = "d34d1cbe248782556ada85ba143954ca"; // <<< REPLACE THIS WITH YOUR API KEY <<<

function App() {
  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecastChartData, setForecastChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Function to set the background based on weather condition ---
  const setWeatherBackground = (condition) => {
    const body = document.body;
    const weatherImageClasses = [
      'bg-clear', 'bg-clouds', 'bg-rain',
      'bg-drizzle', 'bg-snow', 'bg-thunderstorm', 'bg-atmosphere'
    ];

    // Remove all existing image-based background classes
    weatherImageClasses.forEach(className => body.classList.remove(className));

    // Add the appropriate class based on the normalized condition
    switch (condition.toLowerCase()) {
      case 'clear':
        body.classList.add('bg-clear');
        break;
      case 'clouds':
        body.classList.add('bg-clouds');
        break;
      case 'rain':
        body.classList.add('bg-rain');
        break;
      case 'drizzle':
        body.classList.add('bg-drizzle');
        break;
      case 'snow':
        body.classList.add('bg-snow');
        break;
      case 'thunderstorm':
        body.classList.add('bg-thunderstorm');
        break;
      case 'mist':
      case 'smoke':
      case 'haze':
      case 'dust':
      case 'fog':
      case 'sand':
      case 'ash':
      case 'squall':
      case 'tornado':
      case 'atmosphere': 
        body.classList.add('bg-atmosphere');
        break;
      default:
        // If 'default' or unknown, no specific weather class is added.
        // The body's default background-image (from index.css) will show.
        break;
    }
  };

  // Set initial background state (ensures default static image from CSS is shown)
  useEffect(() => {
    setWeatherBackground('default'); // This will remove any .bg- classes
  }, []);


  const getWeather = async () => {
    setLoading(true);
    setError(null);
    setWeatherData(null);
    setForecastChartData({ labels: [], datasets: [] });
    setWeatherBackground('default'); // Reset to default static image (from CSS) while loading

    if (!city) {
      setError('Please enter a city name.');
      setLoading(false);
      return;
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    try {
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(forecastUrl)
      ]);

      if (!weatherRes.ok || !forecastRes.ok) {
        const errorData = await weatherRes.json();
        throw new Error(errorData.message || "City not found or API error");
      }

      const currentWeatherData = await weatherRes.json();
      const forecastWeatherData = await forecastRes.json();

      // --- Set dynamic background based on current weather ---
      const weatherConditionMain = currentWeatherData.weather[0].main;
      setWeatherBackground(weatherConditionMain); // This will add a .bg- class
      // --- End Dynamic Background Logic ---

      setWeatherData(currentWeatherData);

      const labels = forecastWeatherData.list.slice(0, 8).map(entry =>
        new Date(entry.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      const temps = forecastWeatherData.list.slice(0, 8).map(entry => entry.main.temp);
      
      setForecastChartData({
        labels: labels,
        datasets: [{
          label: 'Temperature (°C)',
          data: temps,
          borderColor: 'rgba(123, 220, 181, 0.9)',
          backgroundColor: 'rgba(123, 220, 181, 0.2)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(123, 220, 181, 1)',
          pointBorderColor: '#fff',
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(123, 220, 181, 1)',
        }]
      });

    } catch (err) {
      console.error("Error fetching weather data:", err);
      setError(`Error fetching weather data. ${err.message}`);
      setWeatherBackground('default'); // Revert to default static image (from CSS) on error
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = { /* ... same as before ... */ 
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#e0e0e0' }, grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false } },
      y: { beginAtZero: false, ticks: { color: '#e0e0e0', stepSize: 5 }, grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false } }
    },
    plugins: {
      legend: { labels: { color: '#e0e0e0' } },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(123, 220, 181, 0.7)',
        borderWidth: 1
      }
    }
  };

  const showChart = forecastChartData.labels && forecastChartData.labels.length > 0 && !loading && !error;

  // JSX for rendering remains the same as the previous version
  return (
    <div className="container">
      <h1>Weather Forecast</h1>
      <input
        type="text"
        id="cityInput"
        placeholder="Enter City Name"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        onKeyPress={(e) => { if (e.key === 'Enter') getWeather(); }}
      />
      <button onClick={getWeather} disabled={loading}>
        {loading ? 'Loading...' : 'Get Weather'}
      </button>

      {error && (<div id="weatherDisplay" style={{ display: 'block' }}><p className="error">{error}</p></div>)}
      
      {weatherData && !loading && !error && (
        <div id="weatherDisplay" style={{ display: 'block' }}>
          <h2>{weatherData.name}, {weatherData.sys.country}</h2>
          <p><strong>Temperature:</strong> {weatherData.main.temp.toFixed(1)}°C</p>
          <p><strong>Condition:</strong> {weatherData.weather[0].description.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
          <p><strong>Humidity:</strong> {weatherData.main.humidity}%</p>
          <p><strong>Wind:</strong> {weatherData.wind.speed.toFixed(1)} m/s</p>
        </div>
      )}
      
      {showChart && (
        <div id="forecastChart" style={{ display: 'block', height: '250px', width: '100%' }}>
          <Line data={forecastChartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}

export default App;