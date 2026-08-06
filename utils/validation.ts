
import React from 'react';

// --- REGEX CONSTANTS ---
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- API FETCH FUNCTION ---
interface PincodeData {
  Message: string;
  Status: string;
  PostOffice: {
    Name: string;
    District: string;
    State: string;
  }[] | null;
}

/**
 * Fetches city and state from an Indian pincode.
 * @param pincode The 6-digit pincode string.
 * @returns An object with city and state, null if invalid pincode, or undefined if network error.
 */
export const fetchLocationByPincode = async (pincode: string): Promise<{ city: string; state: string } | null | undefined> => {
  if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
    return null;
  }
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (!response.ok) return undefined; // Network/Server error
    
    const data: PincodeData[] = await response.json();

    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
      const postOffice = data[0].PostOffice[0];
      return {
        city: postOffice.District,
        state: postOffice.State,
      };
    }
    return null; // Logic: returns null if API says not found (Status != Success)
  } catch (error) {
    console.error('Failed to fetch pincode data:', error);
    return undefined; // Logic: returns undefined if Network Error (don't show invalid error)
  }
};


// --- VALIDATION FUNCTIONS ---

/**
 * Validates a GSTIN number format.
 * @param gstin The GSTIN string to validate.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateGstin = (gstin: string): string | null => {
    if (gstin && !GSTIN_REGEX.test(gstin)) {
        return 'Invalid GSTIN format. Should be like 22AAAAA0000A1Z5.';
    }
    return null;
};

/**
 * Validates a PAN card number format.
 * @param pan The PAN string to validate.
 * @returns An error message string if invalid, otherwise null.
 */
export const validatePan = (pan: string): string | null => {
    if (pan && !PAN_REGEX.test(pan)) {
        return 'Invalid PAN format. Should be like ABCDE1234F.';
    }
    return null;
};

/**
 * Validates an IFSC code format.
 * @param ifsc The IFSC string to validate.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateIfsc = (ifsc: string): string | null => {
    if (ifsc && !IFSC_REGEX.test(ifsc)) {
        return 'Invalid IFSC format. Should be like ABCD0123456.';
    }
    return null;
};

/**
 * Validates an email address format.
 * @param email The email string to validate.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateEmail = (email: string): string | null => {
    if (email && !EMAIL_REGEX.test(email)) {
        return 'Please enter a valid email address.';
    }
    return null;
};

/**
 * Validates a required field.
 * @param value The value to check.
 * @returns An error message string if empty, otherwise null.
 */
export const validateRequired = (value: string | number): string | null => {
    if (value === '' || value === null || value === undefined) {
        return 'This field is required.';
    }
     if (typeof value === 'number' && isNaN(value)) {
        return 'This field is required.';
    }
    return null;
};

/**
 * Validates that a number is non-negative.
 * @param value The number to check.
 * @returns An error message string if negative, otherwise null.
 */
export const validateNonNegative = (value: number | string): string | null => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num < 0) {
        return 'Value cannot be negative.';
    }
    return null;
};

/**
 * Validates password strength.
 * @param password The password string to validate.
 * @returns An error message string if weak, otherwise null.
 */
export const validatePasswordStrength = (password: string): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[a-z]/.test(password)) return 'Must contain at least one lowercase letter.';
    if (!/[A-Z]/.test(password)) return 'Must contain at least one uppercase letter.';
    if (!/\d/.test(password)) return 'Must contain at least one number.';
    if (!/[@$!%*?&]/.test(password)) return 'Must contain at least one special character (@$!%*?&).';
    return null;
};
