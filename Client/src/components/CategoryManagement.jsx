import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  // Fetch categories
  useEffect(() => {
    axios.get('/categories')
      .then(response => setCategories(response.data))
      .catch(error => console.error('Error fetching categories:', error));
  }, []);

  // Create category
  const handleCreateCategory = () => {
    axios.post('/categories', { name: newCategory })
      .then(response => {
        setCategories([...categories, response.data]);
        setNewCategory('');
      })
      .catch(error => console.error('Error creating category:', error));
  };

  // Delete category
  const handleDeleteCategory = (id) => {
    axios.delete(`/categories/${id}`)
      .then(() => setCategories(categories.filter(category => category.id !== id)))
      .catch(error => console.error('Error deleting category:', error));
  };

  return (
      <div>
          <h1>All categories</h1>
      <h2>Manage Categories</h2>
      <input
        type="text"
        placeholder="New Category"
        value={newCategory}
        onChange={(e) => setNewCategory(e.target.value)}
      />
      <button onClick={handleCreateCategory}>Add Category</button>

      <ul>
        {categories.map(category => (
          <li key={category.id}>
            {category.name} 
            <button onClick={() => handleDeleteCategory(category.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryManagement;
