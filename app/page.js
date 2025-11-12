'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Users, Calendar, DollarSign, LogOut, Plus, Edit, Trash2, Check, X, Eye, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cars, setCars] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedCar, setSelectedCar] = useState(null);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [showCarDialog, setShowCarDialog] = useState(false);
  const [showRentalDialog, setShowRentalDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [availableCars, setAvailableCars] = useState([]);
  const [carImageFile, setCarImageFile] = useState(null);
  const [carImagePreview, setCarImagePreview] = useState('');
  const [editingReservation, setEditingReservation] = useState(null);
  const [showEditReservationDialog, setShowEditReservationDialog] = useState(false);
  const [showReservationDetailsDialog, setShowReservationDetailsDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [reservationFilter, setReservationFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [repairOrders, setRepairOrders] = useState([]);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showRepairOrderDialog, setShowRepairOrderDialog] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [editingRepairOrder, setEditingRepairOrder] = useState(null);
  const [maintenanceView, setMaintenanceView] = useState('schedule'); // 'schedule' or 'repairs'
  const [financialAnalytics, setFinancialAnalytics] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
      setIsAdmin(true);
    }
    fetchCars();
  }, []);

  useEffect(() => {
    if (isAdmin && token) {
      fetchDashboardData();
    }
  }, [isAdmin, token]);

  const fetchCars = async () => {
    try {
      const res = await fetch('/api/cars');
      const data = await res.json();
      if (data.success) {
        setCars(data.data);
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  const checkAvailability = async () => {
    if (!startDate || !endDate) {
      setAvailableCars(cars.filter(car => car.status === 'available'));
      return;
    }

    try {
      const res = await fetch(`/api/cars/availability?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      if (data.success) {
        setAvailableCars(data.data);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast({ title: 'Error', description: 'Failed to check availability', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (cars.length > 0) {
      checkAvailability();
    }
  }, [startDate, endDate, cars]);

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, reservationsRes, rentalsRes, paymentsRes, maintenanceRes, repairOrdersRes, analyticsRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers }),
        fetch('/api/reservations', { headers }),
        fetch('/api/rentals', { headers }),
        fetch('/api/payments', { headers }),
        fetch('/api/maintenance'),
        fetch('/api/repair-orders'),
        fetch('/api/financial-analytics')
      ]);

      const statsData = await statsRes.json();
      const reservationsData = await reservationsRes.json();
      const rentalsData = await rentalsRes.json();
      const paymentsData = await paymentsRes.json();
      const maintenanceData = await maintenanceRes.json();
      const repairOrdersData = await repairOrdersRes.json();
      const analyticsData = await analyticsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (reservationsData.success) setReservations(reservationsData.data);
      if (rentalsData.success) setRentals(rentalsData.data);
      if (paymentsData.success) setPayments(paymentsData.data);
      if (maintenanceData.success) setMaintenanceRecords(maintenanceData.data);
      if (repairOrdersData.success) setRepairOrders(repairOrdersData.data);
      if (analyticsData.success) setFinancialAnalytics(analyticsData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Login attempt with:', { username, password });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (data.success) {
        setToken(data.data.token);
        setIsAdmin(true);
        localStorage.setItem('adminToken', data.data.token);
        toast({ title: 'Success', description: 'Logged in successfully' });
      } else {
        console.error('Login failed:', data.error);
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: 'Error', description: 'Login failed: ' + error.message, variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem('adminToken');
    toast({ title: 'Success', description: 'Logged out successfully' });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Error', description: 'Image size should be less than 5MB', variant: 'destructive' });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
        return;
      }

      setCarImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCarImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCar = async (carData) => {
    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(carData)
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Car added successfully' });
        fetchCars();
        fetchDashboardData();
        setShowCarDialog(false);
        setCarImageFile(null);
        setCarImagePreview('');
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add car', variant: 'destructive' });
    }
  };

  const handleUpdateCar = async (carId, carData) => {
    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(carData)
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Car updated successfully' });
        fetchCars();
        fetchDashboardData();
        setShowCarDialog(false);
        setEditingCar(null);
        setCarImageFile(null);
        setCarImagePreview('');
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update car', variant: 'destructive' });
    }
  };

  const handleDeleteCar = async (carId) => {
    if (!confirm('Are you sure you want to delete this car?')) return;
    
    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: 'Car deleted successfully' });
        fetchCars();
        fetchDashboardData();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete car', variant: 'destructive' });
    }
  };

  const handleReservationRequest = async (formData) => {
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Reservation request submitted successfully' });
        setShowReservationForm(false);
        setSelectedCar(null);
        checkAvailability(); // Refresh availability
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit reservation', variant: 'destructive' });
    }
  };

  const getFilteredReservations = () => {
    let filtered = [...reservations];

    // Apply status/date filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (reservationFilter) {
      case 'todays-returns':
        filtered = filtered.filter(r => {
          const returnDate = new Date(r.returnDate || r.endDate);
          returnDate.setHours(0, 0, 0, 0);
          return returnDate.getTime() === today.getTime();
        });
        break;
      case 'tomorrows-pickups':
        filtered = filtered.filter(r => {
          const pickupDate = new Date(r.pickupDate || r.startDate);
          pickupDate.setHours(0, 0, 0, 0);
          return pickupDate.getTime() === tomorrow.getTime();
        });
        break;
      case 'todays-pickups':
        filtered = filtered.filter(r => {
          const pickupDate = new Date(r.pickupDate || r.startDate);
          pickupDate.setHours(0, 0, 0, 0);
          return pickupDate.getTime() === today.getTime();
        });
        break;
      case 'tomorrows-returns':
        filtered = filtered.filter(r => {
          const returnDate = new Date(r.returnDate || r.endDate);
          returnDate.setHours(0, 0, 0, 0);
          return returnDate.getTime() === tomorrow.getTime();
        });
        break;
      case 'on-rent':
        filtered = filtered.filter(r => r.status === 'rental');
        break;
      case 'completed':
        filtered = filtered.filter(r => r.status === 'completed');
        break;
      case 'cancelled':
        filtered = filtered.filter(r => r.status === 'cancelled');
        break;
      case 'outstanding-payment':
        filtered = filtered.filter(r => (r.outstandingBalance || 0) > 0);
        break;
      default:
        // 'all' - no filter
        break;
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        (r.customerName || '').toLowerCase().includes(query) ||
        (r.email || '').toLowerCase().includes(query) ||
        (r.phone || '').toLowerCase().includes(query) ||
        (r.reservationNumber || '').toLowerCase().includes(query) ||
        (r.assignedVehicle || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const getFilteredVehicles = () => {
    let filtered = [...cars];

    // Apply status filters
    switch (vehicleFilter) {
      case 'available':
        filtered = filtered.filter(v => v.status === 'available');
        break;
      case 'dirty':
        filtered = filtered.filter(v => v.status === 'dirty');
        break;
      case 'on-rent':
        filtered = filtered.filter(v => v.status === 'rental');
        break;
      default:
        // 'all' - no filter
        break;
    }

    // Apply search filter
    if (vehicleSearchQuery) {
      const query = vehicleSearchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        (v.vehicleKey || '').toLowerCase().includes(query) ||
        (v.name || '').toLowerCase().includes(query) ||
        (v.vin || '').toLowerCase().includes(query) ||
        (v.licenseNumber || '').toLowerCase().includes(query) ||
        (v.brand || '').toLowerCase().includes(query) ||
        (v.model || '').toLowerCase().includes(query) ||
        (v.currentRenter || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const handleUpdateReservation = async (reservationId, status) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Reservation updated' });
        fetchDashboardData();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update reservation', variant: 'destructive' });
    }
  };

  const handleEditReservation = async (reservationData) => {
    try {
      const res = await fetch(`/api/reservations/${editingReservation._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reservationData)
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Reservation updated successfully' });
        fetchDashboardData();
        setShowEditReservationDialog(false);
        setEditingReservation(null);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update reservation', variant: 'destructive' });
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return;

    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Reservation deleted successfully' });
        fetchDashboardData();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete reservation', variant: 'destructive' });
    }
  };

  const handleDeleteMaintenance = async (maintenanceId) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;

    try {
      const res = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Maintenance record deleted successfully' });
        fetchDashboardData();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete maintenance record', variant: 'destructive' });
    }
  };

  const handleDeleteRepairOrder = async (repairOrderId) => {
    if (!confirm('Are you sure you want to delete this repair order?')) return;

    try {
      const res = await fetch(`/api/repair-orders/${repairOrderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Repair order deleted successfully' });
        fetchDashboardData();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete repair order', variant: 'destructive' });
    }
  };

  const handleAddMaintenance = async (maintenanceData) => {
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(maintenanceData)
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Maintenance scheduled successfully' });
        fetchDashboardData();
        setShowMaintenanceDialog(false);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to schedule maintenance', variant: 'destructive' });
    }
  };

  const handleUpdateMaintenance = async (maintenanceId, maintenanceData) => {
    try {
      const res = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(maintenanceData)
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Maintenance updated successfully' });
        fetchDashboardData();
        setShowMaintenanceDialog(false);
        setEditingMaintenance(null);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update maintenance', variant: 'destructive' });
    }
  };

  const handleAddRepairOrder = async (repairOrderData) => {
    try {
      const res = await fetch('/api/repair-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(repairOrderData)
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Repair order created successfully' });
        fetchDashboardData();
        setShowRepairOrderDialog(false);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create repair order', variant: 'destructive' });
    }
  };

  const handleUpdateRepairOrder = async (repairOrderId, repairOrderData) => {
    try {
      const res = await fetch(`/api/repair-orders/${repairOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(repairOrderData)
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: 'Success', description: 'Repair order updated successfully' });
        fetchDashboardData();
        setShowRepairOrderDialog(false);
        setEditingRepairOrder(null);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update repair order', variant: 'destructive' });
    }
  };

  const handleAddRental = async (rentalData) => {
    try {
      const res = await fetch('/api/rentals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(rentalData)
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: 'Rental created successfully' });
        fetchDashboardData();
        fetchCars();
        setShowRentalDialog(false);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create rental', variant: 'destructive' });
    }
  };

  const handleUpdateRental = async (rentalId, status) => {
    try {
      const res = await fetch(`/api/rentals/${rentalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: 'Rental updated' });
        fetchDashboardData();
        fetchCars();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update rental', variant: 'destructive' });
    }
  };

  const handleAddPayment = async (paymentData) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: 'Payment record added' });
        fetchDashboardData();
        setShowPaymentDialog(false);
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add payment', variant: 'destructive' });
    }
  };

  const handleUpdatePayment = async (paymentId, updateData) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: 'Payment updated' });
        fetchDashboardData();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update payment', variant: 'destructive' });
    }
  };

  // Customer Portal View
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="flex justify-between items-center mb-12">
              <h1 className="text-4xl font-bold">Deccan Rentals</h1>
              <Button
                onClick={() => setIsAdmin(true)}
                variant="outline"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                Admin Login
              </Button>
            </div>
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-4">Premium Car Rentals</h2>
              <p className="text-xl text-blue-100">Find your perfect ride for monthly rentals</p>
            </div>
          </div>
        </div>

        {/* Date Selection Section */}
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Select Your Rental Dates</CardTitle>
              <CardDescription>Choose your start and end dates to see available cars</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      setStartDate(selectedDate);
                      // Automatically set end date to 30 days later (minimum rental period)
                      if (selectedDate) {
                        const start = new Date(selectedDate);
                        const end = new Date(start);
                        end.setDate(start.getDate() + 30);
                        setEndDate(end.toISOString().split('T')[0]);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Minimum rental period: 30 days (monthly rental)
                  </p>
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (minimum 30 days)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      const selectedEndDate = e.target.value;
                      if (startDate) {
                        const start = new Date(startDate);
                        const end = new Date(selectedEndDate);
                        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

                        if (daysDiff < 30) {
                          toast({
                            title: 'Invalid Rental Period',
                            description: 'Monthly rentals require a minimum of 30 days. End date has been adjusted.',
                            variant: 'destructive'
                          });
                          // Set to minimum 30 days
                          const minEnd = new Date(start);
                          minEnd.setDate(start.getDate() + 30);
                          setEndDate(minEnd.toISOString().split('T')[0]);
                        } else {
                          setEndDate(selectedEndDate);
                        }
                      } else {
                        setEndDate(selectedEndDate);
                      }
                    }}
                    min={startDate ? (() => {
                      const minDate = new Date(startDate);
                      minDate.setDate(minDate.getDate() + 30);
                      return minDate.toISOString().split('T')[0];
                    })() : new Date().toISOString().split('T')[0]}
                  />
                  {startDate && endDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Rental period: {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={checkAvailability}
                  disabled={!startDate || !endDate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg"
                  size="lg"
                >
                  Search Available Cars
                </Button>
                {(startDate || endDate) && (
                  <Button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setAvailableCars([]);
                    }}
                    variant="outline"
                    className="px-6 py-6"
                    size="lg"
                  >
                    Clear
                  </Button>
                )}
              </div>
              {startDate && endDate && availableCars.length >= 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Showing <strong>{availableCars.length}</strong> cars available from <strong>{new Date(startDate).toLocaleDateString()}</strong> to <strong>{new Date(endDate).toLocaleDateString()}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cars Grid */}
        <div className="container mx-auto px-4 py-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-8">
            Available Cars {startDate && endDate ? `(${availableCars.length})` : ''}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(startDate && endDate ? availableCars : cars.filter(car => car.status === 'available')).map((car) => (
              <Card key={car._id} className="hover:shadow-xl transition-shadow">
                <CardHeader className="p-0">
                  <img
                    src={car.imageUrl}
                    alt={car.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="text-xl mb-2">{car.name}</CardTitle>
                  <CardDescription className="mb-4">
                    {car.brand} {car.model}
                  </CardDescription>
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-blue-600">₹{car.price}/month</p>
                  </div>
                  {car.features && car.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {car.features.slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="secondary">{feature}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => {
                      setSelectedCar(car);
                      setShowReservationForm(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Request Reservation
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Reservation Form Dialog */}
        <Dialog open={showReservationForm} onOpenChange={setShowReservationForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Reservation</DialogTitle>
              <DialogDescription>
                {selectedCar && `${selectedCar.name} - ₹${selectedCar.price}/month`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleReservationRequest({
                carId: selectedCar._id,
                customerName: formData.get('customerName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                message: formData.get('message')
              });
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Full Name</Label>
                  <Input id="customerName" name="customerName" required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reservationStartDate">Start Date</Label>
                    <Input
                      id="reservationStartDate"
                      name="startDate"
                      type="date"
                      defaultValue={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reservationEndDate">End Date</Label>
                    <Input
                      id="reservationEndDate"
                      name="endDate"
                      type="date"
                      defaultValue={endDate}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea id="message" name="message" />
                </div>
                <Button type="submit" className="w-full">Submit Request</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Admin Login View
  if (isAdmin && !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Default: admin / admin123
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin123"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  onClick={() => console.log('Login button clicked!')}
                >
                  Login
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdmin(false)}
                  className="w-full"
                >
                  Back to Customer Portal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Deccan Rentals</h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Total Cars</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalCars || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.availableCars || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Rented</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.rentedCars || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingReservations || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Active Rentals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.activeRentals || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Due Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.pendingPayments || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="vehicles" className="flex gap-6">
          <TabsList className="flex flex-col h-fit w-48 space-y-1">
            <TabsTrigger value="vehicles" className="w-full justify-start">Vehicles</TabsTrigger>
            <TabsTrigger value="reservations" className="w-full justify-start">Reservations</TabsTrigger>
            <TabsTrigger value="rentals" className="w-full justify-start">Rentals</TabsTrigger>
            <TabsTrigger value="maintenance" className="w-full justify-start">Maintenance</TabsTrigger>
            <TabsTrigger value="payments" className="w-full justify-start">Payments</TabsTrigger>
            <TabsTrigger value="analytics" className="w-full justify-start">Financial Analytics</TabsTrigger>
          </TabsList>

          <div className="flex-1 space-y-4">

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Vehicles</h2>
              <Button onClick={() => {
                setEditingCar(null);
                setShowCarDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Vehicle
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 border-b">
              <Button
                variant={vehicleFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVehicleFilter('all')}
              >
                All
              </Button>
              <Button
                variant={vehicleFilter === 'available' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVehicleFilter('available')}
              >
                Available
              </Button>
              <Button
                variant={vehicleFilter === 'dirty' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVehicleFilter('dirty')}
              >
                Dirty
              </Button>
              <Button
                variant={vehicleFilter === 'on-rent' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVehicleFilter('on-rent')}
              >
                On Rent
              </Button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <Input
                placeholder="Start typing a name..."
                value={vehicleSearchQuery}
                onChange={(e) => setVehicleSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Vehicles Table */}
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Key</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vehicle Type</TableHead>
                    <TableHead>Current Renter</TableHead>
                    <TableHead>Available Date</TableHead>
                    <TableHead>Make</TableHead>
                    <TableHead>Vehicle Model</TableHead>
                    <TableHead>Vehicle Class</TableHead>
                    <TableHead>Current Location</TableHead>
                    <TableHead>Odometer</TableHead>
                    <TableHead>Fuel Level</TableHead>
                    <TableHead>Available?</TableHead>
                    <TableHead>Last Location Update</TableHead>
                    <TableHead>Telematics</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredVehicles().map((vehicle) => (
                    <TableRow key={vehicle._id}>
                      <TableCell className="font-medium">
                        {vehicle.vehicleKey || vehicle._id.slice(-6)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {vehicle.vin || '-'}
                      </TableCell>
                      <TableCell>{vehicle.licenseNumber || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            vehicle.status === 'available' ? 'default' :
                            vehicle.status === 'rental' ? 'default' :
                            vehicle.status === 'dirty' ? 'secondary' :
                            'default'
                          }
                          className={
                            vehicle.status === 'rental' ? 'bg-blue-600 hover:bg-blue-700' :
                            vehicle.status === 'dirty' ? 'bg-green-600 hover:bg-green-700' :
                            ''
                          }
                        >
                          {vehicle.status === 'rental' ? 'Rental' :
                           vehicle.status === 'dirty' ? 'Dirty' :
                           vehicle.status === 'available' ? 'Available' : vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{vehicle.vehicleType || 'Car'}</TableCell>
                      <TableCell className="text-blue-600">
                        {vehicle.currentRenter || 'Not Assigned'}
                      </TableCell>
                      <TableCell>
                        {vehicle.availableDate ? new Date(vehicle.availableDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{vehicle.brand}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {vehicle.vehicleClass || 'Economic Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell>{vehicle.currentLocation || 'Office'}</TableCell>
                      <TableCell className="text-right">
                        {vehicle.odometer ? vehicle.odometer.toLocaleString() : '0'}
                      </TableCell>
                      <TableCell>{vehicle.fuelLevel || '8/8'}</TableCell>
                      <TableCell>
                        {vehicle.status === 'available' ? (
                          <Badge className="bg-green-500">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {vehicle.lastLocationUpdate ? new Date(vehicle.lastLocationUpdate).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        {vehicle.telematicsConnected ? (
                          <Badge className="bg-green-500">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingCar(vehicle);
                              setShowCarDialog(true);
                            }}
                            title="Edit Vehicle"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCar(vehicle._id)}
                            disabled={vehicle.status === 'rental'}
                            title="Delete Vehicle"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            {getFilteredVehicles().length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {getFilteredVehicles().length} of {cars.length} vehicles
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">Available: </span>
                    <span className="font-bold text-green-600">
                      {cars.filter(v => v.status === 'available').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">On Rent: </span>
                    <span className="font-bold text-blue-600">
                      {cars.filter(v => v.status === 'rental').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dirty: </span>
                    <span className="font-bold text-orange-600">
                      {cars.filter(v => v.status === 'dirty').length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Cars Tab (Legacy - Grid View) */}
          <TabsContent value="cars" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Car Management</h2>
              <Button onClick={() => {
                setEditingCar(null);
                setShowCarDialog(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Car
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cars.map((car) => (
                <Card key={car._id}>
                  <CardHeader className="p-0">
                    <img src={car.imageUrl} alt={car.name} className="w-full h-40 object-cover rounded-t-lg" />
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <CardTitle className="text-lg">{car.name}</CardTitle>
                        <CardDescription>{car.brand} {car.model}</CardDescription>
                      </div>
                      <Badge variant={car.status === 'available' ? 'default' : 'secondary'}>
                        {car.status}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold text-blue-600">₹{car.price}/month</p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCar(car);
                        setShowCarDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteCar(car._id)}
                      disabled={car.status === 'rented'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Reservations</h2>
              <div className="flex gap-2">
                <Button variant="outline">
                  Availability Check
                </Button>
                <Button onClick={() => setShowEditReservationDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> New Reservation
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 flex-wrap border-b">
              <Button
                variant={reservationFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReservationFilter('all')}
              >
                All
              </Button>
              <Button
                variant={reservationFilter === 'todays-returns' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReservationFilter('todays-returns')}
              >
                Today's Returns
              </Button>
              <Button
                variant={reservationFilter === 'tomorrows-pickups' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReservationFilter('tomorrows-pickups')}
              >
                Tomorrow's Pickups
              </Button>
              <Button
                variant={reservationFilter === 'todays-pickups' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReservationFilter('todays-pickups')}
              >
                Today's Pickups
              </Button>
              <Button
                variant={reservationFilter === 'tomorrows-returns' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReservationFilter('tomorrows-returns')}
              >
                Tomorrow's Returns
              </Button>
              <Button
                variant={reservationFilter === 'on-rent' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReservationFilter('on-rent')}
              >
                On Rent
              </Button>
              <Button
                variant={reservationFilter === 'completed' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReservationFilter('completed')}
              >
                Completed
              </Button>
              <Button
                variant={reservationFilter === 'cancelled' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReservationFilter('cancelled')}
              >
                Cancelled
              </Button>
              <Button
                variant={reservationFilter === 'outstanding-payment' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setReservationFilter('outstanding-payment')}
              >
                Outstanding Payment
              </Button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <Input
                placeholder="Start typing a name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Reservations Table */}
            <div className="border rounded-lg overflow-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Pickup Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Pickup Location</TableHead>
                  <TableHead>Vehicle Class</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Total Refunded</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Total Days</TableHead>
                  <TableHead className="text-right">Daily Rate</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredReservations().map((reservation, index) => (
                  <TableRow key={reservation._id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{reservation.customerName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(reservation.pickupDate || reservation.startDate).toLocaleDateString()}</div>
                        <div className="text-gray-500">{reservation.pickupTime || '9:00 AM'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(reservation.returnDate || reservation.endDate).toLocaleDateString()}</div>
                        <div className="text-gray-500">{reservation.returnTime || '9:00 AM'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{reservation.pickupLocation || 'Office'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{reservation.vehicleClass || 'Standard'}</Badge>
                    </TableCell>
                    <TableCell>
                      {reservation.assignedVehicle || 'Not Assigned'}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(reservation.totalPrice || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(reservation.totalRevenue || reservation.totalPrice || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(reservation.totalPaid || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(reservation.totalRefunded || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={reservation.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                        ₹{(reservation.outstandingBalance || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          reservation.status === 'open' ? 'default' :
                          reservation.status === 'rental' ? 'default' :
                          reservation.status === 'completed' ? 'secondary' :
                          reservation.status === 'cancelled' ? 'destructive' :
                          'default'
                        }
                        className={
                          reservation.status === 'open' ? 'bg-orange-500 hover:bg-orange-600' :
                          reservation.status === 'rental' ? 'bg-green-500 hover:bg-green-600' :
                          ''
                        }
                      >
                        {reservation.status?.charAt(0).toUpperCase() + reservation.status?.slice(1) || 'Open'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {reservation.notes || reservation.message || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {reservation.totalDays || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{(reservation.dailyRate || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setShowReservationDetailsDialog(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingReservation(reservation);
                            setShowEditReservationDialog(true);
                          }}
                          title="Edit Reservation"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {reservation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateReservation(reservation._id, 'approved')}
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateReservation(reservation._id, 'rejected')}
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteReservation(reservation._id)}
                          title="Delete Reservation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

            {/* Summary Row */}
            {getFilteredReservations().length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {getFilteredReservations().length} of {reservations.length} reservations
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">Total Price: </span>
                    <span className="font-bold">
                      ₹{getFilteredReservations().reduce((sum, r) => sum + (r.totalPrice || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Revenue: </span>
                    <span className="font-bold">
                      ₹{getFilteredReservations().reduce((sum, r) => sum + (r.totalRevenue || r.totalPrice || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Paid: </span>
                    <span className="font-bold">
                      ₹{getFilteredReservations().reduce((sum, r) => sum + (r.totalPaid || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Outstanding: </span>
                    <span className="font-bold text-red-600">
                      ₹{getFilteredReservations().reduce((sum, r) => sum + (r.outstandingBalance || 0), 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Days: </span>
                    <span className="font-bold">
                      {getFilteredReservations().reduce((sum, r) => sum + (r.totalDays || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Rentals Tab */}
          <TabsContent value="rentals" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Rental Tracking</h2>
              <Button onClick={() => setShowRentalDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Rental
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Monthly Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentals.map((rental) => (
                  <TableRow key={rental._id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{rental.customerName}</div>
                        <div>{rental.email}</div>
                        <div>{rental.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{rental.carDetails.name}</TableCell>
                    <TableCell>{new Date(rental.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{rental.endDate ? new Date(rental.endDate).toLocaleDateString() : 'Ongoing'}</TableCell>
                    <TableCell>₹{rental.monthlyPrice}</TableCell>
                    <TableCell>
                      <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}>
                        {rental.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rental.status === 'active' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateRental(rental._id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Maintenance Management</h2>
              <div className="flex gap-2">
                <Button
                  variant={maintenanceView === 'schedule' ? 'default' : 'outline'}
                  onClick={() => setMaintenanceView('schedule')}
                >
                  Maintenance Schedule
                </Button>
                <Button
                  variant={maintenanceView === 'repairs' ? 'default' : 'outline'}
                  onClick={() => setMaintenanceView('repairs')}
                >
                  Repair Orders
                </Button>
              </div>
            </div>

            {/* Maintenance Schedule View */}
            {maintenanceView === 'schedule' && (
              <>
                <div className="flex justify-between items-center">
                  <Input
                    placeholder="Search by vehicle..."
                    className="max-w-md"
                  />
                  <Button onClick={() => {
                    setEditingMaintenance(null);
                    setShowMaintenanceDialog(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" /> Schedule Maintenance
                  </Button>
                </div>

                <div className="border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Maintenance Type</TableHead>
                        <TableHead>Maintenance Type Interval</TableHead>
                        <TableHead>Planned Start Date</TableHead>
                        <TableHead>Planned Date End</TableHead>
                        <TableHead>Odometer at Maintenance</TableHead>
                        <TableHead>Current Odometer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Status of the Vehicle</TableHead>
                        <TableHead>Vehicle Current Renter</TableHead>
                        <TableHead>Vehicle Current Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRecords.map((maintenance, index) => (
                        <TableRow key={maintenance._id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="text-blue-600">
                            {maintenance.vehicleDetails?.name || 'Unknown Vehicle'}
                          </TableCell>
                          <TableCell>{maintenance.maintenanceType}</TableCell>
                          <TableCell>{maintenance.maintenanceTypeInterval}</TableCell>
                          <TableCell>
                            {new Date(maintenance.plannedStartDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {maintenance.plannedEndDate ? new Date(maintenance.plannedEndDate).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {maintenance.odometerAtMaintenance?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {maintenance.currentOdometer?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-gray-500 text-white">
                              {maintenance.status || 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                maintenance.vehicleDetails?.status === 'rental' ? 'bg-blue-600' :
                                maintenance.vehicleDetails?.status === 'dirty' ? 'bg-green-600' : ''
                              }
                            >
                              {maintenance.vehicleDetails?.status === 'rental' ? 'Rental' :
                               maintenance.vehicleDetails?.status === 'dirty' ? 'Dirty' :
                               maintenance.vehicleDetails?.status || 'Available'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-blue-600">
                            {maintenance.vehicleDetails?.currentRenter || 'Not Assigned'}
                          </TableCell>
                          <TableCell>
                            {maintenance.vehicleDetails?.currentLocation || 'Office'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingMaintenance(maintenance);
                                  setShowMaintenanceDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteMaintenance(maintenance._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {/* Repair Orders View */}
            {maintenanceView === 'repairs' && (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">All</Button>
                    <Button variant="ghost" size="sm">Due This Week</Button>
                  </div>
                  <Button onClick={() => {
                    setEditingRepairOrder(null);
                    setShowRepairOrderDialog(true);
                  }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Repair Order
                  </Button>
                </div>

                <div className="border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Maintenance Type</TableHead>
                        <TableHead>Date In</TableHead>
                        <TableHead>Date Out</TableHead>
                        <TableHead>Total In Parts</TableHead>
                        <TableHead>Total In Labor</TableHead>
                        <TableHead>Total In Taxes</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Fuel Level Out</TableHead>
                        <TableHead>Fuel Level In</TableHead>
                        <TableHead>Odometer Out</TableHead>
                        <TableHead>Odometer In</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Comments</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Mechanic Name</TableHead>
                        <TableHead>Workshop Name</TableHead>
                        <TableHead>Phone Number</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repairOrders.map((repair) => (
                        <TableRow key={repair._id}>
                          <TableCell>{repair._id.slice(-6)}</TableCell>
                          <TableCell className="text-blue-600">
                            {repair.vehicleDetails?.name || 'Unknown Vehicle'}
                          </TableCell>
                          <TableCell>{repair.maintenanceType}</TableCell>
                          <TableCell>
                            {repair.dateIn ? new Date(repair.dateIn).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {repair.dateOut ? new Date(repair.dateOut).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            ${repair.totalInParts?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right">
                            ${repair.totalInLabor?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right">
                            ${repair.totalInTaxes?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            ${repair.totalAmount?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>{repair.fuelLevelOut || '-'}</TableCell>
                          <TableCell>{repair.fuelLevelIn || '-'}</TableCell>
                          <TableCell>{repair.odometerOut?.toLocaleString() || '-'}</TableCell>
                          <TableCell>{repair.odometerIn?.toLocaleString() || '-'}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{repair.notes || '-'}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{repair.comments || '-'}</TableCell>
                          <TableCell>
                            <Badge>{repair.status || 'Pending'}</Badge>
                          </TableCell>
                          <TableCell>{repair.mechanicName || '-'}</TableCell>
                          <TableCell>{repair.workshopName || '-'}</TableCell>
                          <TableCell>{repair.phoneNumber || '-'}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{repair.address || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingRepairOrder(repair);
                                  setShowRepairOrderDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteRepairOrder(repair._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary Row for Repair Orders */}
                {repairOrders.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Showing {repairOrders.length} repair orders
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Total Parts: </span>
                        <span className="font-bold">
                          ${repairOrders.reduce((sum, r) => sum + (r.totalInParts || 0), 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Labor: </span>
                        <span className="font-bold">
                          ${repairOrders.reduce((sum, r) => sum + (r.totalInLabor || 0), 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Taxes: </span>
                        <span className="font-bold">
                          ${repairOrders.reduce((sum, r) => sum + (r.totalInTaxes || 0), 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Grand Total: </span>
                        <span className="font-bold text-blue-600">
                          ${repairOrders.reduce((sum, r) => sum + (r.totalAmount || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Payment Tracking</h2>
              <Button onClick={() => setShowPaymentDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Payment
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{payment.rentalDetails.customerName}</TableCell>
                    <TableCell>{payment.rentalDetails.carName}</TableCell>
                    <TableCell>₹{payment.amount}</TableCell>
                    <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === 'pending' ? 'destructive' : 'default'}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdatePayment(payment._id, { 
                            status: 'paid', 
                            paidDate: new Date().toISOString() 
                          })}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Financial Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Financial Analytics - Earnings vs Investments</h2>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${financialAnalytics.reduce((sum, v) => sum + v.totalEarnings, 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Investment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ${financialAnalytics.reduce((sum, v) => sum + v.totalInvestment, 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    financialAnalytics.reduce((sum, v) => sum + v.netProfit, 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    ${financialAnalytics.reduce((sum, v) => sum + v.netProfit, 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Average ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {financialAnalytics.length > 0
                      ? (financialAnalytics.reduce((sum, v) => sum + v.roi, 0) / financialAnalytics.length).toFixed(2)
                      : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Table */}
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Brand/Model</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Rental Earnings</TableHead>
                    <TableHead>Reservation Earnings</TableHead>
                    <TableHead>Total Earnings</TableHead>
                    <TableHead>Maintenance Cost</TableHead>
                    <TableHead>Repair Cost</TableHead>
                    <TableHead>Total Investment</TableHead>
                    <TableHead>Net Profit</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead>Rental Count</TableHead>
                    <TableHead>Reservation Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialAnalytics.map((analytics) => (
                    <TableRow key={analytics.vehicleId}>
                      <TableCell className="font-medium text-blue-600">
                        {analytics.vehicleName}
                        {analytics.vehicleKey && (
                          <span className="text-xs text-gray-500 ml-2">({analytics.vehicleKey})</span>
                        )}
                      </TableCell>
                      <TableCell>{analytics.brand} {analytics.model}</TableCell>
                      <TableCell className="text-right">
                        ${analytics.purchasePrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {analytics.purchaseDate
                          ? new Date(analytics.purchaseDate).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ${analytics.rentalEarnings.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ${analytics.reservationEarnings.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        ${analytics.totalEarnings.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        ${analytics.maintenanceCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        ${analytics.repairCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-red-600">
                        ${analytics.totalInvestment.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${
                        analytics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${analytics.netProfit.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={analytics.roi >= 0 ? 'default' : 'destructive'}>
                          {analytics.roi}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{analytics.rentalCount}</TableCell>
                      <TableCell className="text-center">{analytics.reservationCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary Row */}
            {financialAnalytics.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Showing {financialAnalytics.length} vehicles
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Total Earnings: </span>
                      <span className="font-bold text-green-600">
                        ${financialAnalytics.reduce((sum, v) => sum + v.totalEarnings, 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Investment: </span>
                      <span className="font-bold text-red-600">
                        ${financialAnalytics.reduce((sum, v) => sum + v.totalInvestment, 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Net Profit: </span>
                      <span className={`font-bold ${
                        financialAnalytics.reduce((sum, v) => sum + v.netProfit, 0) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        ${financialAnalytics.reduce((sum, v) => sum + v.netProfit, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Add/Edit Car Dialog */}
      <Dialog open={showCarDialog} onOpenChange={(open) => {
        setShowCarDialog(open);
        if (!open) {
          setCarImageFile(null);
          setCarImagePreview('');
          setEditingCar(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCar ? 'Edit Car' : 'Add New Car'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const carData = {
              name: formData.get('name'),
              model: formData.get('model'),
              brand: formData.get('brand'),
              price: formData.get('price'),
              purchasePrice: formData.get('purchasePrice'),
              purchaseDate: formData.get('purchaseDate'),
              imageUrl: carImagePreview || formData.get('imageUrl') || editingCar?.imageUrl,
              features: formData.get('features').split(',').map(f => f.trim()).filter(f => f),
              vehicleKey: formData.get('vehicleKey'),
              vin: formData.get('vin'),
              licenseNumber: formData.get('licenseNumber'),
              vehicleType: formData.get('vehicleType'),
              vehicleClass: formData.get('vehicleClass'),
              transmission: formData.get('transmission'),
              currentLocation: formData.get('currentLocation'),
              odometer: formData.get('odometer'),
              fuelLevel: formData.get('fuelLevel'),
              telematicsConnected: formData.get('telematicsConnected') === 'yes',
              status: formData.get('status')
            };
            if (editingCar) {
              handleUpdateCar(editingCar._id, carData);
            } else {
              handleAddCar(carData);
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Car Name</Label>
                <Input id="name" name="name" defaultValue={editingCar?.name} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" defaultValue={editingCar?.brand} required />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" name="model" defaultValue={editingCar?.model} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Monthly Price (₹)</Label>
                  <Input id="price" name="price" type="number" defaultValue={editingCar?.price} required />
                </div>
                <div>
                  <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                  <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" defaultValue={editingCar?.purchasePrice} placeholder="Initial investment" />
                </div>
              </div>
              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={editingCar?.purchaseDate?.split('T')[0]} />
              </div>

              {/* Vehicle Details Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehicleKey">Vehicle Key</Label>
                    <Input id="vehicleKey" name="vehicleKey" defaultValue={editingCar?.vehicleKey} placeholder="Auto-generated if empty" />
                  </div>
                  <div>
                    <Label htmlFor="vin">VIN</Label>
                    <Input id="vin" name="vin" defaultValue={editingCar?.vin} placeholder="Vehicle Identification Number" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input id="licenseNumber" name="licenseNumber" defaultValue={editingCar?.licenseNumber} />
                  </div>
                  <div>
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <Select name="vehicleType" defaultValue={editingCar?.vehicleType || 'Car'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Car">Car</SelectItem>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="Van">Van</SelectItem>
                        <SelectItem value="Truck">Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="vehicleClass">Vehicle Class</Label>
                    <Select name="vehicleClass" defaultValue={editingCar?.vehicleClass || 'Economic Manual'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Economic Manual">Economic Manual</SelectItem>
                        <SelectItem value="Economic Automatic">Economic Automatic</SelectItem>
                        <SelectItem value="Premium Manual">Premium Manual</SelectItem>
                        <SelectItem value="Premium Automatic">Premium Automatic</SelectItem>
                        <SelectItem value="Luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="transmission">Transmission</Label>
                    <Select name="transmission" defaultValue={editingCar?.transmission || 'Manual'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="Automatic">Automatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Location & Status Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Location & Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currentLocation">Current Location</Label>
                    <Input id="currentLocation" name="currentLocation" defaultValue={editingCar?.currentLocation || 'Office'} />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={editingCar?.status || 'available'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="rental">Rental</SelectItem>
                        <SelectItem value="dirty">Dirty</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label htmlFor="odometer">Odometer</Label>
                    <Input id="odometer" name="odometer" type="number" defaultValue={editingCar?.odometer || 0} />
                  </div>
                  <div>
                    <Label htmlFor="fuelLevel">Fuel Level</Label>
                    <Input id="fuelLevel" name="fuelLevel" defaultValue={editingCar?.fuelLevel || '8/8'} placeholder="e.g., 8/8" />
                  </div>
                  <div>
                    <Label htmlFor="telematicsConnected">Telematics</Label>
                    <Select name="telematicsConnected" defaultValue={editingCar?.telematicsConnected ? 'yes' : 'no'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Car Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageFile" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Car className="h-12 w-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          Click to upload a photo or drag and drop
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 5MB
                        </span>
                      </div>
                    </Label>
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>

                  {/* Image Preview */}
                  {(carImagePreview || editingCar?.imageUrl) && (
                    <div className="mt-4">
                      <img
                        src={carImagePreview || editingCar?.imageUrl}
                        alt="Car preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setCarImageFile(null);
                          setCarImagePreview('');
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Or enter an image URL below:
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  defaultValue={editingCar?.imageUrl}
                  placeholder="https://example.com/car-image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="features">Features (comma-separated)</Label>
                <Input
                  id="features"
                  name="features"
                  defaultValue={editingCar?.features?.join(', ')}
                  placeholder="AC, Power Steering, GPS"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingCar ? 'Update Car' : 'Add Car'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Rental Dialog */}
      <Dialog open={showRentalDialog} onOpenChange={setShowRentalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Rental</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleAddRental({
              carId: formData.get('carId'),
              customerName: formData.get('customerName'),
              email: formData.get('email'),
              phone: formData.get('phone'),
              startDate: formData.get('startDate'),
              monthlyPrice: formData.get('monthlyPrice')
            });
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="carId">Select Car</Label>
                <Select name="carId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a car" />
                  </SelectTrigger>
                  <SelectContent>
                    {cars.filter(car => car.status === 'available').map((car) => (
                      <SelectItem key={car._id} value={car._id}>
                        {car.name} - ₹{car.price}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input id="customerName" name="customerName" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" required />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" required />
              </div>
              <div>
                <Label htmlFor="monthlyPrice">Monthly Price (₹)</Label>
                <Input id="monthlyPrice" name="monthlyPrice" type="number" required />
              </div>
              <Button type="submit" className="w-full">Create Rental</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleAddPayment({
              rentalId: formData.get('rentalId'),
              amount: formData.get('amount'),
              dueDate: formData.get('dueDate'),
              notes: formData.get('notes')
            });
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rentalId">Select Rental</Label>
                <Select name="rentalId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rental" />
                  </SelectTrigger>
                  <SelectContent>
                    {rentals.filter(r => r.status === 'active').map((rental) => (
                      <SelectItem key={rental._id} value={rental._id}>
                        {rental.customerName} - {rental.carDetails.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input id="amount" name="amount" type="number" required />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="date" required />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" />
              </div>
              <Button type="submit" className="w-full">Add Payment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Reservation Dialog */}
      <Dialog open={showEditReservationDialog} onOpenChange={setShowEditReservationDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReservation ? 'Edit Reservation' : 'New Reservation'}</DialogTitle>
            <DialogDescription>
              {editingReservation ? `Update reservation details for ${editingReservation.customerName}` : 'Create a new reservation'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleEditReservation({
              customerName: formData.get('customerName'),
              email: formData.get('email'),
              phone: formData.get('phone'),
              pickupDate: formData.get('pickupDate'),
              pickupTime: formData.get('pickupTime'),
              pickupLocation: formData.get('pickupLocation'),
              returnDate: formData.get('returnDate'),
              returnTime: formData.get('returnTime'),
              returnLocation: formData.get('returnLocation'),
              assignedVehicle: formData.get('assignedVehicle'),
              totalPaid: formData.get('totalPaid'),
              totalRefunded: formData.get('totalRefunded'),
              notes: formData.get('notes'),
              status: formData.get('status'),
              // Legacy fields
              startDate: formData.get('pickupDate'),
              endDate: formData.get('returnDate'),
              message: formData.get('notes')
            });
          }}>
            <div className="space-y-4">
              {/* Customer Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="editCustomerName">Customer Name *</Label>
                    <Input
                      id="editCustomerName"
                      name="customerName"
                      defaultValue={editingReservation?.customerName}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEmail">Email *</Label>
                    <Input
                      id="editEmail"
                      name="email"
                      type="email"
                      defaultValue={editingReservation?.email}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPhone">Phone *</Label>
                    <Input
                      id="editPhone"
                      name="phone"
                      defaultValue={editingReservation?.phone}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pickup Details */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Pickup Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="editPickupDate">Pickup Date *</Label>
                    <Input
                      id="editPickupDate"
                      name="pickupDate"
                      type="date"
                      defaultValue={editingReservation?.pickupDate ? new Date(editingReservation.pickupDate).toISOString().split('T')[0] : editingReservation?.startDate ? new Date(editingReservation.startDate).toISOString().split('T')[0] : ''}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPickupTime">Pickup Time</Label>
                    <Input
                      id="editPickupTime"
                      name="pickupTime"
                      type="time"
                      defaultValue={editingReservation?.pickupTime || '09:00'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPickupLocation">Pickup Location</Label>
                    <Input
                      id="editPickupLocation"
                      name="pickupLocation"
                      defaultValue={editingReservation?.pickupLocation || 'Office'}
                    />
                  </div>
                </div>
              </div>

              {/* Return Details */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Return Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="editReturnDate">Return Date *</Label>
                    <Input
                      id="editReturnDate"
                      name="returnDate"
                      type="date"
                      defaultValue={editingReservation?.returnDate ? new Date(editingReservation.returnDate).toISOString().split('T')[0] : editingReservation?.endDate ? new Date(editingReservation.endDate).toISOString().split('T')[0] : ''}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editReturnTime">Return Time</Label>
                    <Input
                      id="editReturnTime"
                      name="returnTime"
                      type="time"
                      defaultValue={editingReservation?.returnTime || '09:00'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editReturnLocation">Return Location</Label>
                    <Input
                      id="editReturnLocation"
                      name="returnLocation"
                      defaultValue={editingReservation?.returnLocation || 'Office'}
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Assignment */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Vehicle Assignment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editAssignedVehicle">Assigned Vehicle</Label>
                    <Input
                      id="editAssignedVehicle"
                      name="assignedVehicle"
                      defaultValue={editingReservation?.assignedVehicle || ''}
                      placeholder="e.g., Jeep Grand Cherokee Overland 4X2 - 191"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editStatus">Status *</Label>
                    <Select name="status" defaultValue={editingReservation?.status || 'open'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="rental">Rental</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editTotalPaid">Total Paid (₹)</Label>
                    <Input
                      id="editTotalPaid"
                      name="totalPaid"
                      type="number"
                      step="0.01"
                      defaultValue={editingReservation?.totalPaid || 0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editTotalRefunded">Total Refunded (₹)</Label>
                    <Input
                      id="editTotalRefunded"
                      name="totalRefunded"
                      type="number"
                      step="0.01"
                      defaultValue={editingReservation?.totalRefunded || 0}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  name="notes"
                  defaultValue={editingReservation?.notes || editingReservation?.message || ''}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingReservation ? 'Update Reservation' : 'Create Reservation'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditReservationDialog(false);
                    setEditingReservation(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Reservation Details Dialog */}
      <Dialog open={showReservationDetailsDialog} onOpenChange={setShowReservationDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Customer Name</Label>
                  <p className="text-lg font-medium">{selectedReservation.customerName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={selectedReservation.status === 'pending' ? 'default' :
                              selectedReservation.status === 'approved' ? 'default' : 'destructive'}
                    >
                      {selectedReservation.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="text-base">{selectedReservation.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Phone</Label>
                  <p className="text-base">{selectedReservation.phone}</p>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Car</Label>
                <p className="text-lg font-medium">
                  {selectedReservation.carDetails?.name || 'N/A'}
                </p>
                {selectedReservation.carDetails && (
                  <p className="text-sm text-gray-500">
                    {selectedReservation.carDetails.brand} {selectedReservation.carDetails.model}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Start Date</Label>
                  <p className="text-base">
                    {selectedReservation.startDate ? new Date(selectedReservation.startDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">End Date</Label>
                  <p className="text-base">
                    {selectedReservation.endDate ? new Date(selectedReservation.endDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedReservation.startDate && selectedReservation.endDate && (
                <div>
                  <Label className="text-gray-600">Duration</Label>
                  <p className="text-base">
                    {Math.ceil((new Date(selectedReservation.endDate) - new Date(selectedReservation.startDate)) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              )}

              {selectedReservation.message && (
                <div>
                  <Label className="text-gray-600">Message</Label>
                  <p className="text-base">{selectedReservation.message}</p>
                </div>
              )}

              <div>
                <Label className="text-gray-600">Created At</Label>
                <p className="text-sm text-gray-500">
                  {new Date(selectedReservation.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    setShowReservationDetailsDialog(false);
                    setEditingReservation(selectedReservation);
                    setShowEditReservationDialog(true);
                  }}
                  className="flex-1"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Reservation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReservationDetailsDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Maintenance Dialog */}
      <Dialog open={showMaintenanceDialog} onOpenChange={(open) => {
        setShowMaintenanceDialog(open);
        if (!open) setEditingMaintenance(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMaintenance ? 'Edit Maintenance' : 'Add Maintenance'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const maintenanceData = {
              vehicleId: formData.get('vehicleId'),
              maintenanceType: formData.get('maintenanceType'),
              interval: formData.get('interval'),
              plannedStartDate: formData.get('plannedStartDate'),
              plannedEndDate: formData.get('plannedEndDate'),
              actualStartDate: formData.get('actualStartDate') || null,
              actualEndDate: formData.get('actualEndDate') || null,
              odometerReading: parseInt(formData.get('odometerReading')) || 0,
              status: formData.get('status'),
              notes: formData.get('notes')
            };
            if (editingMaintenance) {
              handleUpdateMaintenance(editingMaintenance._id, maintenanceData);
            } else {
              handleAddMaintenance(maintenanceData);
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vehicleId">Vehicle</Label>
                <select
                  id="vehicleId"
                  name="vehicleId"
                  defaultValue={editingMaintenance?.vehicleId}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {cars.map(car => (
                    <option key={car._id} value={car._id}>
                      {car.name} ({car.vehicleKey || car._id.slice(-6)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenanceType">Maintenance Type</Label>
                  <select
                    id="maintenanceType"
                    name="maintenanceType"
                    defaultValue={editingMaintenance?.maintenanceType}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Oil Change">Oil Change</option>
                    <option value="Tire Rotation">Tire Rotation</option>
                    <option value="Brake Inspection">Brake Inspection</option>
                    <option value="Engine Check">Engine Check</option>
                    <option value="General Service">General Service</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="interval">Interval</Label>
                  <Input
                    id="interval"
                    name="interval"
                    defaultValue={editingMaintenance?.interval}
                    placeholder="e.g., 5000 km, 6 months"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plannedStartDate">Planned Start Date</Label>
                  <Input
                    id="plannedStartDate"
                    name="plannedStartDate"
                    type="date"
                    defaultValue={editingMaintenance?.plannedStartDate?.split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="plannedEndDate">Planned End Date</Label>
                  <Input
                    id="plannedEndDate"
                    name="plannedEndDate"
                    type="date"
                    defaultValue={editingMaintenance?.plannedEndDate?.split('T')[0]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="actualStartDate">Actual Start Date</Label>
                  <Input
                    id="actualStartDate"
                    name="actualStartDate"
                    type="date"
                    defaultValue={editingMaintenance?.actualStartDate?.split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="actualEndDate">Actual End Date</Label>
                  <Input
                    id="actualEndDate"
                    name="actualEndDate"
                    type="date"
                    defaultValue={editingMaintenance?.actualEndDate?.split('T')[0]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="odometerReading">Odometer Reading</Label>
                  <Input
                    id="odometerReading"
                    name="odometerReading"
                    type="number"
                    defaultValue={editingMaintenance?.odometerReading}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={editingMaintenance?.status || 'Planned'}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingMaintenance?.notes}
                  className="w-full p-2 border rounded min-h-[80px]"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingMaintenance ? 'Update Maintenance' : 'Add Maintenance'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMaintenanceDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Repair Order Dialog */}
      <Dialog open={showRepairOrderDialog} onOpenChange={(open) => {
        setShowRepairOrderDialog(open);
        if (!open) setEditingRepairOrder(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRepairOrder ? 'Edit Repair Order' : 'Add Repair Order'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const repairOrderData = {
              vehicleId: formData.get('vehicleId'),
              maintenanceType: formData.get('maintenanceType'),
              totalInParts: parseFloat(formData.get('totalInParts')) || 0,
              totalInLabor: parseFloat(formData.get('totalInLabor')) || 0,
              totalInTaxes: parseFloat(formData.get('totalInTaxes')) || 0,
              totalAmount: parseFloat(formData.get('totalInParts') || 0) +
                          parseFloat(formData.get('totalInLabor') || 0) +
                          parseFloat(formData.get('totalInTaxes') || 0),
              notes: formData.get('notes'),
              dateIn: formData.get('dateIn'),
              dateOut: formData.get('dateOut'),
              fuelLevelOut: formData.get('fuelLevelOut'),
              fuelLevelIn: formData.get('fuelLevelIn'),
              odometerOut: parseInt(formData.get('odometerOut')) || 0,
              odometerIn: parseInt(formData.get('odometerIn')) || 0,
              mechanicName: formData.get('mechanicName'),
              status: formData.get('status'),
              comments: formData.get('comments'),
              workshopName: formData.get('workshopName'),
              workshopMechanicName: formData.get('workshopMechanicName'),
              phoneNumber: formData.get('phoneNumber'),
              address: formData.get('address')
            };
            if (editingRepairOrder) {
              handleUpdateRepairOrder(editingRepairOrder._id, repairOrderData);
            } else {
              handleAddRepairOrder(repairOrderData);
            }
          }}>
            <div className="space-y-6">
              {/* General Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">General Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="repair-vehicleId">Vehicle</Label>
                    <select
                      id="repair-vehicleId"
                      name="vehicleId"
                      defaultValue={editingRepairOrder?.vehicleId}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">Select Vehicle</option>
                      {cars.map(car => (
                        <option key={car._id} value={car._id}>
                          {car.name} ({car.vehicleKey || car._id.slice(-6)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="repair-maintenanceType">Maintenance Type</Label>
                    <select
                      id="repair-maintenanceType"
                      name="maintenanceType"
                      defaultValue={editingRepairOrder?.maintenanceType}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Oil Change">Oil Change</option>
                      <option value="Tire Rotation">Tire Rotation</option>
                      <option value="Brake Repair">Brake Repair</option>
                      <option value="Engine Repair">Engine Repair</option>
                      <option value="Body Work">Body Work</option>
                      <option value="Electrical">Electrical</option>
                      <option value="General Service">General Service</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Financial Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="totalInParts">Total In Parts ($)</Label>
                    <Input
                      id="totalInParts"
                      name="totalInParts"
                      type="number"
                      step="0.01"
                      defaultValue={editingRepairOrder?.totalInParts}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalInLabor">Total In Labor ($)</Label>
                    <Input
                      id="totalInLabor"
                      name="totalInLabor"
                      type="number"
                      step="0.01"
                      defaultValue={editingRepairOrder?.totalInLabor}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalInTaxes">Total In Taxes ($)</Label>
                    <Input
                      id="totalInTaxes"
                      name="totalInTaxes"
                      type="number"
                      step="0.01"
                      defaultValue={editingRepairOrder?.totalInTaxes}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Notes</h3>
                <div>
                  <Label htmlFor="notes">Repair Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    defaultValue={editingRepairOrder?.notes}
                    className="w-full p-2 border rounded min-h-[80px]"
                    placeholder="Details about the repair work..."
                  />
                </div>
              </div>

              {/* Vehicle Out Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Vehicle Out Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateIn">Date In</Label>
                    <Input
                      id="dateIn"
                      name="dateIn"
                      type="date"
                      defaultValue={editingRepairOrder?.dateIn?.split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOut">Date Out</Label>
                    <Input
                      id="dateOut"
                      name="dateOut"
                      type="date"
                      defaultValue={editingRepairOrder?.dateOut?.split('T')[0]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fuelLevelOut">Fuel Level Out</Label>
                    <select
                      id="fuelLevelOut"
                      name="fuelLevelOut"
                      defaultValue={editingRepairOrder?.fuelLevelOut}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="0/8">0/8</option>
                      <option value="1/8">1/8</option>
                      <option value="2/8">2/8</option>
                      <option value="3/8">3/8</option>
                      <option value="4/8">4/8</option>
                      <option value="5/8">5/8</option>
                      <option value="6/8">6/8</option>
                      <option value="7/8">7/8</option>
                      <option value="8/8">8/8</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="fuelLevelIn">Fuel Level In</Label>
                    <select
                      id="fuelLevelIn"
                      name="fuelLevelIn"
                      defaultValue={editingRepairOrder?.fuelLevelIn}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select</option>
                      <option value="0/8">0/8</option>
                      <option value="1/8">1/8</option>
                      <option value="2/8">2/8</option>
                      <option value="3/8">3/8</option>
                      <option value="4/8">4/8</option>
                      <option value="5/8">5/8</option>
                      <option value="6/8">6/8</option>
                      <option value="7/8">7/8</option>
                      <option value="8/8">8/8</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="odometerOut">Odometer Out</Label>
                    <Input
                      id="odometerOut"
                      name="odometerOut"
                      type="number"
                      defaultValue={editingRepairOrder?.odometerOut}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="odometerIn">Odometer In</Label>
                    <Input
                      id="odometerIn"
                      name="odometerIn"
                      type="number"
                      defaultValue={editingRepairOrder?.odometerIn}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Internal Management Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Internal Management</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mechanicName">Mechanic Name</Label>
                    <Input
                      id="mechanicName"
                      name="mechanicName"
                      defaultValue={editingRepairOrder?.mechanicName}
                      placeholder="Assigned mechanic"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      defaultValue={editingRepairOrder?.status || 'Pending'}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Comments</h3>
                <div>
                  <Label htmlFor="comments">Internal Comments</Label>
                  <textarea
                    id="comments"
                    name="comments"
                    defaultValue={editingRepairOrder?.comments}
                    className="w-full p-2 border rounded min-h-[80px]"
                    placeholder="Internal notes and comments..."
                  />
                </div>
              </div>

              {/* External Workshops Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">External Workshops</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workshopName">Workshop Name</Label>
                    <Input
                      id="workshopName"
                      name="workshopName"
                      defaultValue={editingRepairOrder?.workshopName}
                      placeholder="External workshop name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workshopMechanicName">Workshop Mechanic Name</Label>
                    <Input
                      id="workshopMechanicName"
                      name="workshopMechanicName"
                      defaultValue={editingRepairOrder?.workshopMechanicName}
                      placeholder="External mechanic name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      defaultValue={editingRepairOrder?.phoneNumber}
                      placeholder="Workshop contact number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      defaultValue={editingRepairOrder?.address}
                      placeholder="Workshop address"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingRepairOrder ? 'Update Repair Order' : 'Add Repair Order'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRepairOrderDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}