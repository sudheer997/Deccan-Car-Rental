import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'car_rental_db';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGO_URL);
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Simple password hashing (for production, use bcrypt)
function hashPassword(password) {
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Simple JWT simulation
function createToken(userId, username) {
  return Buffer.from(JSON.stringify({ userId, username, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64');
}

function verifyToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', '');

    // Get all cars (public)
    if (path === '/cars') {
      const cars = await db.collection('cars').find({}).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ success: true, data: cars });
    }

    // Get single car (public)
    if (path.startsWith('/cars/') && path.split('/').length === 3) {
      const carId = path.split('/')[2];
      const car = await db.collection('cars').findOne({ _id: carId });
      if (!car) {
        return NextResponse.json({ success: false, error: 'Car not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: car });
    }

    // Admin routes - require authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get reservations
    if (path === '/reservations') {
      const reservations = await db.collection('reservations')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      
      // Populate car details
      for (let reservation of reservations) {
        if (reservation.carId) {
          const car = await db.collection('cars').findOne({ _id: reservation.carId });
          reservation.carDetails = car;
        }
      }
      
      return NextResponse.json({ success: true, data: reservations });
    }

    // Get rentals
    if (path === '/rentals') {
      const rentals = await db.collection('rentals')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      return NextResponse.json({ success: true, data: rentals });
    }

    // Get payments
    if (path === '/payments') {
      const payments = await db.collection('payments')
        .find({})
        .sort({ dueDate: 1 })
        .toArray();
      return NextResponse.json({ success: true, data: payments });
    }

    // Get dashboard stats
    if (path === '/dashboard/stats') {
      const totalCars = await db.collection('cars').countDocuments();
      const availableCars = await db.collection('cars').countDocuments({ status: 'available' });
      const rentedCars = await db.collection('cars').countDocuments({ status: 'rented' });
      const pendingReservations = await db.collection('reservations').countDocuments({ status: 'pending' });
      const activeRentals = await db.collection('rentals').countDocuments({ status: 'active' });
      const pendingPayments = await db.collection('payments').countDocuments({ status: 'pending' });
      
      return NextResponse.json({
        success: true,
        data: {
          totalCars,
          availableCars,
          rentedCars,
          pendingReservations,
          activeRentals,
          pendingPayments
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', '');
    const body = await request.json();

    // Admin login
    if (path === '/auth/login') {
      const { username, password } = body;
      
      if (!username || !password) {
        return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 });
      }

      let admin = await db.collection('admins').findOne({ username });
      
      // Create default admin if none exists
      if (!admin && username === 'admin' && password === 'admin123') {
        const newAdmin = {
          _id: uuidv4(),
          username: 'admin',
          password: hashPassword('admin123'),
          createdAt: new Date()
        };
        await db.collection('admins').insertOne(newAdmin);
        admin = newAdmin;
      }

      if (!admin || !verifyPassword(password, admin.password)) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      const token = createToken(admin._id, admin.username);
      return NextResponse.json({
        success: true,
        data: { token, username: admin.username }
      });
    }

    // Public reservation request
    if (path === '/reservations') {
      const { customerName, email, phone, carId, message } = body;
      
      if (!customerName || !email || !phone || !carId) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      const car = await db.collection('cars').findOne({ _id: carId });
      if (!car) {
        return NextResponse.json({ success: false, error: 'Car not found' }, { status: 404 });
      }

      const reservation = {
        _id: uuidv4(),
        customerName,
        email,
        phone,
        carId,
        message: message || '',
        status: 'pending',
        createdAt: new Date()
      };

      await db.collection('reservations').insertOne(reservation);
      return NextResponse.json({ success: true, data: reservation });
    }

    // Protected routes
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Add car
    if (path === '/cars') {
      const { name, model, brand, price, features, imageUrl, specs } = body;
      
      if (!name || !model || !brand || !price) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      const car = {
        _id: uuidv4(),
        name,
        model,
        brand,
        price: parseFloat(price),
        features: features || [],
        imageUrl: imageUrl || 'https://via.placeholder.com/400x300?text=Car+Image',
        specs: specs || {},
        status: 'available',
        createdAt: new Date()
      };

      await db.collection('cars').insertOne(car);
      return NextResponse.json({ success: true, data: car });
    }

    // Add rental
    if (path === '/rentals') {
      const { carId, customerName, email, phone, startDate, endDate, monthlyPrice } = body;
      
      if (!carId || !customerName || !email || !phone || !startDate || !monthlyPrice) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      const car = await db.collection('cars').findOne({ _id: carId });
      if (!car) {
        return NextResponse.json({ success: false, error: 'Car not found' }, { status: 404 });
      }

      const rental = {
        _id: uuidv4(),
        carId,
        carDetails: {
          name: car.name,
          model: car.model,
          brand: car.brand
        },
        customerName,
        email,
        phone,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        monthlyPrice: parseFloat(monthlyPrice),
        status: 'active',
        createdAt: new Date()
      };

      await db.collection('rentals').insertOne(rental);
      await db.collection('cars').updateOne({ _id: carId }, { $set: { status: 'rented' } });
      
      return NextResponse.json({ success: true, data: rental });
    }

    // Add payment
    if (path === '/payments') {
      const { rentalId, amount, dueDate, notes } = body;
      
      if (!rentalId || !amount || !dueDate) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      const rental = await db.collection('rentals').findOne({ _id: rentalId });
      if (!rental) {
        return NextResponse.json({ success: false, error: 'Rental not found' }, { status: 404 });
      }

      const payment = {
        _id: uuidv4(),
        rentalId,
        rentalDetails: {
          customerName: rental.customerName,
          carName: rental.carDetails.name
        },
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        paidDate: null,
        status: 'pending',
        notes: notes || '',
        createdAt: new Date()
      };

      await db.collection('payments').insertOne(payment);
      return NextResponse.json({ success: true, data: payment });
    }

    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', '');
    const body = await request.json();

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Update car
    if (path.startsWith('/cars/') && path.split('/').length === 3) {
      const carId = path.split('/')[2];
      const { name, model, brand, price, features, imageUrl, specs, status } = body;
      
      const updateData = {};
      if (name) updateData.name = name;
      if (model) updateData.model = model;
      if (brand) updateData.brand = brand;
      if (price) updateData.price = parseFloat(price);
      if (features) updateData.features = features;
      if (imageUrl) updateData.imageUrl = imageUrl;
      if (specs) updateData.specs = specs;
      if (status) updateData.status = status;

      const result = await db.collection('cars').updateOne(
        { _id: carId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Car not found' }, { status: 404 });
      }

      const updatedCar = await db.collection('cars').findOne({ _id: carId });
      return NextResponse.json({ success: true, data: updatedCar });
    }

    // Update reservation status
    if (path.startsWith('/reservations/') && path.split('/').length === 3) {
      const reservationId = path.split('/')[2];
      const { status } = body;
      
      if (!status) {
        return NextResponse.json({ success: false, error: 'Status required' }, { status: 400 });
      }

      const result = await db.collection('reservations').updateOne(
        { _id: reservationId },
        { $set: { status } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
      }

      const updated = await db.collection('reservations').findOne({ _id: reservationId });
      return NextResponse.json({ success: true, data: updated });
    }

    // Update rental
    if (path.startsWith('/rentals/') && path.split('/').length === 3) {
      const rentalId = path.split('/')[2];
      const { status, endDate } = body;
      
      const updateData = {};
      if (status) updateData.status = status;
      if (endDate) updateData.endDate = new Date(endDate);

      const result = await db.collection('rentals').updateOne(
        { _id: rentalId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Rental not found' }, { status: 404 });
      }

      const rental = await db.collection('rentals').findOne({ _id: rentalId });
      
      // If rental is completed, update car status
      if (status === 'completed') {
        await db.collection('cars').updateOne(
          { _id: rental.carId },
          { $set: { status: 'available' } }
        );
      }

      return NextResponse.json({ success: true, data: rental });
    }

    // Update payment
    if (path.startsWith('/payments/') && path.split('/').length === 3) {
      const paymentId = path.split('/')[2];
      const { status, paidDate, notes } = body;
      
      const updateData = {};
      if (status) updateData.status = status;
      if (paidDate) updateData.paidDate = new Date(paidDate);
      if (notes !== undefined) updateData.notes = notes;

      const result = await db.collection('payments').updateOne(
        { _id: paymentId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
      }

      const updated = await db.collection('payments').findOne({ _id: paymentId });
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(request.url);
    const path = url.pathname.replace('/api', '');

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Delete car
    if (path.startsWith('/cars/') && path.split('/').length === 3) {
      const carId = path.split('/')[2];
      
      // Check if car is rented
      const car = await db.collection('cars').findOne({ _id: carId });
      if (car && car.status === 'rented') {
        return NextResponse.json({ success: false, error: 'Cannot delete rented car' }, { status: 400 });
      }

      const result = await db.collection('cars').deleteOne({ _id: carId });
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ success: false, error: 'Car not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Car deleted' });
    }

    // Delete reservation
    if (path.startsWith('/reservations/') && path.split('/').length === 3) {
      const reservationId = path.split('/')[2];
      const result = await db.collection('reservations').deleteOne({ _id: reservationId });
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Reservation deleted' });
    }

    // Delete payment
    if (path.startsWith('/payments/') && path.split('/').length === 3) {
      const paymentId = path.split('/')[2];
      const result = await db.collection('payments').deleteOne({ _id: paymentId });
      
      if (result.deletedCount === 0) {
        return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Payment deleted' });
    }

    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}