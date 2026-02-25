// src/components/AirplaneSeatBooking.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useSession } from "next-auth/react";

/* eslint-disable */
interface AirplaneSeatBookingProps {
  tableHeader?: string;
}

const AirplaneSeatBooking: React.FC<AirplaneSeatBookingProps> = ({ tableHeader }) => {
  const { data: session, status } = useSession();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [inputMode, setInputMode] = useState('add');
  const [bookings, setBookings] = useState({});
  const [pendingSeats, setPendingSeats] = useState({}); 
  const [isLoading, setIsLoading] = useState(false);
  const [dateTimeInputs, setDateTimeInputs] = useState({});
  const [selectedAdvisor, setSelectedAdvisor] = useState('');
  const [purpose, setPurpose] = useState(''); // Purpose for both modes
      // Add this with your other useState declarations
  const [currentTime, setCurrentTime] = useState(new Date());
  const [eventPurpose, setEventPurpose] = useState<string>('');
  const [bulkDateTime, setBulkDateTime] = useState({
    dateIn: '',
    dateOut: '',
    periodTime: 'choose'
  });
  const [formInput, setFormInput] = useState({
    seatId: '',
    dateIn: '',
    dateOut: '',
    periodTime: 'choose'
  });
  const [options, setOptions] = useState([]);
  

  // Get username from session or fallback to prop
  const username = session?.user?.name || tableHeader || 'Guest';
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 2);
  const minDate = tomorrow.toISOString().split('T')[0];

  const rooms = [
    {
      id: 'room601',
      name: 'Computer Room 601',
      capacity: 54,
      rows: 7,
      seatsPerRow: 8,
      unused: ['4E','5E'],
      occupied: ['1A'],
      layout: [
        { section: 'Room 601', rows: 7, seatsPerRow: 8, seatWidth: 'A B C D   E F G H' }
      ]
    },
    {
      id: 'room602',
      name: 'Computer Room 602',
      capacity: 54,
      rows: 8,
      seatsPerRow: 8,
      unused: ['1A','1B','1G','1H','2A','5A','5H','6A','6H'],
      occupied: [],
      layout: [
        { section: 'Room 602', rows: 8, seatsPerRow: 8, seatWidth: 'A B C D   E F G H' }
      ]
    },
    {
      id: 'room701',
      name: 'Computer Room 701',
      capacity: 54,
      rows: 7,
      seatsPerRow: 8,
      unused: ['4E','5E'],
      occupied: [],
      layout: [
        { section: 'Room 701', rows: 7, seatsPerRow: 8, seatWidth: 'A B C D   E F G H' }
      ]
    },
    {
      id: 'room801',
      name: 'Computer Room 801',
      capacity: 55,
      rows: 8,
      seatsPerRow: 8,
      unused: ['1B','1C','1D','1E','1F','1G','1H','5E','6E'],
      occupied: [],
      layout: [
        { section: 'Room 801', rows: 8, seatsPerRow: 8, seatWidth: 'A B C D   E F G H' }
      ]
    },
    {
      id: 'room802',
      name: 'Computer Room 802',
      capacity: 56,
      rows: 8,
      seatsPerRow: 8,
      unused: ['1A','1B','1G','1H','5A','5H', '6A','6H'],
      occupied: [],
      layout: [
        { section: 'Room 802', rows: 8, seatsPerRow: 8, seatWidth: 'A B C D   E F G H' }
      ]
    }
  ];

  // Fetch reservations from database
  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/reservations?role=student', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const reservationsByRoom:any = {};
        const pendingByRoom:any = {};
        
        if (data.reservations && Array.isArray(data.reservations)) {
          data.reservations.forEach(reservation => {
            if (reservation.room && reservation.seat) {
              if (reservation.status === 'pending') {
                if (!pendingByRoom[reservation.room]) {
                  pendingByRoom[reservation.room] = [];
                }
                pendingByRoom[reservation.room].push(reservation.seat);
              } else {
                if (!reservationsByRoom[reservation.room]) {
                  reservationsByRoom[reservation.room] = [];
                }
                reservationsByRoom[reservation.room].push(reservation.seat);
              }
            }
          });
        }
        setBookings(reservationsByRoom);
        setPendingSeats(pendingByRoom);
      } else {
        console.warn('Failed to fetch reservations:', response.status);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setBookings({});
      setPendingSeats({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/dropdown')
      .then((res) => res.json())
      .then((data) => {
        setOptions(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setIsLoading(false);
      });
  }, []); 

   useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
  
    return () => clearInterval(timer); // Cleanup on unmount
  }, []);
  
  useEffect(() => {
    fetchReservations();
  }, []);

  // Generate seat map
  const generateSeatMap = (room) => {
    const seatMap = [];
    const seatPattern = room.layout[0].seatWidth;
    const seatLetters = seatPattern.replace(/\s+/g, '').split('');
    
    for (let row = 1; row <= room.rows; row++) {
      const rowSeats = [];
      
      seatLetters.forEach((letter) => {
        const seatId = `${row}${letter}`;
        rowSeats.push({
          id: seatId,
          occupied: bookings[room.id]?.includes(seatId) || false,
          unused: room.unused.includes(seatId),
          selected: selectedSeats.includes(seatId)
        });
      });
      
      seatMap.push({
        rowNumber: row,
        seats: rowSeats,
        layout: seatPattern
      });
    }
    
    return seatMap;
  };

  const handleFormInputChange = (field, value) => {
    setFormInput(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function for single seat booking
  const handleBookingWithData = async (seatId, seatData) => {
    // ✅ ADDED: Validate purpose
    if (!purpose || purpose.trim() === '') {
      alert('Please enter the purpose of booking');
      return;
    }

    setIsLoading(true);

    const payload = {
      username: username,
      room: selectedRoom.id,
      purpose: purpose,
      seats: [{
        seat: seatId,
        date_in: seatData.dateIn,
        date_out: seatData.dateOut,
        period_time: seatData.periodTime,
        purpose: purpose,
        advisor_name: 'N/A'  // ✅ ADD THIS for single mode
      }],
    };

    console.log("Single booking payload:", payload);

    try {
      const response = await fetch('/api/reservations?role=student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (response.ok) {
        alert(`Successfully booked seat ${seatId} in ${selectedRoom.name}! You need to get confirmed by Admin. Please check your reservation status.`);
        
        // Reset states after successful booking
        setSelectedSeats([]);
        setDateTimeInputs({});
        setFormInput({ seatId: '', dateIn: '', dateOut: '', periodTime: 'choose' });
        setPurpose('');  // ✅ ADDED: Reset purpose
        
        // Refresh reservations from database
        await fetchReservations();
      } else {
        const errorMessage = responseData?.message || responseData?.error || 'Failed to book seats';
        console.error('Booking failed:', response.status, errorMessage);
        alert(`Booking failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Network or parsing error:', error);
      alert(`An error occurred while booking: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDateTimeChange = (field, value) => {
    setBulkDateTime(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateTimeChange = (seatId, field, value) => {
    setDateTimeInputs(prev => ({
      ...prev,
      [seatId]: {
        ...prev[seatId],
        [field]: value
      }
    }));
  };

  const handleRemoveSeat = (seatId) => {
    setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    const newInputs = { ...dateTimeInputs };
    delete newInputs[seatId];
    setDateTimeInputs(newInputs);
  };

  // Validation function
  const validateBookingData = () => {
    if (selectedSeats.length === 0) {
      return { valid: false, message: 'Please select at least one seat.' };
    }

    if (!selectedRoom) {
      return { valid: false, message: 'Please select a room.' };
    }

    // ✅ ADDED: Purpose required for both modes
    if (!purpose || purpose.trim() === '') {
      return { valid: false, message: 'Please enter the purpose of booking.' };
    }

    // FOR BULK/ALL MODE
    if (inputMode === 'all') {
      if (!selectedAdvisor) {
        return { valid: false, message: 'Please select an advisor.' };
      }

      if (!bulkDateTime.dateIn || !bulkDateTime.dateOut || !bulkDateTime.periodTime || bulkDateTime.periodTime === 'choose') {
        return { valid: false, message: 'Please complete all date and time fields.' };
      }

      const dateIn = new Date(bulkDateTime.dateIn);
      const dateOut = new Date(bulkDateTime.dateOut);

      if (isNaN(dateIn.getTime()) || isNaN(dateOut.getTime())) {
        return { valid: false, message: 'Invalid date format.' };
      }

      if (dateOut.getTime() < dateIn.getTime()) {
        return { valid: false, message: 'End date cannot be before start date.' };
      }

      return { valid: true };
    }

    // FOR SINGLE MODE
    if (inputMode === 'add') {
      for (const seatId of selectedSeats) {
        const seatData = dateTimeInputs[seatId];
        
        if (!seatData) {
          return { valid: false, message: `Please fill in all fields for seat ${seatId}.` };
        }
        
        if (!seatData.dateIn || !seatData.dateOut || !seatData.periodTime || seatData.periodTime === 'choose') {
          return { valid: false, message: `Please complete all fields for seat ${seatId}.` };
        }

        const dateIn = new Date(seatData.dateIn);
        const dateOut = new Date(seatData.dateOut);

        if (isNaN(dateIn.getTime()) || isNaN(dateOut.getTime())) {
          return { valid: false, message: `Invalid date format for seat ${seatId}.` };
        }
        
        if (dateOut.getTime() < dateIn.getTime()) {
          return { valid: false, message: `End date cannot be before start date for seat ${seatId}.` };
        }
      }
    }

    return { valid: true };
  };

  // Room mode booking handler
  const handleBooking = async () => {
    const validation = validateBookingData();
    
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    setIsLoading(true);

    // Create payload
    const payload = {
      username: username,
      room: selectedRoom.id,
      purpose: purpose,
      seats: selectedSeats.map(seatId => {
        const seatData = {
          seat: seatId,
          date_in: inputMode === 'add' ? dateTimeInputs[seatId].dateIn : bulkDateTime.dateIn,
          date_out: inputMode === 'add' ? dateTimeInputs[seatId].dateOut : bulkDateTime.dateOut,
          period_time: inputMode === 'add' ? dateTimeInputs[seatId].periodTime : bulkDateTime.periodTime,
          purpose: purpose,  // ✅ Purpose for both modes
        };
        
      // Always include advisor_name
    seatData.advisor_name = inputMode === 'all' ? selectedAdvisor : 'N/A';
        
        return seatData;
      }),
    };

    console.log("Room booking payload:", payload);

    try {
      const response = await fetch('/api/reservations?role=student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (response.ok) {
        alert(`Successfully booked ${selectedSeats.length} seat(s) in ${selectedRoom.name}! You need to get confirmed by Admin${inputMode === 'all' ? ' and Advisor' : ''}. Please check your reservation status.`);
        
        // Reset states after successful booking
        setSelectedSeats([]);
        setDateTimeInputs({});
        setBulkDateTime({ dateIn: '', dateOut: '', periodTime: 'choose' });
        setFormInput({ seatId: '', dateIn: '', dateOut: '', periodTime: 'choose' });
        setSelectedAdvisor('');
        setPurpose('');
        
        // Refresh reservations from database
        await fetchReservations();
      } else {
        const errorMessage = responseData?.message || responseData?.error || 'Failed to book seats';
        console.error('Booking failed:', response.status, errorMessage);
        alert(`Booking failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Network or parsing error:', error);
      alert(`An error occurred while booking: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSeat = (seat) => {
    const isPending = pendingSeats[selectedRoom.id]?.includes(seat.id) || false;
    let className = "w-10 h-10 border-2 flex items-center justify-center text-xs font-bold transition-all";
    
    if (seat.unused) {
      className += " bg-gray-800 border-gray-900 text-white";
    } else if (seat.occupied) {
      className += " bg-red-500 border-red-600 text-white";
    } else if (isPending) {
      className += " bg-yellow-400 border-yellow-500 text-gray-800";
    } else if (seat.selected) {
      className += " bg-blue-500 border-blue-600 text-white scale-110";
    } else {
      className += " bg-green-100 border-green-400 text-green-800";
    }

    return (
      <div key={seat.id} className={className}>
        {seat.unused ? 'X' : seat.occupied ? <X className="w-3 h-3 text-white" /> : seat.selected ? <Check className="w-3 h-3 text-white" /> : seat.id.slice(-1)}
      </div>
    );
  };

  const renderSeatRow = (row) => {
    const elements = [];
    const pattern = row.layout.split('');
    let seatIndex = 0;

    pattern.forEach((char, index) => {
      if (char === ' ') {
        elements.push(<div key={`space-${index}`} className="w-6"></div>);
      } else {
        elements.push(renderSeat(row.seats[seatIndex]));
        seatIndex++;
      }
    });

    return (
      <div key={row.rowNumber} className="flex items-center gap-2 mb-2">
        <div className="w-8 text-center font-bold text-gray-600">{row.rowNumber}</div>
        <div className="flex gap-1">{elements}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Computer Seat Booking System</h1>
          <p className="text-gray-600 text-center">Welcome {username}</p>
        </div>

        {/* Room Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 w-full">
          <h2 className="text-xl font-bold mb-4 text-center">Select Room</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => {
                  setSelectedRoom(room);
                  setInputMode('add');
                  setSelectedSeats([]);
                  setDateTimeInputs({});
                  setFormInput({ seatId: '', dateIn: '', dateOut: '', periodTime: 'choose' });
                  setBulkDateTime({ dateIn: '', dateOut: '', periodTime: 'choose' });
                  setPurpose('');
                  setSelectedAdvisor('');
                }}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedRoom?.id === room.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <h3 className="font-bold text-lg text-center">{room.name}</h3>
                <p className="text-sm text-gray-600 text-center">Capacity: {room.capacity}</p>
                <p className="text-sm text-gray-600 text-center">
                  Occupied: {bookings[room.id]?.length || 0}
                </p>
              </div>
            ))}
          </div>
        </div>

        {selectedRoom && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 w-full">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Date Block */}
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="text-blue-600">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div>
        <p className="text-sm text-gray-600">Today's Date</p>
        <p className="text-lg font-bold text-gray-800">
          {currentTime.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>

    {/* Time Block */}
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="text-blue-600">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-sm text-gray-600">Current Time</p>
        <p className="text-lg font-bold text-gray-800">
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>
      </div>
    </div>
  </div>
</div>

{/* ✅ Event Block - replaced hardcoded "Event" with DB purpose */}
<div className="bg-white rounded-xl shadow-lg p-6 mb-6 w-full">
  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
    <div className="text-blue-600">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
    <div>
      <p className="text-sm text-gray-600">Event / Purpose</p>
      <p className="text-lg font-bold text-gray-800">
        {eventPurpose ? eventPurpose : (
          <span className="text-gray-400 font-normal italic">No event scheduled at this time</span>
        )}
      </p>
    </div>
  </div>
</div>
            {/* Seat Map */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 w-full">
              <h2 className="text-xl font-bold mb-4 text-center">Seat Map - {selectedRoom.name}</h2>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 border-2 border-green-400"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 border-2 border-blue-600"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-400 border-2 border-yellow-500"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 border-2 border-red-600"></div>
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-800 border-2 border-gray-900"></div>
                  <span>Not Available</span>
                </div>
              </div>

              <div className="flex justify-center overflow-x-auto">
                <div className="inline-block">
                  {generateSeatMap(selectedRoom).map(renderSeatRow)}
                </div>
              </div>
              
              {/* Desk */}
              <div className="flex justify-center items-center p-3">
                <div className="flex items-center w-25 h-10 bg-gray-900 border-2 border-gray-900 gap-2 ml-10"></div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 w-full">
              <h2 className="text-xl font-bold mb-4 text-center">Seat Booking</h2>
              
              {/* Input Mode Selection */}
              <div className="mb-6">
                <div className="flex gap-4 justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setInputMode('add');
                      setSelectedSeats([]);
                      setDateTimeInputs({});
                      setSelectedAdvisor('');
                      setPurpose('');
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                      inputMode === 'add'
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    Single (1 seat)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setInputMode('all');
                      
                      // Auto-select all available seats
                      const availableSeats = [];
                      const seatPattern = selectedRoom.layout[0].seatWidth;
                      const seatLetters = seatPattern.replace(/\s+/g, '').split('');
                      
                      for (let row = 1; row <= selectedRoom.rows; row++) {
                        seatLetters.forEach((letter) => {
                          const seatId = `${row}${letter}`;
                          if (!selectedRoom.unused.includes(seatId) && 
                              !bookings[selectedRoom.id]?.includes(seatId) &&
                              !pendingSeats[selectedRoom.id]?.includes(seatId)) {
                            availableSeats.push(seatId);
                          }
                        });
                      }
                      
                      setSelectedSeats(availableSeats);
                      setDateTimeInputs({});
                      setSelectedAdvisor('');
                      setPurpose('');
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${
                      inputMode === 'all'
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    Room (All seats)
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-300 mb-6"></div>

              {/* SINGLE MODE */}
              {inputMode === 'add' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Username:</p>
                      <p className="font-semibold text-gray-800">{username}</p>
                    </div>
                  {/*  <div>
                      <p className="text-sm text-gray-600">Major:</p>
                      <p className="font-semibold text-gray-800">{major}</p>
                    </div> */}
                    <div>
                      <p className="text-sm text-gray-600">Room:</p>
                      <p className="font-semibold text-gray-800">{selectedRoom.name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Seat ID</label>
                      <input
                        type="text"
                        placeholder="e.g., 1A"
                        value={formInput.seatId}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().trim();
                          handleFormInputChange('seatId', value);
                          
                          // Auto-select seat as user types
                          if (value.length >= 2) {
                            const seatRegex = /^[1-9][0-9]?[A-H]$/;
                            if (seatRegex.test(value)) {
                              const seatPattern = selectedRoom.layout[0].seatWidth;
                              const seatLetters = seatPattern.replace(/\s+/g, '').split('');
                              const rowNum = parseInt(value.slice(0, -1));
                              const seatLetter = value.slice(-1);
                              
                              if (rowNum <= selectedRoom.rows && 
                                  seatLetters.includes(seatLetter) &&
                                  !selectedRoom.unused.includes(value) &&
                                  !bookings[selectedRoom.id]?.includes(value) &&
                                  !pendingSeats[selectedRoom.id]?.includes(value)) {
                                setSelectedSeats([value]);
                              } else {
                                setSelectedSeats([]);
                              }
                            } else {
                              setSelectedSeats([]);
                            }
                          } else {
                            setSelectedSeats([]);
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-lg uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date In</label>
                      <input
                        type="date"
                        value={formInput.dateIn}
                        onChange={(e) => handleFormInputChange('dateIn', e.target.value)}
                        min={minDate}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date Out</label>
                      <input
                        type="date"
                        value={formInput.dateOut}
                        onChange={(e) => handleFormInputChange('dateOut', e.target.value)}
                        min={minDate}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Period Time</label>
                      <select
                        value={formInput.periodTime}
                        onChange={(e) => handleFormInputChange('periodTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="choose">Choose time</option>
                        <option value="9:00-12:00">9:00 - 12:00</option>
                        <option value="13:00-16:00">13:00 - 16:00</option>
                        <option value="9:00-16:00">9:00 - 16:00</option>
                      </select>
                    </div>
                  </div>

                  {/* Purpose - Single Mode */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Purpose of Booking *</label>
                    <textarea 
                      className="w-full px-3 py-2 border rounded-lg resize-none"
                      rows={3}
                      placeholder="Enter the purpose of your booking (e.g., Self-study, Project work, etc.)"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      
                      const seatId = formInput.seatId.toUpperCase().trim();
                      
                      if (!seatId || !formInput.dateIn || !formInput.dateOut || formInput.periodTime === 'choose') {
                        alert('Please complete all fields');
                        return;
                      }

                      if (!purpose || purpose.trim() === '') {
                        alert('Please enter the purpose of booking');
                        return;
                      }
                      
                      const seatRegex = /^[1-9][0-9]?[A-H]$/;
                      if (!seatRegex.test(seatId)) {
                        alert('Invalid seat format. Use format like 1A, 2B, etc.');
                        return;
                      }

                      const seatPattern = selectedRoom.layout[0].seatWidth;
                      const seatLetters = seatPattern.replace(/\s+/g, '').split('');
                      const rowNum = parseInt(seatId.slice(0, -1));
                      const seatLetter = seatId.slice(-1);
                      
                      if (rowNum > selectedRoom.rows || !seatLetters.includes(seatLetter)) {
                        alert('Seat does not exist in this room');
                        return;
                      }

                      if (selectedRoom.unused.includes(seatId)) {
                        alert('This seat is not available');
                        return;
                      }

                      if (bookings[selectedRoom.id]?.includes(seatId)) {
                        alert('This seat is already occupied');
                        return;
                      }

                      if (pendingSeats[selectedRoom.id]?.includes(seatId)) {
                        alert('This seat has a pending reservation');
                        return;
                      }
                      
                      setSelectedSeats([seatId]);
                      const seatData = {
                        dateIn: formInput.dateIn,
                        dateOut: formInput.dateOut,
                        periodTime: formInput.periodTime
                      };
                      setDateTimeInputs({ [seatId]: seatData });
                      
                      handleBookingWithData(seatId, seatData);
                    }}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </div>
              )}

              {/* ROOM MODE */}
              {inputMode === 'all' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Username:</p>
                      <p className="font-semibold text-gray-800">{username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Room:</p>
                      <p className="font-semibold text-gray-800">{selectedRoom.name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date In</label>
                      <input
                        type="date"
                        value={bulkDateTime.dateIn}
                        onChange={(e) => handleBulkDateTimeChange('dateIn', e.target.value)}
                        min={minDate}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date Out</label>
                      <input
                        type="date"
                        value={bulkDateTime.dateOut}
                        onChange={(e) => handleBulkDateTimeChange('dateOut', e.target.value)}
                        min={minDate}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Period Time</label>
                      <select
                        value={bulkDateTime.periodTime}
                        onChange={(e) => handleBulkDateTimeChange('periodTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="choose">Choose time</option>
                        <option value="9:00-12:00">9:00 - 12:00</option>
                        <option value="13:00-16:00">13:00 - 16:00</option>
                        <option value="9:00-16:00">9:00 - 16:00</option>
                      </select>
                    </div>
                  </div>

                  {/* Advisor selection - Room Mode Only */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Advisor *</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-lg"
                      value={selectedAdvisor}
                      onChange={(e) => setSelectedAdvisor(e.target.value)}
                    >
                      <option value="">เลือกอาจารย์ที่ปรึกษา</option>
                      {options.map((option) => (
                        <option key={option.staff_id} value={option.staff_name}>
                          {option.staff_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Purpose - Room Mode */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Purpose of Booking *</label>
                    <textarea 
                      className="w-full px-3 py-2 border rounded-lg resize-none"
                      rows={3}
                      placeholder="Enter the purpose of booking the entire room (e.g., Workshop, Training, Exam, etc.)"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      
                      if (!selectedAdvisor) {
                        alert('Please select an advisor');
                        return;
                      }
                      
                      if (!purpose || purpose.trim() === '') {
                        alert('Please enter the purpose of booking');
                        return;
                      }
                      
                      if (!bulkDateTime.dateIn || !bulkDateTime.dateOut || bulkDateTime.periodTime === 'choose') {
                        alert('Please complete all date and time fields');
                        return;
                      }

                      if (selectedSeats.length === 0) {
                        alert('No available seats to book');
                        return;
                      }

                      const newDateTimeInputs = {};
                      selectedSeats.forEach(seatId => {
                        newDateTimeInputs[seatId] = {
                          dateIn: bulkDateTime.dateIn,
                          dateOut: bulkDateTime.dateOut,
                          periodTime: bulkDateTime.periodTime
                        };
                      });

                      setDateTimeInputs(newDateTimeInputs);
                      handleBooking();
                    }}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AirplaneSeatBooking;