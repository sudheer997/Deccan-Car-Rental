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

  // MongoDB connection options for serverless/production environments
  const options = {
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
    retryWrites: true,
    retryReads: true,
    w: 'majority'
  };

  const client = await MongoClient.connect(MONGO_URL, options);
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

    // Check car availability by date range (public)
    if (path === '/cars/availability') {
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      if (!startDate || !endDate) {
        return NextResponse.json({ success: false, error: 'Start date and end date are required' }, { status: 400 });
      }

      const requestStart = new Date(startDate);
      const requestEnd = new Date(endDate);

      // Get all cars
      const allCars = await db.collection('cars').find({}).toArray();

      // Get all active rentals and approved reservations that overlap with the requested dates
      const activeRentals = await db.collection('rentals').find({
        status: 'active',
        $or: [
          // Rental starts before request ends and has no end date (ongoing)
          { startDate: { $lte: requestEnd }, endDate: null },
          // Rental overlaps with the requested period
          {
            startDate: { $lte: requestEnd },
            endDate: { $gte: requestStart }
          }
        ]
      }).toArray();

      const approvedReservations = await db.collection('reservations').find({
        status: 'approved',
        startDate: { $lte: requestEnd },
        endDate: { $gte: requestStart }
      }).toArray();

      // Get car IDs that are not available
      const unavailableCarIds = new Set([
        ...activeRentals.map(r => r.carId),
        ...approvedReservations.map(r => r.carId)
      ]);

      // Filter available cars
      const availableCars = allCars.filter(car =>
        car.status === 'available' && !unavailableCarIds.has(car._id)
      );

      return NextResponse.json({ success: true, data: availableCars });
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
      const {
        customerName,
        email,
        phone,
        carId,
        message,
        startDate,
        endDate,
        pickupTime,
        returnTime,
        pickupLocation,
        returnLocation
      } = body;

      if (!customerName || !email || !phone || !carId || !startDate || !endDate) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      const car = await db.collection('cars').findOne({ _id: carId });
      if (!car) {
        return NextResponse.json({ success: false, error: 'Car not found' }, { status: 404 });
      }

      // Check if car is available for the requested dates
      const requestStart = new Date(startDate);
      const requestEnd = new Date(endDate);

      // Calculate total days
      const totalDays = Math.ceil((requestEnd - requestStart) / (1000 * 60 * 60 * 24));

      // Calculate pricing
      const dailyRate = car.price / 30; // Assuming monthly price, convert to daily
      const totalPrice = dailyRate * totalDays;

      // Check for overlapping rentals
      const overlappingRentals = await db.collection('rentals').findOne({
        carId,
        status: 'active',
        $or: [
          { startDate: { $lte: requestEnd }, endDate: null },
          { startDate: { $lte: requestEnd }, endDate: { $gte: requestStart } }
        ]
      });

      if (overlappingRentals) {
        return NextResponse.json({ success: false, error: 'Car is not available for the selected dates' }, { status: 400 });
      }

      // Check for overlapping approved reservations
      const overlappingReservations = await db.collection('reservations').findOne({
        carId,
        status: 'approved',
        startDate: { $lte: requestEnd },
        endDate: { $gte: requestStart }
      });

      if (overlappingReservations) {
        return NextResponse.json({ success: false, error: 'Car is already reserved for the selected dates' }, { status: 400 });
      }

      const reservation = {
        _id: uuidv4(),
        reservationNumber: `RES-${Date.now()}`,
        customerName,
        email,
        phone,
        carId,
        vehicleClass: car.brand || 'Standard',
        assignedVehicle: null, // Will be assigned later
        pickupDate: requestStart,
        pickupTime: pickupTime || '09:00',
        pickupLocation: pickupLocation || 'Office',
        returnDate: requestEnd,
        returnTime: returnTime || '09:00',
        returnLocation: returnLocation || 'Office',
        totalDays,
        dailyRate: parseFloat(dailyRate.toFixed(2)),
        totalPrice: parseFloat(totalPrice.toFixed(2)),
        totalRevenue: parseFloat(totalPrice.toFixed(2)),
        totalPaid: 0,
        totalRefunded: 0,
        outstandingBalance: parseFloat(totalPrice.toFixed(2)),
        message: message || '',
        notes: '',
        status: 'open', // Changed from 'pending' to 'open'
        // Legacy fields for backward compatibility
        startDate: requestStart,
        endDate: requestEnd,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('reservations').insertOne(reservation);
      return NextResponse.json({ success: true, data: reservation });
    }

    // Protected routes (maintenance and repair orders - public endpoints before auth)

    // Get all maintenance records (public for now, can be protected later)
    if (path === '/maintenance') {
      const maintenance = await db.collection('maintenance')
        .aggregate([
          {
            $lookup: {
              from: 'cars',
              localField: 'vehicleId',
              foreignField: '_id',
              as: 'vehicleDetails'
            }
          },
          { $unwind: { path: '$vehicleDetails', preserveNullAndEmptyArrays: true } },
          { $sort: { plannedStartDate: -1 } }
        ]).toArray();
      return NextResponse.json({ success: true, data: maintenance });
    }

    // Get all repair orders (public for now)
    if (path === '/repair-orders') {
      const repairOrders = await db.collection('repairOrders')
        .aggregate([
          {
            $lookup: {
              from: 'cars',
              localField: 'vehicleId',
              foreignField: '_id',
              as: 'vehicleDetails'
            }
          },
          { $unwind: { path: '$vehicleDetails', preserveNullAndEmptyArrays: true } },
          { $sort: { dateIn: -1 } }
        ]).toArray();
      return NextResponse.json({ success: true, data: repairOrders });
    }

    // Get financial analytics - earnings vs investments per vehicle
    if (path === '/financial-analytics') {
      const vehicles = await db.collection('cars').find({}).toArray();

      const analytics = await Promise.all(vehicles.map(async (vehicle) => {
        // Get all rentals for this vehicle
        const rentals = await db.collection('rentals')
          .find({ carId: vehicle._id })
          .toArray();

        // Get all reservations for this vehicle
        const reservations = await db.collection('reservations')
          .find({ carId: vehicle._id, status: 'completed' })
          .toArray();

        // Calculate total earnings from rentals
        const rentalEarnings = rentals.reduce((sum, rental) => {
          return sum + (rental.totalPrice || 0);
        }, 0);

        // Calculate total earnings from reservations
        const reservationEarnings = reservations.reduce((sum, reservation) => {
          return sum + (reservation.totalRevenue || reservation.totalPrice || 0);
        }, 0);

        // Get maintenance/repair costs
        const maintenanceCosts = await db.collection('maintenance')
          .find({ vehicleId: vehicle._id })
          .toArray();

        const repairCosts = await db.collection('repairOrders')
          .find({ vehicleId: vehicle._id })
          .toArray();

        const totalMaintenanceCost = maintenanceCosts.reduce((sum, m) => sum + (m.cost || 0), 0);
        const totalRepairCost = repairCosts.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

        const totalEarnings = rentalEarnings + reservationEarnings;
        const totalInvestment = (vehicle.purchasePrice || 0) + totalMaintenanceCost + totalRepairCost;
        const netProfit = totalEarnings - totalInvestment;
        const roi = totalInvestment > 0 ? ((netProfit / totalInvestment) * 100).toFixed(2) : 0;

        return {
          vehicleId: vehicle._id,
          vehicleName: vehicle.name,
          vehicleKey: vehicle.vehicleKey,
          brand: vehicle.brand,
          model: vehicle.model,
          purchasePrice: vehicle.purchasePrice || 0,
          purchaseDate: vehicle.purchaseDate || vehicle.createdAt,
          totalEarnings: parseFloat(totalEarnings.toFixed(2)),
          rentalEarnings: parseFloat(rentalEarnings.toFixed(2)),
          reservationEarnings: parseFloat(reservationEarnings.toFixed(2)),
          maintenanceCost: parseFloat(totalMaintenanceCost.toFixed(2)),
          repairCost: parseFloat(totalRepairCost.toFixed(2)),
          totalInvestment: parseFloat(totalInvestment.toFixed(2)),
          netProfit: parseFloat(netProfit.toFixed(2)),
          roi: parseFloat(roi),
          rentalCount: rentals.length,
          reservationCount: reservations.length
        };
      }));

      return NextResponse.json({ success: true, data: analytics });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Add car/vehicle
    if (path === '/cars') {
      const {
        name,
        model,
        brand,
        price,
        purchasePrice,
        purchaseDate,
        features,
        imageUrl,
        specs,
        vehicleKey,
        vin,
        licenseNumber,
        vehicleType,
        vehicleClass,
        transmission,
        currentLocation,
        odometer,
        fuelLevel,
        telematicsConnected,
        availableDate
      } = body;

      if (!name || !model || !brand || !price) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      const car = {
        _id: uuidv4(),
        vehicleKey: vehicleKey || `V${Date.now().toString().slice(-6)}`,
        name,
        model,
        brand,
        vin: vin || '',
        licenseNumber: licenseNumber || '',
        price: parseFloat(price),
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        vehicleType: vehicleType || 'Car',
        vehicleClass: vehicleClass || 'Economic Manual',
        transmission: transmission || 'Manual',
        features: features || [],
        imageUrl: imageUrl || 'https://via.placeholder.com/400x300?text=Car+Image',
        specs: specs || {},
        status: 'available', // available, rental, dirty, maintenance
        currentRenter: null,
        currentRenterId: null,
        currentLocation: currentLocation || 'Office',
        odometer: odometer || 0,
        fuelLevel: fuelLevel || '8/8',
        telematicsConnected: telematicsConnected || false,
        availableDate: availableDate ? new Date(availableDate) : new Date(),
        lastLocationUpdate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
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

    // Add maintenance record
    if (path === '/maintenance') {
      const {
        vehicleId,
        maintenanceType,
        maintenanceTypeInterval,
        plannedStartDate,
        plannedEndDate,
        odometerAtMaintenance,
        currentOdometer,
        status,
        notes
      } = body;

      if (!vehicleId || !maintenanceType || !plannedStartDate) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      const maintenance = {
        _id: uuidv4(),
        vehicleId,
        maintenanceType,
        maintenanceTypeInterval: maintenanceTypeInterval || 'Every 30 Days',
        plannedStartDate: new Date(plannedStartDate),
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        odometerAtMaintenance: odometerAtMaintenance || 0,
        currentOdometer: currentOdometer || 0,
        status: status || 'pending',
        notes: notes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('maintenance').insertOne(maintenance);
      return NextResponse.json({ success: true, data: maintenance });
    }

    // Add repair order
    if (path === '/repair-orders') {
      const {
        vehicleId,
        maintenanceType,
        dateIn,
        dateOut,
        totalInParts,
        totalInLabor,
        totalInTaxes,
        totalAmount,
        fuelLevelOut,
        fuelLevelIn,
        odometerOut,
        odometerIn,
        notes,
        comments,
        status,
        mechanicName,
        workshopName,
        phoneNumber,
        address
      } = body;

      if (!vehicleId || !maintenanceType || !dateIn) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
      }

      const repairOrder = {
        _id: uuidv4(),
        vehicleId,
        maintenanceType,
        dateIn: new Date(dateIn),
        dateOut: dateOut ? new Date(dateOut) : null,
        totalInParts: parseFloat(totalInParts) || 0,
        totalInLabor: parseFloat(totalInLabor) || 0,
        totalInTaxes: parseFloat(totalInTaxes) || 0,
        totalAmount: parseFloat(totalAmount) || 0,
        fuelLevelOut: fuelLevelOut || '',
        fuelLevelIn: fuelLevelIn || '',
        odometerOut: odometerOut || 0,
        odometerIn: odometerIn || 0,
        notes: notes || '',
        comments: comments || '',
        status: status || 'pending',
        mechanicName: mechanicName || '',
        workshopName: workshopName || '',
        phoneNumber: phoneNumber || '',
        address: address || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('repairOrders').insertOne(repairOrder);
      return NextResponse.json({ success: true, data: repairOrder });
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

    // Update car/vehicle
    if (path.startsWith('/cars/') && path.split('/').length === 3) {
      const carId = path.split('/')[2];
      const {
        name,
        model,
        brand,
        price,
        features,
        imageUrl,
        specs,
        status,
        vehicleKey,
        vin,
        licenseNumber,
        vehicleType,
        vehicleClass,
        transmission,
        currentLocation,
        currentRenter,
        currentRenterId,
        odometer,
        fuelLevel,
        telematicsConnected,
        availableDate
      } = body;

      const updateData = {};
      if (name) updateData.name = name;
      if (model) updateData.model = model;
      if (brand) updateData.brand = brand;
      if (price) updateData.price = parseFloat(price);
      if (features) updateData.features = features;
      if (imageUrl) updateData.imageUrl = imageUrl;
      if (specs) updateData.specs = specs;
      if (status) updateData.status = status;
      if (vehicleKey) updateData.vehicleKey = vehicleKey;
      if (vin !== undefined) updateData.vin = vin;
      if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
      if (vehicleType) updateData.vehicleType = vehicleType;
      if (vehicleClass) updateData.vehicleClass = vehicleClass;
      if (transmission) updateData.transmission = transmission;
      if (currentLocation) updateData.currentLocation = currentLocation;
      if (currentRenter !== undefined) updateData.currentRenter = currentRenter;
      if (currentRenterId !== undefined) updateData.currentRenterId = currentRenterId;
      if (odometer !== undefined) updateData.odometer = odometer;
      if (fuelLevel !== undefined) updateData.fuelLevel = fuelLevel;
      if (telematicsConnected !== undefined) updateData.telematicsConnected = telematicsConnected;
      if (availableDate) updateData.availableDate = new Date(availableDate);
      if (currentLocation) updateData.lastLocationUpdate = new Date();

      updateData.updatedAt = new Date();

      const result = await db.collection('cars').updateOne(
        { _id: carId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Vehicle not found' }, { status: 404 });
      }

      const updatedCar = await db.collection('cars').findOne({ _id: carId });
      return NextResponse.json({ success: true, data: updatedCar });
    }

    // Update reservation
    if (path.startsWith('/reservations/') && path.split('/').length === 3) {
      const reservationId = path.split('/')[2];
      const {
        status,
        customerName,
        email,
        phone,
        startDate,
        endDate,
        message,
        pickupDate,
        pickupTime,
        pickupLocation,
        returnDate,
        returnTime,
        returnLocation,
        assignedVehicle,
        totalPaid,
        totalRefunded,
        notes
      } = body;

      const updateData = {};
      if (status) updateData.status = status;
      if (customerName) updateData.customerName = customerName;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (message !== undefined) updateData.message = message;
      if (notes !== undefined) updateData.notes = notes;
      if (assignedVehicle !== undefined) updateData.assignedVehicle = assignedVehicle;
      if (pickupTime) updateData.pickupTime = pickupTime;
      if (pickupLocation) updateData.pickupLocation = pickupLocation;
      if (returnTime) updateData.returnTime = returnTime;
      if (returnLocation) updateData.returnLocation = returnLocation;

      // Handle date updates
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (pickupDate) updateData.pickupDate = new Date(pickupDate);
      if (returnDate) updateData.returnDate = new Date(returnDate);

      // Handle financial updates
      if (totalPaid !== undefined) {
        updateData.totalPaid = parseFloat(totalPaid);
      }
      if (totalRefunded !== undefined) {
        updateData.totalRefunded = parseFloat(totalRefunded);
      }

      // Recalculate outstanding balance if financial fields updated
      if (totalPaid !== undefined || totalRefunded !== undefined) {
        const reservation = await db.collection('reservations').findOne({ _id: reservationId });
        if (reservation) {
          const paid = totalPaid !== undefined ? parseFloat(totalPaid) : reservation.totalPaid || 0;
          const refunded = totalRefunded !== undefined ? parseFloat(totalRefunded) : reservation.totalRefunded || 0;
          const revenue = reservation.totalRevenue || reservation.totalPrice || 0;
          updateData.outstandingBalance = parseFloat((revenue - paid + refunded).toFixed(2));
        }
      }

      // Recalculate days and pricing if dates changed
      if ((pickupDate && returnDate) || (startDate && endDate)) {
        const reservation = await db.collection('reservations').findOne({ _id: reservationId });
        if (reservation) {
          const newPickupDate = pickupDate ? new Date(pickupDate) : (startDate ? new Date(startDate) : reservation.pickupDate);
          const newReturnDate = returnDate ? new Date(returnDate) : (endDate ? new Date(endDate) : reservation.returnDate);
          const totalDays = Math.ceil((newReturnDate - newPickupDate) / (1000 * 60 * 60 * 24));
          const dailyRate = reservation.dailyRate || 0;
          const totalPrice = parseFloat((dailyRate * totalDays).toFixed(2));

          updateData.totalDays = totalDays;
          updateData.totalPrice = totalPrice;
          updateData.totalRevenue = totalPrice;
          updateData.outstandingBalance = parseFloat((totalPrice - (reservation.totalPaid || 0) + (reservation.totalRefunded || 0)).toFixed(2));
        }
      }

      updateData.updatedAt = new Date();

      // If dates are being updated, check for conflicts
      if (startDate && endDate) {
        const reservation = await db.collection('reservations').findOne({ _id: reservationId });
        if (!reservation) {
          return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
        }

        const requestStart = new Date(startDate);
        const requestEnd = new Date(endDate);

        // Check for overlapping rentals
        const overlappingRentals = await db.collection('rentals').findOne({
          carId: reservation.carId,
          status: 'active',
          $or: [
            { startDate: { $lte: requestEnd }, endDate: null },
            { startDate: { $lte: requestEnd }, endDate: { $gte: requestStart } }
          ]
        });

        if (overlappingRentals) {
          return NextResponse.json({ success: false, error: 'Car is not available for the selected dates' }, { status: 400 });
        }

        // Check for overlapping approved reservations (excluding current reservation)
        const overlappingReservations = await db.collection('reservations').findOne({
          _id: { $ne: reservationId },
          carId: reservation.carId,
          status: 'approved',
          startDate: { $lte: requestEnd },
          endDate: { $gte: requestStart }
        });

        if (overlappingReservations) {
          return NextResponse.json({ success: false, error: 'Car is already reserved for the selected dates' }, { status: 400 });
        }
      }

      const result = await db.collection('reservations').updateOne(
        { _id: reservationId },
        { $set: updateData }
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

    // Update maintenance
    if (path.startsWith('/maintenance/') && path.split('/').length === 3) {
      const maintenanceId = path.split('/')[2];
      const updateData = { ...body, updatedAt: new Date() };

      if (body.plannedStartDate) updateData.plannedStartDate = new Date(body.plannedStartDate);
      if (body.plannedEndDate) updateData.plannedEndDate = new Date(body.plannedEndDate);

      const result = await db.collection('maintenance').updateOne(
        { _id: maintenanceId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Maintenance record not found' }, { status: 404 });
      }

      const updated = await db.collection('maintenance').findOne({ _id: maintenanceId });
      return NextResponse.json({ success: true, data: updated });
    }

    // Update repair order
    if (path.startsWith('/repair-orders/') && path.split('/').length === 3) {
      const repairOrderId = path.split('/')[2];
      const updateData = { ...body, updatedAt: new Date() };

      if (body.dateIn) updateData.dateIn = new Date(body.dateIn);
      if (body.dateOut) updateData.dateOut = new Date(body.dateOut);
      if (body.totalInParts !== undefined) updateData.totalInParts = parseFloat(body.totalInParts);
      if (body.totalInLabor !== undefined) updateData.totalInLabor = parseFloat(body.totalInLabor);
      if (body.totalInTaxes !== undefined) updateData.totalInTaxes = parseFloat(body.totalInTaxes);
      if (body.totalAmount !== undefined) updateData.totalAmount = parseFloat(body.totalAmount);

      const result = await db.collection('repairOrders').updateOne(
        { _id: repairOrderId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'Repair order not found' }, { status: 404 });
      }

      const updated = await db.collection('repairOrders').findOne({ _id: repairOrderId });
      return NextResponse.json({ success: true, data: updated });
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

    // Delete maintenance
    if (path.startsWith('/maintenance/') && path.split('/').length === 3) {
      const maintenanceId = path.split('/')[2];
      const result = await db.collection('maintenance').deleteOne({ _id: maintenanceId });

      if (result.deletedCount === 0) {
        return NextResponse.json({ success: false, error: 'Maintenance record not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Maintenance record deleted' });
    }

    // Delete repair order
    if (path.startsWith('/repair-orders/') && path.split('/').length === 3) {
      const repairOrderId = path.split('/')[2];
      const result = await db.collection('repairOrders').deleteOne({ _id: repairOrderId });

      if (result.deletedCount === 0) {
        return NextResponse.json({ success: false, error: 'Repair order not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Repair order deleted' });
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