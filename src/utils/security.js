/**
 * Validates a password against strong policy requirements.
 *
 * Policy:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character (!@#$%^&*(),.?":{}|<>)
 *
 * @param {string} password - The password to validate
 * @returns {{ isValid: boolean, message: string }} - Validation result
 */
export const validatePassword = (password) => {
    if (!password || password.length < 8) {
        return { isValid: false, message: "Password must be at least 8 characters long." };
    }

    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one uppercase letter." };
    }

    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one lowercase letter." };
    }

    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one number." };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one special character." };
    }

    return { isValid: true, message: "" };
};
