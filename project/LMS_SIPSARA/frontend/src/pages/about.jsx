import React from 'react';
import { Mail, UserPlus, Flag } from 'lucide-react';

const AboutPage = () => {
  const SITE_NAME = "Our Organization"; // Replace with your actual site name

  const handleJoinClick = () => {
    // Replace with your actual join URL or routing logic
    window.location.href = '/join';
  };

  const handleContactClick = () => {
    // Replace with your actual contact URL or routing logic
    window.location.href = '/contact';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-2/3 mb-8 lg:mb-0">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                About {SITE_NAME}
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100">
                Defending liberty, protecting rights, and standing for freedom since our founding.
              </p>
            </div>
            <div className="lg:w-1/3 text-center">
              <img
                src="public/logos/master_logo.png"
                alt="Edulearn Logo"
                className="h-60 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />

            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Our Story Section */}
        <section className="mb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              Our Mission and History
            </h2>
            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              Our mission is to protect and defend the constitutional rights of all Americans 
              through advocacy, education, and an unwavering commitment to freedom. We are 
              founded on the core values of constitutional protection, community unity, and 
              civic awareness.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Established in 1971 by a group of concerned citizens, our organization has grown 
              from a passionate grassroots movement into America's leading voice for constitutional 
              rights. Over the decades, we have established a robust legal defense fund to support 
              landmark cases and adapted to the digital age to provide educational resources to 
              millions. Today, with over 5 million members nationwide, we continue to fight for 
              the principles of liberty and justice for all.
            </p>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gray-50 py-12 rounded-lg">
          <div className="text-center max-w-4xl mx-auto px-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              Join Our Mission
            </h3>
            <p className="text-xl text-gray-700 mb-8">
              Become part of America's largest constitutional rights organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleJoinClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <UserPlus size={20} />
                Join Now
              </button>
              <button
                onClick={handleContactClick}
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Mail size={20} />
                Contact Us
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;