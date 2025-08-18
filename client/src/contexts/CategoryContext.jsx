import React, { createContext, useContext, useState, useEffect } from 'react';
import categoryService from '../services/categoryService';

const CategoryContext = createContext();

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all categories
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific category by slug
  const fetchCategoryBySlug = async (slug) => {
    try {
      const data = await categoryService.getCategory(slug);
      setSelectedCategory(data);
      return data;
    } catch (err) {
      console.error(`Error fetching category ${slug}:`, err);
      setSelectedCategory(null);
    }
  };

  // Create category (Admin)
  const createCategory = async (formData) => {
    const newCategory = await categoryService.createCategory(formData);
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  // Update category (Admin)
  const updateCategory = async (id, formData) => {
    const updated = await categoryService.updateCategory(id, formData);
    setCategories((prev) =>
      prev.map((cat) => (cat._id === id ? updated : cat))
    );
    return updated;
  };

  // Delete category (Admin)
  const deleteCategory = async (id) => {
    await categoryService.deleteCategory(id);
    setCategories((prev) => prev.filter((cat) => cat._id !== id));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

 // Add this method to your CategoryProvider component, before the value object

  // Fetch products by subcategory
  const fetchSubcategoryProducts = async (categorySlug, itemSlug, options = {}) => {
    try {
      const data = await categoryService.getSubcategoryProducts(categorySlug, itemSlug, options);
      return data;
    } catch (err) {
      console.error(`Error fetching products for ${categorySlug}/${itemSlug}:`, err);
      throw err;
    }
  };

  // Then add it to your value object:
  const value = {
    categories,
    selectedCategory,
    loading,
    fetchCategories,
    fetchCategoryBySlug,
    fetchSubcategoryProducts, // Add this line
    createCategory,
    updateCategory,
    deleteCategory,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};
