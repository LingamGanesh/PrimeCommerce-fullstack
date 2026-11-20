import React from 'react'
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa'

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Brand */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            PrimeCommerce
          </h3>
          <p className="text-sm text-gray-600">
            Everyday essentials, simple shopping and reliable delivery.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-gray-900 font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/" className="hover:text-gray-900">Home</a></li>
            <li><a href="/search" className="hover:text-gray-900">Shop all</a></li>
            <li><a href="/dashboard/support" className="hover:text-gray-900">Customer support</a></li>
          </ul>
        </div>

      </div>

      <div className="border-t border-gray-200 mt-8 pt-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} PrimeCommerce. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer
