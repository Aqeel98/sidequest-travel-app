## 2024-05-23 - [Weak Password Policy]
**Vulnerability:** The application allowed users to sign up and admins to update passwords with weak credentials (e.g. "123").
**Learning:** Client-side validation for password strength was completely missing, relying solely on the backend provider's minimum length (usually 6).
**Prevention:** Implemented a centralized `validatePassword` utility enforcing complexity (8+ chars, uppercase, lowercase, number, special char) and integrated it into the Signup and Admin Password Update flows.
