// Normalización compartida para que la búsqueda y validación ignoren variantes de escritura.
export function normalizarTexto(texto) {
  return String(texto || "")
    .replace(/[Øø]/g, "o")
    .replace(/[Ææ]/g, "ae")
    .replace(/[Œœ]/g, "oe")
    .replace(/[ßẞ]/g, "ss")
    .replace(/[Łł]/g, "l")
    .replace(/[ĐđÐð]/g, "d")
    .replace(/[Þþ]/g, "th")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Wordle compara letras pegadas; el resto de búsquedas conserva los espacios.
export function normalizarPalabra(texto) {
  return normalizarTexto(texto).replace(/[^a-z0-9]/g, "").toUpperCase();
}
