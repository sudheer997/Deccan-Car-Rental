const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'car_rental_db';

const sampleVehicles = [
  {
    name: 'Toyota Camry 2024',
    brand: 'Toyota',
    model: 'Camry',
    price: 1200,
    purchasePrice: 28000,
    purchaseDate: new Date('2024-01-15'),
    imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop',
    vehicleType: 'Car',
    vehicleClass: 'Mid-Size Sedan',
    transmission: 'Automatic',
    vin: '4T1B11HK8RU123456',
    licenseNumber: 'ABC-1234',
    features: ['Bluetooth', 'Backup Camera', 'Lane Assist', 'Apple CarPlay', 'Cruise Control'],
    currentLocation: 'Office',
    odometer: 12500,
    fuelLevel: '8/8'
  },
  {
    name: 'Honda CR-V 2024',
    brand: 'Honda',
    model: 'CR-V',
    price: 1400,
    purchasePrice: 32000,
    purchaseDate: new Date('2024-02-10'),
    imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop',
    vehicleType: 'SUV',
    vehicleClass: 'Compact SUV',
    transmission: 'Automatic',
    vin: '2HKRW2H89PH123457',
    licenseNumber: 'XYZ-5678',
    features: ['AWD', 'Sunroof', 'Heated Seats', 'Navigation', 'Blind Spot Monitor'],
    currentLocation: 'Office',
    odometer: 8200,
    fuelLevel: '7/8'
  },
  {
    name: 'Ford F-150 2023',
    brand: 'Ford',
    model: 'F-150',
    price: 1600,
    purchasePrice: 45000,
    purchaseDate: new Date('2023-11-20'),
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&h=600&fit=crop',
    vehicleType: 'Truck',
    vehicleClass: 'Full-Size Pickup',
    transmission: 'Automatic',
    vin: '1FTFW1E84NFC12458',
    licenseNumber: 'TRK-9012',
    features: ['4WD', 'Towing Package', 'Bed Liner', 'Trailer Hitch', 'Remote Start'],
    currentLocation: 'Office',
    odometer: 15000,
    fuelLevel: '6/8'
  },
  {
    name: 'Tesla Model 3 2024',
    brand: 'Tesla',
    model: 'Model 3',
    price: 1800,
    purchasePrice: 42000,
    purchaseDate: new Date('2024-03-05'),
    imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop',
    vehicleType: 'Car',
    vehicleClass: 'Electric Sedan',
    transmission: 'Automatic',
    vin: '5YJ3E1EA5PF123459',
    licenseNumber: 'EV-3456',
    features: ['Autopilot', 'Full Self-Driving', 'Premium Audio', 'Glass Roof', 'Supercharging'],
    currentLocation: 'Office',
    odometer: 5000,
    fuelLevel: '8/8',
    telematicsConnected: true
  },
  {
    name: 'Chevrolet Suburban 2024',
    brand: 'Chevrolet',
    model: 'Suburban',
    price: 1700,
    purchasePrice: 58000,
    purchaseDate: new Date('2024-01-30'),
    imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=600&fit=crop',
    vehicleType: 'SUV',
    vehicleClass: 'Full-Size SUV',
    transmission: 'Automatic',
    vin: '1GNSKCKD4PR123460',
    licenseNumber: 'SUV-7890',
    features: ['7-Seater', 'DVD Player', 'Roof Rack', 'Power Liftgate', 'Leather Seats'],
    currentLocation: 'Office',
    odometer: 9500,
    fuelLevel: '7/8'
  },
  {
    name: 'BMW 3 Series 2024',
    brand: 'BMW',
    model: '330i',
    price: 2000,
    purchasePrice: 48000,
    purchaseDate: new Date('2024-02-15'),
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop',
    vehicleType: 'Car',
    vehicleClass: 'Luxury Sedan',
    transmission: 'Automatic',
    vin: 'WBA8E9C51MCE12461',
    licenseNumber: 'LUX-1122',
    features: ['Sport Package', 'Premium Sound', 'Adaptive Suspension', 'HUD', 'Wireless Charging'],
    currentLocation: 'Office',
    odometer: 6000,
    fuelLevel: '8/8',
    telematicsConnected: true
  },
  {
    name: 'Jeep Wrangler 2024',
    brand: 'Jeep',
    model: 'Wrangler Unlimited',
    price: 1500,
    purchasePrice: 42000,
    purchaseDate: new Date('2024-03-20'),
    imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=600&fit=crop',
    vehicleType: 'SUV',
    vehicleClass: 'Off-Road SUV',
    transmission: 'Automatic',
    vin: '1C4HJXDG5PW123462',
    licenseNumber: 'JEP-3344',
    features: ['Removable Top', '4x4', 'Off-Road Tires', 'Winch', 'Rock Rails'],
    currentLocation: 'Office',
    odometer: 7200,
    fuelLevel: '6/8'
  },
  {
    name: 'Mercedes-Benz E-Class 2024',
    brand: 'Mercedes-Benz',
    model: 'E350',
    price: 2200,
    purchasePrice: 62000,
    purchaseDate: new Date('2024-01-10'),
    imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&h=600&fit=crop',
    vehicleType: 'Car',
    vehicleClass: 'Executive Sedan',
    transmission: 'Automatic',
    vin: 'W1K2A46G9PA123463',
    licenseNumber: 'MBZ-5566',
    features: ['Massage Seats', 'Burmester Sound', 'Air Suspension', 'Night Vision', 'Ambient Lighting'],
    currentLocation: 'Office',
    odometer: 4500,
    fuelLevel: '8/8',
    telematicsConnected: true
  },
  {
    name: 'Hyundai Sonata 2024',
    brand: 'Hyundai',
    model: 'Sonata',
    price: 1100,
    purchasePrice: 26000,
    purchaseDate: new Date('2024-02-28'),
    imageUrl: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&h=600&fit=crop',
    vehicleType: 'Car',
    vehicleClass: 'Mid-Size Sedan',
    transmission: 'Automatic',
    vin: '5NPEH4J20PH123464',
    licenseNumber: 'HYU-7788',
    features: ['Smart Cruise', 'Wireless CarPlay', 'Digital Key', 'Heated Steering', 'Panoramic Roof'],
    currentLocation: 'Office',
    odometer: 10500,
    fuelLevel: '7/8'
  },
  {
    name: 'Audi Q5 2024',
    brand: 'Audi',
    model: 'Q5',
    price: 1900,
    purchasePrice: 52000,
    purchaseDate: new Date('2024-03-10'),
    imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&h=600&fit=crop',
    vehicleType: 'SUV',
    vehicleClass: 'Luxury SUV',
    transmission: 'Automatic',
    vin: 'WA1BNAFY2P2123465',
    licenseNumber: 'AUD-9900',
    features: ['Quattro AWD', 'Virtual Cockpit', 'Matrix LED', 'Bang & Olufsen', 'Adaptive Cruise'],
    currentLocation: 'Office',
    odometer: 5800,
    fuelLevel: '8/8',
    telematicsConnected: true
  },
  {
    name: 'Nissan Altima 2024',
    brand: 'Nissan',
    model: 'Altima',
    price: 1050,
    purchasePrice: 24000,
    purchaseDate: new Date('2024-01-25'),
    imageUrl: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=600&fit=crop',
    vehicleType: 'Car',
    vehicleClass: 'Mid-Size Sedan',
    transmission: 'Automatic',
    vin: '1N4BL4BV6PC123466',
    licenseNumber: 'NIS-1212',
    features: ['ProPILOT Assist', 'Zero Gravity Seats', 'Safety Shield', 'Remote Start', 'Apple CarPlay'],
    currentLocation: 'Office',
    odometer: 11000,
    fuelLevel: '6/8'
  },
  {
    name: 'Mazda CX-5 2024',
    brand: 'Mazda',
    model: 'CX-5',
    price: 1300,
    purchasePrice: 30000,
    purchaseDate: new Date('2024-02-20'),
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    vehicleType: 'SUV',
    vehicleClass: 'Compact SUV',
    transmission: 'Automatic',
    vin: 'JM3KFBDM5P0123467',
    licenseNumber: 'MAZ-3434',
    features: ['i-ACTIVSENSE', 'Bose Audio', 'Head-Up Display', 'Turbo Engine', 'Premium Interior'],
    currentLocation: 'Office',
    odometer: 9000,
    fuelLevel: '7/8'
  },
  {
    name: 'Ram 1500 2024',
    brand: 'Ram',
    model: '1500',
    price: 1550,
    purchasePrice: 48000,
    purchaseDate: new Date('2024-03-01'),
    imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&h=600&fit=crop',
    vehicleType: 'Truck',
    vehicleClass: 'Full-Size Pickup',
    transmission: 'Automatic',
    vin: '1C6SRFFT4PN123468',
    licenseNumber: 'RAM-5656',
    features: ['eTorque', 'Multifunction Tailgate', 'Air Suspension', 'Harman Kardon', '12-inch Screen'],
    currentLocation: 'Office',
    odometer: 13000,
    fuelLevel: '6/8'
  },
  {
    name: 'Volkswagen Atlas 2024',
    brand: 'Volkswagen',
    model: 'Atlas',
    price: 1450,
    purchasePrice: 38000,
    purchaseDate: new Date('2024-01-18'),
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop',
    vehicleType: 'SUV',
    vehicleClass: 'Mid-Size SUV',
    transmission: 'Automatic',
    vin: '1V2GR2CA6PC123469',
    licenseNumber: 'VW-7878',
    features: ['Third Row', 'Digital Cockpit', 'Travel Assist', 'Fender Audio', 'Panoramic Sunroof'],
    currentLocation: 'Office',
    odometer: 8500,
    fuelLevel: '7/8'
  },
  {
    name: 'Lexus RX 350 2024',
    brand: 'Lexus',
    model: 'RX 350',
    price: 2100,
    purchasePrice: 55000,
    purchaseDate: new Date('2024-02-05'),
    imageUrl: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=600&fit=crop',
    vehicleType: 'SUV',
    vehicleClass: 'Luxury SUV',
    transmission: 'Automatic',
    vin: '2T2BZMCA5PC123470',
    licenseNumber: 'LEX-9090',
    features: ['Mark Levinson Audio', 'Heated/Cooled Seats', 'Head-Up Display', 'Safety System+', 'Premium Package'],
    currentLocation: 'Office',
    odometer: 6500,
    fuelLevel: '8/8',
    telematicsConnected: true
  }
];

async function addVehicles() {
  let client;
  try {
    console.log('Connecting to MongoDB...');
    client = await MongoClient.connect(MONGO_URL);
    const db = client.db(DB_NAME);

    console.log('Adding sample vehicles...');

    for (const vehicle of sampleVehicles) {
      const car = {
        _id: uuidv4(),
        vehicleKey: `V${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(7)}`,
        ...vehicle,
        specs: {},
        status: 'available',
        currentRenter: null,
        currentRenterId: null,
        telematicsConnected: vehicle.telematicsConnected || false,
        availableDate: new Date(),
        lastLocationUpdate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('cars').insertOne(car);
      console.log(`✓ Added: ${vehicle.name}`);
    }

    console.log(`\n✓ Successfully added ${sampleVehicles.length} vehicles to the inventory!`);
  } catch (error) {
    console.error('Error adding vehicles:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
  }
}

addVehicles();
