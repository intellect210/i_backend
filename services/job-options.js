const { isValid, parse } = require('date-fns');
const { fromZonedTime } = require('date-fns-tz');

/**
 * Converts a job input object into Bull queue options, handling time zone conversions from IST to UTC.
 *
 * @param {object} jobInput - The job input object containing task details.
 * @returns {object} - The Bull queue options object.
 */
function convertToBullOptions(jobInput) {
  console.log("[DEBUG: jobInput]", jobInput);

  if (!jobInput || !jobInput.task) {
    console.error("Invalid input: jobInput or task is missing.");
    return {};
  }

  const task = jobInput.task;
  const bullOptions = {};
  const istTimeZone = 'Asia/Kolkata'; // IST time zone

  // Handle one-time jobs
  if (isOneTimeJob(task)) {
    return handleOneTimeJob(task, istTimeZone);
  }

  // Handle repeatable jobs
  if (isRepeatableJob(task)) {
    return handleRepeatableJob(task, istTimeZone);
  }

  console.error("Invalid input: task should be either one-time or repeatable.");
  return {};
}

/**
 * Checks if a task is a one-time job.
 *
 * @param {object} task - The task object.
 * @returns {boolean} - True if the task is a one-time job, false otherwise.
 */
function isOneTimeJob(task) {
  return !task.recurrence || Object.keys(task.recurrence).length === 0;
}

/**
 * Checks if a task is a repeatable job.
 *
 * @param {object} task - The task object.
 * @returns {boolean} - True if the task is a repeatable job, false otherwise.
 */
function isRepeatableJob(task) {
  return task.recurrence && Object.keys(task.recurrence).length > 0;
}

/**
 * Handles one-time job scheduling.
 *
 * @param {object} task - The task object.
 * @param {string} timeZone - The IANA time zone identifier (e.g., 'Asia/Kolkata').
 * @returns {object} - The Bull queue options for the one-time job.
 */
function handleOneTimeJob(task, timeZone) {
  const { one_time_date } = task;
  if (!one_time_date) {
    console.error("Invalid input: one_time_date is missing for one-time job.");
    return {};
  }

  if (!isValidOneTimeDateFormat(one_time_date)) {
    console.error("Invalid one_time_date string format, valid format: yyyy-MM-dd'T'HH:mm:ss'Z'");
    return {};
  }

  // Convert IST to UTC
  const oneTimeDateUTC = fromZonedTime(new Date(one_time_date), timeZone);

  const now = new Date();
  const delay = oneTimeDateUTC.getTime() - now.getTime();
  if (delay < 0) {
    console.error('Invalid input: one_time_date is in the past.');
    return {};
  }

  return { delay };
}

/**
 * Validates the format of the one_time_date string.
 *
 * @param {string} dateString - The date string to validate.
 * @returns {boolean} - True if the date string is valid, false otherwise.
 */
function isValidOneTimeDateFormat(dateString) {
  if (!dateString) return false;
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
  return regex.test(dateString);
}

/**
 * Handles repeatable job scheduling.
 *
 * @param {object} task - The task object.
 * @param {string} timeZone - The IANA time zone identifier (e.g., 'Asia/Kolkata').
 * @returns {object} - The Bull queue options for the repeatable job.
 */
function handleRepeatableJob(task, timeZone) {
  const { recurrence, time } = task;

  if (!time || !isValidTimeString(time)) {
    console.error("Invalid input: time is missing or invalid for repeatable job.");
    return {};
  }
  
  const { type, days, ends, start_date, one_time_date } = recurrence;
  const taskDateUTC = getTaskDateUTC(recurrence, time, timeZone);

  switch (type) {
    case 'once':
      return handleOnceRepeatableJob(taskDateUTC);
    case 'daily':
      return handleDailyRepeatableJob(taskDateUTC);
    case 'weekly':
      return handleWeeklyRepeatableJob(taskDateUTC, days);
    case 'limited':
      return handleLimitedRepeatableJob(taskDateUTC, start_date, ends);
    default:
      console.error('Invalid recurrence type.');
      return {};
  }
}

/**
 * Validates the format of the time string.
 *
 * @param {string} timeString - The time string to validate.
 * @returns {boolean} - True if the time string is valid, false otherwise.
 */
function isValidTimeString(timeString) {
  if (!timeString) return false;
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(timeString);
}

/**
 * Calculates the UTC date and time for a task based on its recurrence type and time.
 *
 * @param {object} recurrence - The recurrence object.
 * @param {string} time - The time string in HH:mm format.
 * @param {string} timeZone - The IANA time zone identifier.
 * @returns {Date} - The UTC date object representing the task's scheduled time.
 */
function getTaskDateUTC(recurrence, time, timeZone) {
    const { type, one_time_date, start_date } = recurrence;
    const getUTCDateForTime = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const nowIST = new Date();
        const dateIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate(), hours, minutes);
        const dateUTC = fromZonedTime(dateIST, timeZone);
        return dateUTC;
    };
    if (type === 'once') {
        return fromZonedTime(new Date(one_time_date), timeZone);
    } else if (type === 'limited') {
        // Parse start_date assuming it's in 'yyyy-MM-dd' format
        const startDate = safeParseDate(start_date);
        if (!isValid(startDate)) {
            console.error('Invalid start_date format for limited recurrence.');
            return new Date(); // Default to current date-time
        }
        // Set the time part using getUTCDateForTime
        const utcTime = getUTCDateForTime(time);
        startDate.setHours(utcTime.getUTCHours(), utcTime.getUTCMinutes(), 0, 0);
        return startDate;
    } else {
        return getUTCDateForTime(time);
    }
}

/**
 * Safely parses a date string, returning a default date if parsing fails.
 *
 * @param {string} dateString - The date string to parse.
 * @param {Date} [defaultValue=new Date()] - The default date to return if parsing fails.
 * @returns {Date} - The parsed date or the default date.
 */
function safeParseDate(dateString, defaultValue = new Date()) {
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
}

/**
 * Handles 'once' type repeatable job.
 *
 * @param {Date} taskDateUTC - The UTC date for the task.
 * @returns {object} - The Bull queue options.
 */
function handleOnceRepeatableJob(taskDateUTC) {
  const now = new Date();
  const delay = taskDateUTC.getTime() - now.getTime();
  if (delay < 0) {
    console.error('Invalid input: one_time_date is in the past.');
    return {};
  }
  return { delay };
}

/**
 * Handles 'daily' type repeatable job.
 *
 * @param {Date} taskDateUTC - The UTC date for the task.
 * @returns {object} - The Bull queue options.
 */
function handleDailyRepeatableJob(taskDateUTC) {
  const cronTime = `${taskDateUTC.getUTCMinutes()} ${taskDateUTC.getUTCHours()} * * *`;
  return { repeat: { cron: cronTime } };
}

/**
 * Handles 'weekly' type repeatable job.
 *
 * @param {Date} taskDateUTC - The UTC date for the task.
 * @param {string[]} days - The days of the week for the task.
 * @returns {object} - The Bull queue options.
 */
function handleWeeklyRepeatableJob(taskDateUTC, days) {
  if (!days || !Array.isArray(days) || days.length === 0) {
    console.error('Weekly recurrence requires a valid array of days.');
    return {};
  }
  const validDays = days.filter(day =>
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(day.toLowerCase())
  );
  if (validDays.length === 0) {
    console.error('Weekly recurrence requires at least one valid day.');
    return {};
  }
  const cronDays = validDays.map(day => {
    switch (day.toLowerCase()) {
      case 'monday': return 1;
      case 'tuesday': return 2;
      case 'wednesday': return 3;
      case 'thursday': return 4;
      case 'friday': return 5;
      case 'saturday': return 6;
      case 'sunday': return 0;
      default: return null;
    }
  }).join(',');
  const cronTime = `${taskDateUTC.getUTCMinutes()} ${taskDateUTC.getUTCHours()} * * ${cronDays}`;
  return { repeat: { cron: cronTime } };
}

/**
 * Handles 'limited' type repeatable job.
 *
 * @param {Date} taskDateUTC - The UTC date for the task.
 * @param {string} start_date - The start date for the task.
 * @param {object} ends - The end condition for the task.
 * @returns {object} - The Bull queue options.
 */
function handleLimitedRepeatableJob(taskDateUTC, start_date, ends) {
  if (!start_date) {
    console.error('Limited recurrence requires a start_date.');
    return {};
  }
  const cronTime = `${taskDateUTC.getUTCMinutes()} ${taskDateUTC.getUTCHours()} * * *`; // daily
  const jobStart = taskDateUTC.getTime();
  let jobEnd;
  if (ends) {
    if (ends.type === 'after_repetitions') {
      console.warn('After Repetitions is currently not supported.');
      return {};
    } else if (ends.type === 'on_date' && ends.value) {
      const endDate = safeParseDate(ends.value, null);
      if (!endDate) {
        console.error(`Invalid end date given, could not parse date: ${ends.value}`);
        return {};
      }
      endDate.setHours(taskDateUTC.getUTCHours());
      endDate.setMinutes(taskDateUTC.getUTCMinutes());
      if (endDate.getTime() <= jobStart) {
        console.error('Invalid input: end_date must be after start_date.');
        return {};
      }
      jobEnd = endDate.getTime();
    }
  }
  const bullOptions = {
    repeat: {
      cron: cronTime,
      startDate: new Date(jobStart),
    },
  };
  if (jobEnd) {
    bullOptions.repeat.endDate = new Date(jobEnd);
  }
  return bullOptions;
}

module.exports = { convertToBullOptions };