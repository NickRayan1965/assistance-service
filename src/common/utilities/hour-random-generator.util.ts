import { ValidTimes } from '@app/seed/interfaces/valid-times';
import { getRandomInt } from './random-int.util';

export const hourRandomGenerator = (schedule: ValidTimes) => {
    const minutesAcepted = ['00', '15', '30', '45'];
    const times = {
        [ValidTimes.START_TIME]: ['05', '06', '07', '08', '09', '10'],
        [ValidTimes.LUNCH_START]: ['11', '12'],
        [ValidTimes.LUNCH_END]: ['13', '14', '15'],
        [ValidTimes.END_TIME]: ['16', '17', '18', '19', '20', '21'],
    };
    const hour = times[schedule][getRandomInt(0, times[schedule].length)];
    const minutes = minutesAcepted[getRandomInt(0, minutesAcepted.length)];
    const hour_complete_text = hour + ':' + minutes;
    return hour_complete_text;
};
