import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { 
  UserGroupIcon, 
  ShieldCheckIcon, 
  CurrencyDollarIcon, 
  LightningBoltIcon 
} from '@heroicons/react/outline';
import { Button } from '../components/common';

const Home = () => {
  return (
    <>
      <Helmet>
        <title>MentorConnect | Anonymous Professional Networking</title>
        <meta
          name="description"
          content="Connect with industry professionals anonymously for career guidance, networking, and mentorship. Gain insights and build relationships without revealing your identity."
        />
      </Helmet>
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-background.jpg"
            alt="Background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <div className="md:w-3/4 lg:w-1/2">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Anonymous Professional Networking
            </h1>
            <p className="mt-6 text-xl">
              Connect with industry professionals anonymously for career guidance, networking, 
              and mentorship. Gain insights and build relationships without revealing your identity.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                to="/register"
                variant="secondary"
                size="xl"
                className="font-bold"
              >
                Get Started
              </Button>
              <Button
                to="/how-it-works"
                variant="outline"
                size="xl"
                className="font-bold text-white border-white hover:bg-white hover:text-primary-700"
              >
                How It Works
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Why Choose MentorConnect
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-gray-500 mx-auto">
              Our platform offers a unique approach to professional networking, providing value to 
              both mentees seeking guidance and professionals sharing their expertise.
            </p>
          </div>
          
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-600 rounded-md shadow-lg">
                        <UserGroupIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Anonymous Connections
                    </h3>
                    <p className="mt-5 text-base text-gray-500">
                      Connect without revealing your identity. Get honest feedback and guidance without 
                      workplace politics or bias.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-600 rounded-md shadow-lg">
                        <ShieldCheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Verified Professionals
                    </h3>
                    <p className="mt-5 text-base text-gray-500">
                      All professionals on our platform are verified for their expertise and experience, 
                      ensuring quality guidance.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-600 rounded-md shadow-lg">
                        <CurrencyDollarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Fair Compensation
                    </h3>
                    <p className="mt-5 text-base text-gray-500">
                      Professionals receive fair compensation for their time and expertise while mentees 
                      get valuable insights worth the investment.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary-600 rounded-md shadow-lg">
                        <LightningBoltIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Seamless Experience
                    </h3>
                    <p className="mt-5 text-base text-gray-500">
                      Integrated video conferencing, scheduling, and payment systems for a hassle-free 
                      networking experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              How It Works
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-gray-500 mx-auto">
              Our platform is designed to be simple and effective, connecting you with the right professionals 
              while maintaining your privacy.
            </p>
          </div>
          
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary-500 text-white font-bold text-xl">
                  1
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Create Your Profile</h3>
                <p className="mt-2 text-base text-gray-500">
                  Sign up and create your profile. Choose to remain anonymous or share your identity.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary-500 text-white font-bold text-xl">
                  2
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Find the Right Match</h3>
                <p className="mt-2 text-base text-gray-500">
                  Browse professionals by industry, expertise, and hourly rate. Find someone who matches your needs.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary-500 text-white font-bold text-xl">
                  3
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Connect and Grow</h3>
                <p className="mt-2 text-base text-gray-500">
                  Book sessions, connect via video, and get the guidance you need to advance your career.
                </p>
              </div>
            </div>
            
            <div className="mt-10 text-center">
              <Button to="/how-it-works" variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonial Section */}
      <div className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              What Our Users Say
            </h2>
          </div>
          
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <img
                      className="h-12 w-12 rounded-full"
                      src="/images/testimonials/user1.jpg"
                      alt="User"
                    />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-bold text-gray-900">Anonymous Seeker</h4>
                    <p className="text-sm text-gray-500">Software Engineer</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-600">
                  "Being able to ask questions anonymously removed my fear of looking inexperienced. 
                  I received honest feedback that helped me negotiate a 20% higher salary."
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <img
                      className="h-12 w-12 rounded-full"
                      src="/images/testimonials/user2.jpg"
                      alt="User"
                    />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-bold text-gray-900">Jane D.</h4>
                    <p className="text-sm text-gray-500">Marketing Director</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-600">
                  "As a professional, I enjoy giving back while maintaining privacy. The platform handles 
                  all the logistics so I can focus on providing value to mentees."
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <img
                      className="h-12 w-12 rounded-full"
                      src="/images/testimonials/user3.jpg"
                      alt="User"
                    />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-bold text-gray-900">John S.</h4>
                    <p className="text-sm text-gray-500">Career Changer</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-600">
                  "I was nervous about transitioning industries. The professionals on MentorConnect gave me 
                  practical advice that made my transition smoother than I expected."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Ready to advance your career?
            <br />
            <span className="text-primary-200">Join MentorConnect today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Button to="/register" variant="white" size="lg" className="font-bold text-primary-600">
                Get Started
              </Button>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Button
                to="/professionals"
                variant="outline"
                size="lg"
                className="font-bold text-white border-white hover:bg-white hover:text-primary-700"
              >
                Browse Professionals
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
