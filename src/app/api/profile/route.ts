// app/api/profile/route.ts
import { NextResponse, NextRequest } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME3
};


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { buasri, role } = body;

    // Validate input (optional but recommended)
    if (!buasri || typeof buasri !== 'string') {
      return NextResponse.json(
        { message: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    // Create a MySQL connection pool
    const pool = mysql.createPool(dbConfig);
    
    try {
  // Check if the name exists in the database
  const query = 'SELECT * FROM registration_member WHERE buasri = ?';
  
  const [rows] = await pool.query(query, [buasri]);
  const exists = Array.isArray(rows) && rows.length > 0;

  return NextResponse.json({ 
    exists: exists,
    userData: exists ? rows[0] : null
  });
}catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      );
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error('Request parsing error:', error);
    return NextResponse.json(
      { message: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// Handle other HTTP methods
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);

    // ⭐ FIXED: Query the single table with role differentiation
    const [rows]: any[] = await connection.execute(
      'SELECT name, advisor, email, role FROM registration_member WHERE name = ?',
      [name]
    );

    await connection.end();

    if (rows.length > 0) {
      const userData = rows[0];
      
      return NextResponse.json({ 
        success: true, 
        data: userData,
        userType: userData.role === 'student' ? 'student' : 'staff' // Determine type from role column
      });
    }

    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}


export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, userType, data } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);

    // ⭐ FIXED: Use original name to find record, update based on userType
    if (userType === 'student') {
      await connection.execute(
        'UPDATE registration_member SET name = ?, advisor = ?, email = ? WHERE name = ?',
        [data.name, data.advisor, data.email, name]
      );
    } else if (userType === 'staff') {
      await connection.execute(
        'UPDATE registration_member SET name = ?, email = ? WHERE name = ?',
        [data.name, data.email, name]
      );
    }

    await connection.end();

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update data' },
      { status: 500 }
    );
  }
}