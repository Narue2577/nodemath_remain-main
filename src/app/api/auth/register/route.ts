// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
//import bcrypt from 'bcryptjs';  You'll need to install this: npm install bcryptjs @types/bcryptjs
import mysql from 'mysql2/promise';

export async function POST(req: NextRequest) {
  const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME3,
    });

    let connection;

  try {
    // Parse request body - match what frontend sends
    const { 
      role, 
      id,        // This is either studentId or buasri from frontend
      buasri,    // This is the buasri ID (studentbuasriId or buasri)
      password, 
      fullName, 
      email, 
      advisor   // Only for students
    } = await req.json();

    console.log('Received registration data:', { role, id, buasri, fullName, email });

    // Validation
    if (!role || !id || !buasri || !password || !fullName || !email) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // Role-specific validation
    if (role === 'student' && ( !advisor)) {
      return NextResponse.json(
        { success: false, message: 'Major and advisor are required for students.' },
        { status: 400 }
      );
    }

  

    connection = await pool.getConnection();
    

    // Check if user already exists in database
if (role === 'student') {
  const [existingStudents] = await connection.query(
    'SELECT * FROM registration_member WHERE id = ? OR email = ?',
    [id, email]  // Now matches 2 placeholders
  );

  if (Array.isArray(existingStudents) && existingStudents.length > 0) {
    return NextResponse.json(
      { success: false, message: 'Student with this ID or email already exists.' },
      { status: 400 }
    );
  }
} else if (role === 'staff') {
  const [existingStaff] = await connection.query(
    'SELECT * FROM registration_member WHERE buasri = ? OR email = ?',
    [buasri, email]  // Now matches 2 placeholders
  );

  if (Array.isArray(existingStaff) && existingStaff.length > 0) {
    return NextResponse.json(
      { success: false, message: 'Staff member with this ID or email already exists.' },
      { status: 400 }
    );
  }
}
   
    // Insert new user into database
    // Adjust table name and columns to match your schema
     if (role === 'student') {
    const insertQuery = `
      INSERT INTO registration_member 
      (id,buasri,role, password, name,advisor,email, created_at) 
      VALUES (?, ?,?, ?, ?, ?, ?, NOW())
    `;

    await connection.query(insertQuery, [
         id,              // student_id (from your form: studentId)
        buasri,          // student_buasri (from your form: studentbuasriId)
        'student',
        password,  // student_password (HASHED!)
        fullName,        // student_name
        advisor,         // student_advisor
        email,           // student_email
      ]);
}else if (role === 'staff') {
      const insertQuery2 = `
        INSERT INTO registration_member 
        (id, buasri, role, password, name, advisor, email, created_at) 
        VALUES (?, ?,?,?, ?, '-', ?, NOW())
      `;

      await connection.query(insertQuery2, [
        id,              // staff_id (from frontend: staffId)
        buasri,          // staff_buasri (from frontend: buasri)
        'staff',
        password,  // staff_password (HASHED)
        fullName,        // staff_name
        email,           // staff_email
      ]);

      console.log('New user registered:', { id, role, email });
    }

     
  

    
    return NextResponse.json(
      { success: true, message: 'Registration successful! You can now login.',user: { id, role, fullName, email } },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during registration.' },
      { status: 500 }
    );
  }finally {
    if (connection) connection.release();
  }
}