import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiScissors, FiImage } = FiIcons;

const Header = () => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white shadow-lg border-b border-secondary-200"
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <SafeIcon 
                icon={FiImage} 
                className="text-3xl text-primary-600" 
              />
              <SafeIcon 
                icon={FiScissors} 
                className="text-lg text-secondary-600 absolute -top-1 -right-1" 
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">
                Image Slicer Pro
              </h1>
              <p className="text-secondary-600 text-sm">
                Professional image slicing tool with intelligent cropping
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;