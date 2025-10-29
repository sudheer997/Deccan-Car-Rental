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
import { Car, Users, Calendar, DollarSign, LogOut, Plus, Edit, Trash2, Check, X } from 'lucide-react';
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

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [statsRes, reservationsRes, rentalsRes, paymentsRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers }),
        fetch('/api/reservations', { headers }),
        fetch('/api/rentals', { headers }),
        fetch('/api/payments', { headers })
      ]);

      const statsData = await statsRes.json();
      const reservationsData = await reservationsRes.json();
      const rentalsData = await rentalsRes.json();
      const paymentsData = await paymentsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (reservationsData.success) setReservations(reservationsData.data);
      if (rentalsData.success) setRentals(rentalsData.data);
      if (paymentsData.success) setPayments(paymentsData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (data.success) {
        setToken(data.data.token);
        setIsAdmin(true);
        localStorage.setItem('adminToken', data.data.token);
        toast({ title: 'Success', description: 'Logged in successfully' });
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Login failed', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem('adminToken');
    toast({ title: 'Success', description: 'Logged out successfully' });
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
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit reservation', variant: 'destructive' });
    }
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
              <h1 className="text-4xl font-bold">RentalFleet</h1>
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

        {/* Cars Grid */}
        <div className="container mx-auto px-4 py-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-8">Available Cars</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.filter(car => car.status === 'available').map((car) => (
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
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Login</Button>
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
          <h1 className="text-2xl font-bold text-gray-800">RentalFleet Admin</h1>
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
        <Tabs defaultValue="cars" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cars">Cars</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="rentals">Rentals</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Cars Tab */}
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
            <h2 className="text-2xl font-bold">Reservation Requests</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation._id}>
                    <TableCell>{reservation.customerName}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{reservation.email}</div>
                        <div>{reservation.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {reservation.carDetails ? reservation.carDetails.name : 'N/A'}
                    </TableCell>
                    <TableCell>{reservation.message || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={reservation.status === 'pending' ? 'default' : 
                                reservation.status === 'approved' ? 'default' : 'destructive'}
                      >
                        {reservation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {reservation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateReservation(reservation._id, 'approved')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleUpdateReservation(reservation._id, 'rejected')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
        </Tabs>
      </div>

      {/* Add/Edit Car Dialog */}
      <Dialog open={showCarDialog} onOpenChange={setShowCarDialog}>
        <DialogContent className="max-w-2xl">
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
              imageUrl: formData.get('imageUrl'),
              features: formData.get('features').split(',').map(f => f.trim()).filter(f => f)
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
              <div>
                <Label htmlFor="price">Monthly Price (₹)</Label>
                <Input id="price" name="price" type="number" defaultValue={editingCar?.price} required />
              </div>
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" name="imageUrl" defaultValue={editingCar?.imageUrl} />
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
    </div>
  );
}