// FILE: models/reminderModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { isValid, parse } = require('date-fns');

// Helper function to validate time format (HH:mm)
const isValidTimeString = (timeString) => {
   if (!timeString) return false;
   const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
   return regex.test(timeString);
};

// Helper function to safely parse dates
const safeParseDate = (dateString, defaultValue = new Date()) => {
   if (!dateString) {
     return defaultValue;
   }
   try {
     const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
     return isValid(parsedDate) ? parsedDate : defaultValue;
   } catch (error) {
     console.error(`Invalid date format: ${dateString}, using default date`, error);
     return defaultValue;
   }
};
const reminderSchema = new Schema({
   userId: {
     type: String,
     required: true,
   },
   reminderId: {
     type: String,
     required: true,
     unique: true,
   },
   jobKey: {  // ADD THIS LINE
      type: String,
      required: false, // Set to false because it is not required for one-time jobs.
   },
   taskDescription: {
     type: String,
     required: true,
   },
  time: {
     type: String,
     required: true,
     validate: {
       validator: isValidTimeString,
       message: 'Invalid time format. Use HH:mm.',
     },
  },
  recurrence: {
    type: Object,
    nullable: true,
    validate: {
      validator: function(recurrence) {
       if (!recurrence) return true; // Allow null or undefined recurrence
       if (!recurrence.type) return false; // Type is required if recurrence is present
       
       const validRecurrenceTypes = ['once', 'daily', 'weekly', 'limited'];
       if (!validRecurrenceTypes.includes(recurrence.type)) {
          return false;
       }
 
       const validDaysOfWeek = [
         'monday',
         'tuesday',
         'wednesday',
         'thursday',
         'friday',
         'saturday',
         'sunday',
       ];
 
       if (recurrence.type === 'weekly') {
         if (
           !recurrence.days ||
           !Array.isArray(recurrence.days) ||
           recurrence.days.length === 0
         ) {
           return false;
         }
 
         if (
           !recurrence.days.every((day) => validDaysOfWeek.includes(day))
         ) {
          return false;
         }
       }
 
       if (recurrence.type === 'once') {
         if (!recurrence.one_time_date) {
           return false;
         }
         const parsedDate = safeParseDate(recurrence.one_time_date);
         if (isNaN(parsedDate.getTime())) {
          return false;
         }
       }
 
       if (recurrence.type === 'limited') {
         if (!recurrence.start_date) {
           return false;
         }
 
         const startDate = safeParseDate(recurrence.start_date);
         if (isNaN(startDate.getTime())) {
           return false;
         }
 
         if (recurrence.ends) {
           if (!recurrence.ends.type) {
            return false;
           }
 
           const validEndTypes = ['after_repetitions', 'on_date'];
           if (!validEndTypes.includes(recurrence.ends.type)) {
            return false;
           }
 
           if (recurrence.ends.type === 'on_date') {
             if (!recurrence.ends.value) {
              return false;
             }
 
             const endDate = safeParseDate(recurrence.ends.value);
             if (isNaN(endDate.getTime())) {
               return false;
             }
 
             if (endDate <= startDate) {
              return false;
             }
           }
         }
       }
       return true;
     },
     message: 'Invalid recurrence data.',
   }
  },
   status: {
     type: String,
     enum: ['scheduled', 'completed', 'failed', 'cancelled'],
     default: 'scheduled',
   },
   createdAt: {
     type: Date,
     default: Date.now,
   },
   updatedAt: {
     type: Date,
     default: Date.now,
   },
});
const Reminder = mongoose.model('Reminder', reminderSchema);
module.exports = Reminder;