# TODO

- [ ] Add backend routes for forgot-password (OTP + reset-link token) and reset-password
- [ ] Store reset requests in Mongo with expiry + used flag
- [ ] Hash updated password consistently with existing login/signup (sha256 placeholder)
- [ ] Update frontend API client (`frontend/src/services/api.js`) with forgot-password/reset-password functions
- [ ] Update `frontend/src/components/ForgotPassword.jsx` to call backend instead of localStorage
- [x] Run backend lint/test (at least start flask) and verify flow manually
- [ ] Verify OTP flow manually with a real Mongo instance (or create a seeded user)