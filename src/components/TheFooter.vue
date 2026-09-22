<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-top">
        <div class="social-icons">
          <a href="#" aria-label="X">
            <img src="@/assets/icons/social-media-icons/X.png" alt="X" />
          </a>
          <a href="#" aria-label="Instagram">
            <img
              src="@/assets/icons/social-media-icons/instagram.png"
              alt="Instagram"
            />
          </a>
          <a href="#" aria-label="YouTube">
            <img
              src="@/assets/icons/social-media-icons/youtube.png"
              alt="YouTube"
            />
          </a>
          <a href="#" aria-label="LinkedIn">
            <img
              src="@/assets/icons/social-media-icons/linkedin.png"
              alt="LinkedIn"
            />
          </a>
        </div>

        <div class="footer-links">
          <div class="footer-column">
            <h3>Internal Access</h3>
            <router-link to="/staff-login">Staff Login</router-link>
          </div>

          <div class="footer-column">
            <h3>Customer Service</h3>
            <a href="#">FAQs</a>
            <a href="#">Help Centre</a>
            <a href="#">Contact Us</a>
          </div>

          <div class="footer-column">
            <h3>About SmartQueue</h3>
            <a href="#">About Us</a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-branding">
          <img src="@/assets/icons/smartqueue-logo.png" alt="SmartQueue" />
          <span class="brand-separator">×</span>
          <img src="@/assets/icons/abc-bank-logo.png" alt="ABC Bank" />
        </div>

        <p class="footer-note">
          Powered by SmartQueue — For ABC Bank customers
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  width: 100%;
  background: white;
  padding: 20px 0 10px;
  box-sizing: border-box;
  font-family: "Inter", sans-serif;
  border-top: 1.5px solid #e5e7eb;
}

.footer-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  box-sizing: border-box;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;
  flex-wrap: wrap;
}

.social-icons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.social-icons a img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.footer-links {
  display: flex;
  gap: 80px;
  flex-wrap: wrap;
}

.footer-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 160px;
}

.footer-column h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  color: #333333;
}

.footer-column a {
  text-decoration: none;
  color: #555555;
  font-size: 15px;
}

.footer-bottom {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.footer-branding {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-branding img {
  height: 32px;
  object-fit: contain;
}

.brand-separator {
  font-size: 24px;
  font-weight: 600;
  color: #222222;
}

.footer-note {
  margin: 0;
  font-size: 13px;
  color: #5c6b82;
  text-align: center;
}
</style>
