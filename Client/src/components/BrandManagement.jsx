import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [newBrand, setNewBrand] = useState('');

  useEffect(() => {
    axios.get('/brands')
      .then(response => setBrands(response.data))
      .catch(error => console.error('Error fetching brands:', error));
  }, []);

  const handleCreateBrand = () => {
    axios.post('/brands', { name: newBrand })
      .then(response => {
        setBrands([...brands, response.data]);
        setNewBrand('');
      })
      .catch(error => console.error('Error creating brand:', error));
  };

  const handleDeleteBrand = (id) => {
    axios.delete(`/brands/${id}`)
      .then(() => setBrands(brands.filter(brand => brand.id !== id)))
      .catch(error => console.error('Error deleting brand:', error));
  };

  return (
    <div>
      <h2>Manage Brands</h2>
      <input
        type="text"
        placeholder="New Brand"
        value={newBrand}
        onChange={(e) => setNewBrand(e.target.value)}
      />
      <button onClick={handleCreateBrand}>Add Brand</button>

      <ul>
        {brands.map(brand => (
          <li key={brand.id}>
            {brand.name} 
            <button onClick={() => handleDeleteBrand(brand.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BrandManagement;
