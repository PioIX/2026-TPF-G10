//Sección MySQL del código
const mySql = require("mysql2/promise");

/**
 * Configuración MySQL leída del entorno del backend.
 * Estas credenciales solo las usa Node; nunca se envían al frontend.
 */
const SQL_CONFIGURATION_DATA =
{
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USERNAME,
	password: process.env.MYSQL_PASSWORD, 
	database: process.env.MYSQL_DB,	
	port: 3306,
	charset: 'UTF8_GENERAL_CI'
}

/**
 * Ejecuta una consulta en MySQL.
 * @param {String} queryString SQL a ejecutar. Puede usar placeholders `?`.
 * @param {Array} valores Valores que mysql2 coloca en esos placeholders, en el mismo orden.
 * @returns {Array} Filas devueltas (o [] si no se obtuvieron filas).
 *
 * Abre una conexión para esta consulta, ejecuta con mysql2/promise y la cierra al terminar.
 * Los endpoints HTTP y el middleware de handshake usan esta función; los juegos no llaman MySQL.
 */
exports.realizarQuery = async function (queryString, valores = [])
{
	let returnObject;
	let connection;
	try
	{
		// Abre una conexión para esta consulta (no es un pool compartido entre requests).
		connection = await mySql.createConnection(SQL_CONFIGURATION_DATA);
		// execute separa los valores `?` del SQL para las consultas que usan placeholders.
		returnObject = await connection.execute(queryString, valores);
	}
	catch(err)
	{
		console.log(err);
	}
	finally
	{
		// También se ejecuta si la query falla; evita dejar esta conexión abierta.
		if(connection && connection.end) connection.end();
	}
	return returnObject?.[0] || [];
}
