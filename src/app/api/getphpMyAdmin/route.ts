// api/reservations/check-user/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const mode = searchParams.get('mode'); // 'single' or 'room'

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME3
    });

    // Check for active bookings (pending or occupied)
    let query;
    if (mode === 'single') {
      // For single mode: check if user has any active single seat bookings (where advisor_name is NULL)
      query = `
        SELECT COUNT(*) as count 
        FROM cosci_reservation.BookingTest
        WHERE username = ? 
        AND (status = 'pending' OR status = 'occupied')
        AND advisor_name IS NULL
      `;
    } else {
      // For room mode: check if user has any active room bookings (where advisor_name is NOT NULL)
      query = `
        SELECT COUNT(*) as count 
        FROM cosci_reservation.BookingTest
        WHERE username = ? 
        AND (status = 'pending' OR status = 'occupied')
        AND advisor_name IS NOT NULL
      `;
    }

    const [result]: any = await connection.execute(query, [username]);
    
    await connection.end();

    return NextResponse.json({ 
      hasBooking: result[0].count > 0,
      count: result[0].count
    });
  } catch (err) {
    console.error('Database error:', err);
    if (connection) await connection.end();
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}