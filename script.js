// script.js

// 1. Seleccionamos los elementos del HTML
const searchInput = document.getElementById('search-input');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const weatherDiv = document.getElementById('weather');

const cityNameEl = document.getElementById('city-name');
const tempEl = document.getElementById('temp');
const descriptionEl = document.getElementById('description');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const feelsLikeEl = document.getElementById('feels-like');
const forecastContainer = document.getElementById('forecast');

// ======================
// FUNCIÓN PRINCIPAL
// ======================
async function buscarClima() {
    const ciudad = searchInput.value.trim();

    if (ciudad === "") {
        mostrarError("Por favor escribe el nombre de una ciudad");
        return;
    }

    mostrarLoading(true);
    ocultarError();

    try {
        // PASO 1: Obtener coordenadas
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${ciudad}&count=1&language=es`
        );
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("No se encontró la ciudad. Intenta con otro nombre.");
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;
        const nombreReal = location.name;

        // PASO 2: Obtener el clima
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
            `&timezone=auto&forecast_days=6`;

        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        // Mostrar todo
        mostrarClimaActual(weatherData, nombreReal);
        mostrarPronostico(weatherData);

    } catch (error) {
        console.error("Error:", error);
        mostrarError(error.message || "Error al obtener el clima");
    } finally {
        mostrarLoading(false);
    }
}

// ======================
// MOSTRAR CLIMA ACTUAL (MEJORADO)
// ======================
function mostrarClimaActual(data, ciudad) {
    const current = data.current;

    cityNameEl.textContent = ciudad;
    tempEl.textContent = Math.round(current.temperature_2m);
    
    // Nueva línea: Icono grande según el clima
    const iconoGrande = obtenerEmojiGrande(current.weather_code);
    descriptionEl.innerHTML = `${iconoGrande} ${obtenerDescripcion(current.weather_code)}`;

    humidityEl.textContent = current.relative_humidity_2m + "%";
    windEl.textContent = Math.round(current.wind_speed_10m) + " km/h";
    feelsLikeEl.textContent = Math.round(current.apparent_temperature) + "°C";

    weatherDiv.classList.remove('hidden');
}

// ======================
// MOSTRAR PRONÓSTICO
// ======================
function mostrarPronostico(data) {
    forecastContainer.innerHTML = '';

    const days = data.daily.time;
    const maxTemps = data.daily.temperature_2m_max;
    const minTemps = data.daily.temperature_2m_min;
    const codes = data.daily.weather_code;

    for (let i = 1; i < 6; i++) {
        const fecha = new Date(days[i]);
        const diaNombre = fecha.toLocaleDateString('es-ES', { weekday: 'short' });

        const cardHTML = `
            <div class="forecast-card">
                <p><strong>${diaNombre}</strong></p>
                <p style="font-size: 2rem; margin: 8px 0;">${obtenerEmoji(codes[i])}</p>
                <p><strong>${Math.round(maxTemps[i])}°</strong> / ${Math.round(minTemps[i])}°</p>
            </div>
        `;

        forecastContainer.innerHTML += cardHTML;
    }
}

// ======================
// FUNCIONES AUXILIARES
// ======================
function obtenerDescripcion(code) {
    const descripciones = {
        0: "Despejado", 1: "Mayormente despejado", 2: "Parcialmente nublado",
        3: "Nublado", 45: "Niebla", 61: "Lluvia ligera", 63: "Lluvia moderada",
        65: "Lluvia fuerte", 95: "Tormenta", 96: "Tormenta con granizo",
        99: "Tormenta fuerte"
    };
    return descripciones[code] || "Clima variable";
}

// Icono grande para el clima actual
function obtenerEmojiGrande(code) {
    const emojis = {
        0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
        45: "🌫️", 48: "🌫️",
        51: "🌦️", 53: "🌦️", 55: "🌧️",
        61: "🌧️", 63: "🌧️", 65: "🌧️",
        71: "❄️", 73: "❄️", 75: "❄️",
        80: "🌦️", 81: "🌧️", 82: "⛈️",
        95: "⛈️", 96: "⛈️", 99: "⛈️"
    };
    return emojis[code] || "🌥️";
}

function obtenerEmoji(code) {
    return obtenerEmojiGrande(code); // reutilizamos la misma función
}

function mostrarLoading(mostrar) {
    loading.classList.toggle('hidden', !mostrar);
    if (mostrar) weatherDiv.classList.add('hidden');
}

function mostrarError(mensaje) {
    errorDiv.textContent = mensaje;
    errorDiv.classList.remove('hidden');
}

function ocultarError() {
    errorDiv.classList.add('hidden');
}

// Buscar con Enter
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        buscarClima();
    }
});