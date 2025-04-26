let pagina = 1;
const btnAnterior = document.getElementById("btnAnterior");
const btnSiguiente = document.getElementById("btnSiguiente");

btnSiguiente.addEventListener("click", () => {
    if (pagina < 1000) {
        pagina += 1;
        obtenerPeliculasFamilia();
    }
});

btnAnterior.addEventListener("click", () => {
    if (pagina > 1) {
        pagina -= 1;
        obtenerPeliculasFamilia();
    }
});

const obtenerPeliculasFamilia = async () => {
    try {
        // Usamos la API de YTS para obtener las películas familiares
        const respuesta = await fetch(`https://yts.mx/api/v2/list_movies.json?genre=family&page=${pagina}`);
        
        if (respuesta.status === 200) {
            const datos = await respuesta.json();
            let peliculas = "";

            datos.data.movies.forEach(pelicula => {
                // Filtrar películas con títulos inapropiados
                if (pelicula.title.toLowerCase().includes("xxx") || pelicula.title.toLowerCase().includes("adult")) {
                    return; // Salir de la iteración si la película tiene contenido inapropiado
                }

                // En YTS, la imagen de la película está en `medium_cover_image`
                peliculas += `
                    <div class="pelicula" onclick="window.location.href='pelicula.html?id=${pelicula.id}'">
                        <img class="poster" src="${pelicula.medium_cover_image}" alt="${pelicula.title}">
                    </div>
                `;
            });
            
            document.getElementById("contenedor").innerHTML = peliculas;
        }
    } catch (error) {
        console.log("Error en la petición:", error);
    }
};


document.getElementById('btnBuscar').addEventListener('click', realizarBusqueda);
document.getElementById('inputBusqueda').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        realizarBusqueda();
    }
});

async function realizarBusqueda() {
    const busqueda = document.getElementById('inputBusqueda').value.trim();
    
    if (busqueda === '') {
        // Si la búsqueda está vacía, mostrar las películas populares
        obtenerPeliculasFamilia();
        return;
    }

    try {
        // Usamos la API de YTS para realizar la búsqueda
        const respuesta = await fetch(
            `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(busqueda)}`
        );

        if (!respuesta.ok) {
            throw new Error('Error en la búsqueda');
        }

        const datos = await respuesta.json();
        
        let peliculas = "";
        
        if (datos.data.movies.length === 0) {
            document.getElementById('contenedor').innerHTML = `
                <div class="no-resultados">
                    <p>No se encontraron películas para "${busqueda}"</p>
                </div>
            `;
            return;
        }

        datos.data.movies.forEach(pelicula => {
            // En YTS, la imagen de la película está en `medium_cover_image`
            peliculas += `
                <div class="pelicula" onclick="window.location.href='pelicula.html?id=${pelicula.id}'">
                    <img class="poster" 
                         src="${pelicula.medium_cover_image}" 
                         alt="${pelicula.title}">
                </div>
            `;
        });

        document.getElementById('contenedor').innerHTML = peliculas;

    } catch (error) {
        console.error('Error en la búsqueda:', error);
        document.getElementById('contenedor').innerHTML = `
            <div class="error">
                <p>Error al realizar la búsqueda. Por favor, intenta de nuevo.</p>
            </div>
        `;
    }
}

obtenerPeliculasFamilia();
