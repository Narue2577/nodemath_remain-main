// api/delete/route.ts
import mysql from 'mysql2/promise';
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  const req = await request.json();
  console.log('Received data:', req);

  const { created_at, username } = req;
  
  if (created_at && username) {
    try {
      console.log('Connecting to database...');
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME3,
      });
      
      // ⭐ FIXED: Convert UTC to Bangkok time (+7 hours) and format for MySQL
      const utcDate = new Date(created_at);
      const bangkokDate = new Date(utcDate.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours
      const mysqlDatetime = bangkokDate.toISOString().slice(0, 19).replace('T', ' ');
      
      console.log('Original UTC:', created_at);
      console.log('Bangkok time for MySQL:', mysqlDatetime);
      
      const updateQuery = `
        UPDATE cosci_reservation.BookingTest
        SET status = 'cancelled', updated_at = NOW()
        WHERE created_at = ?
        AND username = ? 
        AND (status = 'occupied' OR status = 'pending')
      `;
      
      console.log('Executing query with created_at:', mysqlDatetime);
      const [result]: any = await connection.execute(updateQuery, [mysqlDatetime, username]);
      console.log('Update result:', result);
      
      await connection.end();
      
      if (result.affectedRows === 0) {
        return NextResponse.json({ 
          message: "Reservation not found or already cancelled"
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        message: "Reservation cancelled successfully",
        affectedRows: result.affectedRows 
      }, { status: 200 });
      
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      return NextResponse.json({ message: "Failed to cancel reservation" }, { status: 500 });
    }
  }
  
  return NextResponse.json({ message: "Missing created_at or username" }, { status: 400 });
}