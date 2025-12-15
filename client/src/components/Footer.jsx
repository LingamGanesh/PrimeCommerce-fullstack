import React from 'react'
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa'

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Brand */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            YourCompany
          </h3>
          <p className="text-sm text-gray-600">
            Building modern web solutions with clean design and performance.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-gray-900 font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="#" className="hover:text-gray-900">Home</a></li>
            <li><a href="#" className="hover:text-gray-900">About</a></li>
            <li><a href="#" className="hover:text-gray-900">Contact</a></li>
          </ul>
        </div>

        {/* Contact + Social Icons */}
        <div>
          <h4 className="text-gray-900 font-semibold mb-3">Contact</h4>
          <p className="text-sm text-gray-600">support@yourcompany.com</p>
          <p className="text-sm text-gray-600 mb-4">+91 98765 43210</p>

          <div className="flex space-x-4">
            <a
              href="#"
              className="p-2 rounded-full border text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              <FaFacebookF />
            </a>

            <a
              href="#"
              className="p-2 rounded-full border text-gray-500 hover:bg-pink-50 hover:text-pink-500 transition"
            >
              <FaInstagram />
            </a>

            <a
              href="#"
              className="p-2 rounded-full border text-gray-500 hover:bg-sky-50 hover:text-sky-500 transition"
            >
              <FaTwitter />
            </a>
          </div>
        </div>

      </div>

      <div className="border-t border-gray-200 mt-8 pt-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} YourCompany. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer
