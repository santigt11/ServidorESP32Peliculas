document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Obtener el ID de la película de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');
        
        if (!movieId) {
            throw new Error('ID de película no encontrado');
        }

        await cargarDetallesPelicula(movieId);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los detalles de la película');
    }
});

const cargarDetallesPelicula = async (movieId) => {
    try {
        // Usamos el parámetro 'movie_id' para la solicitud de la API
        const url = `https://yts.mx/api/v2/movie_details.json?movie_id=${movieId}&with_images=true&with_cast=true`;
        
        console.log('URL de la API:', url);  // Verificar la URL generada

        const respuesta = await fetch(url);

        if (respuesta.status === 200) {
            const datos = await respuesta.json();
            const pelicula = datos.data.movie;

            // Verificar si la respuesta contiene la información correcta
            console.log('Respuesta de la API:', pelicula);

            // Mostrar los detalles de la película
            actualizarContenidoPelicula(pelicula);
        } else {
            throw new Error('No se encontraron detalles de la película');
        }
    } catch (error) {
        console.log("Error al obtener detalles de la película:", error);
        mostrarError('No se pudieron cargar los detalles de la película');
    }
};

const actualizarContenidoPelicula = (peliculaYTS) => {
    const contenedorDetalle = document.getElementById('contenedorDetalle');
    
    // Obtener datos de la película
    const posterPath = peliculaYTS.medium_cover_image || 'ruta-a-imagen-por-defecto.jpg';
    const synopsis = peliculaYTS.synopsis || 'No hay sinopsis disponible.';
    const cast = peliculaYTS.cast || [];

    // Mostrar los detalles de la película con nueva estructura
    contenedorDetalle.innerHTML = `
        <div class="pelicula-contenedor">
            <div class="pelicula-header">
                <!-- Columna izquierda con poster -->
                <div class="poster-container">
                    <img class="poster" src="${posterPath}" alt="${peliculaYTS.title}">
                </div>
                
                <!-- Columna derecha con información -->
                <div class="info-container">
                    <h1 class="titulo">${peliculaYTS.title}</h1>
                    
                    <div class="info-adicional">
                        <p><strong>Fecha de estreno:</strong> ${peliculaYTS.year || 'No disponible'}</p>
                        <p><strong>Puntuación:</strong> ${peliculaYTS.rating || 'No disponible'}/10</p>
                        <p><strong>Sinopsis:</strong> ${synopsis}</p>
                    </div>

                    <div class="elenco">
                        <h3>Elenco</h3>
                        ${cast.length > 0 ? 
                            cast.map(actor => `
                                <p><strong>${actor.name}</strong> - ${actor.character_name}</p>`).join('') : 
                            `<p>No hay información de elenco disponible.</p>`}
                    </div>

                    <!-- Selector de calidad -->
                    <div class="selector-calidad">
                        <h3>Calidad a reproducir</h3>
                        <select id="torrentSelect">
                            <option value="">Selecciona la calidad</option>
                            ${peliculaYTS.torrents && peliculaYTS.torrents.length > 0 ? 
                                peliculaYTS.torrents.map(torrent => `
                                    <option value="${torrent.hash}">${torrent.quality} - ${torrent.size}</option>`).join('') : 
                                `<option disabled>No hay calidades disponibles</option>`}
                        </select>
                    </div>
                </div>
            </div>

            <!-- Contenedor del reproductor -->
            <div class="player-container">
                <div id="player" class="webtor"></div>
            </div>
        </div>
    `;

    // Mover el recuadro de reproducción dentro del player
    const playerContainer = document.getElementById('player');
    const recuadroReproducir = document.getElementById('recuadroReproducir');
    if (recuadroReproducir) {
        playerContainer.appendChild(recuadroReproducir);
    }

    // Event listener para el selector de calidad
    const torrentSelect = document.getElementById('torrentSelect');
    torrentSelect.addEventListener('change', (event) => {
        const selectedHash = event.target.value;
        if (selectedHash) {
            const selectedTorrent = peliculaYTS.torrents.find(torrent => torrent.hash === selectedHash);
            const trackers = [
                'udp://tracker.opentrackr.org:1337/announce',
                'udp://open.tracker.cl:1337/announce',
                'udp://p4p.arenabg.com:1337/announce',
                'udp://tracker.torrent.eu.org:451/announce',
                'udp://tracker.dler.org:6969/announce',
                'udp://open.stealth.si:80/announce',
                'udp://ipv4.tracker.harry.lu:80/announce',
                'https://opentracker.i2p.rocks:443/announce'
            ];
            const magnetURL = `magnet:?xt=urn:btih:${selectedTorrent.hash.toLowerCase()}&dn=${encodeURIComponent(peliculaYTS.title)}&tr=${trackers.join('&tr=')}`;
            localStorage.setItem('magnetLink', magnetURL);
        }
    });
};


// Función para cargar el iframe con el enlace del torrent
const cargarIframe = (magnetURL) => {
    const contenedorDetalle = document.getElementById('contenedorDetalle');
    
    let iframeContainer = document.getElementById('iframeContainer');
    if (!iframeContainer) {
        iframeContainer = document.createElement('div');
        iframeContainer.id = 'iframeContainer';
        contenedorDetalle.appendChild(iframeContainer);
    }

    const encodedMagnetURL = encodeURIComponent(magnetURL);
    const iframeSrc = `https://webtor.io/api/v1/torrent?url=${encodedMagnetURL}&mode=video`;

    iframeContainer.innerHTML = ` 
        <iframe id="webtor-player" width="100%" allowfullscreen="" webkitallowfullscreen="" 
            mozallowfullscreen="" scrolling="no" frameborder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; fullscreen; picture-in-picture"
            src="${iframeSrc}" style="overflow: hidden; height: 400px; width: 100%;"></iframe>
    `;
};

const redirigirAMirarAhora = (hashTorrent) => {
    const hashEnMinusculas = hashTorrent === hashTorrent.toLowerCase() ? hashTorrent : hashTorrent.toLowerCase();
    window.location.href = `https://webtor.io/${hashEnMinusculas}`;
};

const mostrarError = (mensaje) => {
    const contenedorDetalle = document.getElementById('contenedorDetalle');
    contenedorDetalle.innerHTML = ` 
        <div class="error">
            <p>${mensaje}</p>
        </div>
    `;
};
