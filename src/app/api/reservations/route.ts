//api/reservations/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { transporter } from '@/lib/email';




// Common email sent to both roles
async function sendReservationConfirmationEmail(
  recipientEmail: string,
  username: any,
  room: any,
  seatDetails: any,
  confirmLink: any,
  rejectLink: any,
  purpose: any

) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: 'ขออนุมัติจากนายณภัทร สุบรรณพงษ์',
     html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: gray; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">คำขออนุมัติการจองห้อง</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              เรียน <strong>ผศ.ดร.ปรวัน แพทยานนท์</strong> (ผู้อนุมัติรายการจองห้อง)
            </p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              <strong>${username}</strong> ได้ทำรายการจองห้องคอมพิวเตอร์ <strong>${room}</strong> 
              ของวิทยาลัยนวัตกรรมสื่อสารสังคม ผ่านทางเว็บไซต์
            </p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              ทั้งนี้ ใคร่ขอรบกวนให้ท่านตรวจสอบรายละเอียดการจอง และอนุมัติหรือไม่อนุมัติรายการจองดังกล่าว โดยกดปุ่มด้านล่าง
            </p>
            
            <!-- Booking Details Box -->
            <div style="background-color: #f8f9fa;  padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #667eea; font-size: 18px; margin-bottom: 15px;">รายละเอียดการจอง</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${seatDetails}
              </ul>
              ${purpose ? `
                <p style="margin: 15px 0 0 0; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                  <strong>วัตถุประสงค์:</strong> ${purpose}
                </p>
              ` : ''}
              <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
                <strong>วันที่ขอ:</strong> ${new Date().toLocaleString('th-TH')}
              </p>
            </div>
                  
            <!-- Confirm Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmLink}" 
                 style="background-color: #4CAF50; 
                        color: white; 
                        padding: 15px 50px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-size: 18px;
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(76, 175, 80, 0.3);">
                 อนุมัติ (CONFIRM)
              </a>
            </div>
            <!-- Reject Section  -->
            <div style="background-color: #fff3f3; border: 2px solid #f44336; border-radius: 8px; padding: 25px; margin-top: 30px;">
  <h3 style="color: #f44336; margin-top: 0; font-size: 18px; margin-bottom: 15px;">
    คำขอปฏิเสธ
  </h3>
  <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
    หากต้องการปฏิเสธการจอง กรุณาตอบกลับอีเมลนี้พร้อมระบุเหตุผลของคุณ<br>
  </p>
  <div style="text-align: center; margin-top: 20px;">
    <a href="${rejectLink}" 
                   style="background-color: #f44336; 
                          color: white; 
                          padding: 14px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-size: 16px; 
                          font-weight: bold; 
                          display: inline-block;
                          margin: 0 0 10px 0;
                          box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);">
                  ปฏิเสธการจอง (REJECT)
                </a>
  </div>
</div>
            
          </div>  
        </div>
      </body>
      </html>
    `
,
  };


  await transporter.sendMail(mailOptions);
}

// Additional email ONLY for students
async function sendStudentPendingApprovalEmail(
  recipientEmail: string,
  username: any,
  room: any,
  seatDetails: any,
  confirmLink: any,
  rejectLink: any,
  advisor: any,
  purpose: any
) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: `ขออนุมัติจาก${advisor}`,
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: gray; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">คำขออนุมัติการจองห้อง</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              เรียน <strong>${advisor}</strong> (ผู้อนุมัติรายการจองห้อง)
            </p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              <strong>${username}</strong> ได้ทำรายการจองห้องคอมพิวเตอร์ <strong>${room}</strong> 
              ของวิทยาลัยนวัตกรรมสื่อสารสังคม ผ่านทางเว็บไซต์
            </p>
            
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              ทั้งนี้ ใคร่ขอรบกวนให้ท่านตรวจสอบรายละเอียดการจอง และอนุมัติหรือไม่อนุมัติรายการจองดังกล่าว โดยกดปุ่มด้านล่าง
            </p>
            
            <!-- Booking Details Box -->
            <div style="background-color: #f8f9fa;  padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #667eea; font-size: 18px; margin-bottom: 15px;">รายละเอียดการจอง</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${seatDetails}
              </ul>
              ${purpose ? `
                <p style="margin: 15px 0 0 0; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                  <strong>วัตถุประสงค์:</strong> ${purpose}
                </p>
              ` : ''}
              <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
                <strong>วันที่ขอ:</strong> ${new Date().toLocaleString('th-TH')}
              </p>
            </div>
                  
            <!-- Confirm Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmLink}" 
                 style="background-color: #4CAF50; 
                        color: white; 
                        padding: 15px 50px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-size: 18px;
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(76, 175, 80, 0.3);">
                 อนุมัติ (CONFIRM)
              </a>
            </div>
            <!-- Reject Section  -->
            <div style="background-color: #fff3f3; border: 2px solid #f44336; border-radius: 8px; padding: 25px; margin-top: 30px;">
  <h3 style="color: #f44336; margin-top: 0; font-size: 18px; margin-bottom: 15px;">
    คำขอปฏิเสธ
  </h3>
  <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
    หากต้องการปฏิเสธการจอง กรุณาตอบกลับอีเมลนี้พร้อมระบุเหตุผลของคุณ<br>
  </p>
  <div style="text-align: center; margin-top: 20px;">
    <a href="${rejectLink}" 
                   style="background-color: #f44336; 
                          color: white; 
                          padding: 14px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-size: 16px; 
                          font-weight: bold; 
                          display: inline-block;
                          margin: 0 0 10px 0;
                          box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);">
                  ปฏิเสธการจอง (REJECT)
                </a>
  </div>
</div>
            
          </div>  
        </div>
      </body>
      </html>
    `
,
  };

  await transporter.sendMail(mailOptions);
}

// Helper function to check and update expired reservations
/* eslint-disable */
async function updateExpiredReservations(connection: any) {
  try {
    console.log('\n=== Checking for expired reservations ===');
    console.log('Current time:', new Date().toISOString());
    
    // First, let's see what we're working with
    const [occupiedRows]: any = await connection.execute(`
  
  SELECT 
      id,
      username,
      room,
      seat,
      date_out,
      period_time,
      status,
      CONCAT(date_out, ' ', SUBSTRING_INDEX(period_time, '-', -1)) as end_datetime,
      NOW() as current_datetime,
      CONCAT(date_out, ' ', SUBSTRING_INDEX(period_time, '-', -1)) < NOW() as is_expired
    FROM cosci_reservation.BookingTest
    WHERE (status = 'occupied' OR status = 'pending')
    LIMIT 5
  
`);
    
    console.log('Sample occupied reservations:', occupiedRows);
    
    // Count how many should be expired
    
    const [CountResult]: any = await connection.execute(`
      SELECT COUNT(*) as count
      FROM cosci_reservation.BookingTest
      WHERE (status = 'occupied' OR status = 'pending')
      AND CONCAT(date_out, ' ', SUBSTRING_INDEX(period_time, '-', -1), ':00') < NOW()
    `);

    console.log('Reservations to expire:', CountResult[0].count);

    
  

    const query = `
      UPDATE cosci_reservation.BookingTest
      SET status = 'complete', updated_at = NOW()
      WHERE (status = 'occupied' OR status = 'pending')
      AND CONCAT(date_out, ' ', SUBSTRING_INDEX(period_time, '-', -1), ':00') < NOW()
    `;

       const [result]: any = await connection.execute(query);
    console.log('Update result - Rows affected:', result.affectedRows);
    console.log('=== Expiry check complete ===\n');

    return result.affectedRows;
  } catch (error) {
    console.error('Error in updateExpiredReservations:', error);
    return 0;
  }
}
/* eslint-enable */

// GET method with auto-update for expired reservations
export async function GET(request: Request) {
 const { searchParams } = new URL(request.url); // 18 Nov 2568
  const source = searchParams.get('source'); // 18 Nov 2568
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME3
    });

    // First, update any expired reservations
    const expiredCount = await updateExpiredReservations(connection);
    console.log(`GET: Updated ${expiredCount} expired reservations`);

   
    const selectQuery = `
      SELECT room, seat, status FROM cosci_reservation.BookingTest
      WHERE (status = 'occupied' OR status = 'pending')
    `;


    const [reservations] = await connection.execute(selectQuery);
    await connection.end();

    return NextResponse.json({ 
      reservations,
      expiredUpdated: expiredCount 
    });
  } catch (err) {
    console.error('Database error:', err);
    if (connection) await connection.end();
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  let advisorEmail;

  let connection, connection2;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME3,
      charset: 'utf8mb4'
    });

    // Parse request body
    const body = await request.json();
    
    let username, room, seats, advisor_name, purpose;

    if (role === 'student') {
      username = body.username;
      room = body.room;
      seats = body.seats;
      advisor_name = seats[0]?.advisor_name;
      purpose = seats[0]?.purpose || null;

      console.log('=== DEBUG ADVISOR ===');
      console.log('advisor_name received:', advisor_name);
      
        // ✅ ADDED: Check if user already has an active booking
      const bookingType = advisor_name ? 'room' : 'single';
      const checkQuery = advisor_name 
        ? `SELECT COUNT(*) as count FROM cosci_reservation.BookingTest 
           WHERE username = ? AND (status = 'pending' OR status = 'occupied') 
           AND advisor_name IS NOT NULL`
        : `SELECT COUNT(*) as count FROM cosci_reservation.BookingTest 
           WHERE username = ? AND (status = 'pending' OR status = 'occupied') 
           AND advisor_name IS NULL`;
      
       const [existingBookings]: any = await connection.execute(checkQuery, [username]);
      
      if (existingBookings[0].count > 0) {
        await connection.end();
        return NextResponse.json({
          error: `You already have an active ${bookingType} booking. Please cancel your existing booking before making a new one.`
        }, { status: 409 });
      }
      
    } else if (role === 'admin') {
      username = body.username;
      room = body.room;
      seats = body.seats;
      purpose = body.purpose || null;
    }
  
    const expiredCount = await updateExpiredReservations(connection);
    console.log(`POST: Updated ${expiredCount} expired reservations`);

    
    // Validation
    if (!username || !room || !seats || !Array.isArray(seats)) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    if (role === 'student') {
      // Connection 2: For staff/advisors (DB_NAME2)
      connection2 = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME2,
        charset: 'utf8mb4'  
      });

      // ✅ ONLY lookup advisor if it's NOT "N/A"
      if (advisor_name && advisor_name !== 'N/A') {
        const [advisorRows] = await connection2.query(
          'SELECT staff_email FROM staff WHERE staff_name = ?',
          [advisor_name]
        );

        if (!advisorRows || (advisorRows as any[]).length === 0) {
          if (connection2) await connection2.end();
          if (connection) await connection.end();
          return NextResponse.json({
            error: `Advisor "${advisor_name}" not found`
          }, { status: 404 });
        }

        advisorEmail = (advisorRows as any[])[0].staff_email;
      }
    }


    // Check if any seats are already occupied (for BOTH roles)
    const seatIds = seats.map((s: any) => s.seat);
    const approvalToken = crypto.randomUUID();
    const placeholders = seatIds.map(() => '?').join(',');
    const checkQuery = `
      SELECT seat FROM cosci_reservation.BookingTest
      WHERE room = ? AND seat IN (${placeholders}) AND (status = 'occupied' OR status = 'pending')
    `;

    const [existingSeats] = await connection.execute(checkQuery, [room, ...seatIds]);

    if ((existingSeats as any[]).length > 0) {
      await connection.end();
      if (connection2) await connection2.end();
      return NextResponse.json({
        error: 'Some seats are already occupied or pending approval',
        occupiedSeats: (existingSeats as any[]).map(row => row.seat)
      }, { status: 409 });
    }
   
    const confirmLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/approve?token=${approvalToken}&action=confirm&approver=admin`;
    const rejectLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reject?token=${approvalToken}`;
    // Email 2 - For Advisor
    const aaConfirmLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/approve?token=${approvalToken}&action=confirm&approver=advisor`;

    // Insert reservation - FIXED: Different logic for admin vs student
    const insertQuery = `
      INSERT INTO cosci_reservation.BookingTest
      (username, room, seat, purpose, date_in, date_out, period_time, advisor_name, advisor, admin, status, approval_token, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    // Insert with better error handling
    for (const seat of seats) {
      try {
        console.log('Inserting seat data:', {
          username,
          room,
          seat: seat.seat,
          purpose,
          date_in: seat.date_in,
          date_out: seat.date_out,
          period_time: seat.period_time,
          advisor_name: seat.advisor_name || 'N/A',
          role: role
        });
        
        // ✅ FIXED: Different status and approval logic based on role
        let status, advisorApproval, adminApproval;
        
        if (role === 'admin') {
          // Admin books: Auto-approved, no advisor needed
          status = 'occupied';
          advisorApproval = 'N/A';
          adminApproval = 'approved';
        } else if (role === 'student') {
          // Student books: Needs approval
          status = 'pending';
          advisorApproval = seat.advisor_name !== 'N/A' ? 'pending' : 'N/A';
          adminApproval = 'pending';
        }
        
        await connection.execute(insertQuery, [
          username,
          room,
          seat.seat,
          purpose,
          seat.date_in,
          seat.date_out,
          seat.period_time,
          seat.advisor_name || 'N/A',
          advisorApproval,  // ✅ CHANGED: Dynamic based on role
          adminApproval,    // ✅ CHANGED: Dynamic based on role
          status,           // ✅ CHANGED: Dynamic based on role
          approvalToken
        ]);
      } catch (insertError) {
        console.error('Error inserting seat:', seat.seat, insertError);
        throw insertError;
      }
    }


    const seatDetails = seats.map((seat: any) => `
      <li style="padding: 8px 0; color: #333;">
        <strong>Seat ${seat.seat}:</strong> ${seat.date_in} to ${seat.date_out} (${seat.period_time})
      </li>
    `).join('');

    // ✅ ONLY send emails for STUDENT bookings
    if (role === 'student') {
      // Send to admin
     // await sendReservationConfirmationEmail('napatsu@g.swu.ac.th', username, room, seatDetails, confirmLink, rejectLink, purpose);
      await sendReservationConfirmationEmail('aekchai@g.swu.ac.th', username, room, seatDetails, confirmLink, rejectLink, purpose);
      
      // Send to advisor if applicable
      if (advisorEmail) {
        await sendStudentPendingApprovalEmail(advisorEmail, username, room, seatDetails, aaConfirmLink, rejectLink, advisor_name, purpose);
      }
    }
    
    await connection.end();
    if (connection2) await connection2.end();
    
    return NextResponse.json({
      success: true,
      message: role === 'admin' ? 'Reservation created and approved automatically' : 'Reservation submitted for approval',
      role: role
    });
    
  } catch (error) {
    console.error('Error:', error);
    if (connection) await connection.end();
    if (connection2) await connection2.end();
    return NextResponse.json({
      error: 'An error occurred'
    }, { status: 500 });
  }
}



// PUT method with auto-update for expired reservations
export async function PUT(request: Request) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME3
    });

    // First, update any expired reservations
    const expiredCount = await updateExpiredReservations(connection);
    
    console.log(`PUT: Updated ${expiredCount} expired reservations`);

    const { username, room, seat, purpose, date_in, date_out, period_time, status } = await request.json();

    if (!username || !room || !seat || !date_in || !date_out || !period_time || !status) {
      await connection.end();
      return NextResponse.json({ 
        error: 'Missing required fields: username, room, seat, date_in, date_out, period_time, and status are required' 
      }, { status: 400 });
    }

    // Check if the reservation exists
    const checkQuery = `
      SELECT * FROM cosci_reservation.BookingTest
      WHERE username = ? AND room = ? AND seat = ?
    `;

   
    const [existingReservation] = await connection.execute(checkQuery, [username, room, seat]);

    if (!(existingReservation as any[]).length) {
      await connection.end();
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const updateQuery = `
      UPDATE cosci_reservation.BookingTest
      SET purpose = ?, date_in = ?, date_out = ?, period_time = ?, status = ?, updated_at = NOW()
      WHERE username = ? AND room = ? AND seat = ?
    `;

    await connection.execute(updateQuery, [
      purpose || null,
      date_in,
      date_out,
      period_time,
      status,
      username,
      room,
      seat
    ]);

    await connection.end();
    return NextResponse.json({ 
      message: 'Reservation updated successfully',
      expiredUpdated: expiredCount
    });
  } catch (err) {
    console.error('Database error:', err);
    if (connection) await connection.end();
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}