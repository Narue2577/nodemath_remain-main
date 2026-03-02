import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME3
    });
    const [rows]: any = await connection.query('SELECT DISTINCT username, room, date_in, date_out, period_time, purpose FROM cosci_reservation.BookingTest WHERE status = "occupied"');
    return NextResponse.json({ reservations: rows });
  } catch (error) {
    return NextResponse.json({ purpose: '' }, { status: 500 });
  } finally {
    if (connection) await connection.end(); // always close connection!
  }
}