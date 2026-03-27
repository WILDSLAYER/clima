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
// FUNCIÓN PRINCIPAL - Buscar por ciudad
// ======================
async function buscarClima() {
    const ciudad = searchInput.value.trim();

    if (ciudad === "") {
        mostrarError("Por favor escribe el nombre de una ciudad");
        return;
    }

    await obtenerClimaPorCoordenadas(null, null, ciudad); // reutilizamos la función de abajo
}

// ======================
// FUNCIÓN CORREGIDA - Usar mi ubicación actual
function usarMiUbicacion() {
    if (!navigator.geolocation) {
        mostrarError("Tu navegador no soporta geolocalización");
        return;
    }

    mostrarLoading(true);
    ocultarError();

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            console.log("Ubicación obtenida:", lat, lon);

            // Obtener el nombre real de la ciudad mediante geocodificación inversa
            let nombreCiudad = "Tu ubicación";
            try {
                // Usar la API de reverse geocoding de Nominatim (OpenStreetMap)
                const revRes = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`
                );
                const revData = await revRes.json();
                if (revData && revData.address) {
                    nombreCiudad = revData.address.city || revData.address.town || revData.address.village || revData.address.municipality || "Tu ubicación";
                }
            } catch (e) {
                console.warn("No se pudo obtener el nombre de la ciudad:", e);
            }

            await obtenerClimaPorCoordenadas(lat, lon, nombreCiudad);
        },
        (error) => {
            let mensaje = "No se pudo obtener tu ubicación.";
            
            if (error.code === 1) mensaje = "Permiso denegado. Activa la ubicación en tu navegador.";
            else if (error.code === 2) mensaje = "Ubicación no disponible.";
            else if (error.code === 3) mensaje = "Tiempo de espera agotado.";

            mostrarError(mensaje);
            mostrarLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// ======================
// FUNCIÓN CENTRAL: Obtener clima por coordenadas (reutilizable)
// ======================
async function obtenerClimaPorCoordenadas(lat, lon, nombreCiudad) {
    try {
        mostrarLoading(true);
        ocultarError();

        let url;

        if (lat && lon) {
            // Si tenemos coordenadas (desde geolocalización)
            url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                  `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
                  `&minutely_15=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
                  `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
                  `&timezone=auto&forecast_days=6&cell_selection=nearest`;
        } else {
            // Si viene desde búsqueda por nombre → primero buscamos coordenadas
            const geoResponse = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${nombreCiudad}&count=1&language=es`
            );
            const geoData = await geoResponse.json();

            if (!geoData.results || geoData.results.length === 0) {
                throw new Error("No se encontró la ciudad.");
            }

            const location = geoData.results[0];
            lat = location.latitude;
            lon = location.longitude;
            nombreCiudad = location.name;

            url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                  `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
                  `&minutely_15=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
                  `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
                  `&timezone=auto&forecast_days=6&cell_selection=nearest`;
        }

        // Obtener datos del clima
        const weatherResponse = await fetch(url);
        const weatherData = await weatherResponse.json();

        // Mostrar resultados
        mostrarClimaActual(weatherData, nombreCiudad);
        mostrarPronostico(weatherData);

    } catch (error) {
        console.error("Error:", error);
        mostrarError(error.message || "Error al obtener el clima");
    } finally {
        mostrarLoading(false);
    }
}

// ======================
// MOSTRAR CLIMA ACTUAL
// ======================
function mostrarClimaActual(data, ciudad) {
    // Intentar usar datos de 15 minutos (más precisos y actualizados)
    let temp, humidity, apparentTemp, weatherCode, windSpeed;

    if (data.minutely_15 && data.minutely_15.time && data.minutely_15.time.length > 0) {
        // Buscar el dato más reciente (más cercano a la hora actual)
        const ahora = new Date();
        let indiceMasCercano = 0;
        let menorDiferencia = Infinity;

        for (let i = 0; i < data.minutely_15.time.length; i++) {
            const diff = Math.abs(new Date(data.minutely_15.time[i]) - ahora);
            if (diff < menorDiferencia) {
                menorDiferencia = diff;
                indiceMasCercano = i;
            }
        }

        const m15 = data.minutely_15;
        temp = m15.temperature_2m[indiceMasCercano];
        humidity = m15.relative_humidity_2m[indiceMasCercano];
        apparentTemp = m15.apparent_temperature[indiceMasCercano];
        weatherCode = m15.weather_code[indiceMasCercano];
        windSpeed = m15.wind_speed_10m[indiceMasCercano];
    } else {
        // Fallback a datos "current"
        const current = data.current;
        temp = current.temperature_2m;
        humidity = current.relative_humidity_2m;
        apparentTemp = current.apparent_temperature;
        weatherCode = current.weather_code;
        windSpeed = current.wind_speed_10m;
    }

    cityNameEl.textContent = ciudad;
    tempEl.textContent = Math.round(temp);
    
    const iconoGrande = obtenerEmojiGrande(weatherCode);
    descriptionEl.innerHTML = `${iconoGrande} ${obtenerDescripcion(weatherCode)}`;

    humidityEl.textContent = humidity + "%";
    windEl.textContent = Math.round(windSpeed) + " km/h";
    feelsLikeEl.textContent = Math.round(apparentTemp) + "°C";

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
// AUXILIARES
// ======================
function obtenerDescripcion(code) {
    const descripciones = {
        0: "Despejado", 1: "Mayormente despejado", 2: "Parcialmente nublado",
        3: "Nublado", 45: "Niebla", 48: "Niebla con escarcha",
        51: "Llovizna ligera", 53: "Llovizna moderada", 55: "Llovizna densa",
        56: "Llovizna helada ligera", 57: "Llovizna helada densa",
        61: "Lluvia ligera", 63: "Lluvia moderada", 65: "Lluvia fuerte",
        66: "Lluvia helada ligera", 67: "Lluvia helada fuerte",
        71: "Nieve ligera", 73: "Nieve moderada", 75: "Nieve fuerte",
        77: "Granizo fino",
        80: "Aguacero ligero", 81: "Aguacero moderado", 82: "Aguacero fuerte",
        85: "Nevada ligera", 86: "Nevada fuerte",
        95: "Tormenta", 96: "Tormenta con granizo ligero", 99: "Tormenta con granizo fuerte"
    };
    return descripciones[code] || "Clima variable";
}

function obtenerEmojiGrande(code) {
    const emojis = {
        0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
        45: "🌫️", 48: "🌫️",
        51: "🌦️", 53: "🌦️", 55: "🌦️",
        56: "🌧️", 57: "🌧️",
        61: "🌧️", 63: "🌧️", 65: "🌧️",
        66: "🌧️", 67: "🌧️",
        71: "🌨️", 73: "🌨️", 75: "🌨️",
        77: "🌨️",
        80: "🌧️", 81: "🌧️", 82: "🌧️",
        85: "🌨️", 86: "🌨️",
        95: "⛈️", 96: "⛈️", 99: "⛈️"
    };
    return emojis[code] || "🌥️";
}

function obtenerEmoji(code) {
    return obtenerEmojiGrande(code);
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

// ======================
// EVENTOS
// ======================
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        buscarClima();
    }
});