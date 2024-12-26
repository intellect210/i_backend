const getCurrentDateTimeIST = () => {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Kolkata',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  };
  return now.toLocaleString('en-IN', options);
};

module.exports = {
  getCurrentDateTimeIST,
};