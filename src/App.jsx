import React, { useState, useMemo, useCallback } from 'react';
import { productsData } from './data/products';
import './App.css';

// Modal Component
const Modal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm" }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">{title}</h3>
        <p className="modal-body">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

// Toast Component
const ToastNotification = ({ toasts }) => {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  );
};

function App() {
  const [products] = useState(productsData);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog state
  const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: null, payload: null });
  
  // Toast state
  const [toasts, setToasts] = useState([]);

  // Feature 2: Notifications when user adds item
  const addToast = useCallback((message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Feature 5: Fix quantity update by multiples
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    addToast(`Successfully added ${product.name} to cart!`);
  };

  const updateQuantity = (id, change) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + change;
          return { ...item, quantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      });
    });
  };

  // Feature 1: Dialog for remove item
  const confirmRemoveItem = (id) => {
    setDialogConfig({
      isOpen: true,
      type: 'REMOVE_ITEM',
      payload: id
    });
  };

  // Feature 1: Dialog for checkout
  const confirmCheckout = () => {
    if (cart.length === 0) return;
    setDialogConfig({
      isOpen: true,
      type: 'CHECKOUT',
      payload: null
    });
  };

  const handleDialogConfirm = () => {
    if (dialogConfig.type === 'REMOVE_ITEM') {
      setCart(prev => prev.filter(item => item.id !== dialogConfig.payload));
      addToast('Item removed from cart');
    } else if (dialogConfig.type === 'CHECKOUT') {
      setCart([]);
      addToast('Checkout successful! Thank you for your purchase.');
    }
    closeDialog();
  };

  const closeDialog = () => {
    setDialogConfig({ isOpen: false, type: null, payload: null });
  };

  // Feature 4: Search Box
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  // Feature 3: Count total quantity
  const totalQuantity = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  return (
    <div className="app-container">
      <main>
        <div className="header-section">
          <h1>Modern Tech Store</h1>
          {/* Feature 4: Search Box */}
          <input 
            type="text" 
            className="search-box"
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="product-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-title">{product.name}</div>
              <div className="product-price">NT$ {product.price.toLocaleString()}</div>
              <button className="btn btn-primary" onClick={() => addToCart(product)}>
                Add to Cart
              </button>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)'}}>
              No products found matching "{searchQuery}"
            </div>
          )}
        </div>
      </main>

      <aside className="cart-sidebar">
        <div className="cart-header">
          <h2 className="cart-title">Shopping Cart</h2>
          {/* Feature 3: Total Quantity Badge */}
          <span className="cart-badge">{totalQuantity} Items</span>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <div className="cart-item-price">NT$ {item.price.toLocaleString()}</div>
                  </div>
                  <div className="cart-item-controls">
                    <button className="quantity-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button className="quantity-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                    <button className="remove-btn" onClick={() => confirmRemoveItem(item.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>NT$ {totalPrice.toLocaleString()}</span>
              </div>
              <button className="btn btn-primary checkout-btn" onClick={confirmCheckout}>
                Checkout Now
              </button>
            </div>
          </>
        )}
      </aside>

      <Modal 
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.type === 'CHECKOUT' ? 'Confirm Checkout' : 'Remove Item'}
        message={dialogConfig.type === 'CHECKOUT' 
          ? `Are you sure you want to checkout ${totalQuantity} items for NT$ ${totalPrice.toLocaleString()}?` 
          : 'Are you sure you want to remove this item from your cart?'}
        confirmText={dialogConfig.type === 'CHECKOUT' ? 'Checkout' : 'Remove'}
        onConfirm={handleDialogConfirm}
        onCancel={closeDialog}
      />
      
      <ToastNotification toasts={toasts} />
    </div>
  );
}

export default App;
