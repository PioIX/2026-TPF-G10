import { useEffect, useState } from "react";

const cache = {};
const CONFIG = {
    player: { url: (n) => `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(n)}`, lista: "player", campos: ["strCutout", "strThumb"] },
    team: { url: (n) => `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(n)}`, lista: "teams", campos: ["strBadge", "strThumb"] },
};

export default function useSportsDbImage(tipo, nombre) {
    const clave = `${tipo}:${nombre}`;
    const [src, setSrc] = useState(cache[clave] ?? "");

    useEffect(() => {
        if (!nombre) { setSrc(""); return; }
        if (cache[clave] !== undefined) { setSrc(cache[clave]); return; }
        let activo = true;
        const { url, lista, campos } = CONFIG[tipo];
        fetch(url(nombre))
            .then((r) => r.json())
            .then((d) => {
                const item = d?.[lista]?.[0];
                const img = item ? campos.map((c) => item[c]).find(Boolean) || "" : "";
                cache[clave] = img;
                if (activo) setSrc(img);
            })
            .catch(() => activo && setSrc(""));
        return () => { activo = false; };
    }, [clave, tipo, nombre]);

    return src;
}