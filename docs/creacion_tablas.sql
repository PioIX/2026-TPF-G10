-- Tabla: Equipos
CREATE TABLE Equipos (
    id_equipo INT AUTO_INCREMENT PRIMARY KEY,
    nombre_equipo VARCHAR(100) NOT NULL,
    estadio VARCHAR(100),
    cantidad_socios INT DEFAULT 0,
    apodo VARCHAR(50),
    dt_actual VARCHAR(100),
    presidente VARCHAR(100),
    ciudad VARCHAR(100),
    titulos_internacionales INT DEFAULT 0,
    titulos_nacionales INT DEFAULT 0,
    anio_creacion INT
) ENGINE=InnoDB;

-- Tabla: Jugadores
CREATE TABLE Jugadores (
    id_jugador INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    id_equipo INT NOT NULL,
    valor_mercado BIGINT DEFAULT 0,
    dorsal_seleccion INT,
    dorsal_equipo INT,
    posicion VARCHAR(50),
    pais VARCHAR(50),
    CONSTRAINT fk_jugadores_equipos
        FOREIGN KEY (id_equipo) REFERENCES Equipos(id_equipo)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabla: Datos (Relación 1 a 1 con Jugadores)
CREATE TABLE Datos (
    id_datos INT AUTO_INCREMENT PRIMARY KEY,
    id_jugador INT NOT NULL UNIQUE,
    edad INT,
    altura DECIMAL(4,2),
    peso DECIMAL(5,2),
    pierna_habil VARCHAR(20),
    CONSTRAINT fk_datos_jugadores
        FOREIGN KEY (id_jugador) REFERENCES Jugadores(id_jugador)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabla: Estadisticas (Relación 1 a 1 con Jugadores)
CREATE TABLE Estadisticas (
    id_estadistica INT AUTO_INCREMENT PRIMARY KEY,
    id_jugador INT NOT NULL UNIQUE,
    goles INT DEFAULT 0,
    asistencias INT DEFAULT 0,
    titulos_equipo INT DEFAULT 0,
    titulos_seleccion INT DEFAULT 0,
    titulos_individuales INT DEFAULT 0,
    CONSTRAINT fk_estadisticas_jugadores
        FOREIGN KEY (id_jugador) REFERENCES Jugadores(id_jugador)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabla: Trayectoria
CREATE TABLE Trayectoria (
    id_trayectoria INT AUTO_INCREMENT PRIMARY KEY,
    id_jugador INT NOT NULL,
    id_equipo INT NOT NULL,
    anio_ingreso INT,
    anio_traspaso INT,
    club_anterior VARCHAR(100),
    CONSTRAINT fk_trayectoria_jugadores
        FOREIGN KEY (id_jugador) REFERENCES Jugadores(id_jugador)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_trayectoria_equipos
        FOREIGN KEY (id_equipo) REFERENCES Equipos(id_equipo)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabla: Usuarios
CREATE TABLE Usuarios (
    id_usuarios INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Tabla: Partida
CREATE TABLE Partida (
    id_partida INT AUTO_INCREMENT PRIMARY KEY,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla: UsuariosXPartida
CREATE TABLE UsuariosXPartida (
    id_usuariosporpartida INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_partida INT NOT NULL,
    puntaje INT DEFAULT 0,
    CONSTRAINT fk_uxp_usuarios
        FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuarios)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_uxp_partida
        FOREIGN KEY (id_partida) REFERENCES Partida(id_partida)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;