import { useEffect, useState } from "react";

// Hook usado por GridBoard para consultar fotos y escudos sin incluir la búsqueda en cada celda.
// TheSportsDB es una API externa; esta integración no aparece en los apuntes de clase.
// Caché compartida para evitar repetir búsquedas de la misma imagen en la sesión.
const cache = {};
// Configura la URL, la propiedad que contiene resultados y las imágenes de respaldo por tipo.
const CONFIG = {
    player: { url: (n) => `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(n)}`, lista: "player", campos: ["strCutout", "strThumb"] },
    team: { url: (n) => `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(n)}`, lista: "teams", campos: ["strBadge", "strThumb"] },
};

// Busca una imagen en el navegador y devuelve una cadena vacía mientras no haya resultado.
export default function useSportsDbImage(tipo, nombre) {
    // La URL se consulta una sola vez y se devuelve desde la caché al reutilizarla.
    const clave = `${tipo}:${nombre}`;
    const [imagenes, setImagenes] = useState({});

    useEffect(() => {
        // Sin nombre no hay consulta; la URL se deriva como cadena vacía abajo.
        if (!nombre || cache[clave] !== undefined) return;

        let activo = true;
        const { url, lista, campos } = CONFIG[tipo];
        fetch(url(nombre))
            .then((r) => r.json())
            .then((d) => {
                const item = d?.[lista]?.[0];
                const img = item ? campos.map((c) => item[c]).find(Boolean) || "" : "";
                cache[clave] = img;
                if (activo) {
                    setImagenes((prev) => ({ ...prev, [clave]: img }));
                }
            })
            .catch(() => {
                // Guardar el resultado vacío evita repetir una consulta fallida.
                cache[clave] = "";
                if (activo) setImagenes((prev) => ({ ...prev, [clave]: "" }));
            });
        return () => { activo = false; };
    }, [clave, tipo, nombre]);

    // El valor se deriva de la caché o del estado de la consulta actual.
    return nombre ? (cache[clave] ?? imagenes[clave] ?? "") : "";
}
