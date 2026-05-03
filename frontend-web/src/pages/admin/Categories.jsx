import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { PageHeader, Button, Toast, ConfirmDialog, LoadingSpinner } from '../../components/common';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../../services/productService';
import { useAdmin } from '../../context/AdminContext';

export default function Categories() {
  const { setCurrentPage } = useAdmin();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ category_name: '', description: '' });
  const [saving, setSaving] = useState(false);
  
  // Delete states
  const [deleteId, setDeleteId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      showToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (cat = null) => {
    if (cat) {
      setEditCat(cat);
      setForm({ category_name: cat.category_name, description: cat.description || '' });
    } else {
      setEditCat(null);
      setForm({ category_name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditCat(null);
    setForm({ category_name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editCat) {
        await updateCategory(editCat.category_id, {
          category_name: form.category_name.trim(),
          description: form.description.trim() || null,
        });
        showToast('Category updated successfully');
      } else {
        await addCategory({
          category_name: form.category_name.trim(),
          description: form.description.trim() || null,
        });
        showToast('Category added successfully');
      }
      closeModal();
      fetchCategories();
    } catch (err) {
      showToast(err?.message || 'Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory(deleteId);
      showToast('Category deleted successfully');
      setDeleteId(null);
      fetchCategories();
    } catch (err) {
      showToast(err?.message || 'Failed to delete category', 'error');
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
      
      <PageHeader
        breadcrumb={<span className="cursor-pointer hover:text-[#1e3a5f] transition-colors" onClick={() => setCurrentPage('products')}>← Products</span>}
        title="Manage Categories"
        actions={
          <Button variant="primary" onClick={() => openModal()}>+ Add Category</Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0' }}>
          <table className="data-table w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Category Name</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length > 0 ? categories.map((cat) => (
                <tr key={cat.category_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">#{cat.category_id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.category_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{cat.description || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(cat)} className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                        Edit
                      </button>
                      <button onClick={() => setDeleteId(cat.category_id)} className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    No categories found. Click "+ Add Category" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">{editCat ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Beverages"
                    value={form.category_name}
                    onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Brief description of the category..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="secondary" onClick={closeModal} type="button">Cancel</Button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editCat ? 'Update Category' : 'Save Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Category"
        message="Are you sure you want to delete this category? This may affect products associated with it."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AdminLayout>
  );
}
