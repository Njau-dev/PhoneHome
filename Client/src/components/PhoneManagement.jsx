import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PhoneManagement = () => {
  const [phones, setPhones] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    brand_id: '',
    ram: '',
    storage: '',
    battery: '',
    main_camera: '',
    front_camera: '',
    display: '',
    processor: '',
    connectivity: '',
    colors: '',
    os: '',
    images: []
  });

  useEffect(() => {
    // Fetch all phones
    axios.get('/phones')
      .then(response => setPhones(response.data))
      .catch(error => console.error('Error fetching phones:', error));
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, images: e.target.files });
  };

  const handleCreatePhone = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'images') {
        for (let file of formData.images) {
          data.append('image_urls', file);
        }
      } else {
        data.append(key, formData[key]);
      }
    });

    axios.post('/phones', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(response => {
      setPhones([...phones, response.data]);
      alert('Phone added successfully!');
    })
    .catch(error => console.error('Error adding phone:', error));
  };

  return (
    <div>
      <h2>Manage Phones</h2>
      <form onSubmit={handleCreatePhone}>
        <input type="text" name="name" placeholder="Name" onChange={handleInputChange} />
        <input type="number" name="price" placeholder="Price" onChange={handleInputChange} />
        {/* Add input fields for other phone attributes */}
        <input type="file" name="images" multiple onChange={handleFileChange} />
        <button type="submit">Add Phone</button>
      </form>

      <ul>
        {phones.map(phone => (
          <li key={phone.id}>{phone.name} - {phone.price}</li>
        ))}
      </ul>
    </div>
  );
};

export default PhoneManagement;
