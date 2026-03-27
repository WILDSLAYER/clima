// 1. Seleccionamos los elementos del HTML que vamos a manipular

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

// 2. Función principal: buscarClima
async function buscarClima() {
    console.log("Botón Buscar presionado");

    // Obtener lo que escribió el usuario
    const ciudad = searchInput.value.trim();

    // Validación básica
    if (ciudad === "") {
        mostrarError("Por favor escribe el nombre de una ciudad");
        return;
    }

    // Mostrar loading y ocultar error
    mostrarLoading(true);
    ocultarError();

    try {
        console.log("Buscando ciudad:", ciudad);

        // Aquí irá la llamada a la API (lo haremos en el siguiente paso)

        // Por ahora solo mostramos un mensaje de prueba
        cityNameEl.textContent = ciudad;
        weatherDiv.classList.remove('hidden');

    } catch (error) {
        mostrarError("Hubo un error: " + error.message);
    } finally {
        mostrarLoading(false);
    }
}

// Funciones auxiliares (helpers) para mostrar/ocultar cosas
function mostrarLoading(mostrar) {
    if (mostrar) {
        loading.classList.remove('hidden');
        weatherDiv.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function mostrarError(mensaje) {
    errorDiv.textContent = mensaje;
    errorDiv.classList.remove('hidden');
}

function ocultarError() {
    errorDiv.classList.add('hidden');
}

// Bonus: Permitir buscar presionando Enter
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        buscarClima();
    }
});