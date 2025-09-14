import React, { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";

function Payment() {
  const [hardcodedAmount, setHardcodedAmount] = useState(100);
  const [currency, setCurrency] = useState('USD');
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayment = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Note: This will fail in the artifact environment since we can't access localhost
        // In a real app, this would work with your backend
        const response = await fetch(
          `http://localhost:8000/lms/create/payment-intent/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Note: localStorage is not available in artifacts
              // In a real app: 'Authorization': `Bearer ${localStorage.getItem('token')}`
              'Authorization': 'Bearer your-token-here'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setResponseData(data);
      } catch (error) {
        console.error('Fetch error:', error);
        setError('Failed to fetch payment data');
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [hardcodedAmount, currency]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {loading && <p>Loading payment data...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
        <div>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={24} />
            Payment Details
          </h3>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Cards Accepted:
          </label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#003087', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>VISA</div>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#EB001B', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px' }}>MC</div>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#0070BA', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px' }}>PP</div>
          </div>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Name on Card:
          </label>
          <input 
            type="text" 
            placeholder="Mr. John Mark" 
            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Credit Card Number:
          </label>
          <input 
            type="text" 
            placeholder="1111-2222-3333-4444" 
            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px' }}
            required
          />

          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Exp Date:
              </label>
              <input 
                type="text" 
                placeholder="12/29" 
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                CVV:
              </label>
              <input 
                type="text" 
                placeholder="123" 
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
            </div>
          </div>
        </div>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={handleSubmit} 
          style={{ 
            width: '100%', 
            padding: '15px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            fontSize: '16px', 
            cursor: 'pointer' 
          }}
        >
          Proceed to Checkout
        </button>
      </div>
        </div>
      
      {responseData && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h4>Payment Response:</h4>
          <pre>{JSON.stringify(responseData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

const ProductDisplay = () => {
  const handleCheckout = (e) => {
    e.preventDefault();
    // Handle checkout logic here
    console.log('Checkout initiated');
  };

  return (
    <section style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
        <img
          src="https://i.imgur.com/EHyR2nP.png"
          alt="The cover of Stubborn Attachments"
          style={{ width: '200px', height: 'auto', marginBottom: '15px' }}
        />
        <div>
          <h3 style={{ margin: '10px 0' }}>Stubborn Attachments</h3>
          <h5 style={{ color: '#28a745', fontSize: '24px', margin: '10px 0' }}>$20.00</h5>
        </div>
      </div>
      
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={handleCheckout}
          style={{ 
            width: '100%', 
            padding: '15px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            fontSize: '18px', 
            cursor: 'pointer' 
          }}
        >
          Checkout
        </button>
      </div>
    </section>
  );
};

const Message = ({ message }) => (
  <section style={{ maxWidth: '600px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
    <div style={{ 
      padding: '20px', 
      backgroundColor: message.includes('placed') ? '#d4edda' : '#f8d7da',
      border: `1px solid ${message.includes('placed') ? '#c3e6cb' : '#f5c6cb'}`,
      borderRadius: '8px',
      color: message.includes('placed') ? '#155724' : '#721c24'
    }}>
      <p style={{ margin: 0, fontSize: '18px' }}>{message}</p>
    </div>
  </section>
);

export default function App() {
  const [message, setMessage] = useState("");
  const [currentView, setCurrentView] = useState("product"); // "product" or "payment"

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);

    if (query.get("success")) {
      setMessage("Order placed! You will receive an email confirmation.");
    }

    if (query.get("canceled")) {
      setMessage(
        "Order canceled -- continue to shop around and checkout when you're ready."
      );
    }
  }, []);

  if (message) {
    return <Message message={message} />;
  }

  return (
    <div>
      <nav style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
        <button 
          onClick={() => setCurrentView("product")}
          style={{ 
            margin: '0 10px', 
            padding: '10px 20px', 
            backgroundColor: currentView === "product" ? '#007bff' : '#f8f9fa',
            color: currentView === "product" ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Product
        </button>
        <button 
          onClick={() => setCurrentView("payment")}
          style={{ 
            margin: '0 10px', 
            padding: '10px 20px', 
            backgroundColor: currentView === "payment" ? '#007bff' : '#f8f9fa',
            color: currentView === "payment" ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Payment
        </button>
      </nav>
      
      {currentView === "product" ? <ProductDisplay /> : <Payment />}
    </div>
  );
}