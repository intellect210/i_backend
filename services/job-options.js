const { isValid, parse } = require('date-fns');

function convertToBullOptions(jobInput) {
    console.log("[DEBUG: jobInput]", jobInput);

    // 1. Handle missing jobInput or task
    if (!jobInput || !jobInput.task) {
        console.error("Invalid input: jobInput or task is missing.");
        return {};
    }

    const task = jobInput.task;

    // 2. Handle missing recurrence
    if (!task.recurrence) {
        console.error("Invalid input: recurrence is missing.");
        return {};
    }

    const { recurrence, time } = task;
    const { type, days, ends, start_date, one_time_date } = recurrence;

    const bullOptions = {};

    // 3. Handle missing time
    if (!time) {
        console.error("Invalid input: time is missing.");
        return {};
    }

    // 4. Validate time format (HH:mm)
    const isValidTimeString = (timeString) => {
        if (!timeString) return false;
        const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return regex.test(timeString);
    };

    if (!isValidTimeString(time)) {
        console.error(`Invalid Time string format, valid format: HH:mm`);
        return {};
    }

    const [hours, minutes] = time.split(':').map(Number); // Convert to numbers

    // 5. Helper function to safely parse dates
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

    // 6. Function to get task date based on recurrence type
    const getTaskDate = () => {
        if (type === 'once') {
            return safeParseDate(one_time_date);
        }

        if (type === 'limited') {
            return safeParseDate(start_date);
        }
        return safeParseDate();
    };

    const taskDate = getTaskDate();
    taskDate.setHours(hours);
    taskDate.setMinutes(minutes);
    taskDate.setSeconds(0);

    switch (type) {
        case 'once': {
            const now = new Date();
            const delay = taskDate.getTime() - now.getTime();
            if (delay < 0) {
                console.error('Invalid input: one_time_date is in the past.');
                return {};
            }
            bullOptions.delay = delay;
            break;
        }

        case 'daily': {
            const cronTime = `${minutes} ${hours} * * *`;
            bullOptions.repeat = { cron: cronTime };
            break;
        }

        case 'weekly': {
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

            const cronTime = `${minutes} ${hours} * * ${cronDays}`;
            bullOptions.repeat = { cron: cronTime };
            break;
        }

        case 'limited': {
            if (!start_date) {
                console.error('Limited recurrence requires a start_date.');
                return {};
            }

            const cronTime = `${minutes} ${hours} * * *`; // daily
            const jobStart = taskDate.getTime();
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
                    endDate.setHours(hours);
                    endDate.setMinutes(minutes);

                    if (endDate.getTime() <= jobStart) {
                        console.error('Invalid input: end_date must be after start_date.');
                        return {};
                    }

                    jobEnd = endDate.getTime();
                }
            }

            bullOptions.repeat = {
                cron: cronTime,
                startDate: new Date(jobStart),
            };

            if (jobEnd) {
                bullOptions.repeat.endDate = new Date(jobEnd);
            }
            break;
        }

        default:
            console.error('Invalid recurrence type.');
            return {};
    }

    console.log("[DEBUG: bullOptions]", bullOptions);
    return bullOptions;
}

module.exports = { convertToBullOptions };
