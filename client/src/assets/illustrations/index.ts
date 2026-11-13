// unDraw illustrations (https://undraw.co), recoloured to the brand blue.
import cancel from './cancel.svg';
import chooseDoctor from './choose-doctor.svg';
import confirmed from './confirmed.svg';
import empty from './empty.svg';
import heroDoctors from './hero-doctors.svg';
import medicalCare from './medical-care.svg';
import noSignal from './no-signal.svg';
import notFound from './not-found.svg';
import pickTime from './pick-time.svg';
import search from './search.svg';
import success from './success.svg';

export const illustrations = {
  cancel,
  chooseDoctor,
  confirmed,
  empty,
  heroDoctors,
  medicalCare,
  noSignal,
  notFound,
  pickTime,
  search,
  success,
};

export type IllustrationName = keyof typeof illustrations;
