const mongoose = require('mongoose');
const BackendStatus = require('../models/BackendStatus');

async function getServiceStatus() {
  try {
    
    // Find the latest status (assuming you have timestamps in your schema)
    const status = await BackendStatus.findOne().sort({ createdAt: -1 });

    if (status) {
      return { status: status.status, message: status.message };
    } else {
      // Default status if no document found
      return { status: true, message: "we are currently experiencing heavy load, try again later. we are working on it." };
    }
  } catch (error) {
    // console.error("Error fetching service status:", error);
    return { status: true, message: "" }; // Default status on error
  }
}

module.exports = { getServiceStatus };