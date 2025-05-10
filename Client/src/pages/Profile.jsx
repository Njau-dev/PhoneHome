import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Star, Edit, Camera, Save, X, CheckCircle, Heart, Package, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandedSpinner from '../components/BrandedSpinner';
import Breadcrumbs from '../components/BreadCrumbs';
import Title from '../components/Title';
import { ShopContext } from '../context/ShopContext';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // User profile data
  const [user, setUser] = useState({
    username: '',
    email: '',
    phone_number: '',
    address: '',
    created_at: ''
  });

  // Stats data
  const [stats, setStats] = useState({
    wishlist_count: 0,
    order_count: 0,
    total_payment: 0,
    review_count: 0
  });

  // Orders and wishlist data
  const [recentOrders, setRecentOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  // Form state for editing
  const [editForm, setEditForm] = useState({ ...user });

  const { backendUrl, token, currency } = useContext(ShopContext);

  // Function to fetch all necessary data
  const fetchData = async () => {
    setIsLoading(true);
    setIsError(false);

    try {
      // Fetch user profile data
      const profileResponse = await axios.get(`${backendUrl}/api/profile`,
        {
          headers: { Authorization: `Bearer ${token}` }
        });
      setUser(profileResponse.data);
      setEditForm(profileResponse.data);

      // Fetch user stats
      const statsResponse = await axios.get(`${backendUrl}/api/profile/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        });
      setStats(statsResponse.data);

      // Fetch recent orders
      const ordersResponse = await axios.get(`${backendUrl}/api/profile/orders`,
        {
          headers: { Authorization: `Bearer ${token}` }
        });
      setRecentOrders(ordersResponse.data);

      // Fetch wishlist items
      const wishlistResponse = await axios.get(`${backendUrl}/api/profile/wishlist`,
        {
          headers: { Authorization: `Bearer ${token}` }
        });
      setWishlistItems(wishlistResponse.data.wishlist);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load profile data');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData().catch(error => {
      console.error('Failed to fetch profile data:', error);
      setIsError(true);
      setIsLoading(false);
    });
  }, [backendUrl]);

  // Handle input change for profile editing
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value
    });
  };

  // Handle profile update
  const handleSave = async () => {
    try {
      await axios.put(`${backendUrl}/api/profile`, {
        username: editForm.username,
        email: editForm.email,
        phone_number: editForm.phone_number,
        address: editForm.address
      },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUser(editForm);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditForm({ ...user });
    setIsEditing(false);
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // utility function for formatting price
  const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ", ");
  };

  // Transform orders data to have one item per row
  const transformOrdersForDisplay = () => {
    if (!recentOrders || !Array.isArray(recentOrders)) {
      return [];
    }
    const transformedOrders = [];

    recentOrders.forEach(order => {
      if (order?.items && Array.isArray(order.items) && order.items.length > 0) {
        // Create a separate row entry for each item in the order
        order.items.forEach((item, index) => {
          transformedOrders.push({
            ...order,
            // Only include the current item in the items array
            items: [item],
            // If this is the first item, show full order details, otherwise just show item
            showOrderDetails: index === 0
          });
        });
      } else {
        // Handle empty orders if needed
        transformedOrders.push({ ...order, showOrderDetails: true });
      }
    });

    // Limit to 5 products for display
    return transformedOrders.slice(0, 5);
  };

  return (
    <>
      <Breadcrumbs />
      <div className="bg-bgdark text-primary pt-4 sm:pt-8">
        <div className="container mx-auto px-4 xl:px-0 max-w-screen-2xl">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-64 py-16">
              <BrandedSpinner message='Loading profile data...' />
            </div>
          ) : isError ? (
            <div className="flex flex-col justify-center items-center min-h-64 py-16 text-center">
              <h2 className="text-2xl mb-4">Something went wrong</h2>
              <p className="text-gray-400 mb-6">We couldn't load your profile information</p>
              <button
                onClick={fetchData}
                className="flex items-center bg-accent text-bgdark px-6 py-3 rounded-full hover:bg-bgdark hover:text-accent hover:border border-accent transition-all"
              >
                <RefreshCcw size={18} className="mr-2" />
                Try Again
              </button>
            </div>
          ) : (
            <div className="max-w-full mx-auto">
              {/* Profile Header */}
              <div className="mb-12 text-center text-[27px] sm:text-3xl">
                <Title text1={'MY'} text2={'PROFILE'} />
                <p className="text-secondary w-3/4 m-auto text-sm sm:text-base mx-auto">
                  Manage your personal information and track your orders
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                  <div className="bg-bgdark rounded-xl overflow-hidden border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                    <div className="bg-gradient-to-r from-accent/20 to-accent/10 py-6 px-6 relative">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="bg-bgdark p-2 rounded-full text-primary hover:bg-border transition"
                        >
                          {isEditing ? <X size={16} /> : <Edit size={16} />}
                        </button>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                          {user.username && (
                            <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center border-4 border-accent text-2xl">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {isEditing && (
                            <div className="absolute bottom-0 right-0">
                              <button className="bg-accent text-bgdark p-2 rounded-full hover:bg-bgdark hover:text-accent hover:border border-accent transition">
                                <Camera size={16} />
                              </button>
                            </div>
                          )}
                        </div>

                        {!isEditing ? (
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold mb-1">{user.username}</h2>
                          </div>
                        ) : (
                          <input
                            type="text"
                            name="username"
                            value={editForm.username}
                            onChange={handleInputChange}
                            className="bg-bgdark border border-border rounded-lg px-3 py-2 text-xl font-bold mb-1 text-center w-full"
                          />
                        )}

                        <p className="text-secondary text-sm">
                          Member since {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="p-6">
                      {!isEditing ? (
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <Mail className="w-5 h-5 text-accent mr-3 mt-1" />
                            <div>
                              <p className="text-secondary text-sm">Email</p>
                              <p>{user.email}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <Phone className="w-5 h-5 text-accent mr-3 mt-1" />
                            <div>
                              <p className="text-secondary text-sm">Phone</p>
                              <p>{user.phone_number || 'Not provided'}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <MapPin className="w-5 h-5 text-accent mr-3 mt-1" />
                            <div>
                              <p className="text-secondary text-sm">Address</p>
                              <p>{user.address || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-secondary text-sm mb-1">Email</label>
                            <div className="flex">
                              <span className="bg-bgdark px-3 py-2 rounded-l-lg flex items-center border border-r-0 border-border">
                                <Mail className="w-5 h-5 text-accent" />
                              </span>
                              <input
                                type="email"
                                name="email"
                                value={editForm.email}
                                onChange={handleInputChange}
                                className="bg-bgdark border border-border rounded-r-lg px-3 py-2 w-full"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-secondary text-sm mb-1">Phone</label>
                            <div className="flex">
                              <span className="bg-bgdark px-3 py-2 rounded-l-lg flex items-center border border-r-0 border-border">
                                <Phone className="w-5 h-5 text-accent" />
                              </span>
                              <input
                                type="tel"
                                name="phone_number"
                                value={editForm.phone_number}
                                onChange={handleInputChange}
                                className="bg-bgdark border border-border rounded-r-lg px-3 py-2 w-full"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-secondary text-sm mb-1">Address</label>
                            <div className="flex">
                              <span className="bg-bgdark px-3 py-2 rounded-l-lg flex items-center border border-r-0 border-border">
                                <MapPin className="w-5 h-5 text-accent" />
                              </span>
                              <textarea
                                name="address"
                                value={editForm.address || ''}
                                onChange={handleInputChange}
                                rows={3}
                                className="bg-bgdark border border-border rounded-r-lg px-3 py-2 w-full"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 pt-3">
                            <button
                              onClick={handleSave}
                              className="bg-accent text-bgdark text-sm flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium hover:bg-bgdark hover:text-accent hover:border border-accent transition w-full"
                            >
                              <Save size={16} />
                              Save Changes
                            </button>
                            <button
                              onClick={handleCancel}
                              className="bg-border flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium hover:bg-bgdark transition w-full"
                            >
                              <X size={16} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats, Recent Activity, and Wishlist - Now in 3 columns */}
                <div className="lg:col-span-3">
                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium">Orders</h3>
                        <div className="p-2 bg-accent/20 rounded-full">
                          <Package className="w-5 h-5 text-accent" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold">{stats.order_count}</p>
                      <p className="text-secondary text-sm mt-4">Total orders made</p>
                    </div>

                    <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium">Payments</h3>
                        <div className="p-2 bg-accent/20 rounded-full">
                          <CreditCard className="w-5 h-5 text-accent" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold">Kshs {formatPrice(stats.total_payment)}</p>
                      <p className="text-secondary text-sm mt-4">Total amount spent</p>
                    </div>

                    <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium">Wishlist</h3>
                        <div className="p-2 bg-accent/20 rounded-full">
                          <Heart className="w-5 h-5 text-accent" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold">{stats.wishlist_count}</p>
                      <p className="text-secondary text-sm mt-4">Saved items</p>
                    </div>

                    <div className="bg-bgdark rounded-xl p-6 border border-border hover:border-accent transition-all shadow-md hover:shadow-lg shadow-black/30">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium">Reviews</h3>
                        <div className="p-2 bg-accent/20 rounded-full">
                          <Star className="w-5 h-5 text-accent" />
                        </div>
                      </div>
                      <p className="text-3xl font-bold">{stats.review_count}</p>
                      <p className="text-secondary text-sm mt-4">Reviews submitted</p>
                    </div>
                  </div>

                  {/* Data Tables - 2 columns grid for Recent Orders and Wishlist */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {/* Recent Orders */}
                    <div className="md:col-span-3 bg-bgdark rounded-xl p-6 border border-border transition-all shadow-md hover:shadow-lg shadow-black/30">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Recent Orders</h3>
                        <Link to="/orders">
                          <button className="text-accent text-sm hover:underline">
                            View All
                          </button>
                        </Link>
                      </div>

                      <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                        {Array.isArray(recentOrders) && transformOrdersForDisplay()?.length > 0 ? (
                          <table className="w-[620px] table-auto overflow-auto">
                            <thead className="text-left">
                              <tr className="border-b border-border">
                                <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Product</th>
                                <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Total</th>
                                <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Date</th>
                                <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transformOrdersForDisplay().map((order, orderIndex) => (
                                <tr key={`${order.id}-${orderIndex}`} className="border-b border-border overflow-y-auto w-full">
                                  <td className="py-4">
                                    <div className="flex items-center">
                                      {order.items[0] && (
                                        <>
                                          <img
                                            src={order.items[0].image_url}
                                            alt={order.items[0].name}
                                            className="w-10 h-10 sm:w-12 sm:h-12  object-cover rounded-md mr-3"
                                          />
                                          <div>
                                            <p className="font-medium text-xs sm:text-base">{order.items[0].name}</p>
                                            <p className="text-secondary text-xs sm:text-sm">
                                              {order.items[0].brand} {order.items[0].variation_name && `- ${order.items[0].variation_name}`}
                                            </p>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-4 text-xs sm:text-base">
                                    {order.showOrderDetails ? (
                                      <>{currency} {formatPrice(order.total_amount)}</>
                                    ) : (
                                      <>-</>
                                    )}
                                  </td>
                                  <td className="py-4 text-xs sm:text-base">
                                    {order.showOrderDetails ? (
                                      <>{formatDate(order.date)}</>
                                    ) : (
                                      <>-</>
                                    )}
                                  </td>
                                  <td className="py-4">
                                    {order.showOrderDetails ? (
                                      <span className={`text-[10px] sm:text-xs py-1 px-2 rounded-full ${order.status === 'Delivered'
                                        ? 'bg-green-400/20 text-green-400'
                                        : order.status === 'Shipped'
                                          ? 'bg-blue-400/20 text-blue-400'
                                          : 'bg-yellow-400/20 text-yellow-400'
                                        }`}>
                                        {order.status}
                                      </span>
                                    ) : (
                                      <>-</>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-secondary mb-4">You haven't placed any orders yet</p>
                            <Link to="/collection">
                              <button className="bg-accent text-bgdark px-6 py-2 rounded-full hover:bg-bgdark hover:text-accent hover:border border-accent transition">
                                Shop Now
                              </button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Wishlist table */}
                    <div className="md:col-span-2 bg-bgdark rounded-xl p-6 border border-border transition-all shadow-md hover:shadow-lg shadow-black/30">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Wishlist</h3>
                        <Link to="/wishlist">
                          <button className="text-accent text-sm hover:underline">
                            View All
                          </button>
                        </Link>
                      </div>

                      <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                        {Array.isArray(wishlistItems) && wishlistItems?.length > 0 ? (
                          <table className="w-[400px] table-auto overflow-auto">
                            <thead className="text-left">
                              <tr className="border-b border-border">
                                <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Product</th>
                                <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Brand</th>
                                <th className="pb-3 text-secondary font-medium text-sm sm:text-base">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {wishlistItems.slice(0, 5).map((item) => (
                                <tr key={item.id} className="border-b border-border">
                                  <td className="py-4">
                                    <div className="flex items-center">
                                      <img
                                        src={item.image_url}
                                        alt={item.product_name}
                                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md mr-3"
                                      />
                                      <p className="font-medium text-xs sm:text-base">{item.product_name}</p>
                                    </div>
                                  </td>
                                  <td className="py-4 text-xs sm:text-base">{item.brand}</td>
                                  <td className="py-4 text-xs sm:text-base">{currency} {formatPrice(item.price)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-secondary mb-4">Your wishlist is empty</p>
                            <Link to="/collection">
                              <button className="bg-accent text-bgdark px-6 py-2 rounded-full hover:bg-bgdark hover:text-accent hover:border border-accent transition">
                                Discover Products
                              </button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;