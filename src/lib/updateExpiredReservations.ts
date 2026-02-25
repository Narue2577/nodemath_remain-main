// src/lib/updateExpiredReservations.ts

export async function updateExpiredReservations(connection: any): Promise<number> {
  try {
    console.log('🔍 Checking for expired reservations...');

    const [result]: any = await connection.execute(`
      UPDATE cosci_reservation.BookingTest
      SET status = 'complete', 
          updated_at = NOW()
      WHERE status = 'occupied' 
        AND CONCAT(date_out, ' ', SUBSTRING_INDEX(period_time, '-', -1), ':00') < NOW()
    `);

    if (result.affectedRows > 0) {
      console.log(` Updated \${result.affectedRows} expired reservation(s)`);
    } else {
      console.log('No expired reservations found');
    }

    return result.affectedRows;
  } catch (error) {
    console.error('Error updating reservations:', error);
    return 0;
  }
}