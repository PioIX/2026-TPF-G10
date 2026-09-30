// Componente COMPUESTO: combina Title + Button (dos componentes más chicos)
// para armar algo más grande. No usa hooks directamente, así que no necesita
// "use client" (Button sí lo tiene, y eso alcanza).
import Title from "./Title";
import Button from "./Button";

export default function FormularioBase({ title, buttonText, onButtonClick }) {
  return (
    <div>
      <Title text={title} />
      <div>
        <input
          type="text"
          placeholder="Ingresa tu nombre"
        />
        <input
          type="email"
          placeholder="Ingresa tu email"
        />
      </div>
      <Button text={buttonText} onClick={onButtonClick} />
    </div>
  );
}
