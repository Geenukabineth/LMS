import React, { useState, useEffect } from 'react';

function WelcomeCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [username, setuserName] = useState("Guest User");

  // Fetch user data


useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        
        // Check if token exists
        if (!token) {
          console.warn('No authentication token found');
          setuserName("Guest User");
          setIsLoading(false);
          return;
        }

        const response = await fetch("http://localhost:8000/lms/user/", {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.warn('Authentication failed - token may be expired');
            // Clear invalid token
            localStorage.removeItem('authToken');
            setuserName("Guest User");
            // Optionally redirect to login
            // navigate("/login");
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setuserName(data.username || data.name || "User");
      } catch (error) {
        console.error('Error fetching user data:', error);
        setuserName("Guest User");
        
        if (error.message.includes('Failed to fetch')) {
          console.error('Network error - server may be down');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, );

return (    
              <h2 className="welcome-title">Welcome back,{username} </h2>  
                          
            

)

}

export default WelcomeCard;
