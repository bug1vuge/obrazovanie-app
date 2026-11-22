const ONBOARDED_KEY = 'studypro-app-onboarded';

export const isOnboarded = () => {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return true;
  }
};

export const markOnboarded = () => {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    /* ignore */
  }
};
